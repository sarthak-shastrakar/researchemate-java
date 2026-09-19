// CreateNoteService.java (service)
package com.example.researchemate.service;

import com.example.researchemate.Repository.CreateNoteRepository;
import com.example.researchemate.Repository.CreateProjectRepository;
import com.example.researchemate.dto.request.CreateNoteRequest;
import com.example.researchemate.dto.response.CreateNoteResponse;
import com.example.researchemate.model.Createnote;
import com.example.researchemate.model.Createproject;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CreateNoteService {

    private final CreateNoteRepository createNoteRepository;
    private final CreateProjectRepository createProjectRepository;

    public CreateNoteResponse createNote(CreateNoteRequest request) {
        Createproject project = createProjectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Project not found with id: " + request.getProjectId()));

        Createnote note = Createnote.builder()
                .project(project)
                .title(request.getTitle())
                .content(request.getContent())
                .build();

        Createnote saved = createNoteRepository.save(note);
        return mapToResponse(saved);
    }

    public List<CreateNoteResponse> getNotesByProject(Long projectId) {
        return createNoteRepository.findByProjectId(projectId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public CreateNoteResponse updateNote(Long id, CreateNoteRequest request) {
        Createnote note = findNoteOrThrow(id);
        note.setTitle(request.getTitle());
        note.setContent(request.getContent());

        Createnote updated = createNoteRepository.save(note);
        return mapToResponse(updated);
    }

    public void deleteNote(Long id) {
        Createnote note = findNoteOrThrow(id);
        createNoteRepository.delete(note);
    }

    private Createnote findNoteOrThrow(Long id) {
        return createNoteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Note not found with id: " + id));
    }

    private CreateNoteResponse mapToResponse(Createnote note) {
        return CreateNoteResponse.builder()
                .id(note.getId())
                .projectId(note.getProject().getId())
                .title(note.getTitle())
                .content(note.getContent())
                .createdAt(note.getCreatedAt())
                .updatedAt(note.getUpdatedAt())
                .build();
    }
}