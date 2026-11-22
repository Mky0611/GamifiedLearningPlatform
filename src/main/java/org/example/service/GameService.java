package org.example.service;

import org.example.dto.GameCardDto;

import java.util.List;

public interface GameService {
    List<GameCardDto> getAllActiveGames();
    List<GameCardDto> getFeaturedGames();
}
