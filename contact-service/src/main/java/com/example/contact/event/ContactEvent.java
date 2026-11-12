package com.example.contact.event;

import java.time.Instant;
import java.util.UUID;

/**
 * Integration event published to the message broker whenever a contact changes.
 * This is the public contract consumed by other services (e.g. activity-service).
 */
public record ContactEvent(
        UUID eventId,
        ContactEventType type,
        Long contactId,
        String contactName,
        Instant occurredAt) {

    public static ContactEvent of(ContactEventType type, Long contactId, String contactName) {
        return new ContactEvent(UUID.randomUUID(), type, contactId, contactName, Instant.now());
    }
}
