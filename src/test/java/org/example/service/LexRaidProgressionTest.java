package org.example.service;

import org.example.dto.LexRaidSessionDto;
import org.example.dto.LexRaidSessionSyncRequest;
import org.example.dto.UserRewardResultDto;
import org.example.entity.*;
import org.example.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LexRaidProgressionTest {

    @Mock private StageRepository stageRepository;
    @Mock private StageObjectiveRepository stageObjectiveRepository;
    @Mock private StageCoreWordRepository stageCoreWordRepository;
    @Mock private VocabularyWordRepository vocabularyWordRepository;
    @Mock private UserRepository userRepository;
    @Mock private GameModeRepository gameModeRepository;
    @Mock private GameSessionRepository gameSessionRepository;
    @Mock private RaidSessionRepository raidSessionRepository;
    @Mock private BoardSnapshotRepository boardSnapshotRepository;
    @Mock private WordSubmitEventRepository wordSubmitEventRepository;
    @Mock private CoreWordGuessEventRepository coreWordGuessEventRepository;
    @Mock private UserWordMasteryRepository userWordMasteryRepository;
    @Mock private UserStageProgressRepository userStageProgressRepository;
    @Mock private BossRepository bossRepository;
    @Mock private RpgProgressionService rpgProgressionService;

    private LexRaidServiceImpl lexRaidService;

    @BeforeEach
    void setUp() {
        lexRaidService = new LexRaidServiceImpl(
                stageRepository,
                stageObjectiveRepository,
                stageCoreWordRepository,
                vocabularyWordRepository,
                userRepository,
                gameModeRepository,
                gameSessionRepository,
                raidSessionRepository,
                boardSnapshotRepository,
                wordSubmitEventRepository,
                coreWordGuessEventRepository,
                userWordMasteryRepository,
                userStageProgressRepository,
                bossRepository,
                rpgProgressionService
        );
        lenient().when(raidSessionRepository.save(any(RaidSession.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void testFinishSessionAwardsRewardsOnce() {
        Long raidSessionId = 100L;
        User user = new User();
        user.setUserId(1L);
        user.setXpTotal(0);
        user.setLevelCurrent(1);
        user.setCoins(0);

        Stage stage = new Stage();
        stage.setStageId(1L);
        stage.setName("Stage 1");

        GameSession gameSession = new GameSession();
        gameSession.setGameSessionId(50L);
        gameSession.setStatus("IN_PROGRESS");
        gameSession.setUser(user);

        RaidSession raidSession = new RaidSession();
        raidSession.setRaidSessionId(raidSessionId);
        raidSession.setGameSession(gameSession);
        raidSession.setStage(stage);
        raidSession.setStatus("IN_PROGRESS");
        raidSession.setTotalScore(400);
        raidSession.setBossHpRemaining(0);

        when(raidSessionRepository.findById(raidSessionId)).thenReturn(Optional.of(raidSession));
        when(rpgProgressionService.calculateLexRaidXp(true, 400)).thenReturn(90);
        when(rpgProgressionService.calculateLexRaidCoins(true, 400)).thenReturn(20);
        when(rpgProgressionService.applyReward(eq(user), eq(90), eq(20))).thenReturn(
                UserRewardResultDto.builder()
                        .oldLevel(1).newLevel(1).levelUpOccurred(false)
                        .xpEarned(90).coinsEarned(20)
                        .newXpTotal(90).newCoins(20)
                        .build()
        );
        when(userStageProgressRepository.findByUserUserIdAndStageStageId(1L, 1L)).thenReturn(Optional.empty());

        LexRaidSessionSyncRequest finishRequest = new LexRaidSessionSyncRequest();
        finishRequest.setStatus("WON");
        finishRequest.setResultCode("WON");
        finishRequest.setTotalScore(400);

        LexRaidSessionDto dto = lexRaidService.finishSession(raidSessionId, finishRequest);

        assertNotNull(dto);
        assertEquals("COMPLETED", gameSession.getStatus());
        assertEquals("WON", gameSession.getResultCode());
        assertEquals(90, gameSession.getXpEarned());
        assertEquals(20, gameSession.getCoinsEarned());

        verify(rpgProgressionService, times(1)).applyReward(user, 90, 20);
        verify(gameSessionRepository, times(1)).save(gameSession);
        verify(userStageProgressRepository, times(1)).save(any(UserStageProgress.class));
    }

    @Test
    void testFinishSessionStrictIdempotencyNoDoubleReward() {
        Long raidSessionId = 200L;
        User user = new User();
        user.setUserId(2L);
        user.setXpTotal(90);
        user.setLevelCurrent(1);
        user.setCoins(20);

        Stage stage = new Stage();
        stage.setStageId(1L);

        GameSession gameSession = new GameSession();
        gameSession.setGameSessionId(60L);
        gameSession.setStatus("COMPLETED"); // Already finalized!
        gameSession.setResultCode("WON");
        gameSession.setXpEarned(90);
        gameSession.setCoinsEarned(20);
        gameSession.setUser(user);

        RaidSession raidSession = new RaidSession();
        raidSession.setRaidSessionId(raidSessionId);
        raidSession.setGameSession(gameSession);
        raidSession.setStage(stage);
        raidSession.setStatus("WON");
        raidSession.setTotalScore(400);
        raidSession.setBossHpRemaining(0);

        when(raidSessionRepository.findById(raidSessionId)).thenReturn(Optional.of(raidSession));

        LexRaidSessionSyncRequest retryRequest = new LexRaidSessionSyncRequest();
        retryRequest.setResultCode("WON");

        LexRaidSessionDto dto = lexRaidService.finishSession(raidSessionId, retryRequest);

        assertNotNull(dto);
        // Verify applyReward was NEVER called again on duplicate/retry request
        verify(rpgProgressionService, never()).applyReward(any(), anyInt(), anyInt());
    }

    @Test
    void testStageProgressStarsNonDecreasing() {
        Long raidSessionId = 300L;
        User user = new User();
        user.setUserId(3L);

        Stage stage = new Stage();
        stage.setStageId(2L);

        GameSession gameSession = new GameSession();
        gameSession.setStatus("IN_PROGRESS");
        gameSession.setUser(user);

        RaidSession raidSession = new RaidSession();
        raidSession.setRaidSessionId(raidSessionId);
        raidSession.setGameSession(gameSession);
        raidSession.setStage(stage);
        raidSession.setStatus("IN_PROGRESS");
        raidSession.setTotalScore(200); // Lower score, only earns 1 star
        raidSession.setBossHpRemaining(0);

        UserStageProgress existingProgress = new UserStageProgress();
        existingProgress.setUser(user);
        existingProgress.setStage(stage);
        existingProgress.setStarsEarned(3); // Already earned 3 stars in a past run
        existingProgress.setClearCount(1);
        existingProgress.setBestScore(1200);

        when(raidSessionRepository.findById(raidSessionId)).thenReturn(Optional.of(raidSession));
        when(userStageProgressRepository.findByUserUserIdAndStageStageId(3L, 2L)).thenReturn(Optional.of(existingProgress));

        LexRaidSessionSyncRequest finishRequest = new LexRaidSessionSyncRequest();
        finishRequest.setResultCode("WON");
        finishRequest.setTotalScore(200);

        lexRaidService.finishSession(raidSessionId, finishRequest);

        // Best stars must remain 3, best score must remain 1200, clear count becomes 2
        assertEquals(3, existingProgress.getStarsEarned());
        assertEquals(1200, existingProgress.getBestScore());
        assertEquals(2, existingProgress.getClearCount());
        verify(userStageProgressRepository).save(existingProgress);
    }
}
