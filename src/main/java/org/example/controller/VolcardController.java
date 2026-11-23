package org.example.controller;

import lombok.RequiredArgsConstructor;
import org.example.dto.ApiResponse;
import org.example.dto.VolcardPageDto;
import org.example.dto.VolcardSetDto;
import org.example.dto.VolcardTopicDto;
import org.example.service.VolcardService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/volcard")
@RequiredArgsConstructor
public class VolcardController {

    private final VolcardService volcardService;

    @GetMapping("/topics")
    public ApiResponse<List<VolcardTopicDto>> getTopics() {
        return ApiResponse.<List<VolcardTopicDto>>builder().success(true).message("Lay danh sach topic thanh cong").data(volcardService.getTopics()).build();
    }

    @GetMapping("/topics/{topicId}/sets")
    public ApiResponse<List<VolcardSetDto>> getSetsByTopic(@PathVariable Long topicId) {
        return ApiResponse.<List<VolcardSetDto>>builder().success(true).message("Lay danh sach bo tu vung thanh cong").data(volcardService.getSetsByTopic(topicId)).build();
    }

    @GetMapping("/sets/{vocabularySetId}/cards")
    public ApiResponse<VolcardPageDto> getCards(@PathVariable Long vocabularySetId,
                                                @RequestParam(required = false) Integer offset,
                                                @RequestParam(required = false) Integer limit,
                                                @RequestParam(required = false) String cefrLevel,
                                                @RequestParam(required = false) String search) {
        return ApiResponse.<VolcardPageDto>builder().success(true).message("Lay flashcard thanh cong").data(volcardService.getCards(vocabularySetId, offset, limit, cefrLevel, search)).build();
    }
}
