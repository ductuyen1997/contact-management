package com.example.contact.config;

import com.example.contact.entity.Category;
import com.example.contact.entity.Contact;
import com.example.contact.repository.ContactRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Seeds example contacts the first time the application starts against an empty database. */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final ContactRepository contactRepository;
    private final AppProperties appProperties;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!appProperties.isSeedData() || contactRepository.count() > 0) {
            return;
        }
        List<Contact> contacts = List.of(
                contact("Alice", "Nguyen", "alice.nguyen@example.com", "+84 90 123 4567", "Acme Corp", "Product Manager", Category.WORK, true),
                contact("Bob", "Tran", "bob.tran@example.com", "+84 91 234 5678", "Globex", "Software Engineer", Category.WORK, false),
                contact("Chi", "Le", "chi.le@example.com", "+84 93 345 6789", null, null, Category.FRIEND, true),
                contact("David", "Pham", "david.pham@example.com", "+84 94 456 7890", null, null, Category.FAMILY, false),
                contact("Emma", "Hoang", "emma@initech.example", "+1 415 555 0134", "Initech", "Head of Sales", Category.CLIENT, false),
                contact("Frank", "Vo", "frank.vo@example.com", "+84 96 567 8901", "Umbrella Ltd", "Designer", Category.CLIENT, false),
                contact("Giang", "Do", "giang.do@example.com", "+84 97 678 9012", null, null, Category.FRIEND, false),
                contact("Hannah", "Bui", "hannah.bui@example.com", "+44 20 7946 0958", "Stark Industries", "CTO", Category.WORK, true),
                contact("Ivan", "Dang", null, "+84 98 789 0123", null, null, Category.OTHER, false),
                contact("Julia", "Ngo", "julia.ngo@example.com", "+84 99 890 1234", null, null, Category.FAMILY, false),
                contact("Kevin", "Duong", "kevin@wayne.example", "+1 212 555 0199", "Wayne Enterprises", "Accountant", Category.CLIENT, false),
                contact("Linh", "Ly", "linh.ly@example.com", "+84 90 901 2345", null, null, Category.FRIEND, false));
        contactRepository.saveAll(contacts);
        log.info("Seeded {} sample contacts", contacts.size());
    }

    private static Contact contact(String firstName, String lastName, String email, String phone,
                                   String company, String jobTitle, Category category, boolean favorite) {
        return Contact.builder()
                .firstName(firstName)
                .lastName(lastName)
                .email(email)
                .phone(phone)
                .company(company)
                .jobTitle(jobTitle)
                .category(category)
                .favorite(favorite)
                .build();
    }
}
