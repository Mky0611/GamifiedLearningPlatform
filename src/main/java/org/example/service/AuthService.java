package org.example.service;

import org.example.dto.AuthLoginRequest;
import org.example.dto.AuthRegisterRequest;
import org.example.dto.AuthResponse;

public interface AuthService {
    AuthResponse register(AuthRegisterRequest request);
    AuthResponse login(AuthLoginRequest request);
}
