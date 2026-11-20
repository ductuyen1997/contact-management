package com.example.auth.exception;

public final class AuthExceptions {

    private AuthExceptions() {
    }

    public static class UsernameTakenException extends RuntimeException {
        public UsernameTakenException(String username) {
            super("Username '" + username + "' is already taken");
        }
    }

    /** Deliberately vague: never reveal whether the username or the password was wrong. */
    public static class InvalidCredentialsException extends RuntimeException {
        public InvalidCredentialsException() {
            super("Invalid username or password");
        }
    }
}
