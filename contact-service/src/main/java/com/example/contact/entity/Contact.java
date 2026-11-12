package com.example.contact.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "contacts", indexes = {
        @Index(name = "idx_contacts_first_name", columnList = "firstName"),
        @Index(name = "idx_contacts_category", columnList = "category")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(of = {"firstName", "lastName", "email"})
public class Contact extends BaseEntity {

    @Column(nullable = false, length = 60)
    private String firstName;

    @Column(length = 60)
    private String lastName;

    @Column(unique = true, length = 120)
    private String email;

    @Column(length = 25)
    private String phone;

    @Column(length = 100)
    private String company;

    @Column(length = 100)
    private String jobTitle;

    private String address;

    @Column(length = 2000)
    private String notes;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Category category = Category.OTHER;

    private boolean favorite;

    public String getFullName() {
        return lastName == null || lastName.isBlank() ? firstName : firstName + " " + lastName;
    }
}
