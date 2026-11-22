package org.example.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "user_word_mastery")
public class UserWordMastery {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_word_mastery_id")
    private Long userWordMasteryId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "word_id", nullable = false)
    private VocabularyWord word;

    @Column(name = "times_seen", nullable = false)
    private Integer timesSeen;
    @Column(name = "times_found", nullable = false)
    private Integer timesFound;
    @Column(name = "times_guessed", nullable = false)
    private Integer timesGuessed;
    @Column(name = "times_reviewed", nullable = false)
    private Integer timesReviewed;
    @Column(name = "times_answered_correct", nullable = false)
    private Integer timesAnsweredCorrect;
    @Column(name = "mastery_score", nullable = false)
    private BigDecimal masteryScore;
    @Column(name = "mastery_state", nullable = false, length = 30)
    private String masteryState;
    @Column(name = "weakness_score", nullable = false)
    private BigDecimal weaknessScore;
    @Column(name = "last_seen_at")
    private LocalDateTime lastSeenAt;
    @Column(name = "last_found_at")
    private LocalDateTime lastFoundAt;
    @Column(name = "last_reviewed_at")
    private LocalDateTime lastReviewedAt;
    @Column(name = "last_mastered_at")
    private LocalDateTime lastMasteredAt;
}
