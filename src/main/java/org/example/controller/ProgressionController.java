package org.example.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.dto.ApiResponse;
import org.example.dto.ProgressionLoadoutSaveRequest;
import org.example.dto.ProgressionSkillActionRequest;
import org.example.dto.ProgressionSnapshotDto;
import org.example.security.SecurityPrincipalUtils;
import org.example.service.ProgressionService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/progression")
@RequiredArgsConstructor
public class ProgressionController {

    private final ProgressionService progressionService;

    @GetMapping
    public ApiResponse<ProgressionSnapshotDto> getProgression(@RequestParam(required = false) Long userId,
                                                              Authentication authentication) {
        Long ownerId = SecurityPrincipalUtils.resolveOwnerUserId(authentication, userId);
        return ApiResponse.success(progressionService.getProgression(ownerId));
    }

    @GetMapping("/heroes")
    public ApiResponse<List<Map<String, Object>>> getHeroes(@RequestParam(required = false) Long userId,
                                                            Authentication authentication) {
        Long ownerId = SecurityPrincipalUtils.resolveOwnerUserId(authentication, userId);
        return ApiResponse.success(progressionService.getHeroStatuses(ownerId));
    }

    @GetMapping("/skills")
    public ApiResponse<List<Map<String, Object>>> getSkills(@RequestParam(required = false) Long userId,
                                                            @RequestParam(required = false) String heroCode,
                                                            Authentication authentication) {
        Long ownerId = SecurityPrincipalUtils.resolveOwnerUserId(authentication, userId);
        return ApiResponse.success(progressionService.getSkillTree(ownerId, heroCode));
    }

    @PostMapping("/skills/learn")
    public ApiResponse<ProgressionSnapshotDto> learnSkill(@Valid @RequestBody ProgressionSkillActionRequest request,
                                                          Authentication authentication) {
        request.setUserId(SecurityPrincipalUtils.resolveOwnerUserId(authentication, request.getUserId()));
        return ApiResponse.success(progressionService.learnSkill(request));
    }

    @PostMapping("/skills/upgrade")
    public ApiResponse<ProgressionSnapshotDto> upgradeSkill(@Valid @RequestBody ProgressionSkillActionRequest request,
                                                            Authentication authentication) {
        request.setUserId(SecurityPrincipalUtils.resolveOwnerUserId(authentication, request.getUserId()));
        return ApiResponse.success(progressionService.upgradeSkill(request));
    }

    @PutMapping("/loadout")
    public ApiResponse<ProgressionSnapshotDto> saveLoadout(@Valid @RequestBody ProgressionLoadoutSaveRequest request,
                                                           Authentication authentication) {
        request.setUserId(SecurityPrincipalUtils.resolveOwnerUserId(authentication, request.getUserId()));
        return ApiResponse.success(progressionService.saveLoadout(request));
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
