package org.example.service;

import lombok.RequiredArgsConstructor;
import org.example.dto.LevelProgressDto;
import org.example.dto.UserRewardResultDto;
import org.example.entity.User;
import org.example.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RpgProgressionServiceImpl implements RpgProgressionService {

    private final UserRepository userRepository;

    @Override
    public int calculateLevel(int xpTotal) {
        if (xpTotal <= 0) return 1;
        double term = 1.0 + (xpTotal / 12.5);
        int level = (int) Math.floor((1.0 + Math.sqrt(term)) / 2.0);
        return Math.max(1, level);
    }

    @Override
    public int xpRequiredForLevel(int level) {
        if (level <= 1) return 0;
        long l = level;
        return (int) (50L * (l - 1L) * l);
    }

    @Override
    public LevelProgressDto getLevelProgress(int xpTotal) {
        int safeXp = Math.max(0, xpTotal);
        int currentLevel = calculateLevel(safeXp);
        int xpBase = xpRequiredForLevel(currentLevel);
        int xpNext = xpRequiredForLevel(currentLevel + 1);

        int xpCurrentInLevel = safeXp - xpBase;
        int xpNeededForNext = Math.max(0, xpNext - safeXp);
        int levelSpan = Math.max(1, xpNext - xpBase);
        double progressPercent = Math.min(100.0, Math.max(0.0, ((double) xpCurrentInLevel / (double) levelSpan) * 100.0));

        return LevelProgressDto.builder()
                .level(currentLevel)
                .xpTotal(safeXp)
                .xpBase(xpBase)
                .xpNext(xpNext)
                .xpCurrentInLevel(xpCurrentInLevel)
                .xpNeededForNextLevel(xpNeededForNext)
                .progressPercent(Math.round(progressPercent * 10.0) / 10.0)
                .build();
    }

    @Override
    public int calculateLexRaidXp(boolean won, int score) {
        int safeScore = Math.max(0, score);
        if (won) {
            return 50 + Math.min(50, safeScore / 10);
        } else {
            return Math.max(5, Math.min(20, safeScore / 25));
        }
    }

    @Override
    public int calculateLexRaidCoins(boolean won, int score) {
        int safeScore = Math.max(0, score);
        if (won) {
            return Math.max(10, Math.min(50, safeScore / 20));
        } else {
            return Math.max(2, Math.min(10, safeScore / 50));
        }
    }

    @Override
    public int calculateQuizXp(int scoreTotal) {
        int safeScore = Math.max(0, scoreTotal);
        return Math.max(10, Math.min(60, safeScore / 2));
    }

    @Override
    public int calculateQuizCoins(int scoreTotal) {
        int safeScore = Math.max(0, scoreTotal);
        return Math.max(5, Math.min(30, safeScore / 5));
    }

    @Override
    @Transactional
    public UserRewardResultDto applyReward(User user, int xpEarned, int coinsEarned) {
        if (user == null) {
            throw new IllegalArgumentException("User khong duoc null khi apply reward");
        }

        int oldLevel = user.getLevelCurrent() != null && user.getLevelCurrent() > 0 ? user.getLevelCurrent() : 1;
        int oldXp = user.getXpTotal() != null ? user.getXpTotal() : 0;
        int oldCoins = user.getCoins() != null ? user.getCoins() : 0;

        int newXp = oldXp + Math.max(0, xpEarned);
        int newCoins = oldCoins + Math.max(0, coinsEarned);
        int newLevel = calculateLevel(newXp);

        boolean levelUpOccurred = newLevel > oldLevel;
        int levelsGained = Math.max(0, newLevel - oldLevel);

        user.setXpTotal(newXp);
        user.setCoins(newCoins);
        user.setLevelCurrent(newLevel);
        userRepository.save(user);

        return UserRewardResultDto.builder()
                .oldLevel(oldLevel)
                .newLevel(newLevel)
                .levelUpOccurred(levelUpOccurred)
                .levelsGained(levelsGained)
                .xpEarned(xpEarned)
                .coinsEarned(coinsEarned)
                .newXpTotal(newXp)
                .newCoins(newCoins)
                .build();
    }
}
