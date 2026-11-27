package org.example.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "hero_ownership", uniqueConstraints = {
        @UniqueConstraint(name = "UQ_hero_ownership_user_hero", columnNames = {"user_id", "hero_code"})
})
public class HeroOwnership {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "hero_ownership_id")
    private Long heroOwnershipId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "hero_code", nullable = false, length = 32)
    private String heroCode;

    @Column(name = "unlock_source", nullable = false, length = 64)
    private String unlockSource;

    @Column(name = "unlocked_at", insertable = false, updatable = false)
    private LocalDateTime unlockedAt;
}
