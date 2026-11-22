package org.example.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.dto.AccountCatalogDto;
import org.example.dto.AccountLoadoutDto;
import org.example.dto.AccountLoadoutRequest;
import org.example.dto.ApiResponse;
import org.example.service.AccountService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/account")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    @GetMapping("/options")
    public ApiResponse<AccountCatalogDto> getCatalog() {
        return ApiResponse.success(accountService.getCatalog());
    }

    @GetMapping("/loadout")
    public ApiResponse<AccountLoadoutDto> getLoadout(@RequestParam Long userId) {
        return ApiResponse.success(accountService.getLoadout(userId));
    }

    @PutMapping("/loadout")
    public ApiResponse<AccountLoadoutDto> saveLoadout(@Valid @RequestBody AccountLoadoutRequest request) {
        return ApiResponse.success(accountService.saveLoadout(request));
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleBadRequest(Exception ex) {
        Throwable root = ex;
        while (root.getCause() != null) root = root.getCause();
        String message = root.getMessage() != null ? root.getMessage() : ex.getMessage();
        return ApiResponse.<Void>builder()
                .success(false)
                .message(message)
                .data(null)
                .build();
    }
}
