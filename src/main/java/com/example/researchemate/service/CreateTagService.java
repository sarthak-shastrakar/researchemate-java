package com.example.researchemate.service;

import com.example.researchemate.Repository.CreateProjectSourceRepository;
import com.example.researchemate.Repository.CreateTagRepository;
import com.example.researchemate.dto.request.AddTagRequest;
import com.example.researchemate.dto.response.SourceTagResponse;
import com.example.researchemate.model.Createprojectsource;
import com.example.researchemate.model.Createtag;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CreateTagService {

    private final CreateTagRepository createTagRepository;
    private final CreateProjectSourceRepository createSourceRepository;

    public SourceTagResponse addTagToSource(AddTagRequest request) {
        Createprojectsource source = createSourceRepository.findById(request.getSourceId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Source not found with id: " + request.getSourceId()));

        // Tag already exist karta hai to use lo, warna naya banao
        Createtag tag = createTagRepository.findByName(request.getTagName().toLowerCase())
                .orElseGet(() -> createTagRepository.save(
                        Createtag.builder().name(request.getTagName().toLowerCase()).build()));

        source.getTags().add(tag);
        Createprojectsource updated = createSourceRepository.save(source);

        return mapToResponse(updated);
    }

    public SourceTagResponse removeTagFromSource(Long sourceId, Long tagId) {
        Createprojectsource source = createSourceRepository.findById(sourceId)
                .orElseThrow(() -> new IllegalArgumentException("Source not found with id: " + sourceId));

        source.getTags().removeIf(tag -> tag.getId().equals(tagId));
        Createprojectsource updated = createSourceRepository.save(source);

        return mapToResponse(updated);
    }

    public SourceTagResponse getTagsForSource(Long sourceId) {
        Createprojectsource source = createSourceRepository.findById(sourceId)
                .orElseThrow(() -> new IllegalArgumentException("Source not found with id: " + sourceId));
        return mapToResponse(source);
    }

    private SourceTagResponse mapToResponse(Createprojectsource source) {
        return SourceTagResponse.builder()
                .sourceId(source.getId())
                .tags(source.getTags().stream().map(Createtag::getName).collect(Collectors.toSet()))
                .build();
    }
}