package com.example.contact.dto;

import com.example.contact.entity.Category;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;

/** Read model of a contact returned by the API. */
@Value
@Builder
public class ContactResponse {
    Long id;
    String firstName;
    String lastName;
    String fullName;
    String email;
    String phone;
    String company;
    @JsonIgnore
    String jobTitle;
    String address;
    String notes;
    Category category;
    boolean favorite;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
