package com.example.researchemate.service;

import com.example.researchemate.Repository.CreateProjectRepository;
import com.example.researchemate.Repository.CreateProjectSourceRepository;
import com.example.researchemate.ai.AIProvider;
import com.example.researchemate.dto.request.CreateProjectSourceRequest;
import com.example.researchemate.dto.response.CreateProjectSourceResponse;
import com.example.researchemate.dto.response.SummerizeResponse;
import com.example.researchemate.model.Createprojectsource;
import com.example.researchemate.model.Createproject;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Value;
import com.example.researchemate.model.User;
import com.cloudinary.Cloudinary;

import java.util.Base64;
import java.util.UUID;
import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.Files;
import com.example.researchemate.dto.response.AIExplainResponse;
import com.example.researchemate.Repository.SourceImageRepository;
import com.example.researchemate.dto.response.SourceImageResponse;
import com.example.researchemate.model.Sourceimg;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import com.cloudinary.utils.ObjectUtils;
import com.example.researchemate.exception.ResourceNotFoundException;

@Service
public class CreateProjectSourceService {

    private CreateProjectSourceRepository createProjectSourceRepository;
    private CreateProjectRepository createProjectRepository;
    private AIProvider aiProvider;
    private SourceImageRepository sourceImageRepository;
    private CreateProjectService createProjectService;
    private Cloudinary cloudinary;

    public CreateProjectSourceService(CreateProjectSourceRepository createProjectSourceRepository,
            CreateProjectRepository createProjectRepository, AIProvider aiProvider,
            SourceImageRepository sourceImageRepository, CreateProjectService createProjectService,
            Cloudinary cloudinary) {
        this.createProjectSourceRepository = createProjectSourceRepository;
        this.createProjectRepository = createProjectRepository;
        this.aiProvider = aiProvider;
        this.sourceImageRepository = sourceImageRepository;
        this.createProjectService = createProjectService;
        this.cloudinary = cloudinary;
    }

    public CreateProjectSourceResponse createSource(CreateProjectSourceRequest createProjectSourceRequest,
            Long projectId, User currentUser) {
        Createproject project = findProjectOrThrow(projectId);
        createProjectService.verifyOwnership(project, currentUser);

        Createprojectsource source = Createprojectsource.builder()
                .project(project)
                .url(createProjectSourceRequest.getUrl())
                .title(createProjectSourceRequest.getTitle())
                .sourceType(createProjectSourceRequest.getSourceType() != null
                        ? Createprojectsource.SourceType
                                .valueOf(createProjectSourceRequest.getSourceType().toUpperCase())
                        : Createprojectsource.SourceType.ARTICLE)
                .build();

        Createprojectsource saved = createProjectSourceRepository.save(source);
        return mapToResponse(saved);
    }

    public CreateProjectSourceResponse createSource(CreateProjectSourceRequest createProjectSourceRequest,
            User currentUser) {
        return createSource(createProjectSourceRequest, createProjectSourceRequest.getProjectId(), currentUser);
    }

