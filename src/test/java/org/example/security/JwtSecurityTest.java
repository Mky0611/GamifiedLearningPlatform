package org.example.security;

import org.example.entity.Role;
import org.example.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.junit.jupiter.api.Assertions.*;

class JwtSecurityTest {

    @Test
    void jwtTokenServiceIssuesValidatesRejectsExpiredAndTamperedTokens() {
        JwtTokenService jwt = new JwtTokenService("test-p61-secret-key-32-chars-minimum", 3_600_000L);
        Role role = new Role();
        role.setCode("USER");
        User user = new User();
        user.setUserId(42L);
        user.setUsername("hero42");
        user.setRole(role);

        String valid = jwt.generateToken(user);
        AuthenticatedUserPrincipal parsed = jwt.parseAndValidate(valid);
        assertEquals(42L, parsed.userId());
        assertEquals("hero42", parsed.username());
        assertEquals("USER", parsed.role());

        // Tamper payload character -> invalid signature
        String[] parts = valid.split("\\.");
        String tampered = parts[0] + "." + parts[1] + "x." + parts[2];
        assertThrows(BadCredentialsException.class, () -> jwt.parseAndValidate(tampered));

        // Expired token rejected
        String expired = jwt.generateTokenWithTtl(user, -5_000L);
        assertThrows(BadCredentialsException.class, () -> jwt.parseAndValidate(expired));
    }

    @Test
    void filterRejectsInvalidBearerWith401AndPrincipalUtilsBlocksCrossUser() throws Exception {
        JwtTokenService jwt = new JwtTokenService("test-p61-secret-key-32-chars-minimum", 3_600_000L);
        JwtAuthenticationFilter filter = new JwtAuthenticationFilter(jwt, new RestAuthenticationEntryPoint());

        MockHttpServletRequest badReq = new MockHttpServletRequest("GET", "/api/v1/progression");
        badReq.addHeader("Authorization", "Bearer not-a-real-jwt");
        MockHttpServletResponse badRes = new MockHttpServletResponse();
        filter.doFilter(badReq, badRes, new MockFilterChain());
        assertEquals(401, badRes.getStatus());

        SecurityContextHolder.clearContext();
        AuthenticatedUserPrincipal principal = new AuthenticatedUserPrincipal(10L, "owner10", "USER");
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(principal, null);
        assertEquals(10L, SecurityPrincipalUtils.resolveOwnerUserId(auth, null));
        assertEquals(10L, SecurityPrincipalUtils.resolveOwnerUserId(auth, 10L));
        assertThrows(SecurityException.class, () -> SecurityPrincipalUtils.resolveOwnerUserId(auth, 999L));
    }
}
