package org.example.service;

import lombok.RequiredArgsConstructor;
import org.example.dto.AuthLoginRequest;
import org.example.dto.AuthRegisterRequest;
import org.example.dto.AuthResponse;
import org.example.entity.Role;
import org.example.entity.User;
import org.example.repository.RoleRepository;
import org.example.repository.UserRepository;
import org.example.security.JwtTokenService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final String DEFAULT_ROLE_CODE = "USER";
    private static final String DEFAULT_USER_STATUS = "ACTIVE";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenService jwtTokenService;

    @Override
    @Transactional
    public AuthResponse register(AuthRegisterRequest request) {
        if (userRepository.existsByUsernameIgnoreCase(request.getUsername())) {
            throw new IllegalArgumentException("Username da ton tai");
        }

        if (userRepository.existsByEmailIgnoreCase(request.getEmail())) {
            throw new IllegalArgumentException("Email da ton tai");
        }

        Role role = roleRepository.findByCode(DEFAULT_ROLE_CODE)
                .orElseGet(() -> {
                    Role newRole = new Role();
                    newRole.setCode(DEFAULT_ROLE_CODE);
                    newRole.setName("Player");
                    newRole.setDescription("Default player role");
                    return roleRepository.save(newRole);
                });

        User user = new User();
        user.setRole(role);
        user.setUsername(request.getUsername().trim());
        user.setEmail(request.getEmail().trim().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setDisplayName(request.getDisplayName().trim());
        user.setStatus(DEFAULT_USER_STATUS);
        user.setXpTotal(0);
        user.setLevelCurrent(1);
        user.setCoins(0);
        user.setStreakDays(0);

        User savedUser = userRepository.save(user);
        String token = jwtTokenService.generateToken(savedUser);
        return toAuthResponse(savedUser, token, true);
    }

    @Override
    @Transactional
    public AuthResponse login(AuthLoginRequest request) {
        User user = userRepository.findByUsernameOrEmail(request.getUsernameOrEmail().trim())
                .orElseThrow(() -> new IllegalArgumentException("Tai khoan khong ton tai"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Mat khau khong dung");
        }

        user.setLastLoginAt(LocalDateTime.now());
        User savedUser = userRepository.save(user);

        String token = jwtTokenService.generateToken(savedUser);
        return toAuthResponse(savedUser, token, true);
    }

    private AuthResponse toAuthResponse(User user, String accessToken, boolean jwtEnabled) {
        return AuthResponse.builder()
                .userId(user.getUserId())
                .username(user.getUsername())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .levelCurrent(user.getLevelCurrent())
                .xpTotal(user.getXpTotal())
                .accessToken(accessToken)
                .tokenType(jwtEnabled ? "Bearer" : null)
                .jwtEnabled(jwtEnabled)
                .build();
    }
}
