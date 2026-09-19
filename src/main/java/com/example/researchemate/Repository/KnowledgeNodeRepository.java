package com.example.researchemate.Repository;

import com.example.researchemate.model.Knowledgenode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface KnowledgeNodeRepository extends JpaRepository<Knowledgenode, Long> {
    List<Knowledgenode> findByProjectId(Long projectId);

    Optional<Knowledgenode> findByProjectIdAndNameIgnoreCase(Long projectId, String name);
}