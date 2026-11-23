package org.example.service;

import org.example.dto.QuizSubmitAnswerRequest;
import org.example.dto.QuizSubmitAnswerResultDto;
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
class QuizProgressionTest {

    @Mock private QuestionSetRepository questionSetRepository;
    @Mock private QuestionRepository questionRepository;
    @Mock private AnswerRepository answerRepository;
    @Mock private UserRepository userRepository;
    @Mock private GameRepository gameRepository;
    @Mock private GameModeRepository gameModeRepository;
    @Mock private GameSessionRepository gameSessionRepository;
    @Mock private QuizAttemptRepository quizAttemptRepository;
    @Mock private RpgProgressionService rpgProgressionService;

    private QuizServiceImpl quizService;

    @BeforeEach
    void setUp() {
        quizService = new QuizServiceImpl(
                questionSetRepository,
                questionRepository,
                answerRepository,
                userRepository,
                gameRepository,
                gameModeRepository,
                gameSessionRepository,
                quizAttemptRepository,
                rpgProgressionService
        );
        lenient().when(gameSessionRepository.save(any(GameSession.class))).thenAnswer(invocation -> invocation.getArgument(0));
        lenient().when(gameSessionRepository.findByIdForUpdate(anyLong())).thenAnswer(inv -> gameSessionRepository.findById(inv.getArgument(0)));
    }

    @Test
    void testQuizCompletionAwardsXpAndCoins() {
        Long gameSessionId = 50L;
        Long questionId = 100L;
        Long answerId = 200L;

        User user = new User();
        user.setUserId(1L);
        user.setXpTotal(0);
        user.setLevelCurrent(1);
        user.setCoins(0);

        QuestionSet questionSet = new QuestionSet();
        questionSet.setQuestionSetId(10L);
        questionSet.setTotalQuestions(1);

        Question question = new Question();
        question.setQuestionId(questionId);
        question.setQuestionSet(questionSet);
        question.setPointsBase(20);

        Answer answer = new Answer();
        answer.setAnswerId(answerId);
        answer.setQuestion(question);
        answer.setIsCorrect(true);
        answer.setAnswerText("Correct Answer");

        GameSession session = new GameSession();
        session.setGameSessionId(gameSessionId);
        session.setStatus("IN_PROGRESS");
        session.setUser(user);
        session.setScoreTotal(0);
        session.setMetadataJson("{\"mode\":\"quiz\",\"questionSetId\":10}");

        when(gameSessionRepository.findById(gameSessionId)).thenReturn(Optional.of(session));
        when(quizAttemptRepository.existsByGameSessionGameSessionIdAndQuestionQuestionId(gameSessionId, questionId)).thenReturn(false);
        when(questionRepository.findById(questionId)).thenReturn(Optional.of(question));
        when(answerRepository.findFirstByQuestionQuestionIdAndIsCorrectTrue(questionId)).thenReturn(Optional.of(answer));
        when(answerRepository.findById(answerId)).thenReturn(Optional.of(answer));
        when(quizAttemptRepository.countByGameSessionGameSessionId(gameSessionId)).thenReturn(1L);

        when(rpgProgressionService.calculateQuizXp(20)).thenReturn(30);
        when(rpgProgressionService.calculateQuizCoins(20)).thenReturn(10);
        when(rpgProgressionService.applyReward(eq(user), eq(30), eq(10))).thenReturn(
                UserRewardResultDto.builder()
                        .oldLevel(1).newLevel(1).levelUpOccurred(false)
                        .xpEarned(30).coinsEarned(10)
                        .newXpTotal(30).newCoins(10)
                        .build()
        );

        QuizSubmitAnswerRequest request = new QuizSubmitAnswerRequest();
        request.setQuestionId(questionId);
        request.setSelectedAnswerId(answerId);

        QuizSubmitAnswerResultDto result = quizService.submitAnswer(gameSessionId, request);

        assertNotNull(result);
        assertTrue(result.isCorrect());
        assertEquals("COMPLETED", result.getSessionStatus());
        assertEquals(30, result.getXpEarned());
        assertEquals(10, result.getCoinsEarned());
        assertEquals("COMPLETED", session.getStatus());

        verify(rpgProgressionService, times(1)).applyReward(user, 30, 10);
        verify(gameSessionRepository, times(1)).save(session);
    }

