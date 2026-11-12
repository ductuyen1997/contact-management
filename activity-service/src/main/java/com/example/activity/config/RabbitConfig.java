package com.example.activity.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Declares this service's own queue bound to contact-service's topic exchange, plus a dead-letter
 * queue that receives messages which still fail after the configured retries.
 */
@Configuration
public class RabbitConfig {

    @Value("${messaging.contact-exchange}")
    private String contactExchange;

    @Value("${messaging.activity-queue}")
    private String activityQueue;

    @Bean
    public TopicExchange contactExchange() {
        return new TopicExchange(contactExchange, true, false);
    }

    @Bean
    public DirectExchange deadLetterExchange() {
        return new DirectExchange(activityQueue + ".dlx", true, false);
    }

    @Bean
    public Queue activityQueue() {
        return QueueBuilder.durable(activityQueue)
                .deadLetterExchange(activityQueue + ".dlx")
                .deadLetterRoutingKey(activityQueue + ".dlq")
                .build();
    }

    @Bean
    public Queue deadLetterQueue() {
        return QueueBuilder.durable(activityQueue + ".dlq").build();
    }

    @Bean
    public Binding activityBinding() {
        return BindingBuilder.bind(activityQueue()).to(contactExchange()).with("contact.#");
    }

    @Bean
    public Binding deadLetterBinding() {
        return BindingBuilder.bind(deadLetterQueue()).to(deadLetterExchange()).with(activityQueue + ".dlq");
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new JacksonJsonMessageConverter();
    }
}