    public List<CreateProjectSourceResponse> getSourcesByProject(Long projectId, User currentUser) {
        Createproject project = findProjectOrThrow(projectId);
        createProjectService.verifyOwnership(project, currentUser);

        return createProjectSourceRepository.findByProjectId(projectId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public CreateProjectSourceResponse getSourceById(Long id, User currentUser) {
        Createprojectsource source = findSourceOrThrow(id);
        createProjectService.verifyOwnership(source.getProject(), currentUser);
        return mapToResponse(source);
    }

    public void deleteSource(Long id, User currentUser) {
        Createprojectsource source = findSourceOrThrow(id);
        createProjectService.verifyOwnership(source.getProject(), currentUser);
        createProjectSourceRepository.delete(source);
    }

    // search method
    public List<CreateProjectSourceResponse> searchSources(String keyword, Long projectId, User currentUser) {
        return createProjectSourceRepository
                .findByTitleContainingIgnoreCaseOrUrlContainingIgnoreCase(keyword, keyword)
                .stream()
                .filter(s -> s.getProject().getUser().getId().equals(currentUser.getId()))
                // .filter(s -> (projectId == null || s.getProject().getId().equals(projectId))
                // && s.getProject().getUser().getId().equals(currentUser.getId()))
                .map(this::mapToResponse)
                .toList();
    }

    public List<CreateProjectSourceResponse> searchSources(String keyword, User currentUser) {
        return searchSources(keyword, null, currentUser);
    }

    // explain content method
    public AIExplainResponse explainSource(Long sourceId, String content, String level, User currentUser) {
        Createprojectsource source = findSourceOrThrow(sourceId);
        createProjectService.verifyOwnership(source.getProject(), currentUser);

        String explanation = aiProvider.explainContent(content, level);

        return AIExplainResponse.builder()
                .sourceId(source.getId())
                .level(level)
                .explanation(explanation)
                .build();
    }

    // ai feature one
    public SummerizeResponse summarizeSource(Long sourceId, String content, User currentUser) {
        Createprojectsource source = findSourceOrThrow(sourceId);
        createProjectService.verifyOwnership(source.getProject(), currentUser);

        String summary = aiProvider.generateSummary(content);

        source.setSummary(summary);
        source.setStatus(Createprojectsource.SourceStatus.PROCESSED);
        createProjectSourceRepository.save(source);

        return SummerizeResponse.builder()
                .sourceId(source.getId())
                .summary(summary)
                .build();
    }

    @Value("${researchmate.storage.image-upload-dir}")
    private String imageUploadDir;

    public AIExplainResponse explainImage(Long sourceId, MultipartFile imageFile, String prompt, User currentUser)
            throws IOException {
        Createprojectsource source = findSourceOrThrow(sourceId);
        createProjectService.verifyOwnership(source.getProject(), currentUser);

        // 1. Cloudinary pe upload karo (local disk save karne ki jagah)
        Map<String, Object> uploadResult = cloudinary.uploader().upload(
                imageFile.getBytes(),
                ObjectUtils.asMap("folder", "researchmate_images"));
        String imageUrl = (String) uploadResult.get("secure_url"); // permanent cloud URL

        // 2. AI se explanation lo
        String base64 = Base64.getEncoder().encodeToString(imageFile.getBytes());
        String explanation = aiProvider.explainImage(base64, imageFile.getContentType(), prompt);

        // 3. DB mein save karo (ab local path nahi, Cloudinary URL)
        Sourceimg sourceimg = Sourceimg.builder()
                .source(source)
                .imagePath(imageUrl) // ab full cloud URL hai
                .prompt(prompt)
                .explanation(explanation)
                .build();
        sourceImageRepository.save(sourceimg);

        return AIExplainResponse.builder()
                .sourceId(source.getId())
                .level("image")
                .explanation(explanation)
                .build();
    }

    public List<SourceImageResponse> getImagesForSource(Long sourceId, User currentUser) {
        Createprojectsource source = findSourceOrThrow(sourceId);
        createProjectService.verifyOwnership(source.getProject(), currentUser);
        return sourceImageRepository.findBySourceId(sourceId)
                .stream()
                .map(img -> SourceImageResponse.builder()
                        .id(img.getId())
                        .imageUrl(img.getImagePath())
                        .prompt(img.getPrompt())
                        .explanation(img.getExplanation())
                        .createdAt(img.getCreatedAt())
                        .build())
                .toList();
    }

    public void deleteSourceImage(Long imageId, User currentUser) {
        Sourceimg image = sourceImageRepository.findById(imageId)
                .orElseThrow(() -> new ResourceNotFoundException("Image not found with id: " + imageId));

        createProjectService.verifyOwnership(image.getSource().getProject(), currentUser);

        try {
            // Cloudinary URL se public_id nikaalo delete karne ke liye
            String publicId = extractPublicIdFromUrl(image.getImagePath());
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        } catch (Exception e) {
            System.out.println("Warning: could not delete image from Cloudinary - " + e.getMessage());
        }

        sourceImageRepository.delete(image);
    }

    private String extractPublicIdFromUrl(String url) {
        // Example URL:
        // https://res.cloudinary.com/xxx/image/upload/v123/researchmate_images/abc123.jpg
        String[] parts = url.split("/");
        String fileNameWithExt = parts[parts.length - 1];
        String fileName = fileNameWithExt.substring(0, fileNameWithExt.lastIndexOf('.'));
        return "researchmate_images/" + fileName;
    }

    // private helpers

    private Createprojectsource findSourceOrThrow(Long id) {
        return createProjectSourceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Source not found with id: " + id));
    }

    private Createproject findProjectOrThrow(Long id) {
        return createProjectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Project not found with id: " + id));
    }

    private CreateProjectSourceResponse mapToResponse(Createprojectsource source) {
        return CreateProjectSourceResponse.builder()
                .id(source.getId())
                .projectId(source.getProject().getId())
                .url(source.getUrl())
                .title(source.getTitle())
                .sourceType(source.getSourceType().name())
                .status(source.getStatus().name())
                .createdAt(source.getCreatedAt())
                .build();
    }

}