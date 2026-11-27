package org.example.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.dto.ApiResponse;
import org.example.dto.MasteryRecallRequest;
import org.example.dto.MasterySummaryDto;
import org.example.service.MasteryService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/mastery")
@RequiredArgsConstructor
public class MasteryController {

    private final MasteryService masteryService;

    @GetMapping
    public ApiResponse<MasterySummaryDto> getMastery(@RequestParam Long userId) {
        return ApiResponse.success(masteryService.getMasterySummary(userId));
    }

    @PostMapping("/recall-challenge")
    public ApiResponse<MasterySummaryDto.RecallChallengeDto> getRecallChallenge(@RequestParam Long userId,
                                                                                @RequestParam Long wordId) {
        return ApiResponse.success(masteryService.generateRecallChallenge(userId, wordId));
    }

    @PostMapping("/recall")
    public ApiResponse<MasterySummaryDto.RecallAttemptResultDto> submitRecall(@Valid @RequestBody MasteryRecallRequest request) {
        return ApiResponse.success(masteryService.submitRecallAttempt(request));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleBadRequest(IllegalArgumentException ex) {
        return ApiResponse.failure(ex.getMessage());
    }
}
