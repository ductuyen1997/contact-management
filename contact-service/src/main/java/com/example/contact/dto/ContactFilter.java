package com.example.contact.dto;

import com.example.contact.entity.Category;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Search / filter / sort criteria bound from request query parameters. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class ContactFilter {

    @Builder.Default
    private String q = "";

    private Category category;

    private boolean favorites;

    @Builder.Default
    private ContactSort sort = ContactSort.NAME;

    @Builder.Default
    private int page = 0;

    public boolean hasKeyword() {
        return q != null && !q.isBlank();
    }

    public int getPage() {
        return Math.max(page, 0);
    }

    public ContactSort getSort() {
        return sort == null ? ContactSort.NAME : sort;
    }
}
