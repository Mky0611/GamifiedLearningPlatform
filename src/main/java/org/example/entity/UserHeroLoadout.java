package org.example.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "user_hero_loadouts")
@IdClass(UserHeroLoadout.Key.class)
public class UserHeroLoadout {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Key implements Serializable {
        private Long userId;
        private String heroCode;
    }

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Id
    @Column(name = "hero_code", length = 32)
    private String heroCode;

    @Column(name = "active_slots_json", nullable = false, length = 512)
    private String activeSlotsJson = "[]";

    @Column(name = "ultimate_slot_code", length = 64)
    private String ultimateSlotCode;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PrePersist
    @PreUpdate
    public void touch() {
        this.updatedAt = LocalDateTime.now();
    }
}
