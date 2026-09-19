// CreateHighlightController.java (controller)
package com.example.researchemate.controller;

import com.example.researchemate.common.ApiResponse;
import com.example.researchemate.dto.request.CreateHighlightRequest;
import com.example.researchemate.dto.response.CreateHighlightResponse;
import com.example.researchemate.service.CreateHighlightService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/highlights")
@RequiredArgsConstructor
public class CreateHighlightController {

    private final CreateHighlightService createHighlightService;

    @PostMapping
    public ResponseEntity<ApiResponse<CreateHighlightResponse>> createHighlight(
            @Valid @RequestBody CreateHighlightRequest request) {
        CreateHighlightResponse response = createHighlightService.createHighlight(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Highlight created successfully", response));
    }

    @GetMapping("/source/{sourceId}")
    public ResponseEntity<ApiResponse<List<CreateHighlightResponse>>> getHighlightsBySource(
            @PathVariable Long sourceId) {
        return ResponseEntity.ok(ApiResponse.ok("Highlights fetched successfully",
                createHighlightService.getHighlightsBySource(sourceId)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteHighlight(@PathVariable Long id) {
        createHighlightService.deleteHighlight(id);
        return ResponseEntity.ok(ApiResponse.ok("Highlight deleted successfully", null));
    }
}