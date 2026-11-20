package com.example.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;

/** Request and response bodies of {@code /api/v1/auth}. */
public final class AuthDtos {

    private AuthDtos() {
    }

    public record RegisterRequest(
            @NotBlank(message = "Username is required")
            @Size(min = 3, max = 50, message = "Username must be 3-50 characters")
            @Pattern(regexp = "[A-Za-z0-9._-]+", message = "Use only letters, digits, '.', '_' or '-'")
            String username,

            @NotBlank(message = "Password is required")
            @Size(min = 8, max = 72, message = "Password must be 8-72 characters")
            String password) {
    }

    public record LoginRequest(
            @NotBlank(message = "Username is required") String username,
            // BCrypt only looks at the first 72 bytes
            @NotBlank(message = "Password is required") @Size(max = 72) String password) {
    }

    public record UserResponse(String username, List<String> roles) {
    }

    public record AuthResponse(String accessToken, String tokenType, Instant expiresAt, UserResponse user) {
    }
}
