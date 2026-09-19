package com.example.researchemate.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "source_images")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Sourceimg {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "source_id", nullable = false)
    private Createprojectsource source;

    @Column(nullable = false)
    private String imagePath;      // local file path / relative URL

    @Column(length = 5000)
    private String prompt;         // user ne kya poocha tha (optional)

    @Column(length = 5000, nullable = false)
    private String explanation;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}