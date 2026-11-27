package org.example.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "user_milestone_rewards", uniqueConstraints = {
        @UniqueConstraint(name = "UQ_user_milestone_rewards_user_key", columnNames = {"user_id", "milestone_key"})
})
public class UserMilestoneReward {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_milestone_reward_id")
    private Long userMilestoneRewardId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "milestone_key", nullable = false, length = 96)
    private String milestoneKey;

    @Column(name = "reward_type", nullable = false, length = 32)
    private String rewardType;

    @Column(name = "sp_granted", nullable = false)
    private Integer spGranted = 0;

    @Column(name = "granted_at", insertable = false, updatable = false)
    private LocalDateTime grantedAt;
}
