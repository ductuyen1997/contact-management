package com.example.contact.service;

import com.example.contact.dto.ContactResponse;
import com.example.contact.entity.Category;
import org.junit.jupiter.api.Test;

import java.io.StringWriter;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ContactCsvExporterTest {

    private final ContactCsvExporter exporter = new ContactCsvExporter();

    @Test
    void escapesQuotesCommasAndFormulas() {
        ContactResponse contact = ContactResponse.builder()
                .firstName("Ann")
                .lastName("O\"Neil")
                .phone("+84 90 123 4567")
                .company("Foo, Inc")
                .notes("=HYPERLINK(\"x\")")
                .category(Category.CLIENT)
                .favorite(true)
                .build();

        StringWriter out = new StringWriter();
        exporter.write(List.of(contact), out);

        String row = out.toString().lines().skip(1).findFirst().orElseThrow();
        assertThat(row).isEqualTo("Ann,\"O\"\"Neil\",,+84 90 123 4567,\"Foo, Inc\",,,Client,yes,\"'=HYPERLINK(\"\"x\"\")\"");
    }
}
