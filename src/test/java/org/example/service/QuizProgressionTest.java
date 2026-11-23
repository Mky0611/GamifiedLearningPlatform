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
        questionSet.setTotalQuestions(1);

        Question question = new Question();
        question.setQuestionId(questionId);
        question.setQuestionSet(questionSet);
        question.setPointsBase(20);

        Answer answer = new Answer();
        answer.setAnswerId(answerId);
        answer.setIsCorrect(true);
        answer.setAnswerText("Correct Answer");

        GameSession session = new GameSession();
        session.setGameSessionId(gameSessionId);
        session.setStatus("IN_PROGRESS");
        session.setUser(user);
        session.setScoreTotal(0);

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
