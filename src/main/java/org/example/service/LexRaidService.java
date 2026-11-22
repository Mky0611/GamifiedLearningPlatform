package org.example.service;

import org.example.dto.*;

import java.util.List;

public interface LexRaidService {
    List<StageCardDto> getActiveStages();
    StageCardDto getStageDetail(Long stageId);
    StageCardDto getRecommendedStage();
    LexRaidStageRuntimeDto getStageRuntime(Long stageId);
    LexRaidSessionDto startSession(LexRaidSessionStartRequest request);
    LexRaidSessionDto getSession(Long raidSessionId);
    LexRaidSessionDto syncSession(Long raidSessionId, LexRaidSessionSyncRequest request, String reasonCode);
    LexRaidSessionDto finishSession(Long raidSessionId, LexRaidSessionSyncRequest request);
    LexRaidActionResultDto submitWord(Long raidSessionId, LexRaidSubmitWordRequest request);
    LexRaidActionResultDto guessCoreWord(Long raidSessionId, LexRaidGuessCoreWordRequest request);
}
