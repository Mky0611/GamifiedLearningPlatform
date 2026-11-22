package org.example.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "questions")
public class Question {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "question_id")
    private Long questionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_set_id", nullable = false)
    private QuestionSet questionSet;

    @Column(name = "question_type", nullable = false, length = 50)
    private String questionType;

    @Column(name = "question_text", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String questionText;

    @Column(name = "difficulty", nullable = false, length = 30)
    private String difficulty;

    @Column(name = "points_base", nullable = false)
    private Integer pointsBase;

    @Column(name = "order_no", nullable = false)
    private Integer orderNo;

    @Column(name = "status", nullable = false, length = 30)
    private String status;
}