    @Test
    void testQuizAnswerBelongingToAnotherQuestionIsRejected() {
        Long gameSessionId = 52L;
        Long questionId1 = 100L;
        Long questionId2 = 200L;
        Long answerId1 = 501L;
        Long answerId2 = 502L;

        QuestionSet set = new QuestionSet();
        set.setQuestionSetId(10L);

        Question q1 = new Question();
        q1.setQuestionId(questionId1);
        q1.setQuestionSet(set);

        Question q2 = new Question();
        q2.setQuestionId(questionId2);
        q2.setQuestionSet(set);

        Answer a1Correct = new Answer();
        a1Correct.setAnswerId(answerId1);
        a1Correct.setQuestion(q1);
        a1Correct.setIsCorrect(true);

        Answer a2 = new Answer();
        a2.setAnswerId(answerId2);
        a2.setQuestion(q2); // Answer belongs to Q2, not Q1!
        a2.setIsCorrect(true);

        GameSession session = new GameSession();
        session.setGameSessionId(gameSessionId);
        session.setStatus("IN_PROGRESS");
        session.setMetadataJson("{\"mode\":\"quiz\",\"questionSetId\":10}");

        when(gameSessionRepository.findById(gameSessionId)).thenReturn(Optional.of(session));
        when(questionRepository.findById(questionId1)).thenReturn(Optional.of(q1));
        when(quizAttemptRepository.existsByGameSessionGameSessionIdAndQuestionQuestionId(gameSessionId, questionId1)).thenReturn(false);
        when(answerRepository.findFirstByQuestionQuestionIdAndIsCorrectTrue(questionId1)).thenReturn(Optional.of(a1Correct));
        when(answerRepository.findById(answerId2)).thenReturn(Optional.of(a2));

        QuizSubmitAnswerRequest request = new QuizSubmitAnswerRequest();
        request.setQuestionId(questionId1);
        request.setSelectedAnswerId(answerId2);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> quizService.submitAnswer(gameSessionId, request));
        assertTrue(ex.getMessage().contains("Dap an duoc chon khong thuoc ve cau hoi nay"));
    }

    @Test
    void testQuizQuestionBelongingToAnotherSetIsRejected() {
        Long gameSessionId = 53L;
        Long questionId = 100L;

        QuestionSet sessionSet = new QuestionSet();
        sessionSet.setQuestionSetId(10L);

        QuestionSet foreignSet = new QuestionSet();
        foreignSet.setQuestionSetId(99L); // Different set!

        Question foreignQuestion = new Question();
        foreignQuestion.setQuestionId(questionId);
        foreignQuestion.setQuestionSet(foreignSet);

        GameSession session = new GameSession();
        session.setGameSessionId(gameSessionId);
        session.setStatus("IN_PROGRESS");
        session.setMetadataJson("{\"mode\":\"quiz\",\"questionSetId\":10}");

        when(gameSessionRepository.findById(gameSessionId)).thenReturn(Optional.of(session));
        when(questionRepository.findById(questionId)).thenReturn(Optional.of(foreignQuestion));

        QuizSubmitAnswerRequest request = new QuizSubmitAnswerRequest();
        request.setQuestionId(questionId);
        request.setSelectedAnswerId(1L);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> quizService.submitAnswer(gameSessionId, request));
        assertTrue(ex.getMessage().contains("Cau hoi khong thuoc ve QuestionSet cua phien quiz hien tai"));
    }

    @Test
    void testSubmittingAnswerToAlreadyAttemptedQuestionThrowsException() {
        Long gameSessionId = 54L;
        Long questionId = 100L;

        GameSession session = new GameSession();
        session.setGameSessionId(gameSessionId);
        session.setStatus("IN_PROGRESS");

        when(gameSessionRepository.findById(gameSessionId)).thenReturn(Optional.of(session));
        when(quizAttemptRepository.existsByGameSessionGameSessionIdAndQuestionQuestionId(gameSessionId, questionId)).thenReturn(true);

        QuizSubmitAnswerRequest request = new QuizSubmitAnswerRequest();
        request.setQuestionId(questionId);
        request.setSelectedAnswerId(1L);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> quizService.submitAnswer(gameSessionId, request));
        assertTrue(ex.getMessage().contains("Cau hoi nay da duoc tra loi trong session hien tai"));
    }

    @Test
    void testSubmittingAnswerToCompletedSessionThrowsException() {
        Long gameSessionId = 51L;
        GameSession session = new GameSession();
        session.setGameSessionId(gameSessionId);
        session.setStatus("COMPLETED");

        when(gameSessionRepository.findById(gameSessionId)).thenReturn(Optional.of(session));

        QuizSubmitAnswerRequest request = new QuizSubmitAnswerRequest();
        request.setQuestionId(10L);

        assertThrows(IllegalArgumentException.class, () -> quizService.submitAnswer(gameSessionId, request));
    }
}
