package com.example.contact.controller;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Exercises the real JWT decoder with tokens shaped like the ones auth-service issues. */
@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc
@Transactional
class ContactSecurityTest {

    private static final String SECRET = "test-secret-test-secret-test-secret-0123456789";
    private static final String ISSUER = "contact-manager-auth";

    @Autowired
    private MockMvc mvc;

    @Test
    void anonymousRequestsAreRejected() throws Exception {
        mvc.perform(get("/api/v1/contacts")).andExpect(status().isUnauthorized());
    }

    @Test
    void healthIsPublicForDockerHealthchecks() throws Exception {
        mvc.perform(get("/actuator/health")).andExpect(status().isOk());
    }

    @Test
    void userCanReadButNotDeleteOrExport() throws Exception {
        String user = bearer(token(SECRET, ISSUER, Instant.now().plus(Duration.ofHours(1)), "USER"));

        mvc.perform(get("/api/v1/contacts").header("Authorization", user)).andExpect(status().isOk());
        mvc.perform(delete("/api/v1/contacts/1").header("Authorization", user)).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/contacts/export").header("Authorization", user)).andExpect(status().isForbidden());
    }

    @Test
    void adminCanDeleteAndExport() throws Exception {
        String admin = bearer(token(SECRET, ISSUER, Instant.now().plus(Duration.ofHours(1)), "USER", "ADMIN"));

        mvc.perform(get("/api/v1/contacts/export").header("Authorization", admin)).andExpect(status().isOk());
        mvc.perform(delete("/api/v1/contacts/1").header("Authorization", admin)).andExpect(status().isNoContent());
    }

    @Test
    void rejectsExpiredForgedOrForeignTokens() throws Exception {
        Instant later = Instant.now().plus(Duration.ofHours(1));
        String expired = token(SECRET, ISSUER, Instant.now().minus(Duration.ofHours(1)), "USER", "ADMIN");
        String wrongKey = token("another-secret-another-secret-another-secret", ISSUER, later, "USER", "ADMIN");
        String wrongIssuer = token(SECRET, "someone-else", later, "USER", "ADMIN");

        for (String token : List.of(expired, wrongKey, wrongIssuer)) {
            mvc.perform(get("/api/v1/contacts").header("Authorization", bearer(token)))
                    .andExpect(status().isUnauthorized());
        }
    }

    private static String token(String secret, String issuer, Instant expiresAt, String... roles) {
        var encoder = new NimbusJwtEncoder(new ImmutableSecret<>(
                new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256")));
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(issuer)
                .subject("tester")
                .issuedAt(expiresAt.minus(Duration.ofHours(2)))
                .expiresAt(expiresAt)
                .claim("roles", List.of(roles))
                .build();
        return encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims))
                .getTokenValue();
    }

    private static String bearer(String token) {
        return "Bearer " + token;
    }
}
