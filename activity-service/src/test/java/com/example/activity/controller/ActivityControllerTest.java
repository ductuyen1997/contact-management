package com.example.activity.controller;

import com.example.activity.dto.ContactEvent;
import com.example.activity.repository.ActivityRepository;
import com.example.activity.service.ActivityService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@WithMockUser(roles = "USER")
class ActivityControllerTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ActivityService service;

    @Autowired
    private ActivityRepository repository;

    @BeforeEach
    void seed() {
        repository.deleteAll();
        Instant now = Instant.now();
        service.record(new ContactEvent(UUID.randomUUID(), "CREATED", 1L, "Alice", now.minusSeconds(30)));
        service.record(new ContactEvent(UUID.randomUUID(), "FAVORITED", 1L, "Alice", now.minusSeconds(10)));
        service.record(new ContactEvent(UUID.randomUUID(), "CREATED", 2L, "Bob", now.minusSeconds(20)));
    }

    @Test
    void listsNewestFirst() throws Exception {
        mvc.perform(get("/api/v1/activities"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page.totalElements").value(3))
                .andExpect(jsonPath("$.content[0].type").value("FAVORITED"))
                .andExpect(jsonPath("$.content[1].contactName").value("Bob"));
    }

    @Test
    void filtersByContact() throws Exception {
        mvc.perform(get("/api/v1/activities").param("contactId", "2"))
                .andExpect(jsonPath("$.page.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].contactName").value("Bob"));
    }

    @Test
    @WithAnonymousUser
    void requiresAuthentication() throws Exception {
        mvc.perform(get("/api/v1/activities")).andExpect(status().isUnauthorized());
    }

    @Test
    void rejectsOversizedPage() throws Exception {
        mvc.perform(get("/api/v1/activities").param("size", "500"))
                .andExpect(status().isBadRequest());
    }
}
