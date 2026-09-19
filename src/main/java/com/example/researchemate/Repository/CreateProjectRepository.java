package com.example.researchemate.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import com.example.researchemate.model.Createproject;

public interface CreateProjectRepository extends JpaRepository<Createproject, Long> {

    List<Createproject> findByUserId(Long userId);

}
