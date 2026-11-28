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

    @Column(name = "wave_index", nullable = false)
    private Integer waveIndex = 1;

    @Column(name = "total_waves", nullable = false)
    private Integer totalWaves = 1;

    @Column(name = "play_mode", nullable = false, length = 16)
    private String playMode = "CAMPAIGN";

    @Column(name = "hero_code", nullable = false, length = 32)
    private String heroCode = "warrior";

    @Column(name = "player_hp", nullable = false)
    private Integer playerHp = 112;

    @Column(name = "player_max_hp", nullable = false)
    private Integer playerMaxHp = 112;

    @Column(name = "zero_mana_casts_turn", nullable = false)
    private Integer zeroManaCastsTurn = 0;

    @Column(name = "topic_words_solved", nullable = false)
    private Integer topicWordsSolved = 0;

    @Column(name = "boss_statuses_json", length = 1024)
    private String bossStatusesJson;

    @Column(name = "skill_cooldowns_json", length = 1024)
    private String skillCooldownsJson;

    @Column(name = "encounter_roster_json", columnDefinition = "NVARCHAR(MAX)")
    private String encounterRosterJson;

    @Column(name = "started_at", insertable = false, updatable = false)
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;
}
