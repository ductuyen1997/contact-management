package com.example.auth.controller;

import com.example.auth.dto.AuthDtos.AuthResponse;
import com.example.auth.dto.AuthDtos.LoginRequest;
import com.example.auth.dto.AuthDtos.RegisterRequest;
import com.example.auth.dto.AuthDtos.UserResponse;
import com.example.auth.service.AuthService;
import com.example.auth.service.TokenService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Account endpoints: {@code /api/v1/auth}. Register and login are public; {@code /me} needs a token. */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal Jwt jwt) {
        List<String> roles = jwt.getClaimAsStringList(TokenService.ROLES_CLAIM);
        return new UserResponse(jwt.getSubject(), roles == null ? List.of() : roles);
    }
}
