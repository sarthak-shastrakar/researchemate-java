package com.example.researchemate.dto.request;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ExtractedGraphRequest {
    private List<ExtractedNodeRequest> nodes;
    private List<ExtractedEdgeRequest> edges;
}
