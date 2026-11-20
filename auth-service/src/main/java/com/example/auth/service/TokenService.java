package com.example.auth.service;

import com.example.auth.config.JwtProperties;
import com.example.auth.dto.AuthDtos.AuthResponse;
import com.example.auth.dto.AuthDtos.UserResponse;
import com.example.auth.entity.AppUser;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Instant;
import java.util.List;

/** Issues signed access tokens. Claims: {@code sub} = username, {@code roles} = e.g. ["USER", "ADMIN"]. */
@Service
@RequiredArgsConstructor
public class TokenService {

    public static final String ROLES_CLAIM = "roles";

    private final JwtEncoder jwtEncoder;
    private final JwtProperties properties;
    private final Clock clock;

    public AuthResponse issue(AppUser user) {
        Instant now = clock.instant();
        Instant expiresAt = now.plus(properties.ttl());
        List<String> roles = user.getRole().grantedRoles();

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(properties.issuer())
                .subject(user.getUsername())
                .issuedAt(now)
                .expiresAt(expiresAt)
                .claim(ROLES_CLAIM, roles)
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        String token = jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();

        return new AuthResponse(token, "Bearer", expiresAt, new UserResponse(user.getUsername(), roles));
    }
}
