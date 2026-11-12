package com.example.activity.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * Inbound message contract published by contact-service. Kept as a local copy on purpose:
 * services share the message schema, not code, so each can be deployed independently.
 */
public record ContactEvent(
        UUID eventId,
        String type,
        Long contactId,
        String contactName,
        Instant occurredAt) {
}
