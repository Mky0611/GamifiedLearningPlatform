package org.example.service;

import org.example.dto.MasteryRecallRequest;
import org.example.dto.MasterySummaryDto;

public interface MasteryService {
    MasterySummaryDto getMasterySummary(Long userId);
    MasterySummaryDto.RecallChallengeDto generateRecallChallenge(Long userId, Long wordId);
    MasterySummaryDto.RecallAttemptResultDto submitRecallAttempt(MasteryRecallRequest request);
}
