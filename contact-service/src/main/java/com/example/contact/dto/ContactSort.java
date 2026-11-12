package com.example.contact.dto;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;

import static org.springframework.data.domain.Sort.Order.asc;
import static org.springframework.data.domain.Sort.Order.desc;

@Getter
@RequiredArgsConstructor
public enum ContactSort {
    NAME("Name A–Z", Sort.by(asc("firstName"), asc("lastName"))),
    NAME_DESC("Name Z–A", Sort.by(desc("firstName"), desc("lastName"))),
    COMPANY("Company", Sort.by(asc("company"), asc("firstName"))),
    NEWEST("Recently added", Sort.by(desc("createdAt"), desc("id"))),
    UPDATED("Recently updated", Sort.by(desc("updatedAt"), desc("id")));

    private final String label;
    private final Sort sort;
}
