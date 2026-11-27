package org.example.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "skill_cast_events", uniqueConstraints = {
        @UniqueConstraint(name = "UQ_skill_cast_session_action", columnNames = {"raid_session_id", "action_id"})
})
public class SkillCastEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "skill_cast_event_id")
    private Long skillCastEventId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "raid_session_id", nullable = false)
    private RaidSession raidSession;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "action_id", nullable = false, length = 64)
    private String actionId;

    @Column(name = "round_no", nullable = false)
    private Integer roundNo;

    @Column(name = "wave_index", nullable = false)
    private Integer waveIndex;

    @Column(name = "hero_code", nullable = false, length = 32)
    private String heroCode;

    @Column(name = "skill_code", nullable = false, length = 64)
    private String skillCode;

    @Column(name = "skill_level", nullable = false)
    private Integer skillLevel;

    @Column(name = "mana_cost", nullable = false)
    private Integer manaCost;

    @Column(name = "damage_dealt", nullable = false)
    private Integer damageDealt = 0;

    @Column(name = "shield_damage", nullable = false)
    private Integer shieldDamage = 0;

    @Column(name = "heal_value", nullable = false)
    private Integer healValue = 0;

    @Column(name = "status_applied", length = 32)
    private String statusApplied;

    @Column(name = "is_valid", nullable = false)
    private Boolean isValid = true;

    @Column(name = "rejection_reason", length = 255)
    private String rejectionReason;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
