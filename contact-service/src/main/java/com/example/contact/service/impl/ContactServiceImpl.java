package com.example.contact.service.impl;

import com.example.contact.dto.ContactFilter;
import com.example.contact.dto.ContactForm;
import com.example.contact.dto.ContactResponse;
import com.example.contact.dto.ContactStats;
import com.example.contact.entity.Contact;
import com.example.contact.event.ContactEvent;
import com.example.contact.event.ContactEventType;
import com.example.contact.exception.DuplicateEmailException;
import com.example.contact.exception.ResourceNotFoundException;
import com.example.contact.mapper.ContactMapper;
import com.example.contact.repository.ContactRepository;
import com.example.contact.repository.ContactSpecifications;
import com.example.contact.service.ContactService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ContactServiceImpl implements ContactService {

    private static final String RESOURCE = "Contact";

    private final ContactRepository contactRepository;
    private final ContactMapper contactMapper;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    public Page<ContactResponse> search(ContactFilter filter, int pageSize) {
        PageRequest pageable = PageRequest.of(filter.getPage(), pageSize, filter.getSort().getSort());
        return contactRepository.findAll(ContactSpecifications.matching(filter), pageable)
                .map(contactMapper::toResponse);
    }

    @Override
    public List<ContactResponse> findAll(ContactFilter filter) {
        return contactRepository.findAll(ContactSpecifications.matching(filter), filter.getSort().getSort())
                .stream()
                .map(contactMapper::toResponse)
                .toList();
    }

    @Override
    public ContactResponse getById(Long id) {
        return contactMapper.toResponse(findContact(id));
    }

    @Override
    public ContactForm getFormById(Long id) {
        return contactMapper.toForm(findContact(id));
    }

    @Override
    @Transactional
    public ContactResponse create(ContactForm form) {
        ensureEmailAvailable(form.getEmail(), null);
        Contact saved = contactRepository.saveAndFlush(contactMapper.toEntity(form));
        log.info("Created contact id={} name='{}'", saved.getId(), saved.getFullName());
        publish(ContactEventType.CREATED, saved);
        return contactMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public ContactResponse update(Long id, ContactForm form) {
        Contact contact = findContact(id);
        ensureEmailAvailable(form.getEmail(), id);
        contactMapper.updateEntity(contact, form);
        Contact saved = contactRepository.saveAndFlush(contact);
        log.info("Updated contact id={}", id);
        publish(ContactEventType.UPDATED, saved);
        return contactMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public ContactResponse toggleFavorite(Long id) {
        Contact contact = findContact(id);
        contact.setFavorite(!contact.isFavorite());
        Contact saved = contactRepository.saveAndFlush(contact);
        publish(saved.isFavorite() ? ContactEventType.FAVORITED : ContactEventType.UNFAVORITED, saved);
        return contactMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Contact contact = findContact(id);
        contactRepository.delete(contact);
        log.info("Deleted contact id={} name='{}'", id, contact.getFullName());
        publish(ContactEventType.DELETED, contact);
    }

    @Override
    public ContactStats getStats() {
        ContactStats.ContactStatsBuilder stats = ContactStats.builder()
                .total(contactRepository.count())
                .favorites(contactRepository.countByFavoriteTrue());
        contactRepository.countGroupByCategory()
                .forEach(row -> stats.categoryCount(row.getCategory(), row.getTotal()));
        return stats.build();
    }

    /** Raised in-transaction; {@code ContactEventRelay} sends it to the broker after commit. */
    private void publish(ContactEventType type, Contact contact) {
        eventPublisher.publishEvent(ContactEvent.of(type, contact.getId(), contact.getFullName()));
    }

    private Contact findContact(Long id) {
        return contactRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(RESOURCE, id));
    }

    private void ensureEmailAvailable(String rawEmail, Long excludeId) {
        String email = ContactMapper.normaliseEmail(rawEmail);
        if (email == null) return;
        boolean taken = excludeId == null
                ? contactRepository.existsByEmailIgnoreCase(email)
                : contactRepository.existsByEmailIgnoreCaseAndIdNot(email, excludeId);
        if (taken) {
            throw new DuplicateEmailException(email);
        }
    }
}
