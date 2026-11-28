package org.example;

import jakarta.servlet.Filter;
import org.example.dto.*;
import org.example.entity.MasteryRecallChallenge;
import org.example.entity.User;
import org.example.entity.VocabularyWord;
import org.example.repository.*;
import org.example.security.JwtTokenService;
import org.example.service.LexRaidService;
import org.example.service.MasteryService;
import org.example.service.ProgressionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@EnabledIfEnvironmentVariable(named = "RUN_P61_SQL_IT", matches = "true")
class P61SqlServerIntegrationTest {

    @Autowired private WebApplicationContext wac;
    @Autowired private Filter springSecurityFilterChain;
    @Autowired private JwtTokenService jwtTokenService;
    @Autowired private UserRepository userRepository;
    @Autowired private ProgressionService progressionService;
    @Autowired private LexRaidService lexRaidService;
    @Autowired private MasteryService masteryService;
    @Autowired private StageRepository stageRepository;
    @Autowired private UserStageProgressRepository stageProgressRepository;
    @Autowired private MasteryRecallChallengeRepository challengeRepository;
    @Autowired private VocabularyWordRepository vocabularyWordRepository;
    @Autowired private RaidSessionRepository raidSessionRepository;
    @Autowired private SkillCastEventRepository skillCastEventRepository;

    private MockMvc mockMvc;

    @BeforeEach
    void setUpMvc() {
        mockMvc = MockMvcBuilders.webAppContextSetup(wac)
                .addFilters(springSecurityFilterChain)
                .build();
    }

