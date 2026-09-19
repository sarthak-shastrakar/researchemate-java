package com.example.researchemate.controller;

import com.example.researchemate.common.ApiResponse;
import com.example.researchemate.dto.request.AddTagRequest;
import com.example.researchemate.dto.response.SourceTagResponse;
import com.example.researchemate.service.CreateTagService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
public class CreateTagController {

    private final CreateTagService createTagService;

    @PostMapping
    public ResponseEntity<ApiResponse<SourceTagResponse>> addTag(
            @Valid @RequestBody AddTagRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Tag added successfully",
                createTagService.addTagToSource(request)));
    }

    @DeleteMapping("/source/{sourceId}/tag/{tagId}")
    public ResponseEntity<ApiResponse<SourceTagResponse>> removeTag(
            @PathVariable Long sourceId, @PathVariable Long tagId) {
        return ResponseEntity.ok(ApiResponse.ok("Tag removed successfully",
                createTagService.removeTagFromSource(sourceId, tagId)));
    }

    @GetMapping("/source/{sourceId}")
    public ResponseEntity<ApiResponse<SourceTagResponse>> getTags(@PathVariable Long sourceId) {
        return ResponseEntity.ok(ApiResponse.ok("Tags fetched successfully",
                createTagService.getTagsForSource(sourceId)));
    }
}