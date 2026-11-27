package org.example.service;

import org.example.config.RpgCatalogRegistry;
import org.example.dto.ProgressionLoadoutSaveRequest;
import org.example.dto.ProgressionSkillActionRequest;
import org.example.dto.ProgressionSnapshotDto;
import org.example.entity.*;
import org.example.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProgressionServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private UserProgressionWalletRepository walletRepository;
    @Mock private HeroOwnershipRepository heroOwnershipRepository;
    @Mock private UserSkillUnlockRepository skillUnlockRepository;
    @Mock private UserHeroLoadoutRepository heroLoadoutRepository;
    @Mock private UserMilestoneRewardRepository milestoneRewardRepository;
    @Mock private UserStageProgressRepository stageProgressRepository;
    @Mock private UserWordMasteryRepository wordMasteryRepository;
    @Mock private StageRepository stageRepository;

    private RpgCatalogRegistry registry;
    private ProgressionServiceImpl service;
    private User user;
    private UserProgressionWallet wallet;
    private final Set<String> ownedHeroes = new LinkedHashSet<>();
    private final Map<String, UserSkillUnlock> unlockedSkills = new LinkedHashMap<>();
    private final Map<String, UserHeroLoadout> savedLoadouts = new LinkedHashMap<>();
    private final Set<String> milestones = new LinkedHashSet<>();

    @BeforeEach
    void setUp() {
        registry = new RpgCatalogRegistry();
        service = new ProgressionServiceImpl(
                registry, userRepository, walletRepository, heroOwnershipRepository,
                skillUnlockRepository, heroLoadoutRepository, milestoneRewardRepository,
                stageProgressRepository, wordMasteryRepository, stageRepository
        );
        user = new User();
        user.setUserId(10L);
        user.setUsername("player10");

        wallet = new UserProgressionWallet();
        wallet.setUserId(10L);
        wallet.setUser(user);
        wallet.setSkillPoints(3);
        wallet.setSelectedHeroCode("warrior");

        ownedHeroes.clear();
        ownedHeroes.addAll(List.of("warrior", "archer", "lancer"));
        unlockedSkills.clear();
        for (String sid : List.of("knight_slash", "heavy_slash", "royal_guard", "blade_storm", "sacred_recovery",
                "lexical_judgment", "quick_shot", "piercing_arrow", "triple_shot", "spear_thrust",
                "impaling_charge", "iron_fortress", "fire_blade", "frost_seal", "thunder_strike")) {
            UserSkillUnlock u = new UserSkillUnlock();
            u.setUser(user);
            u.setSkillCode(sid);
            u.setSkillLevel(1);
            unlockedSkills.put(sid, u);
        }
        savedLoadouts.clear();
        milestones.clear();

        lenient().when(userRepository.findById(10L)).thenReturn(Optional.of(user));
        lenient().when(walletRepository.findById(10L)).thenReturn(Optional.of(wallet));
        lenient().when(walletRepository.findByUserIdForUpdate(10L)).thenReturn(Optional.of(wallet));
        lenient().when(walletRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        lenient().when(heroOwnershipRepository.existsByUserUserIdAndHeroCode(eq(10L), anyString()))
                .thenAnswer(i -> ownedHeroes.contains(i.getArgument(1)));
        lenient().when(heroOwnershipRepository.findByUserUserId(10L))
                .thenAnswer(i -> ownedHeroes.stream().map(code -> {
                    HeroOwnership h = new HeroOwnership();
                    h.setUser(user);
                    h.setHeroCode(code);
                    return h;
                }).toList());
        lenient().when(heroOwnershipRepository.save(any())).thenAnswer(i -> {
            HeroOwnership h = i.getArgument(0);
            ownedHeroes.add(h.getHeroCode());
            return h;
        });
        lenient().when(skillUnlockRepository.findByUserUserId(10L))
                .thenAnswer(i -> new ArrayList<>(unlockedSkills.values()));
        lenient().when(skillUnlockRepository.findByUserUserIdAndSkillCode(eq(10L), anyString()))
                .thenAnswer(i -> Optional.ofNullable(unlockedSkills.get(i.getArgument(1))));
        lenient().when(skillUnlockRepository.save(any())).thenAnswer(i -> {
            UserSkillUnlock u = i.getArgument(0);
            unlockedSkills.put(u.getSkillCode(), u);
            return u;
        });
        lenient().when(heroLoadoutRepository.findByUserId(10L))
                .thenAnswer(i -> new ArrayList<>(savedLoadouts.values()));
        lenient().when(heroLoadoutRepository.findByUserIdAndHeroCode(eq(10L), anyString()))
                .thenAnswer(i -> Optional.ofNullable(savedLoadouts.get(i.getArgument(1))));
        lenient().when(heroLoadoutRepository.save(any())).thenAnswer(i -> {
            UserHeroLoadout hl = i.getArgument(0);
            savedLoadouts.put(hl.getHeroCode(), hl);
            return hl;
        });
        lenient().when(milestoneRewardRepository.existsByUserUserIdAndMilestoneKey(eq(10L), anyString()))
                .thenAnswer(i -> milestones.contains(i.getArgument(1)));
        lenient().when(milestoneRewardRepository.findByUserUserId(10L))
                .thenAnswer(i -> milestones.stream().map(k -> {
                    UserMilestoneReward m = new UserMilestoneReward();
                    m.setUser(user);
                    m.setMilestoneKey(k);
                    return m;
                }).toList());
        lenient().when(milestoneRewardRepository.save(any())).thenAnswer(i -> {
            UserMilestoneReward m = i.getArgument(0);
            milestones.add(m.getMilestoneKey());
            return m;
        });
    }

    @Test
    void registryMatches4HeroesAnd27SkillsWithoutFreeUltimatesForArcherLancer() {
        assertEquals(4, registry.getAllHeroes().size());
        assertEquals(27, registry.getAllSkills().size());
        assertFalse(registry.getHero("archer").getStarterSkillIds().contains("celestial_arrow"));
        assertFalse(registry.getHero("lancer").getStarterSkillIds().contains("dragon_lance"));
    }

    @Test
    void rejectsSpBypassForStageLockedSkillsAndDoesNotDeductSp() {
        when(stageProgressRepository.findByUserUserId(10L)).thenReturn(List.of());
        ProgressionSkillActionRequest req = new ProgressionSkillActionRequest();
        req.setUserId(10L);
        req.setHeroCode("warrior");
        req.setSkillCode("phantom_dash");

        assertThrows(IllegalArgumentException.class, () -> service.learnSkill(req));
        assertEquals(3, wallet.getSkillPoints());
        assertFalse(unlockedSkills.containsKey("phantom_dash"));
    }

    @Test
    void mageUnlockWorksOnReplayAfter0TopicFirstClearWithoutDuplicateStageSp() {
        Stage stage1 = new Stage();
        stage1.setStageId(1L);
        stage1.setChapterNo(1);
        stage1.setStageNo(1);

        when(stageProgressRepository.findByUserUserId(10L)).thenReturn(List.of());

        // Clear 1: 0 topic words -> Stage SP + Phantom Dash granted, Arcane Mage stays locked
        List<String> clear1 = service.recordCampaignVictoryMilestones(user, stage1, true, false, 0);
        assertTrue(clear1.stream().anyMatch(s -> s.contains("stage_first_clear_1")));
        assertTrue(clear1.contains("skill_unlock_phantom_dash"));
        assertFalse(ownedHeroes.contains("arcane_mage"));
        int spAfterFirst = wallet.getSkillPoints();
        assertEquals(5, spAfterFirst);

        // Replay Stage 1 with 1 topic word -> Arcane Mage unlocks cleanly & SP does NOT duplicate
        List<String> replay = service.recordCampaignVictoryMilestones(user, stage1, true, false, 1);
        assertTrue(ownedHeroes.contains("arcane_mage"));
        assertTrue(replay.contains("hero_unlock_arcane_mage"));
        assertEquals(spAfterFirst, wallet.getSkillPoints());
    }

    @Test
    void saveLoadoutRejectsUnownedHeroWrongClassAndOver4ActiveSlots() {
        ProgressionLoadoutSaveRequest lockedHero = new ProgressionLoadoutSaveRequest();
        lockedHero.setUserId(10L);
        lockedHero.setHeroCode("arcane_mage");
        lockedHero.setActiveSkillCodes(List.of("magic_bolt"));
        assertThrows(IllegalArgumentException.class, () -> service.saveLoadout(lockedHero));

        ProgressionLoadoutSaveRequest wrongClass = new ProgressionLoadoutSaveRequest();
        wrongClass.setUserId(10L);
        wrongClass.setHeroCode("archer");
        wrongClass.setActiveSkillCodes(List.of("knight_slash"));
        assertThrows(IllegalArgumentException.class, () -> service.saveLoadout(wrongClass));

        ProgressionLoadoutSaveRequest tooMany = new ProgressionLoadoutSaveRequest();
        tooMany.setUserId(10L);
        tooMany.setHeroCode("warrior");
        tooMany.setActiveSkillCodes(List.of("knight_slash", "heavy_slash", "royal_guard", "sacred_recovery", "blade_storm"));
        assertThrows(IllegalArgumentException.class, () -> service.saveLoadout(tooMany));

        ProgressionLoadoutSaveRequest valid = new ProgressionLoadoutSaveRequest();
        valid.setUserId(10L);
        valid.setHeroCode("warrior");
        valid.setActiveSkillCodes(List.of("knight_slash", "heavy_slash", "royal_guard", "sacred_recovery"));
        valid.setUltimateSkillCode("lexical_judgment");
        ProgressionSnapshotDto snap = service.saveLoadout(valid);
        assertEquals("warrior", snap.getSelectedHeroCode());
        assertEquals(List.of("knight_slash", "heavy_slash", "royal_guard", "sacred_recovery"),
                snap.getLoadouts().get("warrior").getActiveSkillCodes());
    }

    @Test
    void practiceVictoryNeverGrantsCampaignMilestones() {
        Stage stage1 = new Stage();
        stage1.setStageId(1L);
        stage1.setChapterNo(1);
        stage1.setStageNo(1);

        List<String> granted = service.recordCampaignVictoryMilestones(user, stage1, true, true, 5);
        assertTrue(granted.isEmpty());
        assertEquals(3, wallet.getSkillPoints());
        assertFalse(ownedHeroes.contains("arcane_mage"));
    }
}
