package com.example.researchemate.controller;

import com.example.researchemate.common.ApiResponse;
import com.example.researchemate.dto.response.KnowledgeGraphResponse;
import com.example.researchemate.model.User;
import com.example.researchemate.service.KnowledgeGraphService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/projects")
public class KnowledgeGraphController {

    private KnowledgeGraphService knowledgeGraphService;

    public KnowledgeGraphController(KnowledgeGraphService knowledgeGraphService) {
        this.knowledgeGraphService = knowledgeGraphService;
    }

    @PostMapping("/{id}/knowledge-graph/build")
    public ResponseEntity<ApiResponse<KnowledgeGraphResponse>> buildGraph(
            @PathVariable Long id, @AuthenticationPrincipal User currentUser) {
        KnowledgeGraphResponse response = knowledgeGraphService.buildGraphForProject(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Knowledge graph built successfully", response));
    }

    @GetMapping("/{id}/knowledge-graph")
    public ResponseEntity<ApiResponse<KnowledgeGraphResponse>> getGraph(
            @PathVariable Long id, @AuthenticationPrincipal User currentUser) {
        KnowledgeGraphResponse response = knowledgeGraphService.getGraphForProject(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Knowledge graph fetched successfully", response));
    }
}