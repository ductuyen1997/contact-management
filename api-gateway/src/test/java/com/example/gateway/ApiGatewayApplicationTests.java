package com.example.gateway;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webtestclient.autoconfigure.AutoConfigureWebTestClient;
import org.springframework.test.web.reactive.server.WebTestClient;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "spring.cloud.config.enabled=false",
        "eureka.client.enabled=false",
        "security.jwt.secret=test-secret-test-secret-test-secret-0123456789",
        "security.jwt.issuer=contact-manager-auth"
})
@AutoConfigureWebTestClient
class ApiGatewayApplicationTests {

    @Autowired
    private WebTestClient client;

    @Test
    void fallbackReturnsProblemDetail() {
        client.get().uri("/fallback/activities")
                .exchange()
                .expectStatus().isEqualTo(503)
                .expectBody()
                .jsonPath("$.title").isEqualTo("Service unavailable");
    }

    @Test
    void apiRequiresToken() {
        client.get().uri("/api/v1/contacts").exchange().expectStatus().isUnauthorized();
        client.get().uri("/api/v1/contacts")
                .header("Authorization", "Bearer not-a-jwt")
                .exchange()
                .expectStatus().isUnauthorized();
    }

    @Test
    void loginAndRegisterArePublic() {
        // No auth-service registered in this test, so the request passes security and then fails routing (404),
        // instead of being rejected with 401.
        client.post().uri("/api/v1/auth/login").exchange().expectStatus().isNotFound();
        client.post().uri("/api/v1/auth/register").exchange().expectStatus().isNotFound();
    }
}
