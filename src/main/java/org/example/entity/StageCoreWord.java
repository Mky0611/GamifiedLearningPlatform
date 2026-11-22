package org.example.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "stage_core_words")
public class StageCoreWord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "stage_core_word_id")
    private Long stageCoreWordId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stage_id", nullable = false)
    private Stage stage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "word_id", nullable = false)
    private VocabularyWord word;

    @Column(name = "reveal_order", nullable = false)
    private Integer revealOrder;

    @Column(name = "clue_text_override", length = 255)
    private String clueTextOverride;

    @Column(name = "bonus_damage", nullable = false)
    private Integer bonusDamage;

    @Column(name = "bonus_xp", nullable = false)
    private Integer bonusXp;
}
