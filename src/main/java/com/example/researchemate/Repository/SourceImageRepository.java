package com.example.researchemate.Repository;

import com.example.researchemate.model.Sourceimg;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SourceImageRepository extends JpaRepository<Sourceimg, Long> {
    List<Sourceimg> findBySourceId(Long sourceId);
}