package com.example.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Initial administrator account, bound from {@code app.admin.*}. Created on startup if it doesn't exist yet;
 * leave the password empty to skip creating it.
 */
@ConfigurationProperties(prefix = "app.admin")
public record AdminProperties(String username, String password) {
}
