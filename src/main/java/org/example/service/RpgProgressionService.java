package org.example.service;

import org.example.dto.LevelProgressDto;
import org.example.dto.UserRewardResultDto;
import org.example.entity.User;

public interface RpgProgressionService {
    int calculateLevel(int xpTotal);
    int xpRequiredForLevel(int level);
    LevelProgressDto getLevelProgress(int xpTotal);
    int calculateLexRaidXp(boolean won, int score);
    int calculateLexRaidCoins(boolean won, int score);
    int calculateQuizXp(int scoreTotal);
    int calculateQuizCoins(int scoreTotal);
    UserRewardResultDto applyReward(User user, int xpEarned, int coinsEarned);
}
