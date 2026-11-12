package com.example.contact.dto;

import com.example.contact.entity.Category;
import lombok.Builder;
import lombok.Singular;
import lombok.Value;

import java.util.Map;

@Value
@Builder
public class ContactStats {
    long total;
    long favorites;
    @Singular("categoryCount")
    Map<Category, Long> byCategory;

    public long countFor(Category category) {
        return byCategory.getOrDefault(category, 0L);
    }
}
