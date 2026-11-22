package org.example.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "board_snapshots")
public class BoardSnapshot {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "board_snapshot_id")
    private Long boardSnapshotId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "raid_session_id", nullable = false)
    private RaidSession raidSession;

    @Column(name = "round_no", nullable = false)
    private Integer roundNo;

    @Column(name = "snapshot_no", nullable = false)
    private Integer snapshotNo;

    @Column(name = "board_json", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String boardJson;

    @Column(name = "selected_path_json", columnDefinition = "NVARCHAR(MAX)")
    private String selectedPathJson;

    @Column(name = "reason_code", nullable = false, length = 30)
    private String reasonCode;
}
