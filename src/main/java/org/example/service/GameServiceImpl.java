package org.example.service;

import lombok.RequiredArgsConstructor;
import org.example.dto.GameCardDto;
import org.example.entity.Game;
import org.example.repository.GameRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GameServiceImpl implements GameService {

    private static final String ACTIVE_STATUS = "ACTIVE";

    private final GameRepository gameRepository;

    @Override
    @Transactional(readOnly = true)
    public List<GameCardDto> getAllActiveGames() {
        return gameRepository.findByStatusOrderByNameAsc(ACTIVE_STATUS)
                .stream()
                .map(this::toGameCardDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<GameCardDto> getFeaturedGames() {
        return gameRepository.findTop6ByStatusOrderByUpdatedAtDesc(ACTIVE_STATUS)
                .stream()
                .map(this::toGameCardDto)
                .toList();
    }

    private GameCardDto toGameCardDto(Game game) {
        return GameCardDto.builder()
                .gameId(game.getGameId())
                .code(game.getCode())
                .name(game.getName())
                .gameType(game.getGameType())
                .description(game.getDescription())
                .thumbnailUrl(game.getThumbnailUrl())
                .status(game.getStatus())
                .build();
    }
}
