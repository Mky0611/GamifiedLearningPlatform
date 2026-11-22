package org.example.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "raid_rounds")
public class RaidRound {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "raid_round_id")
    private Long raidRoundId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "raid_session_id", nullable = false)
    private RaidSession raidSession;

    @Column(name = "round_no", nullable = false)
    private Integer roundNo;

    @Column(name = "round_status", nullable = false, length = 20)
    private String roundStatus;

    @Column(name = "words_submitted_count", nullable = false)
    private Integer wordsSubmittedCount;

    @Column(name = "damage_dealt", nullable = false)
    private Integer damageDealt;

    @Column(name = "damage_taken", nullable = false)
    private Integer damageTaken;

    @Column(name = "mana_delta", nullable = false)
    private Integer manaDelta;

    @Column(name = "combo_end_value", nullable = false)
    private Integer comboEndValue;

    @Column(name = "notes_json")
    private String notesJson;
}
