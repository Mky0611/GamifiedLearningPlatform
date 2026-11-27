package org.example.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class LexRaidSubmitWordRequest {
    @NotBlank
    @JsonAlias({"word", "normalizedWord", "submitted_word", "guessWord"})
    private String submittedWord;

    private List<WordPathTileDto> path;
    private String boardJson;
    private Integer roundNo;
    private Long userId;
}
