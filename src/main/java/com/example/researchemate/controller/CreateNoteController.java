// CreateNoteController.java (controller)
package com.example.researchemate.controller;

import com.example.researchemate.common.ApiResponse;
import com.example.researchemate.dto.request.CreateNoteRequest;
import com.example.researchemate.dto.response.CreateNoteResponse;
import com.example.researchemate.service.CreateNoteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notes")
@RequiredArgsConstructor
public class CreateNoteController {

    private final CreateNoteService createNoteService;

    @PostMapping
    public ResponseEntity<ApiResponse<CreateNoteResponse>> createNote(
            @Valid @RequestBody CreateNoteRequest request) {
        CreateNoteResponse response = createNoteService.createNote(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Note created successfully", response));
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<ApiResponse<List<CreateNoteResponse>>> getNotesByProject(
            @PathVariable Long projectId) {
        return ResponseEntity.ok(ApiResponse.ok("Notes fetched successfully",
                createNoteService.getNotesByProject(projectId)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CreateNoteResponse>> updateNote(
            @PathVariable Long id, @Valid @RequestBody CreateNoteRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Note updated successfully",
                createNoteService.updateNote(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteNote(@PathVariable Long id) {
        createNoteService.deleteNote(id);
        return ResponseEntity.ok(ApiResponse.ok("Note deleted successfully", null));
    }
}