package com.example.contact.repository;

import com.example.contact.entity.Category;
import com.example.contact.entity.Contact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ContactRepository extends JpaRepository<Contact, Long>, JpaSpecificationExecutor<Contact> {

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCaseAndIdNot(String email, Long id);

    long countByFavoriteTrue();

    @Query("select c.category as category, count(c) as total from Contact c group by c.category")
    List<CategoryCount> countGroupByCategory();

    interface CategoryCount {
        Category getCategory();

        long getTotal();
    }
}
