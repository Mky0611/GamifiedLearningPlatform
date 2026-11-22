package org.example.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "game_sessions")
public class GameSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "game_session_id")
    private Long gameSessionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_id", nullable = false)
    private Game game;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_mode_id", nullable = false)
    private GameMode gameMode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "content_package_id")
    private ContentPackage contentPackage;

    @Column(name = "session_seed", length = 100)
    private String sessionSeed;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "result_code", length = 20)
    private String resultCode;

    @Column(name = "started_at", insertable = false, updatable = false)
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @Column(name = "duration_sec")
    private Integer durationSec;

    @Column(name = "score_total", nullable = false)
    private Integer scoreTotal;

    @Column(name = "xp_earned", nullable = false)
    private Integer xpEarned;

    @Column(name = "coins_earned", nullable = false)
    private Integer coinsEarned;

    @Column(name = "metadata_json", columnDefinition = "NVARCHAR(MAX)")
    private String metadataJson;
}
