package com.example.researchemate.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateProjectRequest {

    @NotBlank(message = "Project name is required")
    @Size(max = 150, message = "Project name must be under 150 characters")
    private String name;

    @Size(max = 1000, message = "Description must be under 1000 characters")
    private String description;
}