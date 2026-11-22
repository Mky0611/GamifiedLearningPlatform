package org.example.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "word_submit_events")
public class WordSubmitEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "word_submit_event_id")
    private Long wordSubmitEventId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "raid_session_id", nullable = false)
    private RaidSession raidSession;

    @Column(name = "round_no", nullable = false)
    private Integer roundNo;

    @Column(name = "submitted_word", nullable = false, length = 100)
    private String submittedWord;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vocabulary_word_id")
    private VocabularyWord vocabularyWord;

    @Column(name = "word_type", nullable = false, length = 30)
    private String wordType;

    @Column(name = "path_json", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String pathJson;

    @Column(name = "length_value", nullable = false)
    private Integer lengthValue;

    @Column(name = "base_score", nullable = false)
    private Integer baseScore;

    @Column(name = "damage_value", nullable = false)
    private Integer damageValue;

    @Column(name = "clue_points", nullable = false)
    private Integer cluePoints;

    @Column(name = "mana_gain", nullable = false)
    private Integer manaGain;

    @Column(name = "combo_after", nullable = false)
    private Integer comboAfter;

    @Column(name = "is_valid", nullable = false)
    private Boolean isValid;

    @Column(name = "rejection_reason", length = 255)
    private String rejectionReason;

    @Column(name = "submitted_at", insertable = false, updatable = false)
    private LocalDateTime submittedAt;
}
