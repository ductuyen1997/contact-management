package com.example.contact.dto;

import com.example.contact.entity.Category;
import jakarta.validation.constraints.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Create / update payload, used both by the HTML form and the REST API. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class ContactForm {

    /** Present only when editing; ignored on input by the API. */
    private Long id;

    @NotBlank(message = "First name is required")
    @Size(max = 60, message = "First name must be at most 60 characters")
    private String firstName;

    @Size(max = 60, message = "Last name must be at most 60 characters")
    private String lastName;

    @Email(message = "Please enter a valid email address")
    @Size(max = 120, message = "Email must be at most 120 characters")
    private String email;

    @Pattern(regexp = "^$|^[+0-9 ()\\-.]{6,25}$", message = "Please enter a valid phone number")
    private String phone;

    @Size(max = 100, message = "Company must be at most 100 characters")
    private String company;

    @Size(max = 100, message = "Job title must be at most 100 characters")
    private String jobTitle;

    @Size(max = 255, message = "Address must be at most 255 characters")
    private String address;

    @Size(max = 2000, message = "Notes must be at most 2000 characters")
    private String notes;

    @NotNull(message = "Category is required")
    @Builder.Default
    private Category category = Category.OTHER;

    private boolean favorite;
}
