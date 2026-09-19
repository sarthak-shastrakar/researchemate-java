package com.example.researchemate.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class GenerateReportResponse {
    private Long id;
    private Long projectId;
    private String title;
    private String content;
    private LocalDateTime createdAt;
}