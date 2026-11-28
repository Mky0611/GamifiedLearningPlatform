package org.example.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.dto.*;
import org.example.security.SecurityPrincipalUtils;
import org.example.service.LexRaidService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/lex-raid")
@RequiredArgsConstructor
public class LexRaidController {

    private final LexRaidService lexRaidService;

    @GetMapping("/stages")
    public ApiResponse<List<StageCardDto>> getStages() {
        return ApiResponse.<List<StageCardDto>>builder().success(true).message("Lay danh sach stage thanh cong").data(lexRaidService.getActiveStages()).build();
    }

    @GetMapping("/stages/recommended")
    public ApiResponse<StageCardDto> getRecommendedStage() {
        return ApiResponse.<StageCardDto>builder().success(true).message("Lay stage de xuat thanh cong").data(lexRaidService.getRecommendedStage()).build();
    }

    @GetMapping("/stages/{stageId}")
    public ApiResponse<StageCardDto> getStageDetail(@PathVariable Long stageId) {
        return ApiResponse.<StageCardDto>builder().success(true).message("Lay chi tiet stage thanh cong").data(lexRaidService.getStageDetail(stageId)).build();
    }

    @GetMapping("/stages/{stageId}/runtime")
    public ApiResponse<LexRaidStageRuntimeDto> getStageRuntime(@PathVariable Long stageId) {
        return ApiResponse.<LexRaidStageRuntimeDto>builder().success(true).message("Lay cau hinh runtime stage thanh cong").data(lexRaidService.getStageRuntime(stageId)).build();
    }

    @PostMapping("/sessions/start")
    public ApiResponse<LexRaidSessionDto> startSession(@Valid @RequestBody LexRaidSessionStartRequest request,
                                                       Authentication authentication) {
        request.setUserId(SecurityPrincipalUtils.resolveOwnerUserId(authentication, request.getUserId()));
        return ApiResponse.<LexRaidSessionDto>builder().success(true).message("Tao raid session thanh cong").data(lexRaidService.startSession(request)).build();
    }

    @GetMapping("/sessions/{raidSessionId}")
    public ApiResponse<LexRaidSessionDto> getSession(@PathVariable Long raidSessionId,
                                                     @RequestParam(required = false) Long userId,
                                                     Authentication authentication) {
        Long callerUserId = SecurityPrincipalUtils.resolveOwnerUserId(authentication, userId);
        return ApiResponse.<LexRaidSessionDto>builder().success(true).message("Lay raid session thanh cong").data(lexRaidService.getSession(raidSessionId, callerUserId)).build();
    }

    @PostMapping("/sessions/{raidSessionId}/sync")
    public ApiResponse<LexRaidSessionDto> syncSession(@PathVariable Long raidSessionId,
                                                      @RequestBody(required = false) LexRaidSessionSyncRequest request,
                                                      @RequestParam(required = false) Long userId,
                                                      Authentication authentication) {
        Long callerUserId = SecurityPrincipalUtils.resolveOwnerUserId(authentication, userId);
        return ApiResponse.<LexRaidSessionDto>builder().success(true).message("Dong bo raid session thanh cong")
                .data(lexRaidService.syncSession(raidSessionId, request, "MANUAL_SAVE", callerUserId)).build();
    }

    @PostMapping("/sessions/{raidSessionId}/finish")
    public ApiResponse<LexRaidSessionDto> finishSession(@PathVariable Long raidSessionId,
                                                        @RequestBody(required = false) LexRaidSessionSyncRequest request,
                                                        @RequestParam(required = false) Long userId,
                                                        Authentication authentication) {
        Long callerUserId = SecurityPrincipalUtils.resolveOwnerUserId(authentication, userId);
        return ApiResponse.<LexRaidSessionDto>builder().success(true).message("Ket thuc raid session thanh cong")
                .data(lexRaidService.finishSession(raidSessionId, request, callerUserId)).build();
    }

    @PostMapping("/sessions/{raidSessionId}/submit-word")
    public ApiResponse<LexRaidActionResultDto> submitWord(@PathVariable Long raidSessionId,
                                                          @Valid @RequestBody LexRaidSubmitWordRequest request,
                                                          Authentication authentication) {
        request.setUserId(SecurityPrincipalUtils.resolveOwnerUserId(authentication, request.getUserId()));
        return ApiResponse.<LexRaidActionResultDto>builder().success(true).message("Xu ly submit word thanh cong")
                .data(lexRaidService.submitWord(raidSessionId, request)).build();
    }

    @PostMapping("/sessions/{raidSessionId}/guess-core-word")
    public ApiResponse<LexRaidActionResultDto> guessCoreWord(@PathVariable Long raidSessionId,
                                                             @Valid @RequestBody LexRaidGuessCoreWordRequest request,
                                                             Authentication authentication) {
        request.setUserId(SecurityPrincipalUtils.resolveOwnerUserId(authentication, request.getUserId()));
        return ApiResponse.<LexRaidActionResultDto>builder().success(true).message("Xu ly core word guess thanh cong")
                .data(lexRaidService.guessCoreWord(raidSessionId, request)).build();
    }

    @PostMapping("/sessions/{raidSessionId}/cast-skill")
    public ApiResponse<LexRaidActionResultDto> castSkill(@PathVariable Long raidSessionId,
                                                         @Valid @RequestBody LexRaidCastSkillRequest request,
                                                         Authentication authentication) {
        request.setUserId(SecurityPrincipalUtils.resolveOwnerUserId(authentication, request.getUserId()));
        return ApiResponse.<LexRaidActionResultDto>builder().success(true).message("Xu ly ky nang thanh cong")
                .data(lexRaidService.castSkill(raidSessionId, request)).build();
    }

    @ExceptionHandler(SecurityException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ApiResponse<Void> handleForbidden(SecurityException ex) {
        return ApiResponse.<Void>builder().success(false).message(ex.getMessage()).data(null).build();
    }

    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleBadRequest(RuntimeException ex) {
        return ApiResponse.<Void>builder().success(false).message(ex.getMessage()).data(null).build();
    }
}
