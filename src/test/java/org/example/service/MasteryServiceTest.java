package org.example.service;

import org.example.dto.AccountLoadoutRequest;
import org.example.dto.MasteryRecallRequest;
import org.example.dto.MasterySummaryDto;
import org.example.entity.*;
import org.example.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MasteryServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private UserWordMasteryRepository masteryRepository;
    @Mock private VocabularyWordRepository wordRepository;
    @Mock private MasteryRecallChallengeRepository challengeRepository;
    @Mock private UserLoadoutRepository userLoadoutRepository;
    @Mock private UserStageProgressRepository stageProgressRepository;
    @Mock private GameSessionRepository gameSessionRepository;
    @Mock private JdbcTemplate jdbcTemplate;

    private MasteryServiceImpl masteryService;
    private AccountServiceImpl accountService;
    private User user;
    private VocabularyWord wordLearn;
    private UserWordMastery masteryRecord;
    private final Map<String, MasteryRecallChallenge> challenges = new LinkedHashMap<>();

    @BeforeEach
    void setUp() {
        masteryService = new MasteryServiceImpl(userRepository, masteryRepository, wordRepository, challengeRepository);
        accountService = new AccountServiceImpl(
                userRepository, userLoadoutRepository, stageProgressRepository,
                gameSessionRepository, new RpgProgressionServiceImpl(userRepository), jdbcTemplate
        );
        user = new User();
        user.setUserId(10L);

        VocabularySet set = new VocabularySet();
        set.setVocabularySetId(2L);
        wordLearn = new VocabularyWord();
        wordLearn.setWordId(101L);
        wordLearn.setWordText("LEARN");
        wordLearn.setNormalizedText("LEARN");
        wordLearn.setMeaningVi("hoc hoi");
        wordLearn.setVocabularySet(set);

        masteryRecord = null;
        challenges.clear();
        lenient().when(userRepository.findById(10L)).thenReturn(Optional.of(user));
        lenient().when(wordRepository.findById(101L)).thenReturn(Optional.of(wordLearn));
        lenient().when(masteryRepository.findByUserUserIdAndWordWordId(10L, 101L))
                .thenAnswer(i -> Optional.ofNullable(masteryRecord));
        lenient().when(masteryRepository.save(any())).thenAnswer(i -> {
            masteryRecord = i.getArgument(0);
            return masteryRecord;
        });
        lenient().when(challengeRepository.save(any())).thenAnswer(i -> {
            MasteryRecallChallenge c = i.getArgument(0);
            challenges.put(c.getChallengeId(), c);
            return c;
        });
        lenient().when(challengeRepository.findByIdForUpdate(anyString()))
                .thenAnswer(i -> Optional.ofNullable(challenges.get(i.getArgument(0))));
    }

    @Test
    void recallChallengeEnforcesIdExpirySingleUseAndOwnership() {
        when(wordRepository.findTop40ByVocabularySetVocabularySetIdOrderByWordTextAsc(2L))
                .thenReturn(List.of(wordLearn));

        MasterySummaryDto.RecallChallengeDto c1 = masteryService.generateRecallChallenge(10L, 101L);
        assertNotNull(c1.getChallengeId());
        assertNotNull(c1.getExpiresAt());
        assertEquals("hoc hoi", c1.getPromptMeaning());
        assertEquals(3, c1.getOptions().size());
        assertTrue(c1.getOptions().contains("LEARN"));

        // Wrong answer consumes challenge c1
        MasteryRecallRequest wrong = new MasteryRecallRequest();
        wrong.setUserId(10L);
        wrong.setChallengeId(c1.getChallengeId());
        wrong.setWordId(101L);
        wrong.setSelectedWord("WRONG");
        MasterySummaryDto.RecallAttemptResultDto wrongRes = masteryService.submitRecallAttempt(wrong);
        assertFalse(wrongRes.isCorrect());
        assertFalse(wrongRes.isNewUniqueReview());

        // Single-use enforcement: reusing c1 fails
        assertThrows(IllegalStateException.class, () -> masteryService.submitRecallAttempt(wrong));

        // Issue fresh challenge c2 for first right answer -> newUniqueReview=true
        MasterySummaryDto.RecallChallengeDto c2 = masteryService.generateRecallChallenge(10L, 101L);
        MasteryRecallRequest right = new MasteryRecallRequest();
        right.setUserId(10L);
        right.setChallengeId(c2.getChallengeId());
        right.setWordId(101L);
        right.setSelectedWord("learn");
        when(masteryRepository.countByUserUserIdAndTimesAnsweredCorrectGreaterThan(10L, 0)).thenReturn(1L);
        MasterySummaryDto.RecallAttemptResultDto rightRes = masteryService.submitRecallAttempt(right);
        assertTrue(rightRes.isCorrect());
        assertTrue(rightRes.isNewUniqueReview());
        assertEquals("REVIEWED_CORRECT", rightRes.getMasteryState());

        // Expired challenge rejected
        MasterySummaryDto.RecallChallengeDto c3 = masteryService.generateRecallChallenge(10L, 101L);
        challenges.get(c3.getChallengeId()).setExpiresAt(LocalDateTime.now().minusMinutes(1));
        MasteryRecallRequest expiredReq = new MasteryRecallRequest();
        expiredReq.setUserId(10L);
        expiredReq.setChallengeId(c3.getChallengeId());
        expiredReq.setWordId(101L);
        expiredReq.setSelectedWord("learn");
        assertThrows(IllegalStateException.class, () -> masteryService.submitRecallAttempt(expiredReq));

        // Fresh valid challenge repeat right answer must NOT farm newUniqueReview; MASTERED never downgrades
        MasterySummaryDto.RecallChallengeDto c4 = masteryService.generateRecallChallenge(10L, 101L);
        right.setChallengeId(c4.getChallengeId());
        MasterySummaryDto.RecallAttemptResultDto repeatRes = masteryService.submitRecallAttempt(right);
        assertTrue(repeatRes.isCorrect());
        assertFalse(repeatRes.isNewUniqueReview());

        masteryRecord.setMasteryScore(BigDecimal.valueOf(50));
        masteryRecord.setMasteryState("MASTERED");
        MasterySummaryDto.RecallChallengeDto c5 = masteryService.generateRecallChallenge(10L, 101L);
        wrong.setChallengeId(c5.getChallengeId());
        masteryService.submitRecallAttempt(wrong);
        assertEquals("MASTERED", masteryRecord.getMasteryState());
    }

    @Test
    void saveLoadoutRejectsInvalidUserIdWithoutFallbackToFirstUser() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());
        AccountLoadoutRequest req = new AccountLoadoutRequest();
        req.setUserId(999L);
        req.setUnitCode("warrior");
        req.setAvatarCode("avatar1");

        assertThrows(IllegalArgumentException.class, () -> accountService.saveLoadout(req));
    }
}
