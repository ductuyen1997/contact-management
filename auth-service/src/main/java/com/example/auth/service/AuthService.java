package com.example.auth.service;

import com.example.auth.dto.AuthDtos.AuthResponse;
import com.example.auth.dto.AuthDtos.LoginRequest;
import com.example.auth.dto.AuthDtos.RegisterRequest;
import com.example.auth.entity.AppUser;
import com.example.auth.entity.Role;
import com.example.auth.exception.AuthExceptions.InvalidCredentialsException;
import com.example.auth.exception.AuthExceptions.UsernameTakenException;
import com.example.auth.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;
    /** Hash of a random value, checked for unknown usernames so timing doesn't reveal which names exist. */
    private final String dummyHash;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, TokenService tokenService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
        this.dummyHash = passwordEncoder.encode(UUID.randomUUID().toString());
    }

    /** Self-registration always creates a plain USER; admins are provisioned via configuration. */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String username = request.username().trim();
        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw new UsernameTakenException(username);
        }
        AppUser user = AppUser.builder()
                .username(username)
                .passwordHash(passwordEncoder.encode(request.password()))
                .role(Role.USER)
                .build();
        try {
            userRepository.saveAndFlush(user);
        } catch (DataIntegrityViolationException e) {
            // Two concurrent registrations for the same name: the unique constraint decides
            throw new UsernameTakenException(username);
        }
        return tokenService.issue(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        Optional<AppUser> user = userRepository.findByUsernameIgnoreCase(request.username().trim());
        if (user.isEmpty()) {
            passwordEncoder.matches(request.password(), dummyHash);
            throw new InvalidCredentialsException();
        }
        if (!passwordEncoder.matches(request.password(), user.get().getPasswordHash())) {
            throw new InvalidCredentialsException();
        }
        return tokenService.issue(user.get());
    }
}
