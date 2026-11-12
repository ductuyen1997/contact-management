package com.example.activity.repository;

import com.example.activity.entity.Activity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ActivityRepository extends JpaRepository<Activity, Long> {

    boolean existsByEventId(UUID eventId);

    Page<Activity> findByContactId(Long contactId, Pageable pageable);
}
