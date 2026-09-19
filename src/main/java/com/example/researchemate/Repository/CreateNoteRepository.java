// CreateNoteRepository.java (Repository)
package com.example.researchemate.Repository;

import com.example.researchemate.model.Createnote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CreateNoteRepository extends JpaRepository<Createnote, Long> {
    List<Createnote> findByProjectId(Long projectId);
}