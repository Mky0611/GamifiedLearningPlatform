package org.example.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MasteryRecallRequest {
    @NotNull
    private Long userId;
    @NotNull
    private Long wordId;
    @NotBlank
    private String selectedWord;
}
