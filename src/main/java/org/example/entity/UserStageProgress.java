package org.example.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "user_stage_progress")
public class UserStageProgress {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_stage_progress_id")
    private Long userStageProgressId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stage_id", nullable = false)
    private Stage stage;

    @Column(name = "best_score", nullable = false)
    private Integer bestScore;
    @Column(name = "clear_count", nullable = false)
    private Integer clearCount;
    @Column(name = "fail_count", nullable = false)
    private Integer failCount;
    @Column(name = "last_result", length = 20)
    private String lastResult;
    @Column(name = "stars_earned", nullable = false)
    private Integer starsEarned;
    @Column(name = "highest_combo", nullable = false)
    private Integer highestCombo;
    @Column(name = "total_words_found", nullable = false)
    private Integer totalWordsFound;
    @Column(name = "total_core_words_guessed", nullable = false)
    private Integer totalCoreWordsGuessed;
    @Column(name = "first_cleared_at")
    private LocalDateTime firstClearedAt;
    @Column(name = "last_played_at")
    private LocalDateTime lastPlayedAt;
}
