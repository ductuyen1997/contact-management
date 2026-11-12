package com.example.contact.controller.api;

import com.example.contact.dto.ContactFilter;
import com.example.contact.dto.ContactForm;
import com.example.contact.dto.ContactResponse;
import com.example.contact.dto.ContactStats;
import com.example.contact.service.ContactCsvExporter;
import com.example.contact.service.ContactService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.data.web.PagedModel;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;

/** JSON REST API for contacts: {@code /api/v1/contacts}. */
@RestController
@RequestMapping("/api/v1/contacts")
@RequiredArgsConstructor
public class ContactRestController {

    private final ContactService contactService;
    private final ContactCsvExporter csvExporter;

    @GetMapping
    public PagedModel<ContactResponse> list(@ModelAttribute ContactFilter filter,
                                            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return new PagedModel<>(contactService.search(filter, size));
    }

    @GetMapping("/stats")
    public ContactStats stats() {
        return contactService.getStats();
    }

    /** Downloads the contacts matching the same filters as {@link #list} as CSV. */
    @GetMapping(value = "/export", produces = "text/csv")
    public void export(@ModelAttribute ContactFilter filter, HttpServletResponse response) throws IOException {
        response.setContentType("text/csv");
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"contacts.csv\"");
        csvExporter.write(contactService.findAll(filter), response.getWriter());
    }

    @GetMapping("/{id}")
    public ContactResponse get(@PathVariable Long id) {
        return contactService.getById(id);
    }

    @PostMapping
    public ResponseEntity<ContactResponse> create(@Valid @RequestBody ContactForm form) {
        form.setId(null);
        ContactResponse created = contactService.create(form);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}").buildAndExpand(created.getId()).toUri();
        return ResponseEntity.created(location).body(created);
    }

    @PutMapping("/{id}")
    public ContactResponse update(@PathVariable Long id, @Valid @RequestBody ContactForm form) {
        return contactService.update(id, form);
    }

    @PatchMapping("/{id}/favorite")
    public ContactResponse toggleFavorite(@PathVariable Long id) {
        return contactService.toggleFavorite(id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        contactService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
