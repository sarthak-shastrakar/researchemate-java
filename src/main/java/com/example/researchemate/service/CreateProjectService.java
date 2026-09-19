package com.example.researchemate.service;

import com.example.researchemate.Repository.CreateProjectRepository;
import com.example.researchemate.dto.request.CreateProjectRequest;
import com.example.researchemate.dto.response.CreateProjectResponse;
import com.example.researchemate.model.Createproject;
import com.example.researchemate.ai.AIProvider;
import com.example.researchemate.model.User;
import com.example.researchemate.Repository.CreateProjectSourceRepository;
import com.example.researchemate.Repository.CreateNoteRepository;
import com.example.researchemate.Repository.ReportRepository;
import com.example.researchemate.model.Createnote;
import com.example.researchemate.dto.request.GenerateReportRequest;
import com.example.researchemate.dto.response.GenerateReportResponse;
import com.example.researchemate.exception.ResourceNotFoundException;
import com.example.researchemate.model.Report;
import org.springframework.stereotype.Service;
import com.example.researchemate.model.Createprojectsource;
import java.util.List;

@Service

public class CreateProjectService {

    private CreateProjectSourceRepository createProjectSourceRepository;
    private CreateProjectRepository createProjectRepository;
    private AIProvider aiProvider;
    private CreateNoteRepository createNoteRepository;
    private ReportRepository reportRepository; // constructor mein add

    // constructor
    public CreateProjectService(CreateProjectRepository createProjectRepository, AIProvider aiProvider,
            CreateProjectSourceRepository createProjectSourceRepository,
            CreateNoteRepository createNoteRepository,
            ReportRepository reportRepository) {
        this.createProjectRepository = createProjectRepository;
        this.aiProvider = aiProvider;
        this.createProjectSourceRepository = createProjectSourceRepository;
        this.createNoteRepository = createNoteRepository;
        this.reportRepository = reportRepository;
    }

    public CreateProjectResponse createProject(CreateProjectRequest request, User currentUser) {
        Createproject project = Createproject.builder()
                .name(request.getName())
                .description(request.getDescription())
                .user(currentUser)
                .build();

        Createproject saved = createProjectRepository.save(project);
        return mapToResponse(saved);
    }

    public List<CreateProjectResponse> getAllProjects(User currentUser) {
        return createProjectRepository.findByUserId(currentUser.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public CreateProjectResponse getProjectById(Long id, User currentUser) {
        Createproject project = findProjectOrThrow(id);
        verifyOwnership(project, currentUser);
        return mapToResponse(project);
    }

    public CreateProjectResponse updateProject(Long id, CreateProjectRequest request, User currentUser) {
        Createproject project = findProjectOrThrow(id);
        verifyOwnership(project, currentUser);
        project.setName(request.getName());
        project.setDescription(request.getDescription());

        Createproject updated = createProjectRepository.save(project);
        return mapToResponse(updated);
    }

    public void deleteProject(Long id, User currentUser) {
        Createproject project = findProjectOrThrow(id);
        verifyOwnership(project, currentUser);
        createProjectRepository.delete(project);
    }

    // ---- private helpers ----

    public Createproject findProjectOrThrow(Long id) {
        return createProjectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Project not found with id: " + id));
    }

    private CreateProjectResponse mapToResponse(Createproject project) {
        return CreateProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .build();
    }

    // ---- ownership helper — baaki services bhi isko call karenge ----
    public void verifyOwnership(Createproject project, User currentUser) {
        if (!project.getUser().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("Access denied: this project does not belong to you");
        }
    }

    public GenerateReportResponse generateReport(Long projectId, String customTitle, User currentUser) {
        Createproject project = findProjectOrThrow(projectId);
        verifyOwnership(project, currentUser);

        // 1. Saare summaries + notes collect karo (AI context ke liye)
        StringBuilder context = new StringBuilder();

        List<Createprojectsource> sources = createProjectSourceRepository.findByProjectId(projectId);
        for (Createprojectsource source : sources) {
            if (source.getSummary() != null && !source.getSummary().isBlank()) {
                context.append("Source Title: ").append(source.getTitle()).append("\n");
                context.append("Source Type: ").append(source.getSourceType()).append("\n");
                if (source.getUrl() != null && !source.getUrl().isBlank()) {
                    context.append("Source URL: ").append(source.getUrl()).append("\n");
                }
                context.append("Summary:\n").append(source.getSummary()).append("\n\n");
            }
        }

        List<Createnote> notes = createNoteRepository.findByProjectId(projectId);
        for (Createnote note : notes) {
            context.append("Note: ").append(note.getTitle()).append("\n");
            context.append(note.getContent()).append("\n\n");
        }

        if (context.isEmpty()) {
            throw new IllegalArgumentException("No summarized sources or notes found to generate a report");
        }

        // 2. AI se report banwao
        String aiReportContent = aiProvider.generateReport(context.toString());

        // 3. Deterministic References section append karo (AI ke baad, 100% accurate)
        StringBuilder referencesSection = new StringBuilder();
        referencesSection.append("\n\n---\n\n## References\n\n");
        int refNum = 1;
        for (Createprojectsource source : sources) {
            if (source.getSummary() != null && !source.getSummary().isBlank()) {
                referencesSection.append(refNum).append(". ");
                if (source.getUrl() != null && !source.getUrl().isBlank()) {
                    referencesSection.append("**[").append(source.getTitle())
                            .append("](").append(source.getUrl()).append(")**");
                } else {
                    referencesSection.append("**").append(source.getTitle()).append("**");
                }
                if (source.getSourceType() != null) {
                    referencesSection.append(" — `").append(source.getSourceType()).append("`");
                }
                referencesSection.append("\n");
                refNum++;
            }
        }

        String reportContent = aiReportContent + (refNum > 1 ? referencesSection.toString() : "");

        String title = (customTitle != null && !customTitle.isBlank())
                ? customTitle
                : "Research Report: " + project.getName();

        // 3. DB mein save karo
        Report report = Report.builder()
                .project(project)
                .title(title)
                .content(reportContent)
                .build();

        Report saved = reportRepository.save(report);

        return GenerateReportResponse.builder()
                .id(saved.getId())
                .projectId(project.getId())
                .title(saved.getTitle())
                .content(saved.getContent())
                .createdAt(saved.getCreatedAt())
                .build();
    }

    public List<GenerateReportResponse> getReportsByProject(Long projectId, User currentUser) {
        Createproject project = findProjectOrThrow(projectId);
        verifyOwnership(project, currentUser);

        return reportRepository.findByProjectId(projectId)
                .stream()
                .map(r -> GenerateReportResponse.builder()
                        .id(r.getId())
                        .projectId(project.getId())
                        .title(r.getTitle())
                        .content(r.getContent())
                        .createdAt(r.getCreatedAt())
                        .build())
                .toList();
    }

    public GenerateReportResponse getReportById(Long reportId, User currentUser) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found with id: " + reportId));

        verifyOwnership(report.getProject(), currentUser);

        return GenerateReportResponse.builder()
                .id(report.getId())
                .projectId(report.getProject().getId())
                .title(report.getTitle())
                .content(report.getContent())
                .createdAt(report.getCreatedAt())
                .build();
    }

    public void deleteReport(Long reportId, User currentUser) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found with id: " + reportId));
        verifyOwnership(report.getProject(), currentUser);
        reportRepository.delete(report);
    }
}