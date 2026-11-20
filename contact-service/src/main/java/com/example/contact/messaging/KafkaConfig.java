package com.example.contact.messaging;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

/**
 * Declares the topic this service publishes to. Spring Boot's {@code KafkaAdmin} creates it on startup if it
 * does not exist yet, so publishing never depends on a consumer having started first.
 * <p>
 * Events are keyed by contact id, so all events for one contact land on the same partition and stay in order.
 */
@Configuration
public class KafkaConfig {

    @Bean
    public NewTopic contactTopic(@Value("${messaging.contact-topic}") String name,
                                 @Value("${messaging.partitions:3}") int partitions,
                                 @Value("${messaging.replicas:1}") int replicas) {
        return TopicBuilder.name(name).partitions(partitions).replicas(replicas).build();
    }
}
