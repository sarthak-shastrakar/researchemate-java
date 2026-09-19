package com.example.researchemate.controller;

import com.example.researchemate.common.ApiResponse;
import com.example.researchemate.dto.request.CreateProjectRequest;
import com.example.researchemate.dto.response.CreateProjectResponse;
import com.example.researchemate.service.CreateProjectService;
import com.example.researchemate.service.DocumentExportService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.researchemate.dto.request.GenerateReportRequest;
import com.example.researchemate.dto.response.GenerateReportResponse;
import org.springframework.security.core.Authentication;
import com.example.researchemate.model.User;
import org.springframework.http.MediaType;
import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/projects")
public class CreateProjectController {

    private CreateProjectService createProjectService;
    private DocumentExportService documentExportService;

    public CreateProjectController(CreateProjectService createProjectService,
            DocumentExportService documentExportService) {
        this.createProjectService = createProjectService;
        this.documentExportService = documentExportService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CreateProjectResponse>> createProject(
            @Valid @RequestBody CreateProjectRequest request,
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        CreateProjectResponse response = createProjectService.createProject(request, user);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Project created successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CreateProjectResponse>>> getAllProjects(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<CreateProjectResponse> projects = createProjectService.getAllProjects(user);
        return ResponseEntity.ok(ApiResponse.ok("Projects fetched successfully", projects));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CreateProjectResponse>> getProjectById(@PathVariable Long id,
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        CreateProjectResponse response = createProjectService.getProjectById(id, user);
        return ResponseEntity.ok(ApiResponse.ok("Project fetched successfully", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CreateProjectResponse>> updateProject(
            @PathVariable Long id, @Valid @RequestBody CreateProjectRequest request,
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        CreateProjectResponse response = createProjectService.updateProject(id, request, user);
        return ResponseEntity.ok(ApiResponse.ok("Project updated successfully", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProject(@PathVariable Long id, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        createProjectService.deleteProject(id, user);
        return ResponseEntity.ok(ApiResponse.ok("Project deleted successfully", null));
    }

    @PostMapping("/{id}/reports")
    public ResponseEntity<ApiResponse<GenerateReportResponse>> generateReport(
            @PathVariable Long id, @RequestBody GenerateReportRequest request,
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        GenerateReportResponse response = createProjectService.generateReport(id, request.getTitle(), user);
        return ResponseEntity.ok(ApiResponse.ok("Report generated successfully", response));
    }

    @GetMapping("/{id}/reports")
    public ResponseEntity<ApiResponse<List<GenerateReportResponse>>> getReports(
            @PathVariable Long id, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.ok("Reports fetched successfully",
                createProjectService.getReportsByProject(id, user)));
    }

    @GetMapping("/{projectId}/reports/{reportId}/download/pdf")
    public ResponseEntity<byte[]> downloadReportAsPdf(
            @PathVariable Long projectId, @PathVariable Long reportId,
            Authentication authentication) throws IOException {

        User user = (User) authentication.getPrincipal();
        GenerateReportResponse report = createProjectService.getReportById(reportId, user);
        byte[] pdfBytes = documentExportService.generatePdf(report.getTitle(), report.getContent());

        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"" + report.getTitle() + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }

    @GetMapping("/{projectId}/reports/{reportId}/download/docx")
    public ResponseEntity<byte[]> downloadReportAsDocx(
            @PathVariable Long projectId, @PathVariable Long reportId,
            Authentication authentication) throws IOException {

        User user = (User) authentication.getPrincipal();
        GenerateReportResponse report = createProjectService.getReportById(reportId, user);
        byte[] docxBytes = documentExportService.generateDocx(report.getTitle(), report.getContent());

        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"" + report.getTitle() + ".docx\"")
                .contentType(MediaType
                        .parseMediaType("application/vnd.openxmlformats-officedocument.wordprocessingml.document"))
                .body(docxBytes);
    }

    @DeleteMapping("/{projectId}/reports/{reportId}")
    public ResponseEntity<ApiResponse<Void>> deleteReport(
            @PathVariable Long projectId, @PathVariable Long reportId,
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        createProjectService.deleteReport(reportId, user);
        return ResponseEntity.ok(ApiResponse.ok("Report deleted successfully", null));
    }
}