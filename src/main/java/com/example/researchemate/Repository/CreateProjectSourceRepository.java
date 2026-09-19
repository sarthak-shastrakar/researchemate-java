package com.example.researchemate.Repository;

import com.example.researchemate.model.Createprojectsource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CreateProjectSourceRepository extends JpaRepository<Createprojectsource, Long> {
    List<Createprojectsource> findByProjectId(Long projectId);

    List<Createprojectsource> findByTitleContainingIgnoreCaseOrUrlContainingIgnoreCase(
            String titleKeyword, String urlKeyword);
}
