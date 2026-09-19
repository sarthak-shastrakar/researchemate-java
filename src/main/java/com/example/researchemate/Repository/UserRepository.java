package com.example.researchemate.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.researchemate.model.User;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
}