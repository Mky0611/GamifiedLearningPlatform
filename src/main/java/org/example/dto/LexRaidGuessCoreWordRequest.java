package org.example.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class LexRaidGuessCoreWordRequest {
    @NotNull
    private Long stageCoreWordId;
    @NotBlank
    private String guessedWord;
    private Long userId;
}
