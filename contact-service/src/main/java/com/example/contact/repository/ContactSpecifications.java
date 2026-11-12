package com.example.contact.repository;

import com.example.contact.dto.ContactFilter;
import com.example.contact.entity.Contact;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

/** Builds dynamic JPA criteria queries from a {@link ContactFilter}. */
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class ContactSpecifications {

    private static final List<String> SEARCHABLE = List.of("firstName", "lastName", "email", "phone", "company");

    public static Specification<Contact> matching(ContactFilter filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.hasKeyword()) {
                String pattern = "%" + filter.getQ().trim().toLowerCase() + "%";
                Predicate[] any = SEARCHABLE.stream()
                        .map(field -> {
                            Expression<String> value = cb.coalesce(root.get(field), "");
                            return cb.like(cb.lower(value), pattern);
                        })
                        .toArray(Predicate[]::new);
                predicates.add(cb.or(any));
            }
            if (filter.getCategory() != null) {
                predicates.add(cb.equal(root.get("category"), filter.getCategory()));
            }
            if (filter.isFavorites()) {
                predicates.add(cb.isTrue(root.get("favorite")));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }
}
