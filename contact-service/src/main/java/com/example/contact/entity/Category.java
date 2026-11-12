package com.example.contact.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum Category {
    FAMILY("Family"),
    FRIEND("Friend"),
    WORK("Work"),
    CLIENT("Client"),
    OTHER("Other");

    private final String label;
}
