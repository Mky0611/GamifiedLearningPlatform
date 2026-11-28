package org.example.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "mastery_recall_challenges")
public class MasteryRecallChallenge {

    @Id
    @Column(name = "challenge_id", nullable = false, length = 64)
    private String challengeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "word_id", nullable = false)
    private VocabularyWord word;

    @Column(name = "options_json", nullable = false, length = 512)
    private String optionsJson;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "consumed_at")
    private LocalDateTime consumedAt;

    @Column(name = "is_correct")
    private Boolean isCorrect;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
