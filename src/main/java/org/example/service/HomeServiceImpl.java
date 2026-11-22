package org.example.service;

import lombok.RequiredArgsConstructor;
import org.example.dto.HomeOverviewDto;
import org.example.dto.UserSummaryDto;
import org.example.entity.User;
import org.example.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class HomeServiceImpl implements HomeService {

    private static final String ACTIVE_STATUS = "ACTIVE";

    private final GameService gameService;
    private final LexRaidService lexRaidService;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public HomeOverviewDto getHomeOverview() {
        return HomeOverviewDto.builder()
                .featuredGames(gameService.getFeaturedGames())
                .leaderboardPreview(getLeaderboardPreview())
                .recommendedStage(lexRaidService.getRecommendedStage())
                .build();
    }

    private List<UserSummaryDto> getLeaderboardPreview() {
        return userRepository.findTop8ByStatusOrderByXpTotalDesc(ACTIVE_STATUS)
                .stream()
                .map(this::toUserSummaryDto)
                .toList();
    }

    private UserSummaryDto toUserSummaryDto(User user) {
        return UserSummaryDto.builder()
                .userId(user.getUserId())
                .username(user.getUsername())
                .displayName(user.getDisplayName())
                .avatarUrl(user.getAvatarUrl())
                .levelCurrent(user.getLevelCurrent())
                .xpTotal(user.getXpTotal())
                .coins(user.getCoins())
                .build();
    }
}
