// CreateHighlightService.java (service)
package com.example.researchemate.service;

import com.example.researchemate.Repository.CreateHighlightRepository;
import com.example.researchemate.Repository.CreateProjectSourceRepository;
import com.example.researchemate.dto.request.CreateHighlightRequest;
import com.example.researchemate.dto.response.CreateHighlightResponse;
import com.example.researchemate.model.Createprojecthighlight;
import com.example.researchemate.model.Createprojectsource;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CreateHighlightService {

    private final CreateHighlightRepository createHighlightRepository;
    private final CreateProjectSourceRepository createSourceRepository;

    public CreateHighlightResponse createHighlight(CreateHighlightRequest request) {
        Createprojectsource source = createSourceRepository.findById(request.getSourceId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Source not found with id: " + request.getSourceId()));

        Createprojecthighlight highlight = Createprojecthighlight.builder()
                .source(source)
                .selectedText(request.getSelectedText())
                .note(request.getNote())
                .build();

        Createprojecthighlight saved = createHighlightRepository.save(highlight);
        return mapToResponse(saved);
    }

    public List<CreateHighlightResponse> getHighlightsBySource(Long sourceId) {
        return createHighlightRepository.findBySourceId(sourceId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public void deleteHighlight(Long id) {
        Createprojecthighlight highlight = createHighlightRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Highlight not found with id: " + id));
        createHighlightRepository.delete(highlight);
    }

    private CreateHighlightResponse mapToResponse(Createprojecthighlight highlight) {
        return CreateHighlightResponse.builder()
                .id(highlight.getId())
                .sourceId(highlight.getSource().getId())
                .selectedText(highlight.getSelectedText())
                .note(highlight.getNote())
                .createdAt(highlight.getCreatedAt())
                .build();
    }
}