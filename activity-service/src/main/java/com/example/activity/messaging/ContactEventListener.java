package com.example.activity.messaging;

import com.example.activity.dto.ContactEvent;
import com.example.activity.service.ActivityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.AmqpRejectAndDontRequeueException;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ContactEventListener {

    private final ActivityService activityService;

    @RabbitListener(queues = "${messaging.activity-queue}")
    public void onContactEvent(ContactEvent event) {
        try {
            activityService.record(event);
        } catch (IllegalArgumentException | NullPointerException ex) {
            // Malformed message: retrying will never succeed, send it straight to the DLQ
            log.error("Rejecting invalid contact event {}: {}", event, ex.getMessage());
            throw new AmqpRejectAndDontRequeueException("Invalid contact event", ex);
        }
    }
}
