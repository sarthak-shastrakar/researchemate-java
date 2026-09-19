package com.example.researchemate.model;

import com.example.researchemate.model.Createproject;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "knowledge_nodes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
public class Knowledgenode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "project_id", nullable = false)
    private Createproject project;

    @Column(nullable = false)
    private String name; // jaise "AI Agents", "LangChain"

    @Column(nullable = false)
    private String type; // "CONCEPT", "TECHNOLOGY", "PERSON", "OTHER"
}