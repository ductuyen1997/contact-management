package com.example.contact.config;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/** Application-specific settings bound from the {@code app.*} namespace. */
@Getter
@Setter
@Validated
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    /** Number of contacts shown per page in the web UI and the default API page size. */
    @Min(1)
    @Max(100)
    private int pageSize = 10;

    /** Seed example contacts when the database is empty. */
    private boolean seedData = true;
}
