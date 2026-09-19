package com.example.researchemate.service;

import com.example.researchemate.Repository.CreateProjectSourceRepository;
import com.example.researchemate.Repository.KnowledgeEdgeRepository;
import com.example.researchemate.Repository.KnowledgeNodeRepository;
import com.example.researchemate.ai.AIProvider;
import com.example.researchemate.dto.request.ExtractedEdgeRequest;
import com.example.researchemate.dto.request.ExtractedGraphRequest;
import com.example.researchemate.dto.request.ExtractedNodeRequest;
import com.example.researchemate.dto.response.EdgeResponse;
import com.example.researchemate.dto.response.KnowledgeGraphResponse;
import com.example.researchemate.dto.response.NodeResponse;
import com.example.researchemate.model.Createproject;
import com.example.researchemate.model.Createprojectsource;
import com.example.researchemate.model.Knowledgeedge;
import com.example.researchemate.model.Knowledgenode;
import com.example.researchemate.model.User;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class KnowledgeGraphService {

    private KnowledgeNodeRepository knowledgeNodeRepository;
    private KnowledgeEdgeRepository knowledgeEdgeRepository;
    private CreateProjectSourceRepository createProjectSourceRepository;
    private CreateProjectService createProjectService;
    private AIProvider aiProvider;

    public KnowledgeGraphService(KnowledgeNodeRepository knowledgeNodeRepository,
            KnowledgeEdgeRepository knowledgeEdgeRepository,
            CreateProjectSourceRepository createProjectSourceRepository, CreateProjectService createProjectService,
            AIProvider aiProvider) {
        this.knowledgeNodeRepository = knowledgeNodeRepository;
        this.knowledgeEdgeRepository = knowledgeEdgeRepository;
        this.createProjectSourceRepository = createProjectSourceRepository;
        this.createProjectService = createProjectService;
        this.aiProvider = aiProvider;
    }

    public KnowledgeGraphResponse buildGraphForProject(Long projectId, User currentUser) {
        Createproject project = createProjectService.findProjectOrThrow(projectId);
        createProjectService.verifyOwnership(project, currentUser);

        List<Createprojectsource> sources = createProjectSourceRepository.findByProjectId(projectId);

        // Purana graph clear karo, fresh banayenge (simple approach)
        knowledgeEdgeRepository.deleteAll(knowledgeEdgeRepository.findByProjectId(projectId));
        knowledgeNodeRepository.deleteAll(knowledgeNodeRepository.findByProjectId(projectId));

        Map<String, Knowledgenode> nodeCache = new HashMap<>();

        for (Createprojectsource source : sources) {
            if (source.getSummary() == null || source.getSummary().isBlank())
                continue;

            String aiResponse = aiProvider.extractKnowledgeGraph(source.getSummary());
            ExtractedGraphRequest extracted = parseAiResponse(aiResponse);

            if (extracted.getNodes() == null || extracted.getEdges() == null)
                continue;

            // Step A: Nodes save karo (duplicate check ke saath)
            for (ExtractedNodeRequest extractedNode : extracted.getNodes()) {
                String key = extractedNode.getName().toLowerCase();
                if (!nodeCache.containsKey(key)) {
                    Knowledgenode node = knowledgeNodeRepository
                            .findByProjectIdAndNameIgnoreCase(projectId, extractedNode.getName())
                            .orElseGet(() -> knowledgeNodeRepository.save(
                                    Knowledgenode.builder()
                                            .project(project)
                                            .name(extractedNode.getName())
                                            .type(extractedNode.getType() != null ? extractedNode.getType() : "OTHER")
                                            .build()));
                    nodeCache.put(key, node);
                }
            }

            // Step B: Edges save karo
            for (ExtractedEdgeRequest extractedEdge : extracted.getEdges()) {
                Knowledgenode sourceNode = nodeCache.get(extractedEdge.getSource().toLowerCase());
                Knowledgenode targetNode = nodeCache.get(extractedEdge.getTarget().toLowerCase());

                if (sourceNode == null || targetNode == null)
                    continue; // agar node hi nahi mila, skip

                Knowledgeedge edge = Knowledgeedge.builder()
                        .project(project)
                        .sourceNode(sourceNode)
                        .targetNode(targetNode)
                        .relationshipLabel(extractedEdge.getLabel())
                        .build();
                knowledgeEdgeRepository.save(edge);
            }
        }

        return getGraphForProject(projectId, currentUser);
    }

    public KnowledgeGraphResponse getGraphForProject(Long projectId, User currentUser) {
        Createproject project = createProjectService.findProjectOrThrow(projectId);
        createProjectService.verifyOwnership(project, currentUser);

        List<Knowledgenode> nodes = knowledgeNodeRepository.findByProjectId(projectId);
        List<Knowledgeedge> edges = knowledgeEdgeRepository.findByProjectId(projectId);

        List<NodeResponse> nodeResponses = nodes.stream()
                .map(n -> new NodeResponse(n.getId(), n.getName(), n.getType()))
                .toList();

        List<EdgeResponse> edgeResponses = edges.stream()
                .map(e -> new EdgeResponse(
                        e.getSourceNode().getId(),
                        e.getTargetNode().getId(),
                        e.getRelationshipLabel()))
                .toList();

        return new KnowledgeGraphResponse(nodeResponses, edgeResponses);
    }

    private ExtractedGraphRequest parseAiResponse(String aiResponse) {
        try {
            String cleaned = aiResponse.trim()
                    .replaceAll("^```json", "")
                    .replaceAll("^```", "")
                    .replaceAll("```$", "")
                    .trim();

            ObjectMapper mapper = new ObjectMapper();
            return mapper.readValue(cleaned, ExtractedGraphRequest.class);
        } catch (Exception e) {
            System.out.println("Warning: failed to parse knowledge graph AI response - " + e.getMessage());
            return new ExtractedGraphRequest(); // empty graph, crash mat karo
        }
    }
}