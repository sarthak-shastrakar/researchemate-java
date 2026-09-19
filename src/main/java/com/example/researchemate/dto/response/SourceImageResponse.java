package com.example.researchemate.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class SourceImageResponse {
    private Long id;
    private String imageUrl;
    private String prompt;
    private String explanation;
    private LocalDateTime createdAt;
}