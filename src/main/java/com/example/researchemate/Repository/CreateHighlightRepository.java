// CreateHighlightRepository.java (Repository)
package com.example.researchemate.Repository;

import com.example.researchemate.model.Createprojecthighlight;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CreateHighlightRepository extends JpaRepository<Createprojecthighlight, Long> {
    List<Createprojecthighlight> findBySourceId(Long sourceId);
}