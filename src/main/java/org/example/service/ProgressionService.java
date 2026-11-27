package org.example.service;

import org.example.dto.*;
import org.example.entity.Stage;
import org.example.entity.User;

import java.util.List;
import java.util.Map;

public interface ProgressionService {
    ProgressionSnapshotDto getProgression(Long userId);
    List<Map<String, Object>> getHeroStatuses(Long userId);
    List<Map<String, Object>> getSkillTree(Long userId, String heroCode);
    ProgressionSnapshotDto learnSkill(ProgressionSkillActionRequest request);
    ProgressionSnapshotDto upgradeSkill(ProgressionSkillActionRequest request);
    ProgressionSnapshotDto saveLoadout(ProgressionLoadoutSaveRequest request);
    List<String> recordCampaignVictoryMilestones(User user, Stage stage, boolean won, boolean practiceMode, int sessionTopicWords);
}
