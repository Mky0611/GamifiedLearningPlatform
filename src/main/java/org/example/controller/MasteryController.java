package org.example.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.dto.ApiResponse;
import org.example.dto.MasteryRecallRequest;
import org.example.dto.MasterySummaryDto;
import org.example.security.SecurityPrincipalUtils;
import org.example.service.MasteryService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/mastery")
@RequiredArgsConstructor
public class MasteryController {

    private final MasteryService masteryService;

    @GetMapping
    public ApiResponse<MasterySummaryDto> getMastery(@RequestParam(required = false) Long userId,
                                                     Authentication authentication) {
        Long ownerId = SecurityPrincipalUtils.resolveOwnerUserId(authentication, userId);
        return ApiResponse.success(masteryService.getMasterySummary(ownerId));
    }

    @PostMapping("/recall-challenge")
    public ApiResponse<MasterySummaryDto.RecallChallengeDto> getRecallChallenge(@RequestParam(required = false) Long userId,
                                                                                @RequestParam Long wordId,
                                                                                Authentication authentication) {
        Long ownerId = SecurityPrincipalUtils.resolveOwnerUserId(authentication, userId);
        return ApiResponse.success(masteryService.generateRecallChallenge(ownerId, wordId));
    }

    @PostMapping("/recall")
    public ApiResponse<MasterySummaryDto.RecallAttemptResultDto> submitRecall(@Valid @RequestBody MasteryRecallRequest request,
                                                                              Authentication authentication) {
        request.setUserId(SecurityPrincipalUtils.resolveOwnerUserId(authentication, request.getUserId()));
        return ApiResponse.success(masteryService.submitRecallAttempt(request));
    }

    @ExceptionHandler(SecurityException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ApiResponse<Void> handleForbidden(SecurityException ex) {
        return ApiResponse.failure(ex.getMessage());
    }

    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleBadRequest(RuntimeException ex) {
        return ApiResponse.failure(ex.getMessage());
    }
}
