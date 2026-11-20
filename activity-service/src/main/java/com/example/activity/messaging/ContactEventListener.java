package com.example.activity.messaging;

import com.example.activity.dto.ContactEvent;
import com.example.activity.service.ActivityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Records every contact event as an activity. Kafka delivers at least once, so the same event can arrive
 * twice; {@link ActivityService#record} ignores event ids it has already stored.
 * <p>
 * Exceptions are handled by the error handler in {@link KafkaConfig}: invalid events
 * (IllegalArgumentException / NullPointerException) go straight to the dead-letter topic, others are retried first.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ContactEventListener {

    private final ActivityService activityService;

    @KafkaListener(topics = "${messaging.contact-topic}")
    public void onContactEvent(ContactEvent event) {
        try {
            activityService.record(event);
        } catch (IllegalArgumentException | NullPointerException ex) {
            log.error("Rejecting invalid contact event {}: {}", event, ex.getMessage());
            throw ex;
        }
    }
}
