package org.example.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "vocabulary_words")
public class VocabularyWord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "word_id")
    private Long wordId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vocabulary_set_id", nullable = false)
    private VocabularySet vocabularySet;

    @Column(name = "word_text", nullable = false, length = 100)
    private String wordText;

    @Column(name = "normalized_text", nullable = false, length = 100)
    private String normalizedText;

    @Column(name = "part_of_speech", length = 50)
    private String partOfSpeech;

    @Column(name = "meaning_vi", length = 255)
    private String meaningVi;

    @Column(name = "meaning_en", length = 255)
    private String meaningEn;

    @Column(name = "level_cefr", length = 20)
    private String levelCefr;
}
