package org.example.service;

import lombok.RequiredArgsConstructor;
import org.example.dto.AccountCatalogDto;
import org.example.dto.AccountLoadoutDto;
import org.example.dto.AccountLoadoutRequest;
import org.example.dto.AccountOptionDto;
import org.example.dto.LevelProgressDto;
import org.example.dto.PlayerProfileDto;
import org.example.entity.User;
import org.example.entity.UserLoadout;
import org.example.entity.UserStageProgress;
import org.example.repository.GameSessionRepository;
import org.example.repository.UserLoadoutRepository;
import org.example.repository.UserRepository;
import org.example.repository.UserStageProgressRepository;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AccountServiceImpl implements AccountService {

    private static final Set<String> ALLOWED_UNITS = Set.of("warrior", "lancer", "archer", "arcane_mage");
    private static final Set<String> ALLOWED_AVATARS = Set.of("avatar1", "avatar2", "avatar3", "avatar-a", "avatar-b", "avatar-c");

    private final UserRepository userRepository;
    private final UserLoadoutRepository userLoadoutRepository;
    private final UserStageProgressRepository userStageProgressRepository;
    private final GameSessionRepository gameSessionRepository;
    private final RpgProgressionService rpgProgressionService;
    private final JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public PlayerProfileDto getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay user voi id = " + userId));

        int xpTotal = user.getXpTotal() != null ? user.getXpTotal() : 0;
        LevelProgressDto levelProgress = rpgProgressionService.getLevelProgress(xpTotal);

        if (user.getLevelCurrent() == null || !user.getLevelCurrent().equals(levelProgress.getLevel())) {
            user.setLevelCurrent(levelProgress.getLevel());
            userRepository.save(user);
        }

        AccountLoadoutDto loadout = getLoadout(userId);

        long stagesCleared = userStageProgressRepository.countByUserUserIdAndClearCountGreaterThan(userId, 0);

        List<UserStageProgress> userStages = userStageProgressRepository.findByUserUserId(userId);
        int bestScore = userStages.stream()
                .map(s -> s.getBestScore() != null ? s.getBestScore() : 0)
                .max(Integer::compareTo)
                .orElse(0);

        long totalBattles = gameSessionRepository.countByUserUserId(userId);

        return PlayerProfileDto.builder()
                .userId(user.getUserId())
                .username(user.getUsername())
                .displayName(user.getDisplayName())
                .avatarUrl(user.getAvatarUrl())
                .unitCode(loadout != null ? loadout.getUnitCode() : "warrior")
                .avatarKey(loadout != null ? loadout.getAvatarCode() : "avatar1")
                .levelCurrent(levelProgress.getLevel())
                .xpTotal(xpTotal)
                .xpCurrentInLevel(levelProgress.getXpCurrentInLevel())
                .xpNeededForNextLevel(levelProgress.getXpNeededForNextLevel())
                .levelProgressPercent(levelProgress.getProgressPercent())
                .coins(user.getCoins() != null ? user.getCoins() : 0)
                .streakDays(user.getStreakDays() != null ? user.getStreakDays() : 0)
                .stagesCleared((int) stagesCleared)
                .totalBattles((int) totalBattles)
                .bestScore(bestScore)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AccountCatalogDto getCatalog() {
        return AccountCatalogDto.builder()
                .units(List.of(
                        AccountOptionDto.builder().code("warrior").name("Warrior").imageUrl("/ui/assets/ui/avatars/avatar-ts-1.png").role("Cận chiến chủ lực").note("Sát thương ổn định, animation đầy đủ nhất cho Boss Hunt.").build(),
                        AccountOptionDto.builder().code("lancer").name("Lancer").imageUrl("/ui/assets/ui/avatars/avatar-ts-8.png").role("Phòng tuyến / phản đòn").note("Giữ nhịp giao tranh, hợp với state Guard và counter.").build(),
                        AccountOptionDto.builder().code("archer").name("Archer").imageUrl("/ui/assets/ui/avatars/avatar-ts-18.png").role("Tầm xa / áp lực mục tiêu").note("Dùng shoot animation để tạo cảm giác đánh boss từ xa.").build()
                ))
                .avatars(List.of(
                        AccountOptionDto.builder().code("avatar1").name("Knight Crest").imageUrl("/ui/assets/imgs/avatar1.png").build(),
                        AccountOptionDto.builder().code("avatar2").name("Lancer Crest").imageUrl("/ui/assets/imgs/avatar2.png").build(),
                        AccountOptionDto.builder().code("avatar3").name("Archer Crest").imageUrl("/ui/assets/imgs/avatar3.png").build()
                ))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AccountLoadoutDto getLoadout(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay user voi id = " + userId));

        try {
            Optional<UserLoadout> entityLoadout = userLoadoutRepository.findByUserUserId(userId);
            if (entityLoadout.isPresent()) {
                return toDto(entityLoadout.get());
            }
        } catch (Exception ignored) {
            // Fall through to JDBC fallback for schema mismatches.
        }

        AccountLoadoutDto jdbcLoadout = getLoadoutViaJdbc(userId);
        if (jdbcLoadout != null) {
            return jdbcLoadout;
        }

        return AccountLoadoutDto.builder()
                .userId(userId)
                .unitCode("warrior")
                .avatarCode("avatar1")
                .build();
    }

    @Override
    @Transactional
    public AccountLoadoutDto saveLoadout(AccountLoadoutRequest request) {
        String unitCode = normalize(request.getUnitCode());
        String avatarCode = canonicalizeAvatar(normalize(request.getAvatarCode()));
        String dbAvatarCode = toDbAvatarKey(avatarCode);
        if (!ALLOWED_UNITS.contains(unitCode)) {
            throw new IllegalArgumentException("Unit code khong hop le: " + request.getUnitCode());
        }
        if (!ALLOWED_AVATARS.contains(avatarCode)) {
            throw new IllegalArgumentException("Avatar code khong hop le: " + request.getAvatarCode());
        }

        User user = resolveUserForLoadoutSave(request.getUserId());
        if ("arcane_mage".equals(unitCode)
                && userStageProgressRepository.countByUserUserIdAndClearCountGreaterThan(user.getUserId(), 0) < 1) {
            throw new IllegalArgumentException("Can hoan thanh it nhat 1 Stage de mo khoa Arcane Mage.");
        }

        try {
            UserLoadout loadout = userLoadoutRepository.findByUserUserId(user.getUserId())
                    .orElseGet(() -> {
                        UserLoadout created = new UserLoadout();
                        created.setUser(user);
                        return created;
                    });
            loadout.setUnitCode(unitCode);
            loadout.setAvatarCode(dbAvatarCode);
            UserLoadout saved = userLoadoutRepository.saveAndFlush(loadout);
            return AccountLoadoutDto.builder()
                    .userId(user.getUserId())
                    .unitCode(normalize(saved.getUnitCode()))
                    .avatarCode(canonicalizeAvatar(normalize(saved.getAvatarCode())))
                    .build();
        } catch (Exception ignored) {
            saveLoadoutViaJdbc(user.getUserId(), unitCode, dbAvatarCode);
            return AccountLoadoutDto.builder()
                    .userId(user.getUserId())
                    .unitCode(unitCode)
                    .avatarCode(canonicalizeAvatar(dbAvatarCode))
                    .build();
        }
    }


    private User resolveUserForLoadoutSave(Long requestedUserId) {
        if (requestedUserId != null) {
            Optional<User> exact = userRepository.findById(requestedUserId);
            if (exact.isPresent()) return exact.get();
        }
        return userRepository.findAll().stream()
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay user de luu loadout"));
    }

    private AccountLoadoutDto toDto(UserLoadout loadout) {
        return AccountLoadoutDto.builder()
                .userId(loadout.getUser().getUserId())
                .unitCode(normalize(loadout.getUnitCode()))
                .avatarCode(canonicalizeAvatar(normalize(loadout.getAvatarCode())))
                .build();
    }

    private AccountLoadoutDto getLoadoutViaJdbc(Long userId) {
        String unitColumn = resolveFirstExistingColumn("selected_unit_code", "unit_code");
        String avatarColumn = resolveFirstExistingColumn("selected_avatar_key", "avatar_code", "avatar_key");
        if (unitColumn == null || avatarColumn == null) {
            return null;
        }
        try {
            List<AccountLoadoutDto> rows = jdbcTemplate.query(
                    "select user_id, " + unitColumn + " as unit_code, " + avatarColumn + " as avatar_code from dbo.user_loadouts where user_id = ?",
                    (rs, rowNum) -> AccountLoadoutDto.builder()
                            .userId(rs.getLong("user_id"))
                            .unitCode(normalize(rs.getString("unit_code")))
                            .avatarCode(canonicalizeAvatar(normalize(rs.getString("avatar_code"))))
                            .build(),
                    userId
            );
            return rows.isEmpty() ? null : rows.get(0);
        } catch (DataAccessException ex) {
            return null;
        }
    }

    private void saveLoadoutViaJdbc(Long userId, String unitCode, String avatarCode) {
        String unitColumn = resolveFirstExistingColumn("selected_unit_code", "unit_code");
        String avatarColumn = resolveFirstExistingColumn("selected_avatar_key", "avatar_code", "avatar_key");
        if (unitColumn == null || avatarColumn == null) {
            throw new IllegalArgumentException("Khong the xac dinh schema user_loadouts de luu loadout");
        }

        List<String> columns = jdbcTemplate.queryForList(
                "select COLUMN_NAME from INFORMATION_SCHEMA.COLUMNS where TABLE_SCHEMA = 'dbo' and TABLE_NAME = 'user_loadouts' order by ORDINAL_POSITION",
                String.class
        );
        if (columns.isEmpty()) {
            throw new IllegalArgumentException("Bang user_loadouts chua san sang");
        }

        Integer count = jdbcTemplate.queryForObject(
                "select count(*) from dbo.user_loadouts where user_id = ?",
                Integer.class,
                userId
        );
        if (count != null && count > 0) {
            StringBuilder sql = new StringBuilder("update dbo.user_loadouts set " + unitColumn + " = ?, " + avatarColumn + " = ?");
            List<Object> args = new java.util.ArrayList<>();
            args.add(unitCode);
            args.add(avatarCode);
            if (columns.contains("updated_at")) {
                sql.append(", updated_at = CURRENT_TIMESTAMP");
            }
            sql.append(" where user_id = ?");
            args.add(userId);
            jdbcTemplate.update(sql.toString(), args.toArray());
            return;
        }

        java.util.LinkedHashMap<String, Object> values = new java.util.LinkedHashMap<>();
        values.put("user_id", userId);
        values.put(unitColumn, unitCode);
        values.put(avatarColumn, avatarCode);
        if (columns.contains("created_at")) values.put("created_at", java.sql.Timestamp.valueOf(java.time.LocalDateTime.now()));
        if (columns.contains("updated_at")) values.put("updated_at", java.sql.Timestamp.valueOf(java.time.LocalDateTime.now()));
        if (columns.contains("is_active")) values.put("is_active", Boolean.TRUE);
        if (columns.contains("status")) values.put("status", "ACTIVE");

        String columnSql = String.join(", ", values.keySet());
        String placeholders = String.join(", ", java.util.Collections.nCopies(values.size(), "?"));
        jdbcTemplate.update(
                "insert into dbo.user_loadouts (" + columnSql + ") values (" + placeholders + ")",
                values.values().toArray()
        );
    }

    private String resolveFirstExistingColumn(String... candidates) {
        for (String candidate : candidates) {
            try {
                Integer count = jdbcTemplate.queryForObject(
                        "select count(*) from INFORMATION_SCHEMA.COLUMNS where TABLE_SCHEMA = 'dbo' and TABLE_NAME = 'user_loadouts' and COLUMN_NAME = ?",
                        Integer.class,
                        candidate
                );
                if (count != null && count > 0) {
                    return candidate;
                }
            } catch (DataAccessException ignored) {
                // continue
            }
        }
        return null;
    }

    private String normalize(String input) {
        return input == null ? "" : input.trim().toLowerCase(Locale.ROOT);
    }

    private String canonicalizeAvatar(String input) {
        return switch (input) {
            case "avatar-ts-1", "avatar-a", "avatar1" -> "avatar1";
            case "avatar-ts-8", "avatar-b", "avatar2" -> "avatar2";
            case "avatar-ts-18", "avatar-c", "avatar3" -> "avatar3";
            default -> input;
        };
    }

    private String toDbAvatarKey(String input) {
        return switch (canonicalizeAvatar(input)) {
            case "avatar1" -> "avatar-a";
            case "avatar2" -> "avatar-b";
            case "avatar3" -> "avatar-c";
            default -> input;
        };
    }
}
