package com.example.activity.entity;

/** Mirrors {@code ContactEventType} in contact-service; unknown values are rejected by the listener. */
public enum ActivityType {
    CREATED,
    UPDATED,
    DELETED,
    FAVORITED,
    UNFAVORITED
}
