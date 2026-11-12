package com.example.contact.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc
@Transactional
class ContactRestControllerTest {

    @Autowired
    private MockMvc mvc;

    @Test
    void listReturnsPagedJson() throws Exception {
        mvc.perform(get("/api/v1/contacts").param("size", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(5))
                .andExpect(jsonPath("$.page.totalElements").value(greaterThanOrEqualTo(12)));
    }

    @Test
    void crudLifecycle() throws Exception {
        String location = mvc.perform(post("/api/v1/contacts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"firstName":"Api","lastName":"User","email":"api@example.com","category":"CLIENT"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", containsString("/api/v1/contacts/")))
                .andExpect(jsonPath("$.fullName").value("Api User"))
                .andReturn().getResponse().getHeader("Location");

        mvc.perform(patch(location + "/favorite"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.favorite").value(true));

        mvc.perform(put(location)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"firstName":"Renamed","email":"api@example.com","category":"WORK"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Renamed"))
                .andExpect(jsonPath("$.category").value("WORK"));

        mvc.perform(delete(location)).andExpect(status().isNoContent());
        mvc.perform(get(location)).andExpect(status().isNotFound());
    }

    @Test
    void validationErrorsAreProblemDetails() throws Exception {
        mvc.perform(post("/api/v1/contacts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"firstName\":\"\",\"email\":\"nope\",\"category\":\"WORK\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.firstName").value("First name is required"))
                .andExpect(jsonPath("$.errors.email").exists());
    }

    @Test
    void duplicateEmailIsConflict() throws Exception {
        mvc.perform(post("/api/v1/contacts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"firstName\":\"Dup\",\"email\":\"alice.nguyen@example.com\",\"category\":\"WORK\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.title").value("Duplicate email"));
    }

    @Test
    void searchFiltersByKeywordAndCategory() throws Exception {
        mvc.perform(get("/api/v1/contacts").param("q", "globex"))
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].fullName").value("Bob Tran"));

        mvc.perform(get("/api/v1/contacts").param("category", "FAMILY").param("sort", "NAME_DESC"))
                .andExpect(jsonPath("$.content[0].fullName").value("Julia Ngo"))
                .andExpect(jsonPath("$.content[1].fullName").value("David Pham"));
    }

    @Test
    void exportCsvHonoursFilters() throws Exception {
        mvc.perform(get("/api/v1/contacts/export").param("favorites", "true"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", containsString("contacts.csv")))
                .andExpect(content().string(containsString("First name,Last name,Email")))
                .andExpect(content().string(containsString("Hannah")))
                .andExpect(content().string(not(containsString("Bob"))));
    }

    @Test
    void statsCountsByCategory() throws Exception {
        mvc.perform(get("/api/v1/contacts/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(12))
                .andExpect(jsonPath("$.favorites").value(3))
                .andExpect(jsonPath("$.byCategory.WORK").value(3));
    }

    @Test
    void rejectsOversizedPage() throws Exception {
        mvc.perform(get("/api/v1/contacts").param("size", "500"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void missingContactIs404() throws Exception {
        mvc.perform(get("/api/v1/contacts/99999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }
}
