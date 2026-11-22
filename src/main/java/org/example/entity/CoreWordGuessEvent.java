package org.example.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "core_word_guess_events")
public class CoreWordGuessEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "core_word_guess_event_id")
    private Long coreWordGuessEventId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "raid_session_id", nullable = false)
    private RaidSession raidSession;

    @Column(name = "round_no", nullable = false)
    private Integer roundNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stage_core_word_id", nullable = false)
    private StageCoreWord stageCoreWord;

    @Column(name = "guessed_word", nullable = false, length = 100)
    private String guessedWord;

    @Column(name = "is_correct", nullable = false)
    private Boolean isCorrect;

    @Column(name = "penalty_value", nullable = false)
    private Integer penaltyValue;

    @Column(name = "reward_damage", nullable = false)
    private Integer rewardDamage;

    @Column(name = "guessed_at", insertable = false, updatable = false)
    private LocalDateTime guessedAt;
}
