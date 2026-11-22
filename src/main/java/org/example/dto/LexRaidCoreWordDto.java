package org.example.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LexRaidCoreWordDto {
    private Long stageCoreWordId;
    private Integer revealOrder;
    private String coreWord;
    private String clueText;
    private boolean solved;
}
