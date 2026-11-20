# Contact Manager

A contact management app built as **Spring Cloud microservices** with a **React + TypeScript** frontend.

```
                    ┌──────────────┐
 Browser ──────────▶│   frontend   │  React SPA (nginx in Docker, Vite in dev)
                    └──────┬───────┘
                           │ /api/**
                    ┌──────▼───────┐        ┌──────────────────┐
                    │ api-gateway  │◀──────▶│ discovery-server │  Eureka registry
                    │  :8090       │        │  :8761           │
                    └──┬────────┬──┘        └──────────────────┘
       /api/v1/contacts│        │/api/v1/activities  (circuit breaker + fallback)
             ┌─────────▼──┐  ┌──▼────────────────┐   ┌───────────────┐
             │ contact-   │  │ activity-service  │   │ config-server │  central config
             │ service    │  │  :8092            │   │  :8888        │  for all services
             │  :8091     │  └──▲────────┬───────┘   └───────────────┘
             └──┬─────┬───┘     │        │
                │     │ events  │        │
     contacts_db│     └──▶  Kafka  ──────┘ activity_db
                ▼        (contact.events)  ▼
             PostgreSQL ◀──────────────────┘   (one database per service)
```

| Module | Port | Responsibility |
|---|---|---|
| `config-server` | 8888 | Spring Cloud Config (native backend). Holds every service's settings in `config-server/src/main/resources/config/` |
| `discovery-server` | 8761 | Netflix Eureka service registry ([dashboard](http://localhost:8761)) |
| `api-gateway` | 8090 | Spring Cloud Gateway: single entry point, load-balanced routing via Eureka, Resilience4j circuit breaker for activity-service |
| `contact-service` | 8091 | Contacts CRUD, search/filter/sort/paging, CSV export. Owns `contacts_db` (Flyway). Publishes `ContactEvent`s to Kafka (topic `contact.events`, keyed by contact id) after each committed change |
| `auth-service` | 8093 | User accounts (`auth_db`), register/login, issues signed JWTs (Spring Security) |
| `activity-service` | 8092 | Consumes contact events (consumer group `activity-service`, idempotent, retries + dead-letter topic `contact.events.dlt`) into `activity_db` and serves the activity history |
| `frontend` | 5173 / 3000 | React 19, React Router, TanStack Query, React Hook Form + Zod |

## Quick start (everything in Docker)

Requires Docker Desktop.

```bash
docker compose up --build -d
```

- App: http://localhost:3000 (sign in as `admin` / `admin12345`, or create an account)
- Eureka dashboard: http://localhost:8761
- Kafka UI: http://localhost:8080 (topics, messages, consumer groups)
- Kafka: 3-node KRaft cluster (no ZooKeeper), every partition replicated 3x with `min.insync.replicas=2`, so it tolerates one broker down. From the host: `localhost:9092,localhost:9094,localhost:9096`

Stop with `docker compose down` (add `-v` to wipe the databases and start fresh).

## Local development

Run the infrastructure in Docker, and the services from your IDE or terminal (JDK 17+, Node 22+):

```bash
docker compose up -d postgres kafka-1 kafka-2 kafka-3 kafka-ui

# in separate terminals, in this order (config first, then registry)
./mvnw -pl config-server spring-boot:run
./mvnw -pl discovery-server spring-boot:run
./mvnw -pl contact-service spring-boot:run
./mvnw -pl activity-service spring-boot:run
./mvnw -pl auth-service spring-boot:run
./mvnw -pl api-gateway spring-boot:run

cd frontend && npm install && npm run dev   # http://localhost:5173, proxies /api to the gateway
```

In IntelliJ, open the root `pom.xml` as a Maven project and enable annotation processing (Lombok).

## Tests

```bash
./mvnw verify                 # all backend modules (H2 in PostgreSQL mode, no Docker needed)
cd frontend && npm test       # Vitest + Testing Library
cd frontend && npm run lint
```

## Security

Spring Security with stateless JWTs (no sessions or cookies, so no CSRF):

1. `auth-service` checks the username/password (BCrypt) and returns an access token signed with HMAC-SHA256.
   Claims: `sub` = username, `roles` = `["USER"]` or `["USER", "ADMIN"]`, `iss` = `contact-manager-auth`, `exp`.
2. The React app keeps the token in `localStorage` and sends `Authorization: Bearer <token>` on every call.
   A `401` signs the user out and returns them to the login page.
3. The gateway rejects requests without a valid token (only register/login are public) and forwards the header.
4. `contact-service` and `activity-service` validate the token again, because their ports are reachable
   directly, and apply the role rules:

| Action | USER | ADMIN |
|---|---|---|
| View, search, create, edit, favorite contacts; view activity | ✓ | ✓ |
| Delete contacts, export CSV | | ✓ |

New accounts are always `USER`. The `admin` account is created on first start of `auth-service`.

Settings (in `config-server/src/main/resources/config`, overridable with env vars):

| Env var | Default | Notes |
|---|---|---|
| `JWT_SECRET` | dev-only value | **Set in production**, 32+ characters, and the same on every service |
| `JWT_TTL` | `8h` | Token lifetime; there are no refresh tokens, so users sign in again after it ends |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | `admin` / `admin12345` | Only used when that user doesn't exist yet |

```bash
# Get a token and call the API with curl
TOKEN=$(curl -s -X POST localhost:8090/api/v1/auth/login -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin12345"}' | jq -r .accessToken)
curl -H "Authorization: Bearer $TOKEN" localhost:8090/api/v1/contacts
```

## REST API (through the gateway, http://localhost:8090)

All endpoints except register and login need `Authorization: Bearer <token>`.

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Create a USER account: `{"username","password"}` → token (201) |
| POST | `/api/v1/auth/login` | `{"username","password"}` → `{accessToken, tokenType, expiresAt, user}` |
| GET | `/api/v1/auth/me` | The signed-in user and roles |
| GET | `/api/v1/contacts` | Paged list. Params: `q`, `category`, `favorites`, `sort`, `page`, `size` (≤100) |
| GET | `/api/v1/contacts/stats` | Totals per category and favorites |
| GET | `/api/v1/contacts/export` | CSV download, same filters as the list (ADMIN) |
| GET | `/api/v1/contacts/{id}` | Single contact |
| POST | `/api/v1/contacts` | Create (201 + `Location`) |
| PUT | `/api/v1/contacts/{id}` | Update |
| PATCH | `/api/v1/contacts/{id}/favorite` | Toggle favorite |
| DELETE | `/api/v1/contacts/{id}` | Delete (204, ADMIN) |
| GET | `/api/v1/activities` | Activity feed, newest first. Params: `contactId`, `page`, `size` |

Errors are RFC 9457 problem details; validation errors include an `errors` map of field → message.
`sort`: `NAME`, `NAME_DESC`, `COMPANY`, `NEWEST`, `UPDATED`. `category`: `FAMILY`, `FRIEND`, `WORK`, `CLIENT`, `OTHER`.

## Design notes

- **Database per service.** Each service owns its schema, managed by Flyway (`src/main/resources/db/migration`); Hibernate only validates (`ddl-auto: validate`).
- **Events after commit.** `contact-service` raises a Spring event inside the transaction and `ContactEventRelay` publishes it to the `contact.events` topic exchange only after commit. If the broker is down the event is logged and dropped; the *transactional outbox* pattern is the next step for guaranteed delivery.
- **Idempotent consumer.** Every event carries a UUID `eventId`; `activity-service` stores it with a unique constraint, so redelivered messages are recorded once. Invalid messages go to `activity.contact-events.dlq`.
- **No shared code between services.** The event schema is duplicated on purpose (`ContactEvent` in both services) so services can be built and deployed independently.
- **Graceful degradation.** If `activity-service` is down, the gateway's circuit breaker answers `503` immediately and the UI still works, showing "activity unavailable".
- **Not included yet:** refresh tokens and login rate limiting, distributed tracing (Micrometer Tracing + Zipkin), centralized logging.
