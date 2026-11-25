package org.example.service;

import org.example.config.LexRaidBalanceConfig;
import org.example.dto.LexRaidActionResultDto;
import org.example.dto.LexRaidSubmitWordRequest;
import org.example.dto.WordPathTileDto;
import org.example.entity.*;
import org.example.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LexRaidGlobalLexiconTest {

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

    private LexRaidServiceImpl service;
    private RaidSession session;
    private VocabularySet vocabSet;
    private BoardSnapshot snapshot;

    @BeforeEach
    void setUp() {
        EnglishLexiconService lexicon = new EnglishLexiconService(Set.of("WATER", "TIME", "LIGHT"));
        LexRaidBalanceConfig balance = new LexRaidBalanceConfig();
        service = new LexRaidServiceImpl(
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
                rpgProgressionService,
                lexicon,
                balance
        );

        User user = new User();
        user.setUserId(10L);
        user.setXpTotal(0);
        user.setLevelCurrent(1);
        user.setCoins(0);

        Boss boss = new Boss();
        boss.setBossId(1L);
        boss.setCode("CRABBY");
        boss.setName("Crabby");
        boss.setBaseHp(500);
        boss.setBaseShield(0);

        vocabSet = new VocabularySet();
        vocabSet.setVocabularySetId(20L);

        Stage stage = new Stage();
        stage.setStageId(1L);
        stage.setBoardRows(5);
        stage.setBoardCols(5);
        stage.setVocabularySet(vocabSet);
        stage.setBoss(boss);

        GameSession gameSession = new GameSession();
        gameSession.setGameSessionId(100L);
        gameSession.setUser(user);
        gameSession.setStatus("IN_PROGRESS");

        session = new RaidSession();
        session.setRaidSessionId(200L);
        session.setGameSession(gameSession);
        session.setStage(stage);
        session.setStatus("ACTIVE");
        session.setCurrentRound(1);
        session.setBossHpRemaining(500);
        session.setBossShieldRemaining(0);
        session.setComboCount(0);
        session.setManaValue(0);
        session.setRageValue(0);
        session.setTotalScore(0);
        session.setClueProgressJson("[]");

        // 5x5 deterministic snapshot board containing WATER (non-adjacent), CACHE, and LIGHT
        snapshot = new BoardSnapshot();
        snapshot.setRaidSession(session);
        snapshot.setSnapshotNo(1);
        snapshot.setBoardJson("["
                + "[\"W\",\"C\",\"L\",\"X\",\"Y\"],"
                + "[\"Q\",\"A\",\"I\",\"Z\",\"M\"],"
                + "[\"P\",\"C\",\"G\",\"T\",\"E\"],"
                + "[\"R\",\"H\",\"H\",\"B\",\"D\"],"
                + "[\"N\",\"E\",\"T\",\"K\",\"A\"]"
                + "]");

        when(raidSessionRepository.findById(200L)).thenReturn(Optional.of(session));
        when(stageCoreWordRepository.findByStageStageIdOrderByRevealOrderAsc(1L)).thenReturn(List.of());
        when(vocabularyWordRepository.findTop40ByVocabularySetVocabularySetIdOrderByWordTextAsc(20L)).thenReturn(List.of());
        when(boardSnapshotRepository.findTopByRaidSessionRaidSessionIdOrderBySnapshotNoDesc(200L))
                .thenReturn(Optional.of(snapshot));
        when(wordSubmitEventRepository.findByRaidSessionRaidSessionIdAndIsValidTrue(200L)).thenReturn(List.of());
        when(wordSubmitEventRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(raidSessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    private WordPathTileDto tile(int r, int c, String val) {
        WordPathTileDto dto = new WordPathTileDto();
        dto.setRow(r);
        dto.setCol(c);
        dto.setValue(val);
        return dto;
    }

    @Test
    void acceptsValidGlobalNonTopicWordWithNonAdjacentTilesWithoutPollutingMastery() {
        when(vocabularyWordRepository.findByVocabularySetVocabularySetIdAndNormalizedText(20L, "WATER"))
                .thenReturn(Optional.empty());

        LexRaidSubmitWordRequest req = new LexRaidSubmitWordRequest();
        req.setSubmittedWord("water");
        // Non-adjacent path: (0,0) W -> (4,4) A -> (2,3) T -> (2,4) E -> (3,0) R
        req.setPath(List.of(
                tile(0, 0, "W"),
                tile(4, 4, "A"),
                tile(2, 3, "T"),
                tile(2, 4, "E"),
                tile(3, 0, "R")
        ));

        LexRaidActionResultDto result = service.submitWord(200L, req);

        assertTrue(result.isAccepted());
        assertEquals("GLOBAL", result.getWordCategory());
        assertFalse(result.isTopicBonusApplied());
        assertFalse(result.isHasMeaningCard());
        assertNull(result.getVocabularyWordId());
        // length=5, combo=1 -> 5*5 + 1*2 = 27
        assertEquals(27, result.getDamageDealt());
        assertEquals(0, result.getBonusDamage());
        // floor(5/2) = 2
        assertEquals(2, result.getManaGain());
        assertEquals(2, result.getManaAfter());

        verify(userWordMasteryRepository, never()).save(any());

        ArgumentCaptor<WordSubmitEvent> eventCaptor = ArgumentCaptor.forClass(WordSubmitEvent.class);
        verify(wordSubmitEventRepository).save(eventCaptor.capture());
        assertEquals("GLOBAL", eventCaptor.getValue().getWordType());
        assertNull(eventCaptor.getValue().getVocabularyWord());
        assertTrue(eventCaptor.getValue().getIsValid());
    }

    @Test
    void grantsTopicBonusDamageAndManaCapSixForTopicWords() {
        VocabularyWord topicWord = new VocabularyWord();
        topicWord.setWordId(55L);
        topicWord.setWordText("CACHE");
        topicWord.setNormalizedText("CACHE");
        topicWord.setMeaningVi("bo nho dem");
        when(vocabularyWordRepository.findByVocabularySetVocabularySetIdAndNormalizedText(20L, "CACHE"))
                .thenReturn(Optional.of(topicWord));

        session.setManaValue(5); // 1 away from cap 6
        LexRaidSubmitWordRequest req = new LexRaidSubmitWordRequest();
        req.setSubmittedWord("CACHE");
        req.setPath(List.of(
                tile(0, 1, "C"),
                tile(1, 1, "A"),
                tile(2, 1, "C"),
                tile(3, 1, "H"),
                tile(2, 4, "E")
        ));

        LexRaidActionResultDto result = service.submitWord(200L, req);

        assertTrue(result.isAccepted());
        assertEquals("TOPIC", result.getWordCategory());
        assertTrue(result.isTopicBonusApplied());
        assertTrue(result.isHasMeaningCard());
        assertEquals(55L, result.getVocabularyWordId());
        // Base = 5*5 + 1*2 = 27, +30% = Math.round(27 * 1.3) = 35 -> bonus = 8
        assertEquals(35, result.getDamageDealt());
        assertEquals(8, result.getBonusDamage());
        // Mana was 5, gain capped at 6 -> manaAfter = 6, delta manaGain = 1
        assertEquals(6, result.getManaAfter());
        assertEquals(1, result.getManaGain());
        verify(userWordMasteryRepository, times(1)).save(any());
    }

    @Test
    void rejectsInvalidWordDuplicateWordTileReuseAndFakeBoardCoords() {
        // 1) Invalid word not in DB or lexicon
        when(vocabularyWordRepository.findByVocabularySetVocabularySetIdAndNormalizedText(20L, "XQZ"))
                .thenReturn(Optional.empty());
        LexRaidSubmitWordRequest invalidReq = new LexRaidSubmitWordRequest();
        invalidReq.setSubmittedWord("XQZ");
        invalidReq.setPath(List.of(tile(0, 3, "X"), tile(1, 0, "Q"), tile(1, 3, "Z")));
        LexRaidActionResultDto invalidRes = service.submitWord(200L, invalidReq);
        assertFalse(invalidRes.isAccepted());
        assertEquals("INVALID", invalidRes.getWordCategory());

        // 2) Tile reuse ((0,2) used twice or duplicated in path)
        LexRaidSubmitWordRequest reuseReq = new LexRaidSubmitWordRequest();
        reuseReq.setSubmittedWord("TEE");
        reuseReq.setPath(List.of(tile(2, 3, "T"), tile(2, 4, "E"), tile(2, 4, "E")));
        LexRaidActionResultDto reuseRes = service.submitWord(200L, reuseReq);
        assertFalse(reuseRes.isAccepted());
        assertEquals("INVALID", reuseRes.getWordCategory());

        // 3) Fake board coordinates (claiming (0,0) is 'T' when snapshot has 'W')
        LexRaidSubmitWordRequest fakeCoordsReq = new LexRaidSubmitWordRequest();
        fakeCoordsReq.setSubmittedWord("TIME");
        fakeCoordsReq.setPath(List.of(tile(0, 0, "T"), tile(1, 2, "I"), tile(1, 4, "M"), tile(2, 4, "E")));
        LexRaidActionResultDto fakeRes = service.submitWord(200L, fakeCoordsReq);
        assertFalse(fakeRes.isAccepted());
        assertEquals("INVALID", fakeRes.getWordCategory());

        // 4) Duplicate valid word already used in session
        WordSubmitEvent prior = new WordSubmitEvent();
        prior.setIsValid(true);
        prior.setSubmittedWord("WATER");
        when(wordSubmitEventRepository.findByRaidSessionRaidSessionIdAndIsValidTrue(200L))
                .thenReturn(List.of(prior));
        LexRaidSubmitWordRequest dupReq = new LexRaidSubmitWordRequest();
        dupReq.setSubmittedWord("water");
        dupReq.setPath(List.of(
                tile(0, 0, "W"), tile(4, 4, "A"), tile(2, 3, "T"), tile(2, 4, "E"), tile(3, 0, "R")
        ));
        LexRaidActionResultDto dupRes = service.submitWord(200L, dupReq);
        assertFalse(dupRes.isAccepted());
        assertEquals("INVALID", dupRes.getWordCategory());
    }
}
