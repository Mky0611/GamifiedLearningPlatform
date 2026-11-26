package org.example.service;

import org.example.dto.AccountLoadoutDto;
import org.example.dto.PlayerProfileDto;
import org.example.entity.User;
import org.example.entity.UserStageProgress;
import org.example.repository.GameSessionRepository;
import org.example.repository.UserLoadoutRepository;
import org.example.repository.UserRepository;
import org.example.repository.UserStageProgressRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AccountProfileServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private UserLoadoutRepository userLoadoutRepository;
    @Mock
    private UserStageProgressRepository userStageProgressRepository;
    @Mock
    private GameSessionRepository gameSessionRepository;
    @Mock
    private JdbcTemplate jdbcTemplate;

    private RpgProgressionService progressionService;
    private AccountServiceImpl accountService;

    @BeforeEach
    void setUp() {
        progressionService = new RpgProgressionServiceImpl(userRepository);
        accountService = new AccountServiceImpl(
                userRepository,
                userLoadoutRepository,
                userStageProgressRepository,
                gameSessionRepository,
                progressionService,
                jdbcTemplate
        );
    }

    @Test
    void testGetProfileSuccess() {
        Long userId = 10L;
        User user = new User();
        user.setUserId(userId);
        user.setUsername("hero10");
        user.setDisplayName("Hero Ten");
        user.setXpTotal(350); // Level 3 (300..600 XP)
        user.setLevelCurrent(3);
        user.setCoins(150);
        user.setStreakDays(5);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userLoadoutRepository.findByUserUserId(userId)).thenReturn(Optional.empty());

        UserStageProgress stage1 = new UserStageProgress();
        stage1.setClearCount(2);
        stage1.setBestScore(450);

        UserStageProgress stage2 = new UserStageProgress();
        stage2.setClearCount(1);
        stage2.setBestScore(620);

        when(userStageProgressRepository.countByUserUserIdAndClearCountGreaterThan(userId, 0)).thenReturn(2L);
        when(userStageProgressRepository.findByUserUserId(userId)).thenReturn(List.of(stage1, stage2));
        when(gameSessionRepository.countByUserUserId(userId)).thenReturn(5L);

        PlayerProfileDto profile = accountService.getProfile(userId);

        assertNotNull(profile);
        assertEquals(userId, profile.getUserId());
        assertEquals("hero10", profile.getUsername());
        assertEquals("Hero Ten", profile.getDisplayName());
        assertEquals(3, profile.getLevelCurrent());
        assertEquals(350, profile.getXpTotal());
        assertEquals(50, profile.getXpCurrentInLevel());
        assertEquals(250, profile.getXpNeededForNextLevel());
        assertEquals(150, profile.getCoins());
        assertEquals(5, profile.getStreakDays());
        assertEquals(2, profile.getStagesCleared());
        assertEquals(5, profile.getTotalBattles());
        assertEquals(620, profile.getBestScore());
    }

    @Test
    void testGetProfileSelfHealsLevelIfOutOfSync() {
        Long userId = 20L;
        User user = new User();
        user.setUserId(userId);
        user.setUsername("desynced");
        user.setDisplayName("Desynced Player");
        user.setXpTotal(1200); // Level 5 (1000..1500 XP)
        user.setLevelCurrent(1); // Desynced in DB!
        user.setCoins(200);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userLoadoutRepository.findByUserUserId(userId)).thenReturn(Optional.empty());
        when(userStageProgressRepository.countByUserUserIdAndClearCountGreaterThan(userId, 0)).thenReturn(0L);
        when(userStageProgressRepository.findByUserUserId(userId)).thenReturn(List.of());
        when(gameSessionRepository.countByUserUserId(userId)).thenReturn(1L);

        PlayerProfileDto profile = accountService.getProfile(userId);

        assertEquals(5, profile.getLevelCurrent());
        assertEquals(5, user.getLevelCurrent());
        verify(userRepository, times(1)).save(user);
    }

    @Test
    void testSaveLoadoutAcceptsArcaneMage() {
        Long userId = 30L;
        User user = new User();
        user.setUserId(userId);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        org.example.dto.AccountLoadoutRequest req = new org.example.dto.AccountLoadoutRequest();
        req.setUserId(userId);
        req.setUnitCode("arcane_mage");
        req.setAvatarCode("avatar1");

        when(userStageProgressRepository.countByUserUserIdAndClearCountGreaterThan(userId, 0)).thenReturn(0L);
        assertThrows(IllegalArgumentException.class, () -> accountService.saveLoadout(req));

        when(userStageProgressRepository.countByUserUserIdAndClearCountGreaterThan(userId, 0)).thenReturn(1L);
        when(userLoadoutRepository.findByUserUserId(userId)).thenReturn(Optional.empty());
        when(userLoadoutRepository.saveAndFlush(any())).thenAnswer(inv -> inv.getArgument(0));

        AccountLoadoutDto res = accountService.saveLoadout(req);
        assertEquals("arcane_mage", res.getUnitCode());
    }
}
