package org.example.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.dto.AccountCatalogDto;
import org.example.dto.AccountLoadoutDto;
import org.example.dto.AccountLoadoutRequest;
import org.example.dto.ApiResponse;
import org.example.dto.PlayerProfileDto;
import org.example.security.SecurityPrincipalUtils;
import org.example.service.AccountService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

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
    public ApiResponse<AccountLoadoutDto> getLoadout(@RequestParam(required = false) Long userId, Authentication authentication) {
        Long ownerId = SecurityPrincipalUtils.resolveOwnerUserId(authentication, userId);
        return ApiResponse.success(accountService.getLoadout(ownerId));
    }

    @GetMapping("/profile")
    public ApiResponse<PlayerProfileDto> getProfile(@RequestParam(required = false) Long userId, Authentication authentication) {
        Long ownerId = SecurityPrincipalUtils.resolveOwnerUserId(authentication, userId);
        return ApiResponse.success(accountService.getProfile(ownerId));
    }

    @PutMapping("/loadout")
    public ApiResponse<AccountLoadoutDto> saveLoadout(@Valid @RequestBody AccountLoadoutRequest request,
                                                      Authentication authentication) {
        Long ownerId = SecurityPrincipalUtils.resolveOwnerUserId(authentication, request.getUserId());
        request.setUserId(ownerId);
        return ApiResponse.success(accountService.saveLoadout(request));
    }

    @ExceptionHandler(SecurityException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ApiResponse<Void> handleForbidden(SecurityException ex) {
        return ApiResponse.failure(ex.getMessage());
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
