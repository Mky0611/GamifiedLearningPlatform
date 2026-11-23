package org.example.service;

import lombok.RequiredArgsConstructor;
import org.example.dto.*;
import org.example.entity.*;
import org.example.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class QuizServiceImpl implements QuizService {

    private static final String ACTIVE = "ACTIVE";
    private static final String IN_PROGRESS = "IN_PROGRESS";
    private static final String COMPLETED = "COMPLETED";
    private static final String QUIZ_GAME_CODE = "QUIZ";
    private static final String QUIZ_MODE_CODE = "STANDARD";

    private final QuestionSetRepository questionSetRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final UserRepository userRepository;
    private final GameRepository gameRepository;
    private final GameModeRepository gameModeRepository;
    private final GameSessionRepository gameSessionRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final RpgProgressionService rpgProgressionService;

    @Override
    @Transactional(readOnly = true)
    public List<QuizSetDto> getActiveQuestionSets() {
        return questionSetRepository.findByStatusOrderByQuestionSetIdAsc(ACTIVE).stream()
                .map(this::toSetDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public QuizSessionDto getQuestionSetDetail(Long questionSetId) {
        QuestionSet questionSet = questionSetRepository.findById(questionSetId)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay question set voi id = " + questionSetId));
        return QuizSessionDto.builder()
                .questionSetId(questionSet.getQuestionSetId())
                .status(questionSet.getStatus())
                .totalQuestions(questionSet.getTotalQuestions())
                .answeredCount(0)
                .questions(loadQuestions(questionSet.getQuestionSetId()))
                .build();
    }

    @Override
    @Transactional
    public QuizSessionDto startSession(QuizSessionStartRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay user voi id = " + request.getUserId()));
        QuestionSet questionSet = questionSetRepository.findById(request.getQuestionSetId())
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay question set voi id = " + request.getQuestionSetId()));

        Game game = gameRepository.findByStatusOrderByNameAsc(ACTIVE).stream()
                .filter(g -> QUIZ_GAME_CODE.equalsIgnoreCase(g.getCode()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("DB chua co game QUIZ"));

        GameMode gameMode = gameModeRepository.findByGame_CodeAndCodeIgnoreCase(game.getCode(), QUIZ_MODE_CODE)
                .orElseGet(() -> gameModeRepository.findAll().stream()
                        .filter(gm -> gm.getGame().getGameId().equals(game.getGameId()))
                        .findFirst()
                        .orElseThrow(() -> new IllegalArgumentException("DB chua co game mode cho QUIZ")));

        GameSession session = new GameSession();
        session.setUser(user);
        session.setGame(game);
        session.setGameMode(gameMode);
        session.setContentPackage(questionSet.getContentPackage());
        session.setStatus(IN_PROGRESS);
        session.setScoreTotal(0);
        session.setXpEarned(0);
        session.setCoinsEarned(0);
        session.setMetadataJson("{\"mode\":\"quiz\",\"questionSetId\":" + questionSet.getQuestionSetId() + "}");
        session = gameSessionRepository.save(session);

        return QuizSessionDto.builder()
                .gameSessionId(session.getGameSessionId())
                .questionSetId(questionSet.getQuestionSetId())
                .userId(user.getUserId())
                .status(session.getStatus())
                .scoreTotal(0)
                .xpEarned(0)
                .totalQuestions(questionSet.getTotalQuestions())
                .answeredCount(0)
                .questions(loadQuestions(questionSet.getQuestionSetId()))
                .build();
    }

    @Override
    @Transactional
    public QuizSubmitAnswerResultDto submitAnswer(Long gameSessionId, QuizSubmitAnswerRequest request) {
        GameSession session = gameSessionRepository.findById(gameSessionId)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay game session voi id = " + gameSessionId));
        if (COMPLETED.equalsIgnoreCase(session.getStatus())) {
            throw new IllegalArgumentException("Game session da ket thuc");
        }
        if (quizAttemptRepository.existsByGameSessionGameSessionIdAndQuestionQuestionId(gameSessionId, request.getQuestionId())) {
            throw new IllegalArgumentException("Cau hoi nay da duoc tra loi trong session hien tai");
        }

        Question question = questionRepository.findById(request.getQuestionId())
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay question voi id = " + request.getQuestionId()));
        Answer correctAnswer = answerRepository.findFirstByQuestionQuestionIdAndIsCorrectTrue(question.getQuestionId())
                .orElseThrow(() -> new IllegalArgumentException("Question chua co dap an dung"));

        Answer selected = null;
        boolean correct = false;
        if (request.getSelectedAnswerId() != null) {
            selected = answerRepository.findById(request.getSelectedAnswerId())
                    .orElseThrow(() -> new IllegalArgumentException("Khong tim thay answer voi id = " + request.getSelectedAnswerId()));
            correct = Boolean.TRUE.equals(selected.getIsCorrect());
        } else if (request.getAnswerTextRaw() != null) {
            correct = request.getAnswerTextRaw().trim().equalsIgnoreCase(correctAnswer.getAnswerText().trim());
        }

        int points = correct ? defaultInt(question.getPointsBase(), 10) : 0;

        QuizAttempt attempt = new QuizAttempt();
        attempt.setGameSession(session);
        attempt.setQuestion(question);
        attempt.setSelectedAnswer(selected);
        attempt.setAnswerTextRaw(blankToNull(request.getAnswerTextRaw()));
        attempt.setIsCorrect(correct);
        attempt.setResponseTimeMs(request.getResponseTimeMs());
        attempt.setPointsEarned(points);
        quizAttemptRepository.save(attempt);

        int answeredCount = (int) quizAttemptRepository.countByGameSessionGameSessionId(gameSessionId);
        int updatedScore = defaultInt(session.getScoreTotal(), 0) + points;
        session.setScoreTotal(updatedScore);

        QuestionSet questionSet = question.getQuestionSet();
        int finalXp = 0;
        int finalCoins = 0;
        boolean levelUpOccurred = false;
        int newLevel = 1;
        int newXpTotal = 0;
        int newCoins = 0;

        if (answeredCount >= defaultInt(questionSet.getTotalQuestions(), 0)) {
            session.setStatus(COMPLETED);
            session.setResultCode("WON");
            session.setEndedAt(LocalDateTime.now());
            if (session.getStartedAt() != null) {
                session.setDurationSec((int) Math.max(0, Duration.between(session.getStartedAt(), LocalDateTime.now()).getSeconds()));
            }

            finalXp = rpgProgressionService.calculateQuizXp(updatedScore);
            finalCoins = rpgProgressionService.calculateQuizCoins(updatedScore);
            session.setXpEarned(finalXp);
            session.setCoinsEarned(finalCoins);

            User user = session.getUser();
            if (user != null) {
                UserRewardResultDto rewardResult = rpgProgressionService.applyReward(user, finalXp, finalCoins);
                levelUpOccurred = rewardResult.isLevelUpOccurred();
                newLevel = rewardResult.getNewLevel();
                newXpTotal = rewardResult.getNewXpTotal();
                newCoins = rewardResult.getNewCoins();
            }
        } else {
            session.setXpEarned(rpgProgressionService.calculateQuizXp(updatedScore));
            session.setCoinsEarned(rpgProgressionService.calculateQuizCoins(updatedScore));
        }
        gameSessionRepository.save(session);

        return QuizSubmitAnswerResultDto.builder()
                .correct(correct)
                .questionId(question.getQuestionId())
                .selectedAnswerId(selected != null ? selected.getAnswerId() : null)
                .correctAnswerId(correctAnswer.getAnswerId())
                .pointsEarned(points)
                .updatedScore(updatedScore)
                .answeredCount(answeredCount)
                .totalQuestions(questionSet.getTotalQuestions())
                .sessionStatus(session.getStatus())
                .xpEarned(finalXp)
                .coinsEarned(finalCoins)
                .levelUpOccurred(levelUpOccurred)
                .newLevel(newLevel)
                .newXpTotal(newXpTotal)
                .newCoins(newCoins)
                .build();
    }

    private List<QuizQuestionDto> loadQuestions(Long questionSetId) {
        return questionRepository.findByQuestionSetQuestionSetIdAndStatusOrderByOrderNoAsc(questionSetId, ACTIVE).stream()
                .map(q -> QuizQuestionDto.builder()
                        .questionId(q.getQuestionId())
                        .questionType(q.getQuestionType())
                        .questionText(q.getQuestionText())
                        .difficulty(q.getDifficulty())
                        .pointsBase(q.getPointsBase())
                        .orderNo(q.getOrderNo())
                        .options(answerRepository.findByQuestionQuestionIdOrderByAnswerOrderAsc(q.getQuestionId()).stream()
                                .map(a -> QuizAnswerOptionDto.builder()
                                        .answerId(a.getAnswerId())
                                        .answerText(a.getAnswerText())
                                        .answerOrder(a.getAnswerOrder())
                                        .build())
                                .toList())
                        .build())
                .toList();
    }

    private QuizSetDto toSetDto(QuestionSet qs) {
        return QuizSetDto.builder()
                .questionSetId(qs.getQuestionSetId())
                .contentPackageId(qs.getContentPackage() != null ? qs.getContentPackage().getContentPackageId() : null)
                .title(qs.getTitle())
                .description(qs.getDescription())
                .totalQuestions(qs.getTotalQuestions())
                .timeLimitSec(qs.getTimeLimitSec())
                .status(qs.getStatus())
                .build();
    }

    private int defaultInt(Integer value, int fallback) {
        return value != null ? value : fallback;
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
