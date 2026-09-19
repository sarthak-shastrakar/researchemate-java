// CreateHighlightResponse.java (dto/response)
package com.example.researchemate.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class CreateHighlightResponse {
    private Long id;
    private Long sourceId;
    private String selectedText;
    private String note;
    private LocalDateTime createdAt;
}