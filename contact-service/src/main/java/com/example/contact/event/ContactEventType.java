package com.example.contact.event;

/** Kind of change carried in a {@link ContactEvent}; serialized by name (e.g. "CREATED"). */
public enum ContactEventType {
    CREATED,
    UPDATED,
    DELETED,
    FAVORITED,
    UNFAVORITED
}
