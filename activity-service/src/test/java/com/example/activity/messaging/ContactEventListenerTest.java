package com.example.activity.messaging;

import com.example.activity.dto.ContactEvent;
import com.example.activity.repository.ActivityRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
class ContactEventListenerTest {

    @Autowired
    private ContactEventListener listener;

    @Autowired
    private ActivityRepository repository;

    @BeforeEach
    void clean() {
        repository.deleteAll();
    }

    @Test
    void storesEventOnceEvenWhenRedelivered() {
        ContactEvent event = new ContactEvent(UUID.randomUUID(), "CREATED", 1L, "Alice Nguyen", Instant.now());

        listener.onContactEvent(event);
        listener.onContactEvent(event);

        assertThat(repository.count()).isEqualTo(1);
        assertThat(repository.findAll().get(0).getContactName()).isEqualTo("Alice Nguyen");
    }

    @Test
    void rejectsUnknownEventTypeAsNonRetryable() {
        ContactEvent event = new ContactEvent(UUID.randomUUID(), "EXPLODED", 1L, "X", Instant.now());

        assertThatThrownBy(() -> listener.onContactEvent(event))
                .isInstanceOf(IllegalArgumentException.class);   // not retried, sent to the DLT
        assertThat(repository.count()).isZero();
    }
}
