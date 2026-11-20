package com.example.contact.messaging;

import com.example.contact.event.ContactEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.common.KafkaException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Forwards {@link ContactEvent}s to Kafka only after the database transaction has committed,
 * so consumers never see events for changes that were rolled back.
 * <p>
 * The record key is the contact id, which keeps every event for a contact on one partition, in order.
 * Sending is asynchronous: the producer retries on its own, and a final failure is only logged.
 * For guaranteed delivery, replace this with the transactional outbox pattern.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ContactEventRelay {

    private final KafkaTemplate<String, ContactEvent> kafkaTemplate;

    @Value("${messaging.contact-topic}")
    private String topic;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void relay(ContactEvent event) {
        try {
            kafkaTemplate.send(topic, String.valueOf(event.contactId()), event)
                    .whenComplete((result, ex) -> {
                        if (ex != null) {
                            log.error("Failed to publish {} for contact {}: {}",
                                    event.type(), event.contactId(), ex.getMessage());
                        } else {
                            log.debug("Published {} for contact {} to {}-{}@{}", event.type(), event.contactId(),
                                    topic, result.getRecordMetadata().partition(), result.getRecordMetadata().offset());
                        }
                    });
        } catch (KafkaException ex) {
            // e.g. broker metadata unavailable within max.block.ms
            log.error("Failed to publish {} for contact {}: {}", event.type(), event.contactId(), ex.getMessage());
        }
    }
}
