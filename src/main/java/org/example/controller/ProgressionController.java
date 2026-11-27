package org.example.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.dto.ApiResponse;
import org.example.dto.ProgressionLoadoutSaveRequest;
import org.example.dto.ProgressionSkillActionRequest;
import org.example.dto.ProgressionSnapshotDto;
import org.example.service.ProgressionService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/progression")
@RequiredArgsConstructor
public class ProgressionController {

    private final ProgressionService progressionService;

    @GetMapping
    public ApiResponse<ProgressionSnapshotDto> getProgression(@RequestParam Long userId) {
        return ApiResponse.success(progressionService.getProgression(userId));
    }

    @GetMapping("/heroes")
    public ApiResponse<List<Map<String, Object>>> getHeroes(@RequestParam Long userId) {
        return ApiResponse.success(progressionService.getHeroStatuses(userId));
    }

    @GetMapping("/skills")
    public ApiResponse<List<Map<String, Object>>> getSkills(@RequestParam Long userId,
                                                            @RequestParam(required = false) String heroCode) {
        return ApiResponse.success(progressionService.getSkillTree(userId, heroCode));
    }

    @PostMapping("/skills/learn")
    public ApiResponse<ProgressionSnapshotDto> learnSkill(@Valid @RequestBody ProgressionSkillActionRequest request) {
        return ApiResponse.success(progressionService.learnSkill(request));
    }

    @PostMapping("/skills/upgrade")
    public ApiResponse<ProgressionSnapshotDto> upgradeSkill(@Valid @RequestBody ProgressionSkillActionRequest request) {
        return ApiResponse.success(progressionService.upgradeSkill(request));
    }

    @PutMapping("/loadout")
    public ApiResponse<ProgressionSnapshotDto> saveLoadout(@Valid @RequestBody ProgressionLoadoutSaveRequest request) {
        return ApiResponse.success(progressionService.saveLoadout(request));
    }

    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleBadRequest(RuntimeException ex) {
        return ApiResponse.failure(ex.getMessage());
    }
}
