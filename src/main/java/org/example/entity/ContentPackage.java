package org.example.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "content_packages")
public class ContentPackage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "content_package_id")
    private Long contentPackageId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_id", nullable = false)
    private Game game;

    @Column(name = "package_type", nullable = false, length = 50)
    private String packageType;

    @Column(name = "title", nullable = false, length = 150)
    private String title;

    @Column(name = "language_code", nullable = false, length = 10)
    private String languageCode;

    @Column(name = "difficulty", nullable = false, length = 30)
    private String difficulty;
}
