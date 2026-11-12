package com.example.contact.service;

import com.example.contact.dto.ContactForm;
import com.example.contact.dto.ContactResponse;
import com.example.contact.entity.Category;
import com.example.contact.entity.Contact;
import com.example.contact.event.ContactEvent;
import com.example.contact.event.ContactEventType;
import com.example.contact.exception.DuplicateEmailException;
import com.example.contact.exception.ResourceNotFoundException;
import com.example.contact.mapper.ContactMapper;
import com.example.contact.repository.ContactRepository;
import com.example.contact.service.impl.ContactServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ContactServiceImplTest {

    @Mock
    private ContactRepository repository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    private ContactServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new ContactServiceImpl(repository, new ContactMapper(), eventPublisher);
    }

    @Test
    void createNormalisesInputBeforeSaving() {
        when(repository.existsByEmailIgnoreCase("jane@example.com")).thenReturn(false);
        when(repository.saveAndFlush(any(Contact.class))).thenAnswer(inv -> inv.getArgument(0));

        ContactForm form = ContactForm.builder()
                .firstName("  Jane ")
                .lastName("   ")
                .email(" Jane@Example.COM ")
                .company("")
                .category(Category.WORK)
                .build();

        ContactResponse result = service.create(form);

        ArgumentCaptor<Contact> saved = ArgumentCaptor.forClass(Contact.class);
        verify(repository).saveAndFlush(saved.capture());
        assertThat(saved.getValue().getFirstName()).isEqualTo("Jane");
        assertThat(saved.getValue().getLastName()).isNull();
        assertThat(saved.getValue().getEmail()).isEqualTo("jane@example.com");
        assertThat(saved.getValue().getCompany()).isNull();
        assertThat(result.getFullName()).isEqualTo("Jane");
        assertThat(publishedEvent().type()).isEqualTo(ContactEventType.CREATED);
    }

    @Test
    void createRejectsDuplicateEmail() {
        when(repository.existsByEmailIgnoreCase("taken@example.com")).thenReturn(true);

        ContactForm form = ContactForm.builder().firstName("X").email("TAKEN@example.com").build();

        assertThatThrownBy(() -> service.create(form)).isInstanceOf(DuplicateEmailException.class);
        verify(repository, never()).saveAndFlush(any());
        verifyNoInteractions(eventPublisher);
    }

    @Test
    void updateAllowsKeepingOwnEmail() {
        Contact existing = Contact.builder().firstName("Old").email("me@example.com").build();
        existing.setId(7L);
        when(repository.findById(7L)).thenReturn(Optional.of(existing));
        when(repository.existsByEmailIgnoreCaseAndIdNot("me@example.com", 7L)).thenReturn(false);
        when(repository.saveAndFlush(existing)).thenReturn(existing);

        ContactResponse result = service.update(7L,
                ContactForm.builder().firstName("New").email("me@example.com").category(Category.FRIEND).build());

        assertThat(result.getFirstName()).isEqualTo("New");
        assertThat(result.getCategory()).isEqualTo(Category.FRIEND);
    }

    @Test
    void toggleFavoriteFlipsFlag() {
        Contact existing = Contact.builder().firstName("A").favorite(false).build();
        when(repository.findById(1L)).thenReturn(Optional.of(existing));
        when(repository.saveAndFlush(existing)).thenReturn(existing);

        assertThat(service.toggleFavorite(1L).isFavorite()).isTrue();
        assertThat(publishedEvent().type()).isEqualTo(ContactEventType.FAVORITED);
    }

    @Test
    void deletePublishesDeletedEventWithName() {
        Contact existing = Contact.builder().firstName("Gone").lastName("Soon").build();
        existing.setId(3L);
        when(repository.findById(3L)).thenReturn(Optional.of(existing));

        service.delete(3L);

        verify(repository).delete(existing);
        ContactEvent event = publishedEvent();
        assertThat(event.type()).isEqualTo(ContactEventType.DELETED);
        assertThat(event.contactId()).isEqualTo(3L);
        assertThat(event.contactName()).isEqualTo("Gone Soon");
        assertThat(event.eventId()).isNotNull();
    }

    @Test
    void getByIdThrowsWhenMissing() {
        when(repository.findById(42L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getById(42L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("42");
    }

    private ContactEvent publishedEvent() {
        ArgumentCaptor<ContactEvent> captor = ArgumentCaptor.forClass(ContactEvent.class);
        verify(eventPublisher).publishEvent(captor.capture());
        return captor.getValue();
    }
}
