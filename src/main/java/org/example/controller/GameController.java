package org.example.controller;

import lombok.RequiredArgsConstructor;
import org.example.dto.ApiResponse;
import org.example.dto.GameCardDto;
import org.example.service.GameService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/games")
@RequiredArgsConstructor
public class GameController {

    private final GameService gameService;

    @GetMapping
    public ApiResponse<List<GameCardDto>> getAllGames() {
        return ApiResponse.<List<GameCardDto>>builder()
                .success(true)
                .message("Lay danh sach game thanh cong")
                .data(gameService.getAllActiveGames())
                .build();
    }

    @GetMapping("/featured")
    public ApiResponse<List<GameCardDto>> getFeaturedGames() {
        return ApiResponse.<List<GameCardDto>>builder()
                .success(true)
                .message("Lay danh sach game noi bat thanh cong")
                .data(gameService.getFeaturedGames())
                .build();
    }
}
