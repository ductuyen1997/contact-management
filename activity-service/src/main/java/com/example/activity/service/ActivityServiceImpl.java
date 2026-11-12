package com.example.activity.service;

import com.example.activity.dto.ActivityResponse;
import com.example.activity.dto.ContactEvent;
import com.example.activity.entity.Activity;
import com.example.activity.entity.ActivityType;
import com.example.activity.repository.ActivityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ActivityServiceImpl implements ActivityService {

    private static final Sort NEWEST_FIRST = Sort.by(Sort.Order.desc("occurredAt"), Sort.Order.desc("id"));

    private final ActivityRepository activityRepository;

    @Override
    @Transactional
    public boolean record(ContactEvent event) {
        Objects.requireNonNull(event.eventId(), "eventId is required");
        if (activityRepository.existsByEventId(event.eventId())) {
            log.info("Ignoring duplicate event {}", event.eventId());
            return false;
        }
        Activity activity = Activity.builder()
                .eventId(event.eventId())
                .type(ActivityType.valueOf(event.type()))
                .contactId(event.contactId())
                .contactName(event.contactName())
                .occurredAt(event.occurredAt() != null ? event.occurredAt() : Instant.now())
                .receivedAt(Instant.now())
                .build();
        activityRepository.save(activity);
        log.info("Recorded {} for contact {}", activity.getType(), activity.getContactId());
        return true;
    }

    @Override
    public Page<ActivityResponse> list(Long contactId, int page, int size) {
        PageRequest pageable = PageRequest.of(Math.max(page, 0), size, NEWEST_FIRST);
        Page<Activity> result = contactId == null
                ? activityRepository.findAll(pageable)
                : activityRepository.findByContactId(contactId, pageable);
        return result.map(ActivityServiceImpl::toResponse);
    }

    private static ActivityResponse toResponse(Activity activity) {
        return ActivityResponse.builder()
                .id(activity.getId())
                .type(activity.getType())
                .contactId(activity.getContactId())
                .contactName(activity.getContactName())
                .occurredAt(activity.getOccurredAt())
                .build();
    }
}
