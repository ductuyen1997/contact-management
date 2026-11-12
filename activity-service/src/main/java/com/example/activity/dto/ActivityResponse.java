package com.example.activity.dto;

import com.example.activity.entity.ActivityType;
import lombok.Builder;
import lombok.Value;

import java.time.Instant;

@Value
@Builder
public class ActivityResponse {
    Long id;
    ActivityType type;
    Long contactId;
    String contactName;
    Instant occurredAt;
}
