package com.example.contact.exception;

import lombok.Getter;

@Getter
public class DuplicateEmailException extends RuntimeException {

    private final String email;

    public DuplicateEmailException(String email) {
        super("Another contact already uses this email");
        this.email = email;
    }
}
