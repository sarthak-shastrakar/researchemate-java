package com.example.researchemate.model;

import com.example.researchemate.model.Createproject;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "knowledge_edges")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Knowledgeedge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "project_id", nullable = false)
    private Createproject project;

    @ManyToOne
    @JoinColumn(name = "source_node_id", nullable = false)
    private Knowledgenode sourceNode;

    @ManyToOne
    @JoinColumn(name = "target_node_id", nullable = false)
    private Knowledgenode targetNode;

    @Column(nullable = false)
    private String relationshipLabel; // jaise "uses", "requires", "related to"
}