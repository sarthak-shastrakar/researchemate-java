package com.example.researchemate.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ExtractedEdgeRequest {
    private String source;
    private String target;
    private String label;
}