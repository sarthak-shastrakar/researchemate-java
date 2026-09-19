package com.example.researchemate.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class CreateProjectSourceResponse {
    private Long id;
    private Long projectId;
    private String url;
    private String title;
    private String sourceType;
    private String status;
    private LocalDateTime createdAt;
}