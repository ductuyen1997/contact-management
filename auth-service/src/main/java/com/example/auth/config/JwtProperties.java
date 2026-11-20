package com.example.auth.config;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.time.Duration;

/**
 * Settings for the JWTs this service issues, bound from {@code security.jwt.*}.
 * The same secret and issuer are configured on the gateway and every service that validates tokens.
 */
@Validated
@ConfigurationProperties(prefix = "security.jwt")
public record JwtProperties(
        /* HMAC-SHA256 signing key; at least 32 bytes (256 bits). */
        @NotBlank @Size(min = 32) String secret,
        @NotBlank String issuer,
        /* Lifetime of an access token. */
        @NotNull Duration ttl) {
}
