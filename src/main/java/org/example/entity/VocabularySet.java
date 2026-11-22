package org.example.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "vocabulary_sets")
public class VocabularySet {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "vocabulary_set_id")
    private Long vocabularySetId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "content_package_id", nullable = false)
    private ContentPackage contentPackage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "topic_id")
    private VocabularyTopic topic;

    @Column(name = "title", nullable = false, length = 150)
    private String title;

    @Column(name = "language_code", length = 10)
    private String languageCode;

    @Column(name = "difficulty", nullable = false, length = 30)
    private String difficulty;

    @Column(name = "description")
    private String description;

    @Column(name = "total_words", nullable = false)
    private Integer totalWords;

    @Column(name = "is_active")
    private Boolean isActive;
}
