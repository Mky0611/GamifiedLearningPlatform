package org.example.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.dto.*;
import org.example.service.QuizService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/quiz")
@RequiredArgsConstructor
public class QuizController {

    private final QuizService quizService;

    @GetMapping("/sets")
    public ApiResponse<List<QuizSetDto>> getQuestionSets() {
        return ApiResponse.<List<QuizSetDto>>builder().success(true).message("Lay danh sach quiz set thanh cong").data(quizService.getActiveQuestionSets()).build();
    }

    @GetMapping("/sets/{questionSetId}")
    public ApiResponse<QuizSessionDto> getQuestionSetDetail(@PathVariable Long questionSetId) {
        return ApiResponse.<QuizSessionDto>builder().success(true).message("Lay chi tiet quiz set thanh cong").data(quizService.getQuestionSetDetail(questionSetId)).build();
    }

    @PostMapping("/sessions/start")
    public ApiResponse<QuizSessionDto> startSession(@Valid @RequestBody QuizSessionStartRequest request) {
        return ApiResponse.<QuizSessionDto>builder().success(true).message("Tao quiz session thanh cong").data(quizService.startSession(request)).build();
    }

    @PostMapping("/sessions/{gameSessionId}/submit")
    public ApiResponse<QuizSubmitAnswerResultDto> submitAnswer(@PathVariable Long gameSessionId,
                                                               @Valid @RequestBody QuizSubmitAnswerRequest request) {
        return ApiResponse.<QuizSubmitAnswerResultDto>builder().success(true).message("Cham diem cau tra loi thanh cong").data(quizService.submitAnswer(gameSessionId, request)).build();
    }
}
