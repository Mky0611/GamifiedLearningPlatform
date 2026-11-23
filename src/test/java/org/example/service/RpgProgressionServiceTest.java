package org.example.service;

import org.example.dto.LevelProgressDto;
import org.example.dto.UserRewardResultDto;
import org.example.entity.User;
import org.example.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RpgProgressionServiceTest {

    @Mock
    private UserRepository userRepository;

    private RpgProgressionService progressionService;

    @BeforeEach
    void setUp() {
        progressionService = new RpgProgressionServiceImpl(userRepository);
    }

    @Test
    void testLevelCalculationExactBoundaries() {
        // Level 1: 0 - 99 XP
        assertEquals(1, progressionService.calculateLevel(0));
        assertEquals(1, progressionService.calculateLevel(50));
        assertEquals(1, progressionService.calculateLevel(99));

        // Level 2: 100 - 299 XP
        assertEquals(2, progressionService.calculateLevel(100));
        assertEquals(2, progressionService.calculateLevel(250));
        assertEquals(2, progressionService.calculateLevel(299));

        // Level 3: 300 - 599 XP
        assertEquals(3, progressionService.calculateLevel(300));
        assertEquals(3, progressionService.calculateLevel(599));

        // Level 4: 600 - 999 XP
        assertEquals(4, progressionService.calculateLevel(600));
        assertEquals(4, progressionService.calculateLevel(999));

        // Level 5: 1000 - 1499 XP
        assertEquals(5, progressionService.calculateLevel(1000));
        assertEquals(5, progressionService.calculateLevel(1499));

        // Level 10: 4500 XP
        assertEquals(10, progressionService.calculateLevel(4500));
    }

    @Test
    void testNegativeOrZeroXpAlwaysLevelOne() {
        assertEquals(1, progressionService.calculateLevel(-500));
        assertEquals(1, progressionService.calculateLevel(0));
    }

    @Test
    void testXpRequiredForLevel() {
        assertEquals(0, progressionService.xpRequiredForLevel(1));
        assertEquals(100, progressionService.xpRequiredForLevel(2));
        assertEquals(300, progressionService.xpRequiredForLevel(3));
        assertEquals(600, progressionService.xpRequiredForLevel(4));
        assertEquals(1000, progressionService.xpRequiredForLevel(5));
        assertEquals(4500, progressionService.xpRequiredForLevel(10));
    }

    @Test
    void testGetLevelProgressDetails() {
        // At 150 XP: Level 2 (range 100..300, span=200, currentInLevel=50 -> 25%)
        LevelProgressDto progress = progressionService.getLevelProgress(150);
        assertEquals(2, progress.getLevel());
        assertEquals(150, progress.getXpTotal());
        assertEquals(100, progress.getXpBase());
        assertEquals(300, progress.getXpNext());
        assertEquals(50, progress.getXpCurrentInLevel());
        assertEquals(150, progress.getXpNeededForNextLevel());
        assertEquals(25.0, progress.getProgressPercent());
    }

    @Test
    void testRewardCalculationLexRaid() {
        // Win with score 300
        int winXp = progressionService.calculateLexRaidXp(true, 300);
        int winCoins = progressionService.calculateLexRaidCoins(true, 300);
        assertEquals(80, winXp); // 50 + 30
        assertEquals(15, winCoins); // max(10, min(50, 300/20=15))

        // Loss with score 100
        int lossXp = progressionService.calculateLexRaidXp(false, 100);
        int lossCoins = progressionService.calculateLexRaidCoins(false, 100);
        assertEquals(5, lossXp);
        assertEquals(2, lossCoins);
    }

    @Test
    void testApplyRewardSingleLevelUp() {
        User user = new User();
        user.setUserId(1L);
        user.setXpTotal(50);
        user.setLevelCurrent(1);
        user.setCoins(20);

        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Earn 60 XP and 10 coins -> 50 + 60 = 110 XP -> Level 2
        UserRewardResultDto result = progressionService.applyReward(user, 60, 10);

        assertEquals(1, result.getOldLevel());
        assertEquals(2, result.getNewLevel());
        assertTrue(result.getLevelUpOccurred());
        assertEquals(1, result.getLevelsGained());
        assertEquals(110, result.getNewXpTotal());
        assertEquals(30, result.getNewCoins());
        assertEquals(110, user.getXpTotal());
        assertEquals(2, user.getLevelCurrent());
        assertEquals(30, user.getCoins());
    }

    @Test
    void testApplyRewardMultiLevelJump() {
        User user = new User();
        user.setUserId(2L);
        user.setXpTotal(0);
        user.setLevelCurrent(1);
        user.setCoins(0);

        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Jump straight to 650 XP -> Level 4
        UserRewardResultDto result = progressionService.applyReward(user, 650, 50);

        assertEquals(1, result.getOldLevel());
        assertEquals(4, result.getNewLevel());
        assertTrue(result.getLevelUpOccurred());
        assertEquals(3, result.getLevelsGained());
        assertEquals(650, result.getNewXpTotal());
        assertEquals(50, result.getNewCoins());
    }
}
