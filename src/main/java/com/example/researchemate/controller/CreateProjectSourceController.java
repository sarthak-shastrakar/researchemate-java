package com.example.researchemate.controller;

import com.example.researchemate.common.ApiResponse;
import com.example.researchemate.dto.request.CreateProjectSourceRequest;
import com.example.researchemate.dto.request.SummerizeRequest;
import com.example.researchemate.dto.response.CreateProjectSourceResponse;
import com.example.researchemate.dto.response.SummerizeResponse;
import com.example.researchemate.service.CreateProjectSourceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.context.SecurityContextHolder;
import com.example.researchemate.model.User;

import com.example.researchemate.dto.request.AIExplainRequest;
import com.example.researchemate.dto.response.AIExplainResponse;
import com.example.researchemate.dto.response.SourceImageResponse;

import java.io.IOException;
import java.util.Base64;
import java.util.List;

@RestController
@RequestMapping("/api/sources")
public class CreateProjectSourceController {

    private final CreateProjectSourceService createSourceService;

    public CreateProjectSourceController(CreateProjectSourceService createSourceService) {
        this.createSourceService = createSourceService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CreateProjectSourceResponse>> createSource(
            @Valid @RequestBody CreateProjectSourceRequest request, Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        CreateProjectSourceResponse response = createSourceService.createSource(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Source created successfully", response));
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<ApiResponse<List<CreateProjectSourceResponse>>> getSourcesByProject(
            @PathVariable Long projectId, Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        List<CreateProjectSourceResponse> sources = createSourceService.getSourcesByProject(projectId, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Sources fetched successfully", sources));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CreateProjectSourceResponse>> getSourceById(@PathVariable Long id) {
        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        CreateProjectSourceResponse response = createSourceService.getSourceById(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Source fetched successfully", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSource(@PathVariable Long id, Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        createSourceService.deleteSource(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Source deleted successfully", null));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<CreateProjectSourceResponse>>> searchSources(
            @RequestParam String keyword, Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.ok("Search results",
                createSourceService.searchSources(keyword, currentUser)));
    }

    @PostMapping("/{id}/summarize")
    public ResponseEntity<ApiResponse<SummerizeResponse>> summarizeSource(
            @PathVariable Long id, @Valid @RequestBody SummerizeRequest request, Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        SummerizeResponse response = createSourceService.summarizeSource(id, request.getContent(), currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Source summarized successfully", response));
    }

    @PostMapping("/{id}/explain")
    public ResponseEntity<ApiResponse<AIExplainResponse>> explainSource(
            @PathVariable Long id, @Valid @RequestBody AIExplainRequest request, Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        AIExplainResponse response = createSourceService.explainSource(id, request.getContent(), request.getLevel(),
                currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Content explained successfully", response));
    }

    @PostMapping(value = "/{id}/explain-image", consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<AIExplainResponse>> explainImage(
            @PathVariable Long id,
            @RequestParam("image") MultipartFile image,
            @RequestParam(value = "prompt", required = false) String prompt, Authentication authentication)
            throws IOException {
        User currentUser = (User) authentication.getPrincipal();
        AIExplainResponse response = createSourceService.explainImage(id, image, prompt, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Image explained successfully", response));
    }

    @GetMapping("/{id}/images")
    public ResponseEntity<ApiResponse<List<SourceImageResponse>>> getSourceImages(@PathVariable Long id,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        List<SourceImageResponse> response = createSourceService.getImagesForSource(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Images fetched successfully",
                response));
    }

    @DeleteMapping("/images/{imageId}")
    public ResponseEntity<ApiResponse<Void>> deleteSourceImage(@PathVariable Long imageId,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        createSourceService.deleteSourceImage(imageId, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Image deleted successfully", null));
    }
}