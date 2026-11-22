package org.example.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "raid_sessions")
public class RaidSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "raid_session_id")
    private Long raidSessionId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_session_id", nullable = false)
    private GameSession gameSession;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stage_id", nullable = false)
    private Stage stage;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "seed", length = 100)
    private String seed;

    @Column(name = "current_round", nullable = false)
    private Integer currentRound;

    @Column(name = "boss_phase_no", nullable = false)
    private Integer bossPhaseNo;

    @Column(name = "boss_hp_remaining", nullable = false)
    private Integer bossHpRemaining;

    @Column(name = "boss_shield_remaining", nullable = false)
    private Integer bossShieldRemaining;

    @Column(name = "rage_value", nullable = false)
    private Integer rageValue;

    @Column(name = "combo_count", nullable = false)
    private Integer comboCount;

    @Column(name = "mana_value", nullable = false)
    private Integer manaValue;

    @Column(name = "total_score", nullable = false)
    private Integer totalScore;

    @Column(name = "clue_progress_json", columnDefinition = "NVARCHAR(MAX)")
    private String clueProgressJson;

    @Column(name = "started_at", insertable = false, updatable = false)
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;
}
