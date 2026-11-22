package org.example.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "question_sets")
public class QuestionSet {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "question_set_id")
    private Long questionSetId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "content_package_id", nullable = false)
    private ContentPackage contentPackage;

    @Column(name = "title", nullable = false, length = 150)
    private String title;

    @Column(name = "description", columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Column(name = "total_questions", nullable = false)
    private Integer totalQuestions;

    @Column(name = "time_limit_sec")
    private Integer timeLimitSec;

    @Column(name = "status", nullable = false, length = 30)
    private String status;
}
