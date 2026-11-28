package org.example.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MasteryRecallRequest {
    private Long userId;
    private String challengeId;
    @NotNull
    private Long wordId;
    @NotBlank
    private String selectedWord;
}
