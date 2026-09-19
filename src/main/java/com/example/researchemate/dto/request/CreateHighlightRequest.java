// CreateHighlightRequest.java (dto/request)
package com.example.researchemate.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateHighlightRequest {

    @NotNull(message = "Source id is required")
    private Long sourceId;

    @NotBlank(message = "Selected text is required")
    private String selectedText;

    private String note;
}