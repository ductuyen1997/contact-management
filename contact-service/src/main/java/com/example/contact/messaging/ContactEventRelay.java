package com.example.contact.messaging;

import com.example.contact.event.ContactEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Forwards {@link ContactEvent}s to RabbitMQ only after the database transaction has committed,
 * so consumers never see events for changes that were rolled back.
 * <p>
 * Note: if the broker is down at that moment the event is logged and dropped. For guaranteed
 * delivery, replace this with the transactional outbox pattern.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ContactEventRelay {

    private final RabbitTemplate rabbitTemplate;

    @Value("${messaging.contact-exchange}")
    private String exchange;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void relay(ContactEvent event) {
        try {
            rabbitTemplate.convertAndSend(exchange, event.type().getRoutingKey(), event);
            log.debug("Published {} for contact {}", event.type(), event.contactId());
        } catch (AmqpException ex) {
            log.error("Failed to publish {} for contact {}: {}", event.type(), event.contactId(), ex.getMessage());
        }
    }
}
