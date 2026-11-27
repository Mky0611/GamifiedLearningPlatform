package org.example.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "user_skill_unlocks", uniqueConstraints = {
        @UniqueConstraint(name = "UQ_user_skill_unlocks_user_skill", columnNames = {"user_id", "skill_code"})
})
public class UserSkillUnlock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_skill_unlock_id")
    private Long userSkillUnlockId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "skill_code", nullable = false, length = 64)
    private String skillCode;

    @Column(name = "skill_level", nullable = false)
    private Integer skillLevel = 1;

    @Column(name = "unlocked_at", insertable = false, updatable = false)
    private LocalDateTime unlockedAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PrePersist
    @PreUpdate
    public void touch() {
        this.updatedAt = LocalDateTime.now();
    }
}
