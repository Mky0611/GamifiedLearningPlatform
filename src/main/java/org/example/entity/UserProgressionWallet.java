package org.example.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "user_progression_wallets")
public class UserProgressionWallet {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "skill_points", nullable = false)
    private Integer skillPoints = 3;

    @Column(name = "selected_hero_code", nullable = false, length = 32)
    private String selectedHeroCode = "warrior";

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PrePersist
    @PreUpdate
    public void touch() {
        if (this.updatedAt == null || this.userId != null) {
            this.updatedAt = LocalDateTime.now();
        }
    }
}
