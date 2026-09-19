// CreateNoteRequest.java (dto/request)
package com.example.researchemate.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateNoteRequest {

    @NotNull(message = "Project id is required")
    private Long projectId;

    @NotBlank(message = "Title is required")
    private String title;

    private String content;
}