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
    default LexRaidSessionDto getSession(Long raidSessionId, Long callerUserId) {
        return getSession(raidSessionId);
    }
    LexRaidSessionDto syncSession(Long raidSessionId, LexRaidSessionSyncRequest request, String reasonCode);
    default LexRaidSessionDto syncSession(Long raidSessionId, LexRaidSessionSyncRequest request, String reasonCode, Long callerUserId) {
        return syncSession(raidSessionId, request, reasonCode);
    }
    LexRaidSessionDto finishSession(Long raidSessionId, LexRaidSessionSyncRequest request);
    default LexRaidSessionDto finishSession(Long raidSessionId, LexRaidSessionSyncRequest request, Long callerUserId) {
        return finishSession(raidSessionId, request);
    }
    LexRaidActionResultDto submitWord(Long raidSessionId, LexRaidSubmitWordRequest request);
    LexRaidActionResultDto guessCoreWord(Long raidSessionId, LexRaidGuessCoreWordRequest request);
    LexRaidActionResultDto castSkill(Long raidSessionId, LexRaidCastSkillRequest request);
}
