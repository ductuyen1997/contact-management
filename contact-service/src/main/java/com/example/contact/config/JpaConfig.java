package com.example.contact.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

@Configuration
@EnableJpaAuditing
public class JpaConfig {

    /**
     * Tells Spring Data who is making the change, for {@code @CreatedBy} fields.
     * For a request with a JWT, the name is the token's subject: the username auth-service put there.
     * Outside a request (e.g. {@link DataInitializer} seeding sample data) there is no user, so the field stays null.
     */
    @Bean
    AuditorAware<String> auditorAware() {
        return () -> Optional.ofNullable(SecurityContextHolder.getContext().getAuthentication())
                .filter(Authentication::isAuthenticated)
                .filter(auth -> !(auth instanceof AnonymousAuthenticationToken))
                .map(Authentication::getName);
    }
}
