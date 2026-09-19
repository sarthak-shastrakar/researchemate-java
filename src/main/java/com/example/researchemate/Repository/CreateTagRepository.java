package com.example.researchemate.Repository;

import com.example.researchemate.model.Createtag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CreateTagRepository extends JpaRepository<Createtag, Long> {
    Optional<Createtag> findByName(String name);
}