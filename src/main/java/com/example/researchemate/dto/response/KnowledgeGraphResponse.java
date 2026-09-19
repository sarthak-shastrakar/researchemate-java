package com.example.researchemate.dto.response;

import java.util.List;

public record KnowledgeGraphResponse(List<NodeResponse> nodes, List<EdgeResponse> edges) {
}