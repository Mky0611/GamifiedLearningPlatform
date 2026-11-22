package org.example.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "boss_action_events")
public class BossActionEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "boss_action_event_id")
    private Long bossActionEventId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "raid_session_id", nullable = false)
    private RaidSession raidSession;

    @Column(name = "round_no", nullable = false)
    private Integer roundNo;

    @Column(name = "action_type", nullable = false, length = 50)
    private String actionType;

    @Column(name = "target_scope", nullable = false, length = 50)
    private String targetScope;

    @Column(name = "effect_value", nullable = false)
    private Integer effectValue;

    @Column(name = "payload_json")
    private String payloadJson;
}
