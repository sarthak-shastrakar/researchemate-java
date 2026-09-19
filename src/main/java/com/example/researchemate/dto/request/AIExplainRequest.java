package com.example.researchemate.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AIExplainRequest {

    @NotBlank(message = "Content is required")
    private String content;

    @NotBlank(message = "Level is required")
    private String level;
}