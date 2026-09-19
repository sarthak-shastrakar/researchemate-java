package com.example.researchemate.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "sources")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Createprojectsource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "project_id", nullable = false)
    private Createproject project;

    @Column(nullable = false)
    private String url;

    private String title;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private SourceType sourceType = SourceType.ARTICLE;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private SourceStatus status = SourceStatus.SAVED;

    @ManyToMany
    @JoinTable(name = "source_tags", joinColumns = @JoinColumn(name = "source_id"), inverseJoinColumns = @JoinColumn(name = "tag_id"))
    @Builder.Default
    private Set<Createtag> tags = new HashSet<>();

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public enum SourceType {
        ARTICLE, DOCS, GITHUB, PDF, VIDEO
    }

    public enum SourceStatus {
        SAVED, PROCESSED, FAILED
    }

    @Column(length = 5000)
    private String summary;
}