package com.example.contact.service;

import com.example.contact.dto.ContactFilter;
import com.example.contact.dto.ContactForm;
import com.example.contact.dto.ContactResponse;
import com.example.contact.dto.ContactStats;
import org.springframework.data.domain.Page;

import java.util.List;

public interface ContactService {

    Page<ContactResponse> search(ContactFilter filter, int pageSize);

    List<ContactResponse> findAll(ContactFilter filter);

    ContactResponse getById(Long id);

    ContactForm getFormById(Long id);

    ContactResponse create(ContactForm form);

    ContactResponse update(Long id, ContactForm form);

    ContactResponse toggleFavorite(Long id);

    void delete(Long id);

    ContactStats getStats();
}
