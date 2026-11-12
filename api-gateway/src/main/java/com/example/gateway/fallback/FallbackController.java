package com.example.gateway.fallback;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

/**
 * Target of the circuit-breaker {@code fallbackUri}. Returns a problem detail instead of letting
 * a slow or failing downstream service cascade into gateway timeouts.
 */
@Slf4j
@RestController
@RequestMapping("/fallback")
public class FallbackController {

    @RequestMapping("/activities")
    public Mono<ResponseEntity<ProblemDetail>> activitiesUnavailable() {
        log.warn("activity-service unavailable - serving fallback");
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.SERVICE_UNAVAILABLE,
                "The activity service is temporarily unavailable. Please try again shortly.");
        problem.setTitle("Service unavailable");
        return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(problem));
    }
}
