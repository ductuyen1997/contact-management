package com.example.auth.config;

import com.example.auth.entity.AppUser;
import com.example.auth.entity.Role;
import com.example.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/** Creates the configured administrator on first start, so there is always someone who can delete and export. */
@Slf4j
@Component
@RequiredArgsConstructor
public class AdminInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AdminProperties admin;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!StringUtils.hasText(admin.username()) || !StringUtils.hasText(admin.password())
                || userRepository.existsByUsernameIgnoreCase(admin.username())) {
            return;
        }
        userRepository.save(AppUser.builder()
                .username(admin.username())
                .passwordHash(passwordEncoder.encode(admin.password()))
                .role(Role.ADMIN)
                .build());
        log.info("Created administrator account '{}'", admin.username());
    }
}
