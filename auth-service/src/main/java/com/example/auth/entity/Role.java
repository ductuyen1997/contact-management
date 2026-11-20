package com.example.auth.entity;

import java.util.List;

public enum Role {
    USER,
    ADMIN;

    /** Roles written into the token. ADMIN includes everything a USER may do. */
    public List<String> grantedRoles() {
        return this == ADMIN ? List.of(USER.name(), ADMIN.name()) : List.of(USER.name());
    }
}
