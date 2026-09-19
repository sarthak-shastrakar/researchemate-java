package com.example.researchemate.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateProjectSourceRequest {

    @NotNull(message = "Project id is required")
    private Long projectId;

    @NotBlank(message = "URL is required")
    private String url;

    private String title;

    private String sourceType; // "ARTICLE", "DOCS", "GITHUB", "PDF", "VIDEO"
}