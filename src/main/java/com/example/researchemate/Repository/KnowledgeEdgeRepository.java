package com.example.researchemate.Repository;

import com.example.researchemate.model.Knowledgeedge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface KnowledgeEdgeRepository extends JpaRepository<Knowledgeedge, Long> {
    List<Knowledgeedge> findByProjectId(Long projectId);
}