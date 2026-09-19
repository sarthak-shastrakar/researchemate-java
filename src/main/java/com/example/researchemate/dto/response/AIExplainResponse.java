package com.example.researchemate.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class AIExplainResponse {
    private Long sourceId;
    private String level;
    private String explanation;
}