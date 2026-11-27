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
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MasteryServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private UserWordMasteryRepository masteryRepository;
    @Mock private VocabularyWordRepository wordRepository;
    @Mock private UserLoadoutRepository userLoadoutRepository;
    @Mock private UserStageProgressRepository stageProgressRepository;
    @Mock private GameSessionRepository gameSessionRepository;
    @Mock private JdbcTemplate jdbcTemplate;

    private MasteryServiceImpl masteryService;
    private AccountServiceImpl accountService;
    private User user;
    private VocabularyWord wordLearn;
    private UserWordMastery masteryRecord;

    @BeforeEach
    void setUp() {
        masteryService = new MasteryServiceImpl(userRepository, masteryRepository, wordRepository);
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
        lenient().when(userRepository.findById(10L)).thenReturn(Optional.of(user));
        lenient().when(wordRepository.findById(101L)).thenReturn(Optional.of(wordLearn));
        lenient().when(masteryRepository.findByUserUserIdAndWordWordId(10L, 101L))
                .thenAnswer(i -> Optional.ofNullable(masteryRecord));
        lenient().when(masteryRepository.save(any())).thenAnswer(i -> {
            masteryRecord = i.getArgument(0);
            return masteryRecord;
        });
    }

    @Test
    void recallChallengeNeverExposesAnswerFlagAndServerVerifiesResponse() {
        when(wordRepository.findTop40ByVocabularySetVocabularySetIdOrderByWordTextAsc(2L))
                .thenReturn(List.of(wordLearn));

        MasterySummaryDto.RecallChallengeDto challenge = masteryService.generateRecallChallenge(10L, 101L);
        assertEquals("hoc hoi", challenge.getPromptMeaning());
        assertEquals(3, challenge.getOptions().size());
        assertTrue(challenge.getOptions().contains("LEARN"));

        // Wrong answer must not unlock unique review
        MasteryRecallRequest wrong = new MasteryRecallRequest();
        wrong.setUserId(10L);
        wrong.setWordId(101L);
        wrong.setSelectedWord("WRONG");
        MasterySummaryDto.RecallAttemptResultDto wrongRes = masteryService.submitRecallAttempt(wrong);
        assertFalse(wrongRes.isCorrect());
        assertFalse(wrongRes.isNewUniqueReview());

        // First right answer counts as newUniqueReview=true -> REVIEWED_CORRECT
        MasteryRecallRequest right = new MasteryRecallRequest();
        right.setUserId(10L);
        right.setWordId(101L);
        right.setSelectedWord("learn");
        when(masteryRepository.countByUserUserIdAndTimesAnsweredCorrectGreaterThan(10L, 0)).thenReturn(1L);
        MasterySummaryDto.RecallAttemptResultDto rightRes = masteryService.submitRecallAttempt(right);
        assertTrue(rightRes.isCorrect());
        assertTrue(rightRes.isNewUniqueReview());
        assertEquals("REVIEWED_CORRECT", rightRes.getMasteryState());

        // Repeat right answer on same word must NOT farm newUniqueReview
        MasterySummaryDto.RecallAttemptResultDto repeatRes = masteryService.submitRecallAttempt(right);
        assertTrue(repeatRes.isCorrect());
        assertFalse(repeatRes.isNewUniqueReview());

        // Reaching >= 50 score promotes to MASTERED and never downgrades
        masteryRecord.setMasteryScore(BigDecimal.valueOf(50));
        masteryRecord.setMasteryState("MASTERED");
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
        verify(userRepository, never()).findAll();
    }
}
