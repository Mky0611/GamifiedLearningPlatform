package org.example.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "stage_objectives")
public class StageObjective {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "stage_objective_id")
    private Long stageObjectiveId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stage_id", nullable = false)
    private Stage stage;

    @Column(name = "objective_type", nullable = false, length = 50)
    private String objectiveType;

    @Column(name = "description", nullable = false, length = 255)
    private String description;

    @Column(name = "target_value", nullable = false)
    private Integer targetValue;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;
}
