package org.example.controller;

import lombok.RequiredArgsConstructor;
import org.example.dto.ApiResponse;
import org.example.dto.HomeOverviewDto;
import org.example.service.HomeService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/home")
@RequiredArgsConstructor
public class HomeController {

    private final HomeService homeService;

    @GetMapping("/overview")
    public ApiResponse<HomeOverviewDto> getOverview() {
        return ApiResponse.<HomeOverviewDto>builder()
                .success(true)
                .message("Lay du lieu home thanh cong")
                .data(homeService.getHomeOverview())
                .build();
    }
}
