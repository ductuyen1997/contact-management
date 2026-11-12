package com.example.contact.event;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ContactEventType {
    CREATED("contact.created"),
    UPDATED("contact.updated"),
    DELETED("contact.deleted"),
    FAVORITED("contact.favorited"),
    UNFAVORITED("contact.unfavorited");

    /** RabbitMQ routing key used when publishing this event to the topic exchange. */
    private final String routingKey;
}
