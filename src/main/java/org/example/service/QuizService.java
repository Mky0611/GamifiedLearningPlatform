package org.example.service;

import org.example.dto.*;

import java.util.List;

public interface QuizService {
    List<QuizSetDto> getActiveQuestionSets();
    QuizSessionDto getQuestionSetDetail(Long questionSetId);
    QuizSessionDto startSession(QuizSessionStartRequest request);
    QuizSubmitAnswerResultDto submitAnswer(Long gameSessionId, QuizSubmitAnswerRequest request);
}
