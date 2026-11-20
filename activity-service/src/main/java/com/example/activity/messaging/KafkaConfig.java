package com.example.activity.messaging;

import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.common.TopicPartition;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.kafka.support.converter.ByteArrayJacksonJsonMessageConverter;
import org.springframework.kafka.support.converter.RecordMessageConverter;
import org.springframework.util.backoff.FixedBackOff;

/**
 * Consumer side of the contact events.
 * <ul>
 *   <li>Record values arrive as raw bytes and are converted to {@code ContactEvent} by the message converter,
 *       so malformed JSON fails fast instead of blocking the partition.</li>
 *   <li>A failing record is retried twice (3 attempts in total), then published unchanged to the dead-letter
 *       topic. Errors that can never succeed (bad payload, unknown event type) skip the retries.</li>
 * </ul>
 * Spring Boot plugs the {@link RecordMessageConverter} and the error handler beans into the listener container.
 */
@Configuration
public class KafkaConfig {

    @Value("${messaging.contact-dlt}")
    private String deadLetterTopic;

    @Bean
    public NewTopic contactDeadLetterTopic(@Value("${messaging.replicas:1}") int replicas) {
        return TopicBuilder.name(deadLetterTopic).partitions(1).replicas(replicas).build();
    }

    @Bean
    public RecordMessageConverter contactEventConverter() {
        return new ByteArrayJacksonJsonMessageConverter();
    }

    @Bean
    public DefaultErrorHandler kafkaErrorHandler(KafkaTemplate<Object, Object> kafkaTemplate) {
        // partition -1: let the producer pick the dead-letter partition (the DLT has fewer partitions)
        DeadLetterPublishingRecoverer recoverer = new DeadLetterPublishingRecoverer(kafkaTemplate,
                (record, ex) -> new TopicPartition(deadLetterTopic, -1));
        DefaultErrorHandler handler = new DefaultErrorHandler(recoverer, new FixedBackOff(1_000L, 2));
        handler.addNotRetryableExceptions(IllegalArgumentException.class, NullPointerException.class);
        return handler;
    }
}
