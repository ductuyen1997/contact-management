-- Database-per-service: each service owns its schema and credentials.
CREATE USER contact_user WITH PASSWORD 'contact_pass';
CREATE DATABASE contacts_db OWNER contact_user;

CREATE USER activity_user WITH PASSWORD 'activity_pass';
CREATE DATABASE activity_db OWNER activity_user;

CREATE USER auth_user WITH PASSWORD 'auth_pass';
CREATE DATABASE auth_db OWNER auth_user;
