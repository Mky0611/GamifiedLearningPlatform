package org.example.security;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.util.Objects;

/**
 * Resolves the authoritative caller userId from the authenticated JWT principal.
 * Never trusts client-supplied userId when authenticated: mismatched userId throws SecurityException (403).
 */
public final class SecurityPrincipalUtils {

    private SecurityPrincipalUtils() {
    }

    public static Long resolveOwnerUserId(Authentication authentication, Long clientSuppliedUserId) {
        if (authentication != null && authentication.getPrincipal() instanceof AuthenticatedUserPrincipal principal) {
            if (clientSuppliedUserId != null && !Objects.equals(clientSuppliedUserId, principal.userId())) {
                throw new SecurityException("Khong co quyen truy cap tai nguyen cua user khac.");
            }
            return principal.userId();
        }
        if (authentication != null && authentication instanceof AnonymousAuthenticationToken) {
            throw new SecurityException("Yeu cau dang nhap JWT hop le.");
        }
        if (clientSuppliedUserId == null || clientSuppliedUserId <= 0) {
            throw new SecurityException("Thieu thong tin xac thuc user.");
        }
        return clientSuppliedUserId;
    }
}
