package org.example.service;

import org.example.config.LexRaidBalanceConfig;
import org.example.config.RpgCatalogRegistry;
import org.example.dto.*;
import org.example.entity.*;
import org.example.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LexRaidP6CombatTest {

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
    @Mock private HeroOwnershipRepository heroOwnershipRepository;
    @Mock private UserSkillUnlockRepository skillUnlockRepository;
    @Mock private UserHeroLoadoutRepository heroLoadoutRepository;
    @Mock private SkillCastEventRepository skillCastEventRepository;
    @Mock private ProgressionService progressionService;

    private LexRaidServiceImpl service;
    private User user;
    private Stage stage1;
    private Stage stage2;
    private RaidSession raidSession;
    private final Map<String, SkillCastEvent> castEvents = new LinkedHashMap<>();

    @BeforeEach
    void setUp() {
        service = new LexRaidServiceImpl(
                stageRepository, stageObjectiveRepository, stageCoreWordRepository, vocabularyWordRepository,
                userRepository, gameModeRepository, gameSessionRepository, raidSessionRepository,
                boardSnapshotRepository, wordSubmitEventRepository, coreWordGuessEventRepository,
                userWordMasteryRepository, userStageProgressRepository, bossRepository, rpgProgressionService,
                new EnglishLexiconService(Set.of("WATER", "TIME")), new LexRaidBalanceConfig(), new RpgCatalogRegistry(),
                heroOwnershipRepository, skillUnlockRepository, heroLoadoutRepository, skillCastEventRepository, progressionService
        );
        user = new User();
        user.setUserId(10L);

        Game game = new Game();
        game.setGameId(1L);
        game.setCode("LEX_RAID");
        Boss boss = new Boss();
        boss.setBossId(1L);
        boss.setBaseHp(100);
        boss.setBaseShield(20);
        VocabularySet vs = new VocabularySet();
        vs.setVocabularySetId(5L);

        stage1 = new Stage();
        stage1.setStageId(1L);
        stage1.setName("Stage 1");
        stage1.setChapterNo(1);
        stage1.setStageNo(1);
        stage1.setGame(game);
        stage1.setBoss(boss);
        stage1.setVocabularySet(vs);
        stage1.setBoardRows(5);
        stage1.setBoardCols(5);

        stage2 = new Stage();
        stage2.setStageId(2L);
        stage2.setName("Stage 2");
        stage2.setChapterNo(1);
        stage2.setStageNo(2);
        stage2.setGame(game);
        stage2.setBoss(boss);
        stage2.setVocabularySet(vs);
        stage2.setBoardRows(5);
        stage2.setBoardCols(5);

        GameSession gs = new GameSession();
        gs.setGameSessionId(100L);
        gs.setUser(user);
        gs.setStatus("IN_PROGRESS");
        gs.setMetadataJson("{\"source\":\"lex_raid\"}");

        raidSession = new RaidSession();
        raidSession.setRaidSessionId(200L);
        raidSession.setGameSession(gs);
        raidSession.setStage(stage1);
        raidSession.setStatus("ACTIVE");
        raidSession.setCurrentRound(1);
        raidSession.setBossPhaseNo(1);
        raidSession.setBossHpRemaining(100);
        raidSession.setBossShieldRemaining(0);
        raidSession.setManaValue(6);
        raidSession.setComboCount(2);
        raidSession.setClueProgressJson("[]");
        raidSession.setWaveIndex(1);
        raidSession.setTotalWaves(5);
        raidSession.setPlayMode("CAMPAIGN");
        raidSession.setHeroCode("warrior");
        raidSession.setPlayerHp(112);
        raidSession.setPlayerMaxHp(112);
        raidSession.setEncounterRosterJson("["
                + "{\"waveIndex\":1,\"enemyCode\":\"WAVE_SCOUT\",\"enemyName\":\"Vanguard Scout\",\"boss\":false,\"maxHp\":28,\"shield\":0},"
                + "{\"waveIndex\":2,\"enemyCode\":\"WAVE_ACOLYTE\",\"enemyName\":\"Rune Acolyte\",\"boss\":false,\"maxHp\":36,\"shield\":5},"
                + "{\"waveIndex\":3,\"enemyCode\":\"WAVE_WARDEN\",\"enemyName\":\"Iron Warden\",\"boss\":false,\"maxHp\":45,\"shield\":9},"
                + "{\"waveIndex\":4,\"enemyCode\":\"WAVE_ELITE\",\"enemyName\":\"Shadow Captain\",\"boss\":false,\"maxHp\":56,\"shield\":13},"
                + "{\"waveIndex\":5,\"enemyCode\":\"BOSS_ARCHIVE_PHANTOM\",\"enemyName\":\"Archive Phantom\",\"boss\":true,\"maxHp\":100,\"shield\":20}"
                + "]");

        castEvents.clear();
        lenient().when(raidSessionRepository.findByIdForUpdate(200L)).thenReturn(Optional.of(raidSession));
        lenient().when(raidSessionRepository.findById(200L)).thenReturn(Optional.of(raidSession));
        lenient().when(raidSessionRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        lenient().when(gameSessionRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        lenient().when(skillCastEventRepository.findByRaidSessionRaidSessionIdAndActionId(eq(200L), anyString()))
                .thenAnswer(i -> Optional.ofNullable(castEvents.get(i.getArgument(1))));
        lenient().when(skillCastEventRepository.save(any())).thenAnswer(i -> {
            SkillCastEvent ev = i.getArgument(0);
            if (Boolean.TRUE.equals(ev.getIsValid())) castEvents.put(ev.getActionId(), ev);
            return ev;
        });
    }

    @Test
    void campaignBlocksLockedStageWhilePracticePermitsStart() {
        when(userRepository.findById(10L)).thenReturn(Optional.of(user));
        when(stageRepository.findById(2L)).thenReturn(Optional.of(stage2));
        when(stageRepository.findByStatusOrderByChapterNoAscStageNoAsc("ACTIVE")).thenReturn(List.of(stage1, stage2));
        when(userStageProgressRepository.findByUserUserIdAndStageStageId(10L, 1L)).thenReturn(Optional.empty());
        when(heroOwnershipRepository.existsByUserUserIdAndHeroCode(10L, "warrior")).thenReturn(true);

        LexRaidSessionStartRequest campaignReq = new LexRaidSessionStartRequest();
        campaignReq.setUserId(10L);
        campaignReq.setStageId(2L);
        campaignReq.setPlayMode("CAMPAIGN");
        assertThrows(IllegalArgumentException.class, () -> service.startSession(campaignReq));

        GameMode mode = new GameMode();
        mode.setGameModeId(1L);
        mode.setCode("CAMPAIGN");
        mode.setGame(stage2.getGame());
        when(gameModeRepository.findByGame_CodeAndCodeIgnoreCase(anyString(), anyString())).thenReturn(Optional.of(mode));
        when(raidSessionRepository.save(any())).thenAnswer(inv -> {
            RaidSession rs = inv.getArgument(0);
            if (rs.getRaidSessionId() == null) rs.setRaidSessionId(301L);
            return rs;
        });
        when(stageCoreWordRepository.findByStageStageIdOrderByRevealOrderAsc(2L)).thenReturn(List.of());
        when(vocabularyWordRepository.findTop40ByVocabularySetVocabularySetIdOrderByWordTextAsc(5L)).thenReturn(List.of());
        when(bossRepository.findAll()).thenReturn(List.of(stage2.getBoss()));

        LexRaidSessionStartRequest pracReq = new LexRaidSessionStartRequest();
        pracReq.setUserId(10L);
        pracReq.setStageId(2L);
        pracReq.setPlayMode("PRACTICE");
        LexRaidSessionDto res = service.startSession(pracReq);
        assertEquals("PRACTICE", res.getPlayMode());
        assertEquals(5, res.getTotalWaves());
    }

    @Test
    void castSkillEnforcesOwnershipAntiSpamIdempotencyMultiHitAndWaveProgression() {
        when(heroOwnershipRepository.existsByUserUserIdAndHeroCode(10L, "warrior")).thenReturn(true);
        UserSkillUnlock slashUnlock = new UserSkillUnlock();
        slashUnlock.setSkillCode("knight_slash");
        slashUnlock.setSkillLevel(1);
        UserSkillUnlock stormUnlock = new UserSkillUnlock();
        stormUnlock.setSkillCode("blade_storm");
        stormUnlock.setSkillLevel(2);
        UserSkillUnlock heavyUnlock = new UserSkillUnlock();
        heavyUnlock.setSkillCode("heavy_slash");
        heavyUnlock.setSkillLevel(1);
        when(skillUnlockRepository.findByUserUserIdAndSkillCode(10L, "knight_slash")).thenReturn(Optional.of(slashUnlock));
        when(skillUnlockRepository.findByUserUserIdAndSkillCode(10L, "blade_storm")).thenReturn(Optional.of(stormUnlock));
        when(skillUnlockRepository.findByUserUserIdAndSkillCode(10L, "heavy_slash")).thenReturn(Optional.of(heavyUnlock));
        when(skillUnlockRepository.findByUserUserIdAndSkillCode(10L, "earthbreaker")).thenReturn(Optional.empty());

        UserHeroLoadout hl = new UserHeroLoadout();
        hl.setUserId(10L);
        hl.setHeroCode("warrior");
        hl.setActiveSlotsJson("[\"knight_slash\",\"blade_storm\",\"heavy_slash\",\"sacred_recovery\"]");
        when(heroLoadoutRepository.findByUserIdAndHeroCode(10L, "warrior")).thenReturn(Optional.of(hl));

        // 1. Cross-user ownership rejected
        LexRaidCastSkillRequest otherUser = new LexRaidCastSkillRequest();
        otherUser.setUserId(999L);
        otherUser.setSkillCode("knight_slash");
        otherUser.setActionId("a1");
        assertThrows(SecurityException.class, () -> service.castSkill(200L, otherUser));

        // 2. Unlearned skill rejected
        LexRaidCastSkillRequest unlearned = new LexRaidCastSkillRequest();
        unlearned.setUserId(10L);
        unlearned.setSkillCode("earthbreaker");
        unlearned.setActionId("a2");
        assertFalse(service.castSkill(200L, unlearned).isAccepted());

        // 3. First 0 MP basic skill succeeds; second 0 MP basic skill in same turn rejected (anti-spam!)
        LexRaidCastSkillRequest zero1 = new LexRaidCastSkillRequest();
        zero1.setUserId(10L);
        zero1.setSkillCode("knight_slash");
        zero1.setActionId("a3");
        LexRaidActionResultDto r1 = service.castSkill(200L, zero1);
        assertTrue(r1.isAccepted());
        assertEquals(86, r1.getBossHpRemaining());

        LexRaidCastSkillRequest zero2 = new LexRaidCastSkillRequest();
        zero2.setUserId(10L);
        zero2.setSkillCode("knight_slash");
        zero2.setActionId("a4");
        assertFalse(service.castSkill(200L, zero2).isAccepted());

        // 4. Duplicate actionId rejected cleanly
        assertFalse(service.castSkill(200L, zero1).isAccepted());

        // 5. MULTI_HIT Blade Storm Lv2 (32 dmg across 3 hits: 11+11+10) deducts Boss HP & triggers wave advance on 0 HP
        raidSession.setBossHpRemaining(25);
        LexRaidCastSkillRequest stormReq = new LexRaidCastSkillRequest();
        stormReq.setUserId(10L);
        stormReq.setSkillCode("blade_storm");
        stormReq.setActionId("a5");
        LexRaidActionResultDto stormRes = service.castSkill(200L, stormReq);
        assertTrue(stormRes.isAccepted());
        assertEquals(List.of(11, 11, 10), stormRes.getHitDamages());
        assertEquals(2, stormRes.getWaveIndex()); // Advanced Wave 1 -> Wave 2, did NOT premature-win!
        assertEquals("ACTIVE", stormRes.getRaidStatus());
        assertEquals(36, stormRes.getBossHpRemaining());
        assertEquals("WAVE_ACOLYTE", stormRes.getCurrentEnemyCode());
        verify(raidSessionRepository, atLeastOnce()).findByIdForUpdate(200L);
    }

    @Test
    void syncCannotIncrementRoundAndPracticeDoesNotIncrementClearCount() {
        LexRaidSessionSyncRequest syncReq = new LexRaidSessionSyncRequest();
        syncReq.setCurrentRound(99);
        LexRaidSessionDto synced = service.syncSession(200L, syncReq, "MANUAL_SAVE", 10L);
        assertEquals(1, synced.getCurrentRound(), "/sync must not allow client to inflate currentRound");

        raidSession.setPlayMode("PRACTICE");
        raidSession.setWaveIndex(5);
        raidSession.setTotalWaves(5);
        raidSession.setBossHpRemaining(0);
        raidSession.setStatus("ACTIVE");
        UserStageProgress existing = new UserStageProgress();
        existing.setUser(user);
        existing.setStage(stage1);
        existing.setClearCount(0);
        existing.setStarsEarned(0);
        when(userStageProgressRepository.findByUserUserIdAndStageStageId(10L, 1L)).thenReturn(Optional.of(existing));
        when(wordSubmitEventRepository.findByRaidSessionRaidSessionIdAndIsValidTrue(200L)).thenReturn(List.of());
        when(coreWordGuessEventRepository.findByRaidSessionRaidSessionIdAndIsCorrectTrue(200L)).thenReturn(List.of());

        service.finishSession(200L, null, 10L);
        assertEquals(0, existing.getClearCount(), "PRACTICE win must NEVER increment Campaign clearCount");
        verify(progressionService, never()).recordCampaignVictoryMilestones(any(), any(), anyBoolean(), eq(false), anyInt());
    }
}
