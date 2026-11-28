package org.example.security;

import org.example.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Minimal RFC 7519 HS256 JWT token issuer and validator using standard JDK crypto.
 */
@Service
public class JwtTokenService {

    private static final String HMAC_ALG = "HmacSHA256";
    private static final Base64.Encoder B64_ENC = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder B64_DEC = Base64.getUrlDecoder();

    private final byte[] signingKey;
    private final long expirationMs;

    @Autowired
    public JwtTokenService(
            @Value("${app.security.jwt-secret:}") String configuredSecret,
            @Value("${app.security.jwt-expiration-ms:86400000}") long expirationMs
    ) {
        this.signingKey = deriveKey(configuredSecret);
        this.expirationMs = expirationMs > 0 ? expirationMs : 86_400_000L;
    }

    public String generateToken(User user) {
        return generateTokenWithTtl(user, expirationMs);
    }

    public String generateTokenWithTtl(User user, long ttlMs) {
        if (user == null || user.getUserId() == null) {
            throw new IllegalArgumentException("User khong hop le khi tao JWT");
        }
        long nowSec = Instant.now().getEpochSecond();
        long expSec = nowSec + Math.max(-60L, ttlMs / 1000L);
        String roleCode = "USER";
        if (user.getRole() != null && org.hibernate.Hibernate.isInitialized(user.getRole()) && user.getRole().getCode() != null) {
            roleCode = user.getRole().getCode().trim().toUpperCase();
        }
        String safeUser = escapeJson(user.getUsername());
        String safeRole = escapeJson(roleCode);

        String headerJson = "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";
        String payloadJson = "{"
                + "\"sub\":\"" + user.getUserId() + "\","
                + "\"userId\":" + user.getUserId() + ","
                + "\"username\":\"" + safeUser + "\","
                + "\"role\":\"" + safeRole + "\","
                + "\"iat\":" + nowSec + ","
                + "\"exp\":" + expSec
                + "}";

        String encodedHeader = B64_ENC.encodeToString(headerJson.getBytes(StandardCharsets.UTF_8));
        String encodedPayload = B64_ENC.encodeToString(payloadJson.getBytes(StandardCharsets.UTF_8));
        String signingInput = encodedHeader + "." + encodedPayload;
        String encodedSig = B64_ENC.encodeToString(sign(signingInput));
        return signingInput + "." + encodedSig;
    }

    public AuthenticatedUserPrincipal parseAndValidate(String token) {
        if (token == null || token.isBlank()) {
            throw new BadCredentialsException("Thieu JWT token");
        }
        String[] parts = token.trim().split("\\.");
        if (parts.length != 3) {
            throw new BadCredentialsException("Dinh dang JWT khong hop le");
        }
        String signingInput = parts[0] + "." + parts[1];
        byte[] expectedSig = sign(signingInput);
        byte[] providedSig;
        try {
            providedSig = B64_DEC.decode(parts[2]);
        } catch (IllegalArgumentException ex) {
            throw new BadCredentialsException("Chu ky JWT khong hop le");
        }
        if (!MessageDigest.isEqual(expectedSig, providedSig)) {
            throw new BadCredentialsException("Chu ky JWT khong khop");
        }

        String headerJson;
        String payloadJson;
        try {
            headerJson = new String(B64_DEC.decode(parts[0]), StandardCharsets.UTF_8);
            payloadJson = new String(B64_DEC.decode(parts[1]), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException ex) {
            throw new BadCredentialsException("Payload JWT khong hop le");
        }

        String alg = extractString(headerJson, "alg");
        if (!"HS256".equals(alg)) {
            throw new BadCredentialsException("Thuat toan JWT khong duoc ho tro");
        }

        Long expSec = extractLong(payloadJson, "exp");
        if (expSec == null || Instant.now().getEpochSecond() >= expSec) {
            throw new BadCredentialsException("JWT token da het han");
        }

        Long userId = extractLong(payloadJson, "userId");
        if (userId == null) {
            String sub = extractString(payloadJson, "sub");
            if (sub != null && sub.matches("\\d+")) {
                userId = Long.parseLong(sub);
            }
        }
        if (userId == null || userId <= 0) {
            throw new BadCredentialsException("JWT khong chua userId hop le");
        }
        String username = extractString(payloadJson, "username");
        String role = extractString(payloadJson, "role");
        return new AuthenticatedUserPrincipal(userId, username != null ? username : "", role != null ? role : "USER");
    }

    private byte[] sign(String data) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALG);
            mac.init(new SecretKeySpec(signingKey, HMAC_ALG));
            return mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        } catch (Exception ex) {
            throw new IllegalStateException("Khong the ky HS256 JWT", ex);
        }
    }

    private static byte[] deriveKey(String configuredSecret) {
        if (configuredSecret == null || configuredSecret.isBlank()) {
            byte[] ephemeral = new byte[32];
            new SecureRandom().nextBytes(ephemeral);
            return ephemeral;
        }
        try {
            MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
            return sha256.digest(configuredSecret.getBytes(StandardCharsets.UTF_8));
        } catch (Exception ex) {
            throw new IllegalStateException("Khong the khoi tao JWT key", ex);
        }
    }

    private static String extractString(String json, String key) {
        Matcher m = Pattern.compile("\"" + key + "\"\\s*:\\s*\"([^\"]*)\"").matcher(json);
        return m.find() ? m.group(1) : null;
    }

    private static Long extractLong(String json, String key) {
        Matcher m = Pattern.compile("\"" + key + "\"\\s*:\\s*(-?\\d+)").matcher(json);
        return m.find() ? Long.parseLong(m.group(1)) : null;
    }

    private static String escapeJson(String input) {
        if (input == null) return "";
        return input.replace("\\", "").replace("\"", "");
    }
}
