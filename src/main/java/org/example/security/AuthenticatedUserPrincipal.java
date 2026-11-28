package org.example.security;

/**
 * Authenticated user principal populated by JwtAuthenticationFilter.
 */
public record AuthenticatedUserPrincipal(Long userId, String username, String role) {
}
