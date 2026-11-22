package org.example.controller;

import org.example.dto.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class HealthController {

    @GetMapping("/health")
    public ApiResponse<Map<String, String>> health() {
        return ApiResponse.<Map<String, String>>builder()
                .success(true)
                .message("Application is running")
                .data(Map.of("status", "UP"))
                .build();
    }
}
