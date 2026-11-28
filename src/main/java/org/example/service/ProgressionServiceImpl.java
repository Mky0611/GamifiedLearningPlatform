package org.example.service;

import lombok.RequiredArgsConstructor;
import org.example.config.RpgCatalogRegistry;
import org.example.dto.ProgressionLoadoutSaveRequest;
import org.example.dto.ProgressionSkillActionRequest;
import org.example.dto.ProgressionSnapshotDto;
import org.example.entity.*;
import org.example.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class ProgressionServiceImpl implements ProgressionService {

    private static final int INITIAL_SKILL_POINTS = 3;
    private static final List<String> STARTER_HEROES = List.of("warrior", "archer", "lancer");

    private final RpgCatalogRegistry catalogRegistry;
    private final UserRepository userRepository;
    private final UserProgressionWalletRepository walletRepository;
    private final HeroOwnershipRepository heroOwnershipRepository;
    private final UserSkillUnlockRepository skillUnlockRepository;
    private final UserHeroLoadoutRepository heroLoadoutRepository;
    private final UserMilestoneRewardRepository milestoneRewardRepository;
    private final UserStageProgressRepository stageProgressRepository;
    private final UserWordMasteryRepository wordMasteryRepository;
    private final StageRepository stageRepository;

    @Override
    @Transactional
    public ProgressionSnapshotDto getProgression(Long userId) {
        User user = requireUserForUpdate(userId);
        UserProgressionWallet wallet = ensureInitialized(user);
        return buildSnapshot(user, wallet);
    }

    @Override
    @Transactional
    public List<Map<String, Object>> getHeroStatuses(Long userId) {
        User user = requireUserForUpdate(userId);
        ensureInitialized(user);
        Set<String> owned = getOwnedHeroSet(userId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (RpgCatalogRegistry.HeroSpec hero : catalogRegistry.getAllHeroes()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("heroId", hero.getHeroId());
            row.put("name", hero.getName());
            row.put("archetype", hero.getArchetype());
            row.put("ranged", hero.isRanged());
            row.put("baseHp", hero.getBaseHp());
            row.put("baseMp", hero.getBaseMp());
            row.put("maxMp", hero.getMaxMp());
            row.put("unlocked", owned.contains(hero.getHeroId()));
            row.put("unlockRule", hero.getUnlockRule().getLabel());
            result.add(row);
        }
        return result;
    }

    @Override
    @Transactional
    public List<Map<String, Object>> getSkillTree(Long userId, String heroCode) {
        User user = requireUserForUpdate(userId);
        UserProgressionWallet wallet = ensureInitialized(user);
        String targetHero = normalizeHero(heroCode != null ? heroCode : wallet.getSelectedHeroCode());
        RpgCatalogRegistry.HeroSpec hero = requireHeroSpec(targetHero);

        Map<String, Integer> levels = getSkillLevelMap(userId);
        UserHeroLoadout loadout = heroLoadoutRepository.findByUserIdAndHeroCode(userId, targetHero).orElse(null);
        Set<String> equipped = new HashSet<>(parseJsonStringList(loadout != null ? loadout.getActiveSlotsJson() : "[]"));
        if (loadout != null && loadout.getUltimateSlotCode() != null) {
            equipped.add(loadout.getUltimateSlotCode());
        }

        ProgressionContext ctx = buildLearningContext(userId);
        List<Map<String, Object>> nodes = new ArrayList<>();
        for (RpgCatalogRegistry.SkillSpec sk : catalogRegistry.getAllSkills()) {
            if (!sk.getAllowedHeroes().contains(hero.getHeroId())) continue;
            int curLv = levels.getOrDefault(sk.getId(), 0);
            boolean isEquipped = equipped.contains(sk.getId());
            SkillEligibilityResult elig = evaluateSkillEligibility(sk, curLv, wallet.getSkillPoints(), levels, ctx);

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("skillId", sk.getId());
            row.put("name", sk.getName());
            row.put("branch", sk.getBranch());
            row.put("tier", sk.getTier());
            row.put("ultimate", sk.isUltimate());
            row.put("animationProfile", sk.getAnimationProfile());
            row.put("level", curLv);
            row.put("equipped", isEquipped);
            row.put("state", curLv >= 3 ? "MAX_LEVEL"
                    : (curLv >= 1 ? (elig.canAct ? "UPGRADE_AVAILABLE" : (isEquipped ? "EQUIPPED" : "LEARNED"))
                    : (elig.canAct ? "AVAILABLE" : "LOCKED")));
            row.put("canLearn", curLv == 0 && elig.canAct);
            row.put("canUpgrade", curLv >= 1 && curLv < 3 && elig.canAct);
            row.put("reason", elig.reason);
            nodes.add(row);
        }
        return nodes;
    }

    @Override
    @Transactional
    public ProgressionSnapshotDto learnSkill(ProgressionSkillActionRequest request) {
        if (request == null || request.getUserId() == null) {
            throw new IllegalArgumentException("Thieu userId hop le khi hoc skill");
        }
        User user = requireUserForUpdate(request.getUserId());
        ensureInitialized(user);
        UserProgressionWallet wallet = walletRepository.findByUserIdForUpdate(user.getUserId())
                .orElseThrow(() -> new IllegalStateException("Khong the khoa wallet progression cua user"));

        String heroCode = normalizeHero(request.getHeroCode());
        requireOwnedHero(user.getUserId(), heroCode);
        RpgCatalogRegistry.SkillSpec sk = requireSkillSpec(request.getSkillCode());
        if (!sk.getAllowedHeroes().contains(heroCode)) {
            throw new IllegalArgumentException(sk.getName() + " khong thuoc lop Hero " + heroCode);
        }

        Map<String, Integer> levels = getSkillLevelMap(user.getUserId());
        int curLv = levels.getOrDefault(sk.getId(), 0);
        if (curLv >= 1) {
            throw new IllegalArgumentException(sk.getName() + " da duoc hoc (Lv " + curLv + "), hay dung API upgrade.");
        }

        ProgressionContext ctx = buildLearningContext(user.getUserId());
        SkillEligibilityResult elig = evaluateSkillEligibility(sk, 0, wallet.getSkillPoints(), levels, ctx);
        if (!elig.canAct) {
            throw new IllegalArgumentException(elig.reason);
        }

        wallet.setSkillPoints(wallet.getSkillPoints() - 1);
        walletRepository.save(wallet);

        UserSkillUnlock unlock = new UserSkillUnlock();
        unlock.setUser(user);
        unlock.setSkillCode(sk.getId());
        unlock.setSkillLevel(1);
        skillUnlockRepository.save(unlock);

        return buildSnapshot(user, wallet);
    }

    @Override
    @Transactional
    public ProgressionSnapshotDto upgradeSkill(ProgressionSkillActionRequest request) {
        if (request == null || request.getUserId() == null) {
            throw new IllegalArgumentException("Thieu userId hop le khi nang cap skill");
        }
        User user = requireUserForUpdate(request.getUserId());
        ensureInitialized(user);
        UserProgressionWallet wallet = walletRepository.findByUserIdForUpdate(user.getUserId())
                .orElseThrow(() -> new IllegalStateException("Khong the khoa wallet progression cua user"));

        String heroCode = normalizeHero(request.getHeroCode());
        requireOwnedHero(user.getUserId(), heroCode);
        RpgCatalogRegistry.SkillSpec sk = requireSkillSpec(request.getSkillCode());
        if (!sk.getAllowedHeroes().contains(heroCode)) {
            throw new IllegalArgumentException(sk.getName() + " khong thuoc lop Hero " + heroCode);
        }

        UserSkillUnlock existing = skillUnlockRepository.findByUserUserIdAndSkillCode(user.getUserId(), sk.getId())
                .orElseThrow(() -> new IllegalArgumentException(sk.getName() + " chua duoc hoc; khong the nang cap."));
        int curLv = existing.getSkillLevel() != null ? existing.getSkillLevel() : 1;
        if (curLv >= 3) {
            throw new IllegalArgumentException(sk.getName() + " da dat cap toi da Lv 3.");
        }

        Map<String, Integer> levels = getSkillLevelMap(user.getUserId());
        ProgressionContext ctx = buildLearningContext(user.getUserId());
        SkillEligibilityResult elig = evaluateSkillEligibility(sk, curLv, wallet.getSkillPoints(), levels, ctx);
        if (!elig.canAct) {
            throw new IllegalArgumentException(elig.reason);
        }

        wallet.setSkillPoints(wallet.getSkillPoints() - 1);
        walletRepository.save(wallet);

        existing.setSkillLevel(curLv + 1);
        skillUnlockRepository.save(existing);

        return buildSnapshot(user, wallet);
    }

    @Override
    @Transactional
    public ProgressionSnapshotDto saveLoadout(ProgressionLoadoutSaveRequest request) {
        if (request == null || request.getUserId() == null) {
            throw new IllegalArgumentException("Thieu userId hop le khi luu loadout");
        }
        User user = requireUserForUpdate(request.getUserId());
        ensureInitialized(user);
        UserProgressionWallet wallet = walletRepository.findByUserIdForUpdate(user.getUserId())
                .orElseThrow(() -> new IllegalStateException("Khong the khoa wallet progression cua user"));

        String heroCode = normalizeHero(request.getHeroCode());
        requireHeroSpec(heroCode);
        requireOwnedHero(user.getUserId(), heroCode);

        Map<String, Integer> levels = getSkillLevelMap(user.getUserId());
        List<String> activeList = new ArrayList<>();
        Set<String> seenActive = new LinkedHashSet<>();
        for (String raw : Optional.ofNullable(request.getActiveSkillCodes()).orElse(List.of())) {
            String sid = normalizeCode(raw);
            if (sid.isEmpty()) continue;
            RpgCatalogRegistry.SkillSpec sk = requireSkillSpec(sid);
            if (!sk.getAllowedHeroes().contains(heroCode)) {
                throw new IllegalArgumentException(sk.getName() + " khong dung duoc cho " + heroCode);
            }
            if (sk.isUltimate()) {
                throw new IllegalArgumentException(sk.getName() + " la Ultimate, chi dat o o Ultimate (toi da 1).");
            }
            validateLearnedWithPrereqs(sk, levels);
            if (!seenActive.add(sid)) {
                throw new IllegalArgumentException("Trung ky nang trong Active Loadout: " + sid);
            }
            activeList.add(sid);
        }
        if (activeList.size() > RpgCatalogRegistry.MAX_ACTIVE_LOADOUT) {
            throw new IllegalArgumentException("Toi da " + RpgCatalogRegistry.MAX_ACTIVE_LOADOUT + " Active Skill trong Loadout.");
        }

        String ultCode = null;
        if (request.getUltimateSkillCode() != null && !request.getUltimateSkillCode().isBlank()) {
            String cid = normalizeCode(request.getUltimateSkillCode());
            RpgCatalogRegistry.SkillSpec ult = requireSkillSpec(cid);
            if (!ult.isUltimate()) {
                throw new IllegalArgumentException(ult.getName() + " khong phai ky nang Ultimate.");
            }
            if (!ult.getAllowedHeroes().contains(heroCode)) {
                throw new IllegalArgumentException(ult.getName() + " khong dung duoc cho " + heroCode);
            }
            validateLearnedWithPrereqs(ult, levels);
            ultCode = cid;
        }

        UserHeroLoadout loadout = heroLoadoutRepository.findByUserIdAndHeroCode(user.getUserId(), heroCode)
                .orElseGet(() -> {
                    UserHeroLoadout created = new UserHeroLoadout();
                    created.setUserId(user.getUserId());
                    created.setHeroCode(heroCode);
                    return created;
                });
        loadout.setActiveSlotsJson(toJsonStringArray(activeList));
        loadout.setUltimateSlotCode(ultCode);
        heroLoadoutRepository.save(loadout);

        wallet.setSelectedHeroCode(heroCode);
        walletRepository.save(wallet);

        return buildSnapshot(user, wallet);
    }

    @Override
    @Transactional
    public List<String> recordCampaignVictoryMilestones(User user, Stage stage, boolean won, boolean practiceMode, int sessionTopicWords) {
        if (user == null || user.getUserId() == null || stage == null || !won || practiceMode) {
            return List.of();
        }
        UserProgressionWallet wallet = ensureInitializedForUpdate(user);
        int stageOrder = resolveStageOrder(stage);
        List<String> granted = new ArrayList<>();

        // 1. Stage First Clear Milestone (decoupled from Hero Unlock!)
        String stageKey = "stage_first_clear_" + stage.getStageId();
        if (!milestoneRewardRepository.existsByUserUserIdAndMilestoneKey(user.getUserId(), stageKey)) {
            int spBonus = stageOrder <= 3 ? 2 : 3;
            wallet.setSkillPoints(wallet.getSkillPoints() + spBonus);
            saveMilestone(user, stageKey, "STAGE_SP", spBonus);
            granted.add(stageKey + " (+" + spBonus + " SP)");
        }

        // 2. Stage Milestone Skill Unlock (strict stage -> skill mapping)
        String rewardSkillCode = switch (stageOrder) {
            case 1 -> "phantom_dash";
            case 2 -> "shield_counter";
            case 3 -> "rune_prison";
            case 4 -> "earthbreaker";
            case 5 -> "heavens_pillar";
            default -> null;
        };
        if (rewardSkillCode != null) {
            String skillKey = "skill_unlock_" + rewardSkillCode;
            if (!milestoneRewardRepository.existsByUserUserIdAndMilestoneKey(user.getUserId(), skillKey)) {
                ensureSkillAtLeastLv1(user, rewardSkillCode);
                saveMilestone(user, skillKey, "SKILL", 0);
                granted.add(skillKey);
            }
        }

        // 3. Independent Hero Unlock Evaluation (fixes Arcane Mage permanent lock when Stage 1 first clear had 0 Topic words!)
        ProgressionContext ctx = buildLearningContext(user.getUserId());
        int totalTopic = Math.max(ctx.topicWordsSolved, sessionTopicWords);
        RpgCatalogRegistry.HeroSpec mage = catalogRegistry.getHero("arcane_mage");
        if (mage != null) {
            String mageKey = "hero_unlock_arcane_mage";
            boolean stage1Cleared = ctx.clearedStageOrders.contains(1) || stageOrder == 1;
            boolean alreadyOwned = heroOwnershipRepository.existsByUserUserIdAndHeroCode(user.getUserId(), "arcane_mage");
            boolean alreadyMilestone = milestoneRewardRepository.existsByUserUserIdAndMilestoneKey(user.getUserId(), mageKey);
            if (stage1Cleared && totalTopic >= mage.getUnlockRule().getMinTopicWords() && (!alreadyOwned || !alreadyMilestone)) {
                if (!alreadyOwned) {
                    HeroOwnership own = new HeroOwnership();
                    own.setUser(user);
                    own.setHeroCode("arcane_mage");
                    own.setUnlockSource("STAGE_1_AND_TOPIC_WORDS");
                    heroOwnershipRepository.save(own);
                    for (String starterSkill : mage.getStarterSkillIds()) {
                        ensureSkillAtLeastLv1(user, starterSkill);
                    }
                    ensureDefaultLoadoutIfAbsent(user.getUserId(), mage);
                }
                if (!alreadyMilestone) {
                    saveMilestone(user, mageKey, "HERO", 0);
                    granted.add(mageKey);
                }
            }
        }

        walletRepository.save(wallet);
        return granted;
    }

    private UserProgressionWallet ensureInitialized(User user) {
        Optional<UserProgressionWallet> existing = walletRepository.findById(user.getUserId());
        if (existing.isPresent()) {
            return existing.get();
        }
        userRepository.findByIdForUpdate(user.getUserId());
        return walletRepository.findById(user.getUserId())
                .orElseGet(() -> createInitialProgression(user));
    }

    private UserProgressionWallet ensureInitializedForUpdate(User user) {
        Optional<UserProgressionWallet> existing = walletRepository.findByUserIdForUpdate(user.getUserId());
        if (existing.isPresent()) {
            return existing.get();
        }
        userRepository.findByIdForUpdate(user.getUserId());
        return walletRepository.findByUserIdForUpdate(user.getUserId())
                .orElseGet(() -> createInitialProgression(user));
    }

    private UserProgressionWallet createInitialProgression(User user) {
        UserProgressionWallet wallet = new UserProgressionWallet();
        wallet.setUser(user);
        wallet.setSkillPoints(INITIAL_SKILL_POINTS);
        wallet.setSelectedHeroCode("warrior");
        wallet = walletRepository.save(wallet);

        for (String heroCode : STARTER_HEROES) {
            if (!heroOwnershipRepository.existsByUserUserIdAndHeroCode(user.getUserId(), heroCode)) {
                HeroOwnership own = new HeroOwnership();
                own.setUser(user);
                own.setHeroCode(heroCode);
                own.setUnlockSource("STARTER");
                heroOwnershipRepository.save(own);
            }
            RpgCatalogRegistry.HeroSpec spec = catalogRegistry.getHero(heroCode);
            if (spec != null) {
                for (String sid : spec.getStarterSkillIds()) {
                    ensureSkillAtLeastLv1(user, sid);
                }
                ensureDefaultLoadoutIfAbsent(user.getUserId(), spec);
            }
        }
        for (String sharedSpell : RpgCatalogRegistry.SHARED_ELEMENTAL_SPELL_IDS) {
            ensureSkillAtLeastLv1(user, sharedSpell);
        }
        return wallet;
    }

    private void ensureSkillAtLeastLv1(User user, String skillCode) {
        if (skillUnlockRepository.findByUserUserIdAndSkillCode(user.getUserId(), skillCode).isEmpty()) {
            UserSkillUnlock unlock = new UserSkillUnlock();
            unlock.setUser(user);
            unlock.setSkillCode(skillCode);
            unlock.setSkillLevel(1);
            skillUnlockRepository.save(unlock);
        }
    }

    private void ensureDefaultLoadoutIfAbsent(Long userId, RpgCatalogRegistry.HeroSpec hero) {
        if (heroLoadoutRepository.findByUserIdAndHeroCode(userId, hero.getHeroId()).isEmpty()) {
            List<String> active = new ArrayList<>();
            String ult = null;
            for (String sid : hero.getDefaultLoadout()) {
                RpgCatalogRegistry.SkillSpec sk = catalogRegistry.getSkill(sid);
                if (sk == null) continue;
                if (sk.isUltimate()) ult = sid;
                else if (active.size() < RpgCatalogRegistry.MAX_ACTIVE_LOADOUT) active.add(sid);
            }
            UserHeroLoadout loadout = new UserHeroLoadout();
            loadout.setUserId(userId);
            loadout.setHeroCode(hero.getHeroId());
            loadout.setActiveSlotsJson(toJsonStringArray(active));
            loadout.setUltimateSlotCode(ult);
            heroLoadoutRepository.save(loadout);
        }
    }

    private void saveMilestone(User user, String key, String type, int spGranted) {
        UserMilestoneReward reward = new UserMilestoneReward();
        reward.setUser(user);
        reward.setMilestoneKey(key);
        reward.setRewardType(type);
        reward.setSpGranted(spGranted);
        milestoneRewardRepository.save(reward);
    }

    private void validateLearnedWithPrereqs(RpgCatalogRegistry.SkillSpec sk, Map<String, Integer> levels) {
        if (levels.getOrDefault(sk.getId(), 0) < 1) {
            throw new IllegalArgumentException(sk.getName() + " chua duoc hoc; khong the trang bi.");
        }
        for (String pre : sk.getPrerequisites()) {
            if (levels.getOrDefault(pre, 0) < 1) {
                throw new IllegalArgumentException(sk.getName() + " thieu ky nang tien quyet: " + pre);
            }
        }
    }

    private SkillEligibilityResult evaluateSkillEligibility(
            RpgCatalogRegistry.SkillSpec sk, int curLv, int spAvailable,
            Map<String, Integer> levels, ProgressionContext ctx
    ) {
        if (curLv >= 3) {
            return new SkillEligibilityResult(false, "Da dat cap toi da Lv 3.");
        }
        for (String pre : sk.getPrerequisites()) {
            if (levels.getOrDefault(pre, 0) < 1) {
                return new SkillEligibilityResult(false, "Can hoc ky nang tien quyet: " + pre);
            }
        }
        RpgCatalogRegistry.UnlockRule rule = curLv == 0
                ? sk.getUnlockRule()
                : (sk.getUpgradeRequirements() != null ? sk.getUpgradeRequirements().get(curLv + 1) : null);

        if (rule != null && !"STARTER".equals(rule.getType())) {
            if (rule.getRequiredStageOrder() > 0 && !ctx.clearedStageOrders.contains(rule.getRequiredStageOrder())) {
                return new SkillEligibilityResult(false, "Can danh bai Stage " + rule.getRequiredStageOrder() + " truoc.");
            }
            if (rule.getMinTopicWords() > 0 && ctx.topicWordsSolved < rule.getMinTopicWords()) {
                return new SkillEligibilityResult(false, "Can giai >= " + rule.getMinTopicWords() + " tu dung Topic.");
            }
            if (rule.getMinUniqueReviewedWords() > 0 && ctx.uniqueReviewedWords < rule.getMinUniqueReviewedWords()) {
                return new SkillEligibilityResult(false, "Can on tap dung >= " + rule.getMinUniqueReviewedWords() + " tu duy nhat.");
            }
        }
        if (spAvailable < 1) {
            return new SkillEligibilityResult(false, "Can 1 Skill Point.");
        }
        return new SkillEligibilityResult(true, curLv == 0 ? "San sang hoc (1 SP)" : "San sang nang len Lv " + (curLv + 1));
    }

    private ProgressionContext buildLearningContext(Long userId) {
        List<UserStageProgress> progresses = stageProgressRepository.findByUserUserId(userId);
        Set<Integer> clearedOrders = new HashSet<>();
        for (UserStageProgress p : progresses) {
            if (p.getClearCount() != null && p.getClearCount() > 0 && p.getStage() != null) {
                clearedOrders.add(resolveStageOrder(p.getStage()));
            }
        }
        // Only count real Topic vocabulary words found in UserWordMastery — never substitute Global lexicon words
        int foundMastery = (int) wordMasteryRepository.countByUserUserIdAndTimesFoundGreaterThan(userId, 0);
        int reviewedCorrect = (int) wordMasteryRepository.countByUserUserIdAndTimesAnsweredCorrectGreaterThan(userId, 0);
        return new ProgressionContext(clearedOrders, foundMastery, reviewedCorrect);
    }

    private int resolveStageOrder(Stage stage) {
        if (stage == null) return 1;
        if (stage.getChapterNo() != null && stage.getChapterNo() == 1) {
            return stage.getStageNo() != null && stage.getStageNo() >= 2 ? 2 : 1;
        }
        if (stage.getChapterNo() != null && stage.getChapterNo() >= 2) {
            return stage.getChapterNo() + 1;
        }
        return stage.getStageNo() != null ? stage.getStageNo() : 1;
    }

    private ProgressionSnapshotDto buildSnapshot(User user, UserProgressionWallet wallet) {
        Long userId = user.getUserId();
        List<String> unlockedHeroes = heroOwnershipRepository.findByUserUserId(userId).stream()
                .map(HeroOwnership::getHeroCode).toList();
        Map<String, Integer> skillLevels = getSkillLevelMap(userId);
        Map<String, ProgressionSnapshotDto.HeroLoadoutSnapshotDto> loadouts = new LinkedHashMap<>();
        for (UserHeroLoadout hl : heroLoadoutRepository.findByUserId(userId)) {
            loadouts.put(hl.getHeroCode(), ProgressionSnapshotDto.HeroLoadoutSnapshotDto.builder()
                    .activeSkillCodes(parseJsonStringList(hl.getActiveSlotsJson()))
                    .ultimateSkillCode(hl.getUltimateSlotCode())
                    .build());
        }

        List<Stage> activeStages = stageRepository.findByStatusOrderByChapterNoAscStageNoAsc("ACTIVE");
        Map<Long, UserStageProgress> progByStage = new HashMap<>();
        for (UserStageProgress sp : stageProgressRepository.findByUserUserId(userId)) {
            if (sp.getStage() != null) progByStage.put(sp.getStage().getStageId(), sp);
        }
        List<ProgressionSnapshotDto.StageProgressSummaryDto> chapters = new ArrayList<>();
        boolean prevCleared = true;
        for (Stage st : activeStages) {
            UserStageProgress sp = progByStage.get(st.getStageId());
            int clears = sp != null && sp.getClearCount() != null ? sp.getClearCount() : 0;
            int stars = sp != null && sp.getStarsEarned() != null ? sp.getStarsEarned() : 0;
            String status = clears > 0
                    ? (stars >= 3 ? "MASTERED" : "COMPLETED")
                    : (prevCleared ? "AVAILABLE" : "LOCKED");
            prevCleared = clears > 0;
            chapters.add(ProgressionSnapshotDto.StageProgressSummaryDto.builder()
                    .stageId(st.getStageId()).chapterNo(st.getChapterNo()).stageNo(st.getStageNo()).name(st.getName())
                    .status(status).clears(clears)
                    .bestScore(sp != null && sp.getBestScore() != null ? sp.getBestScore() : 0)
                    .stars(stars)
                    .build());
        }

        ProgressionContext ctx = buildLearningContext(userId);
        List<String> milestones = milestoneRewardRepository.findByUserUserId(userId).stream()
                .map(UserMilestoneReward::getMilestoneKey).toList();

        return ProgressionSnapshotDto.builder()
                .userId(userId)
                .skillPoints(wallet.getSkillPoints())
                .selectedHeroCode(wallet.getSelectedHeroCode())
                .unlockedHeroes(unlockedHeroes)
                .skillLevels(skillLevels)
                .loadouts(loadouts)
                .chapters(chapters)
                .rewardedMilestones(milestones)
                .topicWordsSolved(ctx.topicWordsSolved)
                .uniqueReviewedWordsCount(ctx.uniqueReviewedWords)
                .masteredWordsCount(ctx.uniqueReviewedWords)
                .build();
    }

    private Map<String, Integer> getSkillLevelMap(Long userId) {
        Map<String, Integer> map = new LinkedHashMap<>();
        for (UserSkillUnlock u : skillUnlockRepository.findByUserUserId(userId)) {
            map.put(u.getSkillCode(), u.getSkillLevel());
        }
        return map;
    }

    private Set<String> getOwnedHeroSet(Long userId) {
        Set<String> set = new LinkedHashSet<>();
        for (HeroOwnership ho : heroOwnershipRepository.findByUserUserId(userId)) {
            set.add(ho.getHeroCode());
        }
        return set;
    }

    private User requireUserForUpdate(Long userId) {
        if (userId == null || userId <= 0) {
            throw new IllegalArgumentException("Thieu userId hop le");
        }
        return userRepository.findByIdForUpdate(userId)
                .or(() -> userRepository.findById(userId))
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay user voi id = " + userId));
    }

    private User requireUser(Long userId) {
        if (userId == null || userId <= 0) {
            throw new IllegalArgumentException("Thieu userId hop le");
        }
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay user voi id = " + userId));
    }

    private void requireOwnedHero(Long userId, String heroCode) {
        if (!heroOwnershipRepository.existsByUserUserIdAndHeroCode(userId, heroCode)) {
            throw new IllegalArgumentException("Hero '" + heroCode + "' chua duoc mo khoa cho tai khoan nay.");
        }
    }

    private RpgCatalogRegistry.HeroSpec requireHeroSpec(String heroCode) {
        RpgCatalogRegistry.HeroSpec spec = catalogRegistry.getHero(heroCode);
        if (spec == null) {
            throw new IllegalArgumentException("Hero khong ton tai: " + heroCode);
        }
        return spec;
    }

    private RpgCatalogRegistry.SkillSpec requireSkillSpec(String skillCode) {
        RpgCatalogRegistry.SkillSpec spec = catalogRegistry.getSkill(normalizeCode(skillCode));
        if (spec == null) {
            throw new IllegalArgumentException("Ky nang khong ton tai: " + skillCode);
        }
        return spec;
    }

    private String normalizeHero(String heroCode) {
        return normalizeCode(heroCode);
    }

    private String normalizeCode(String raw) {
        return raw == null ? "" : raw.trim().toLowerCase(Locale.ROOT);
    }

    private static List<String> parseJsonStringList(String json) {
        List<String> out = new ArrayList<>();
        if (json == null || json.isBlank()) return out;
        Matcher m = Pattern.compile("\"([^\"]+)\"").matcher(json);
        while (m.find()) out.add(m.group(1));
        return out;
    }

    private static String toJsonStringArray(List<String> items) {
        if (items == null || items.isEmpty()) return "[]";
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < items.size(); i++) {
            if (i > 0) sb.append(',');
            sb.append('"').append(items.get(i).replace("\"", "")).append('"');
        }
        return sb.append(']').toString();
    }

    private record ProgressionContext(Set<Integer> clearedStageOrders, int topicWordsSolved, int uniqueReviewedWords) {}
    private record SkillEligibilityResult(boolean canAct, String reason) {}
}
