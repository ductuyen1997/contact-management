package com.example.activity.service;

import com.example.activity.dto.ActivityResponse;
import com.example.activity.dto.ContactEvent;
import org.springframework.data.domain.Page;

public interface ActivityService {

    /** Stores the event; returns {@code false} if it was already recorded (duplicate delivery). */
    boolean record(ContactEvent event);

    Page<ActivityResponse> list(Long contactId, int page, int size);
}
