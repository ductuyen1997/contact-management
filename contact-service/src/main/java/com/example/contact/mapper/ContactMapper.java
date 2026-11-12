package com.example.contact.mapper;

import com.example.contact.dto.ContactForm;
import com.example.contact.dto.ContactResponse;
import com.example.contact.entity.Contact;
import org.springframework.stereotype.Component;

/** Converts between the {@link Contact} entity and its DTOs, normalising user input on the way in. */
@Component
public class ContactMapper {

    public Contact toEntity(ContactForm form) {
        Contact contact = new Contact();
        updateEntity(contact, form);
        return contact;
    }

    public void updateEntity(Contact contact, ContactForm form) {
        contact.setFirstName(trim(form.getFirstName()));
        contact.setLastName(blankToNull(form.getLastName()));
        contact.setEmail(normaliseEmail(form.getEmail()));
        contact.setPhone(blankToNull(form.getPhone()));
        contact.setCompany(blankToNull(form.getCompany()));
        contact.setJobTitle(blankToNull(form.getJobTitle()));
        contact.setAddress(blankToNull(form.getAddress()));
        contact.setNotes(blankToNull(form.getNotes()));
        contact.setCategory(form.getCategory());
        contact.setFavorite(form.isFavorite());
    }

    public ContactResponse toResponse(Contact contact) {
        return ContactResponse.builder()
                .id(contact.getId())
                .firstName(contact.getFirstName())
                .lastName(contact.getLastName())
                .fullName(contact.getFullName())
                .email(contact.getEmail())
                .phone(contact.getPhone())
                .company(contact.getCompany())
                .jobTitle(contact.getJobTitle())
                .address(contact.getAddress())
                .notes(contact.getNotes())
                .category(contact.getCategory())
                .favorite(contact.isFavorite())
                .createdAt(contact.getCreatedAt())
                .updatedAt(contact.getUpdatedAt())
                .build();
    }

    public ContactForm toForm(Contact contact) {
        return ContactForm.builder()
                .id(contact.getId())
                .firstName(contact.getFirstName())
                .lastName(contact.getLastName())
                .email(contact.getEmail())
                .phone(contact.getPhone())
                .company(contact.getCompany())
                .jobTitle(contact.getJobTitle())
                .address(contact.getAddress())
                .notes(contact.getNotes())
                .category(contact.getCategory())
                .favorite(contact.isFavorite())
                .build();
    }

    public static String normaliseEmail(String email) {
        String value = blankToNull(email);
        return value == null ? null : value.toLowerCase();
    }

    private static String trim(String value) {
        return value == null ? null : value.trim();
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
