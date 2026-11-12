package com.example.contact.service;

import com.example.contact.dto.ContactResponse;
import org.springframework.stereotype.Component;

import java.io.PrintWriter;
import java.io.Writer;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/** Writes contacts as RFC 4180 CSV, guarding against spreadsheet formula injection. */
@Component
public class ContactCsvExporter {

    private static final Pattern FORMULA_START = Pattern.compile("^[=+\\-@\t\r]");
    private static final Pattern PHONE_LIKE = Pattern.compile("^[+\\-]?[0-9 ()\\-.]+$");

    private static final String HEADER =
            "First name,Last name,Email,Phone,Company,Job title,Address,Category,Favorite,Notes";

    public void write(List<ContactResponse> contacts, Writer writer) {
        PrintWriter out = new PrintWriter(writer);
        out.println(HEADER);
        for (ContactResponse c : contacts) {
            out.println(Stream.of(
                            c.getFirstName(), c.getLastName(), c.getEmail(), c.getPhone(), c.getCompany(),
                            c.getJobTitle(), c.getAddress(), c.getCategory().getLabel(),
                            c.isFavorite() ? "yes" : "no", c.getNotes())
                    .map(ContactCsvExporter::escape)
                    .collect(Collectors.joining(",")));
        }
        out.flush();
    }

    static String escape(String value) {
        if (value == null) return "";
        if (FORMULA_START.matcher(value).find() && !PHONE_LIKE.matcher(value).matches()) {
            value = "'" + value;
        }
        if (value.contains(",") || value.contains("\"") || value.contains("\n") || value.contains("\r")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