    @Test
    void fullSqlServerAndJwtAuthOwnershipIntegrationFlow() throws Exception {
        String suffix = String.valueOf(System.currentTimeMillis());
        String regAJson = "{\"username\":\"p61a_" + suffix + "\",\"email\":\"p61a_" + suffix + "@test.local\","
                + "\"password\":\"TestPass123!\",\"displayName\":\"Hero Alpha\"}";
        String regBJson = "{\"username\":\"p61b_" + suffix + "\",\"email\":\"p61b_" + suffix + "@test.local\","
                + "\"password\":\"TestPass123!\",\"displayName\":\"Hero Beta\"}";

        MvcResult regARes = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON).content(regAJson))
                .andExpect(status().isCreated()).andReturn();
        MvcResult regBRes = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON).content(regBJson))
                .andExpect(status().isCreated()).andReturn();

        String bodyA = regARes.getResponse().getContentAsString();
        String bodyB = regBRes.getResponse().getContentAsString();
        Long userAId = extractLong(bodyA, "userId");
        Long userBId = extractLong(bodyB, "userId");
        String tokenA = extractString(bodyA, "accessToken");
        String tokenB = extractString(bodyB, "accessToken");
        assertNotNull(userAId);
        assertNotNull(userBId);
        assertNotNull(tokenA);
        assertNotNull(tokenB);

        // Login returns live BCrypt-verified JWT
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"usernameOrEmail\":\"p61a_" + suffix + "\",\"password\":\"TestPass123!\"}"))
                .andExpect(status().isOk());

        // 1. Security HTTP 401 checks (no token, invalid token, expired token)
        mockMvc.perform(get("/api/v1/progression")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/account/profile")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/mastery")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/progression").header("Authorization", "Bearer invalid.jwt.sig"))
                .andExpect(status().isUnauthorized());

        User entityA = userRepository.findById(userAId).orElseThrow();
        String expiredToken = jwtTokenService.generateTokenWithTtl(entityA, -5_000L);
        mockMvc.perform(get("/api/v1/progression").header("Authorization", "Bearer " + expiredToken))
                .andExpect(status().isUnauthorized());

        // 2. Ownership HTTP 403 checks (cross-user userId query & body tampering)
        mockMvc.perform(get("/api/v1/progression?userId=" + userBId)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/account/profile?userId=" + userBId)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isForbidden());

        // 3. Concurrent wallet initialization on LIVE SQL Server (4 parallel calls)
        ExecutorService pool = Executors.newFixedThreadPool(4);
        List<Callable<ProgressionSnapshotDto>> calls = new ArrayList<>();
        for (int i = 0; i < 4; i++) {
            calls.add(() -> progressionService.getProgression(userAId));
        }
        List<Future<ProgressionSnapshotDto>> futures = pool.invokeAll(calls);
        for (Future<ProgressionSnapshotDto> f : futures) {
            ProgressionSnapshotDto snap = f.get(10, TimeUnit.SECONDS);
            assertEquals(3, snap.getSkillPoints());
            assertTrue(snap.getUnlockedHeroes().containsAll(List.of("warrior", "archer", "lancer")));
            assertFalse(snap.getUnlockedHeroes().contains("arcane_mage"));
        }
        pool.shutdown();

        // 4. Skill tree learn & upgrade + Loadout via HTTP JWT
        mockMvc.perform(post("/api/v1/progression/skills/learn")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"heroCode\":\"warrior\",\"skillCode\":\"earthbreaker\"}"))
                .andExpect(status().isBadRequest()); // Blocked by Stage 4 lock, SP untouched

        mockMvc.perform(post("/api/v1/progression/skills/upgrade")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"heroCode\":\"warrior\",\"skillCode\":\"knight_slash\"}"))
                .andExpect(status().isOk());

        ProgressionSnapshotDto afterUpgrade = progressionService.getProgression(userAId);
        assertEquals(2, afterUpgrade.getSkillPoints());
        assertEquals(2, afterUpgrade.getSkillLevels().get("knight_slash"));

        mockMvc.perform(put("/api/v1/progression/loadout")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"heroCode\":\"warrior\",\"activeSkillCodes\":[\"knight_slash\",\"heavy_slash\",\"royal_guard\",\"sacred_recovery\"],\"ultimateSkillCode\":\"lexical_judgment\"}"))
                .andExpect(status().isOk());

        // 5. Campaign Stage 2 locked vs Practice allowed + Practice never increments clearCount
        LexRaidSessionStartRequest lockedStart = new LexRaidSessionStartRequest();
        lockedStart.setUserId(userAId);
        lockedStart.setStageId(2L);
        lockedStart.setPlayMode("CAMPAIGN");
        assertThrows(IllegalArgumentException.class, () -> lexRaidService.startSession(lockedStart));

        LexRaidSessionStartRequest pracReq = new LexRaidSessionStartRequest();
        pracReq.setUserId(userAId);
        pracReq.setStageId(1L);
        pracReq.setPlayMode("PRACTICE");
        pracReq.setHeroCode("warrior");
        LexRaidSessionDto pracSession = lexRaidService.startSession(pracReq);
        assertEquals(5, pracSession.getTotalWaves());
        assertEquals(5, pracSession.getEncounterRoster().size());
        assertEquals("WAVE_SCOUT", pracSession.getCurrentEnemyCode());

        // User B trying to access User A's raid session -> HTTP 403 Forbidden
        mockMvc.perform(get("/api/v1/lex-raid/sessions/" + pracSession.getRaidSessionId())
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/v1/lex-raid/sessions/" + pracSession.getRaidSessionId() + "/cast-skill")
                        .header("Authorization", "Bearer " + tokenB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"skillCode\":\"knight_slash\",\"actionId\":\"intruder-1\"}"))
                .andExpect(status().isForbidden());

        // Practice win must NOT increment clearCount
        var rsPrac = raidSessionRepository.findById(pracSession.getRaidSessionId()).orElseThrow();
        rsPrac.setWaveIndex(5);
        rsPrac.setBossHpRemaining(0);
        rsPrac.setStatus("ACTIVE");
        raidSessionRepository.save(rsPrac);
        lexRaidService.finishSession(rsPrac.getRaidSessionId(), null, userAId);
        int pracClearCount = stageProgressRepository.findByUserUserIdAndStageStageId(userAId, 1L)
                .map(p -> p.getClearCount() != null ? p.getClearCount() : 0).orElse(0);
        assertEquals(0, pracClearCount, "Practice victory must not grant Campaign clearCount");

        // 6. Campaign real 5-wave session: cast-skill idempotency & sync round anti-tamper
        LexRaidSessionStartRequest campReq = new LexRaidSessionStartRequest();
        campReq.setUserId(userAId);
        campReq.setStageId(1L);
        campReq.setPlayMode("CAMPAIGN");
        campReq.setHeroCode("warrior");
        LexRaidSessionDto camp = lexRaidService.startSession(campReq);

        LexRaidSessionSyncRequest syncTamper = new LexRaidSessionSyncRequest();
        syncTamper.setCurrentRound(50);
        LexRaidSessionDto afterSync = lexRaidService.syncSession(camp.getRaidSessionId(), syncTamper, "MANUAL_SAVE", userAId);
        assertEquals(1, afterSync.getCurrentRound());

        LexRaidCastSkillRequest cast1 = new LexRaidCastSkillRequest();
        cast1.setUserId(userAId);
        cast1.setSkillCode("heavy_slash");
        cast1.setActionId("sql-cast-1");
        LexRaidActionResultDto cRes1 = lexRaidService.castSkill(camp.getRaidSessionId(), cast1);
        assertTrue(cRes1.isAccepted());
        LexRaidActionResultDto cReplay = lexRaidService.castSkill(camp.getRaidSessionId(), cast1);
        assertFalse(cReplay.isAccepted());
        assertTrue(cReplay.isReplayed());
        assertEquals(cRes1.getManaAfter(), cReplay.getManaAfter());
        assertTrue(skillCastEventRepository.findByRaidSessionRaidSessionIdAndActionId(camp.getRaidSessionId(), "sql-cast-1").isPresent());

        // 7. Mastery recall challenge persisted ID, single-use, and expiry in SQL Server
        VocabularyWord anyWord = vocabularyWordRepository.findTop40ByVocabularySetVocabularySetIdOrderByWordTextAsc(1L)
                .stream().findFirst().orElseGet(() -> vocabularyWordRepository.findAll().get(0));
        MasterySummaryDto.RecallChallengeDto ch = masteryService.generateRecallChallenge(userAId, anyWord.getWordId());
        assertNotNull(ch.getChallengeId());

        MasteryRecallRequest recReq = new MasteryRecallRequest();
        recReq.setUserId(userAId);
        recReq.setChallengeId(ch.getChallengeId());
        recReq.setWordId(anyWord.getWordId());
        recReq.setSelectedWord(anyWord.getWordText());
        MasterySummaryDto.RecallAttemptResultDto recOk = masteryService.submitRecallAttempt(recReq);
        assertTrue(recOk.isCorrect());
        assertTrue(recOk.isNewUniqueReview());

        // Reusing same challengeId -> single-use exception
        assertThrows(IllegalStateException.class, () -> masteryService.submitRecallAttempt(recReq));

        // Cross-user attempt on challenge -> SecurityException -> 403
        MasterySummaryDto.RecallChallengeDto ch2 = masteryService.generateRecallChallenge(userAId, anyWord.getWordId());
        mockMvc.perform(post("/api/v1/mastery/recall")
                        .header("Authorization", "Bearer " + tokenB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"challengeId\":\"" + ch2.getChallengeId() + "\",\"wordId\":" + anyWord.getWordId() + ",\"selectedWord\":\"" + anyWord.getWordText() + "\"}"))
                .andExpect(status().isForbidden());

        // Expired challenge
        MasteryRecallChallenge ch2Entity = challengeRepository.findById(ch2.getChallengeId()).orElseThrow();
        ch2Entity.setExpiresAt(LocalDateTime.now().minusSeconds(10));
        challengeRepository.save(ch2Entity);
        MasteryRecallRequest expReq = new MasteryRecallRequest();
        expReq.setUserId(userAId);
        expReq.setChallengeId(ch2.getChallengeId());
        expReq.setWordId(anyWord.getWordId());
        expReq.setSelectedWord(anyWord.getWordText());
        assertThrows(IllegalStateException.class, () -> masteryService.submitRecallAttempt(expReq));
    }

    private static String extractString(String json, String key) {
        Matcher m = Pattern.compile("\"" + key + "\"\\s*:\\s*\"([^\"]*)\"").matcher(json);
        return m.find() ? m.group(1) : null;
    }

    private static Long extractLong(String json, String key) {
        Matcher m = Pattern.compile("\"" + key + "\"\\s*:\\s*(\\d+)").matcher(json);
        return m.find() ? Long.parseLong(m.group(1)) : null;
    }
}
