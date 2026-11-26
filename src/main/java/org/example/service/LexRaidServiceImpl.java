package org.example.service;

import org.example.config.LexRaidBalanceConfig;
import org.example.dto.*;
import org.example.entity.*;
import org.example.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class LexRaidServiceImpl implements LexRaidService {

    private static final String ACTIVE_STATUS = "ACTIVE";
    private static final String IN_PROGRESS = "IN_PROGRESS";
    private static final String COMPLETED = "COMPLETED";
    private static final String FAILED = "FAILED";
    private static final String ABANDONED = "ABANDONED";
    private static final String CAMPAIGN = "CAMPAIGN";
    private static final String DEFAULT_BOARD_REASON = "MANUAL_SAVE";
    private static final String WON = "WON";
    private static final String LOST = "LOST";
    private static final String ENGLISH_LETTER_POOL =
            "EEEEEEEEEEEEAAAAAAAAAIIIIIIIIIOOOOOOOOUUUU" +
            "TTTTTTNNNNNNSSSSSRRRRRRHHHHLLLLDDDDCCCMMMPP" +
            "BBFFGGVWWKYYJXQZ";

    private final StageRepository stageRepository;
    private final StageObjectiveRepository stageObjectiveRepository;
    private final StageCoreWordRepository stageCoreWordRepository;
    private final VocabularyWordRepository vocabularyWordRepository;
    private final UserRepository userRepository;
    private final GameModeRepository gameModeRepository;
    private final GameSessionRepository gameSessionRepository;
    private final RaidSessionRepository raidSessionRepository;
    private final BoardSnapshotRepository boardSnapshotRepository;
    private final WordSubmitEventRepository wordSubmitEventRepository;
    private final CoreWordGuessEventRepository coreWordGuessEventRepository;
    private final UserWordMasteryRepository userWordMasteryRepository;
    private final UserStageProgressRepository userStageProgressRepository;
    private final BossRepository bossRepository;
    private final RpgProgressionService rpgProgressionService;
    private final EnglishLexiconService englishLexiconService;
    private final LexRaidBalanceConfig balanceConfig;

    public LexRaidServiceImpl(
            StageRepository stageRepository,
            StageObjectiveRepository stageObjectiveRepository,
            StageCoreWordRepository stageCoreWordRepository,
            VocabularyWordRepository vocabularyWordRepository,
            UserRepository userRepository,
            GameModeRepository gameModeRepository,
            GameSessionRepository gameSessionRepository,
            RaidSessionRepository raidSessionRepository,
            BoardSnapshotRepository boardSnapshotRepository,
            WordSubmitEventRepository wordSubmitEventRepository,
            CoreWordGuessEventRepository coreWordGuessEventRepository,
            UserWordMasteryRepository userWordMasteryRepository,
            UserStageProgressRepository userStageProgressRepository,
            BossRepository bossRepository,
            RpgProgressionService rpgProgressionService
    ) {
        this(
                stageRepository,
                stageObjectiveRepository,
                stageCoreWordRepository,
                vocabularyWordRepository,
                userRepository,
                gameModeRepository,
                gameSessionRepository,
                raidSessionRepository,
                boardSnapshotRepository,
                wordSubmitEventRepository,
                coreWordGuessEventRepository,
                userWordMasteryRepository,
                userStageProgressRepository,
                bossRepository,
                rpgProgressionService,
                new EnglishLexiconService(),
                new LexRaidBalanceConfig()
        );
    }

    @Autowired
    public LexRaidServiceImpl(
            StageRepository stageRepository,
            StageObjectiveRepository stageObjectiveRepository,
            StageCoreWordRepository stageCoreWordRepository,
            VocabularyWordRepository vocabularyWordRepository,
            UserRepository userRepository,
            GameModeRepository gameModeRepository,
            GameSessionRepository gameSessionRepository,
            RaidSessionRepository raidSessionRepository,
            BoardSnapshotRepository boardSnapshotRepository,
            WordSubmitEventRepository wordSubmitEventRepository,
            CoreWordGuessEventRepository coreWordGuessEventRepository,
            UserWordMasteryRepository userWordMasteryRepository,
            UserStageProgressRepository userStageProgressRepository,
            BossRepository bossRepository,
            RpgProgressionService rpgProgressionService,
            EnglishLexiconService englishLexiconService,
            LexRaidBalanceConfig balanceConfig
    ) {
        this.stageRepository = stageRepository;
        this.stageObjectiveRepository = stageObjectiveRepository;
        this.stageCoreWordRepository = stageCoreWordRepository;
        this.vocabularyWordRepository = vocabularyWordRepository;
        this.userRepository = userRepository;
        this.gameModeRepository = gameModeRepository;
        this.gameSessionRepository = gameSessionRepository;
        this.raidSessionRepository = raidSessionRepository;
        this.boardSnapshotRepository = boardSnapshotRepository;
        this.wordSubmitEventRepository = wordSubmitEventRepository;
        this.coreWordGuessEventRepository = coreWordGuessEventRepository;
        this.userWordMasteryRepository = userWordMasteryRepository;
        this.userStageProgressRepository = userStageProgressRepository;
        this.bossRepository = bossRepository;
        this.rpgProgressionService = rpgProgressionService;
        this.englishLexiconService = englishLexiconService != null ? englishLexiconService : new EnglishLexiconService();
        this.balanceConfig = balanceConfig != null ? balanceConfig : new LexRaidBalanceConfig();
    }

    @Override
    @Transactional(readOnly = true)
    public List<StageCardDto> getActiveStages() {
        return stageRepository.findByStatusOrderByChapterNoAscStageNoAsc(ACTIVE_STATUS).stream()
                .map(this::toStageCardDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public StageCardDto getStageDetail(Long stageId) {
        return toStageCardDto(getStageOrThrow(stageId));
    }

    @Override
    @Transactional(readOnly = true)
    public StageCardDto getRecommendedStage() {
        Stage stage = stageRepository.findFirstByStatusOrderByChapterNoAscStageNoAsc(ACTIVE_STATUS)
                .orElseThrow(() -> new IllegalArgumentException("Khong co stage active de de xuat"));
        return toStageCardDto(stage);
    }

    @Override
    @Transactional(readOnly = true)
    public LexRaidStageRuntimeDto getStageRuntime(Long stageId) {
        Stage stage = getStageOrThrow(stageId);
        List<StageObjective> objectives = stageObjectiveRepository.findByStageStageIdOrderBySortOrderAsc(stageId);
        List<StageCoreWord> coreWords = stageCoreWordRepository.findByStageStageIdOrderByRevealOrderAsc(stageId);
        Set<Long> solvedIds = parseSolvedCoreWordIds(null);
        StageCoreWord activeCoreWord = resolveActiveCoreWord(coreWords, solvedIds);
        int activeCoreIndex = resolveActiveCoreIndex(coreWords, activeCoreWord);
        List<VocabularyWord> rawVocabulary = vocabularyWordRepository.findTop40ByVocabularySetVocabularySetIdOrderByWordTextAsc(stage.getVocabularySet().getVocabularySetId());
        List<VocabularyWord> vocabulary = rawVocabulary.stream()
                .filter(this::isEnglishLexiconWord)
                .toList();
        List<String> topicWords = vocabulary.stream()
                .filter(w -> isBoardEligible(w.getWordText()))
                .map(VocabularyWord::getWordText)
                .limit(12)
                .toList();

        return LexRaidStageRuntimeDto.builder()
                .stage(toStageCardDto(stage))
                .topicCode(stage.getTopic() != null ? stage.getTopic().getCode() : null)
                .topicName(stage.getTopic() != null ? stage.getTopic().getName() : null)
                .vocabularySetTitle(stage.getVocabularySet().getTitle())
                .stageCoreWordId(activeCoreWord != null ? activeCoreWord.getStageCoreWordId() : null)
                .coreWord(activeCoreWord != null && activeCoreWord.getWord() != null ? activeCoreWord.getWord().getWordText() : null)
                .clueText(resolveClueText(activeCoreWord))
                .activeCoreIndex(activeCoreIndex)
                .activeStageCoreWordId(activeCoreWord != null ? activeCoreWord.getStageCoreWordId() : null)
                .activeCoreWord(activeCoreWord != null && activeCoreWord.getWord() != null ? activeCoreWord.getWord().getWordText() : null)
                .activeClueText(resolveClueText(activeCoreWord))
                .coreWords(toCoreWordDtos(coreWords, solvedIds))
                .objectives(objectives.stream().map(o -> StageObjectiveDto.builder()
                        .objectiveType(o.getObjectiveType())
                        .description(o.getDescription())
                        .targetValue(o.getTargetValue())
                        .sortOrder(o.getSortOrder())
                        .build()).toList())
                .topicWords(topicWords)
                .vocabulary(vocabulary.stream().map(this::toVocabularyWordDto).toList())
                .board(buildBoard(stage, vocabulary, activeCoreWord))
                .build();
    }

    @Override
    @Transactional
    public LexRaidSessionDto startSession(LexRaidSessionStartRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay user voi id = " + request.getUserId()));
        Stage stage = getStageOrThrow(request.getStageId());
        GameMode mode = gameModeRepository.findByGame_CodeAndCodeIgnoreCase(stage.getGame().getCode(), CAMPAIGN)
                .orElseGet(() -> gameModeRepository.findAll().stream()
                        .filter(gm -> gm.getGame().getGameId().equals(stage.getGame().getGameId()))
                        .findFirst()
                        .orElseThrow(() -> new IllegalArgumentException("Khong tim thay game mode cho stage nay")));

        GameSession gameSession = new GameSession();
        gameSession.setUser(user);
        gameSession.setGame(stage.getGame());
        gameSession.setGameMode(mode);
        gameSession.setContentPackage(stage.getVocabularySet().getContentPackage());
        gameSession.setSessionSeed(blankToNull(request.getSeed()));
        gameSession.setStatus(IN_PROGRESS);
        gameSession.setScoreTotal(0);
        gameSession.setXpEarned(0);
        gameSession.setCoinsEarned(0);
        gameSession.setMetadataJson("{\"source\":\"lex_raid\"}");
        gameSession = gameSessionRepository.save(gameSession);

        RaidSession raidSession = new RaidSession();
        raidSession.setGameSession(gameSession);
        raidSession.setStage(stage);
        raidSession.setStatus(ACTIVE_STATUS);
        raidSession.setSeed(blankToNull(request.getSeed()));
        raidSession.setCurrentRound(1);
        raidSession.setBossPhaseNo(1);
        
        List<Boss> allBosses = bossRepository.findAll();
        Boss selectedBoss = stage.getBoss();
        if (allBosses != null && !allBosses.isEmpty()) {
            Random random = new Random();
            selectedBoss = allBosses.get(random.nextInt(allBosses.size()));
        }
        
        raidSession.setBossHpRemaining(selectedBoss.getBaseHp());
        raidSession.setBossShieldRemaining(selectedBoss.getBaseShield());
        raidSession.setRageValue(0);
        raidSession.setComboCount(0);
        raidSession.setManaValue(0);
        raidSession.setTotalScore(0);
        raidSession.setClueProgressJson("[]");
        raidSession = raidSessionRepository.save(raidSession);

        saveInitialBoardSnapshot(raidSession, stage);

        return toSessionDto(raidSession);
    }

    @Override
    @Transactional(readOnly = true)
    public LexRaidSessionDto getSession(Long raidSessionId) {
        RaidSession raidSession = findSession(raidSessionId);
        return toSessionDto(raidSession);
    }

    @Override
    @Transactional
    public LexRaidSessionDto syncSession(Long raidSessionId, LexRaidSessionSyncRequest request, String reasonCode) {
        RaidSession raidSession = findSession(raidSessionId);
        if (isSessionClosed(raidSession)) {
            return toSessionDto(raidSession);
        }
        applySync(raidSession, request, false);
        return toSessionDto(raidSessionRepository.save(raidSession));
    }

    @Override
    @Transactional
    public LexRaidSessionDto finishSession(Long raidSessionId, LexRaidSessionSyncRequest request) {
        RaidSession raidSession = findSession(raidSessionId);
        if (isSessionClosed(raidSession)) {
            return toSessionDto(raidSession);
        }
        applySync(raidSession, request, true);
        finalizeGameSessionAndAward(raidSession, request != null ? request.getResultCode() : null, request != null ? request.getDurationSec() : null);
        return toSessionDto(raidSessionRepository.save(raidSession));
    }

    private boolean isSessionClosed(RaidSession raidSession) {
        if (raidSession == null) return true;
        if (WON.equalsIgnoreCase(raidSession.getStatus()) || LOST.equalsIgnoreCase(raidSession.getStatus())) {
            return true;
        }
        GameSession gs = raidSession.getGameSession();
        return gs != null && COMPLETED.equalsIgnoreCase(gs.getStatus());
    }

    @Override
    @Transactional
    public LexRaidActionResultDto submitWord(Long raidSessionId, LexRaidSubmitWordRequest request) {
        RaidSession raidSession = findSession(raidSessionId);
        if (isSessionClosed(raidSession)) {
            return LexRaidActionResultDto.builder()
                    .accepted(false)
                    .actionType("SUBMIT_WORD")
                    .submittedWord(request != null ? request.getSubmittedWord() : null)
                    .rejectionReason("Session da ket thuc, khong the thay doi ket qua")
                    .wordCategory("INVALID")
                    .raidStatus(raidSession.getStatus())
                    .session(toSessionDto(raidSession))
                    .build();
        }
        Stage stage = raidSession.getStage();
        String submittedRaw = request != null ? request.getSubmittedWord() : null;
        String normalizedWord = normalizeWord(submittedRaw);
        int length = normalizedWord.length();
        boolean isTwoLetterWhitelisted = length == LexRaidBalanceConfig.ABSOLUTE_MIN_WHITELIST_LENGTH
                && EnglishLexiconService.TWO_LETTER_COMMON_WHITELIST.contains(normalizedWord);
        boolean lengthValid = (length >= LexRaidBalanceConfig.MIN_WORD_LENGTH
                && length <= LexRaidBalanceConfig.MAX_WORD_LENGTH) || isTwoLetterWhitelisted;

        VocabularySet set = stage.getVocabularySet();
        List<StageCoreWord> coreWords = stageCoreWordRepository.findByStageStageIdOrderByRevealOrderAsc(stage.getStageId());
        Set<Long> solvedIds = parseSolvedCoreWordIds(raidSession.getClueProgressJson());
        StageCoreWord activeCoreWord = resolveActiveCoreWord(coreWords, solvedIds);
        List<VocabularyWord> vocabulary = set != null
                ? vocabularyWordRepository.findTop40ByVocabularySetVocabularySetIdOrderByWordTextAsc(set.getVocabularySetId())
                : List.of();

        List<List<String>> authoritativeBoard = resolveAuthoritativeBoard(raidSession, stage, vocabulary, activeCoreWord);
        List<WordPathTileDto> submittedPath = request != null ? request.getPath() : null;
        boolean hasPath = submittedPath != null && !submittedPath.isEmpty();
        boolean pathValid = hasPath && pathFormsWord(submittedPath, normalizedWord);
        boolean boardValid = pathValid && pathMatchesBoard(submittedPath, authoritativeBoard);

        Optional<VocabularyWord> matchedWordOpt = (set != null && lengthValid)
                ? vocabularyWordRepository.findByVocabularySetVocabularySetIdAndNormalizedText(set.getVocabularySetId(), normalizedWord)
                : Optional.empty();
        boolean alreadyUsed = lengthValid && wordSubmitEventRepository.findByRaidSessionRaidSessionIdAndIsValidTrue(raidSessionId).stream()
                .anyMatch(event -> Boolean.TRUE.equals(event.getIsValid()) && normalizeWord(event.getSubmittedWord()).equals(normalizedWord));

        boolean isTopicWord = matchedWordOpt.isPresent();
        boolean isGlobalWord = !isTopicWord && lengthValid && englishLexiconService.isValidEnglishWord(normalizedWord);
        boolean lexiconValid = isTopicWord || isGlobalWord;
        boolean valid = lengthValid && pathValid && boardValid && !alreadyUsed && lexiconValid;

        VocabularyWord matchedWord = matchedWordOpt.orElse(null);
        int oldCombo = defaultIfNull(raidSession.getComboCount(), 0);
        int chapterNo = stage.getChapterNo() != null ? stage.getChapterNo() : 1;
        int invalidComboAfter = chapterNo <= 1 ? Math.max(0, oldCombo / 2) : 0;
        int comboAfter = valid ? oldCombo + 1 : invalidComboAfter;
        boolean solvedCoreCandidate = valid && activeCoreWord != null && !solvedIds.contains(activeCoreWord.getStageCoreWordId())
                && ((matchedWord != null && activeCoreWord.getWord() != null && Objects.equals(activeCoreWord.getWord().getWordId(), matchedWord.getWordId()))
                || (activeCoreWord.getWord() != null && normalizeWord(activeCoreWord.getWord().getWordText()).equals(normalizedWord)));

        int baseScore = valid ? balanceConfig.resolveWordBaseScore(length, isTopicWord) : 0;
        int currentMana = defaultIfNull(raidSession.getManaValue(), 0);
        int rawManaGain = valid ? balanceConfig.computeManaGain(length, isTopicWord, solvedCoreCandidate) : 0;
        int manaAfter = valid ? balanceConfig.applyManaGainWithCap(currentMana, rawManaGain) : currentMana;
        int manaGain = Math.max(0, manaAfter - currentMana);
        int cluePoints = valid ? Math.max(1, length / 3) : 0;
        int baseDamage = valid ? balanceConfig.computeBaseDamage(length, comboAfter) : 0;
        int totalDamage = valid ? balanceConfig.computeTotalDamage(length, comboAfter, isTopicWord) : 0;
        int bonusDamage = Math.max(0, totalDamage - baseDamage);
        int shieldDamage = Math.min(defaultIfNull(raidSession.getBossShieldRemaining(), 0), totalDamage);
        int hpDamage = Math.max(0, totalDamage - shieldDamage);
        boolean solvedCoreBySubmit = false;
        boolean bossClearedAllWaves = false;

        if (valid) {
            raidSession.setBossShieldRemaining(defaultIfNull(raidSession.getBossShieldRemaining(), 0) - shieldDamage);
            raidSession.setBossHpRemaining(Math.max(0, defaultIfNull(raidSession.getBossHpRemaining(), 0) - hpDamage));
            raidSession.setComboCount(comboAfter);
            raidSession.setManaValue(manaAfter);
            raidSession.setRageValue(defaultIfNull(raidSession.getRageValue(), 0) + Math.max(1, length));
            raidSession.setTotalScore(defaultIfNull(raidSession.getTotalScore(), 0) + baseScore);

            if (solvedCoreCandidate) {
                raidSession.setClueProgressJson(appendCoreWordProgress(raidSession.getClueProgressJson(), activeCoreWord));
                solvedIds.add(activeCoreWord.getStageCoreWordId());
                solvedCoreBySubmit = true;
                raidSession.setBossHpRemaining(0);
            }

            if (matchedWord != null) {
                updateWordMastery(raidSession.getGameSession().getUser(), matchedWord, true, solvedCoreBySubmit);
            }
            updateStageWordProgress(raidSession, 1, solvedCoreBySubmit ? 1 : 0);

            if (raidSession.getBossHpRemaining() <= 0) {
                StageCoreWord nextWordCheck = resolveActiveCoreWord(coreWords, solvedIds);
                if (nextWordCheck == null) {
                    raidSession.setStatus(WON);
                    raidSession.setEndedAt(LocalDateTime.now());
                    bossClearedAllWaves = true;
                } else {
                    raidSession.setBossHpRemaining(stage.getBoss().getBaseHp());
                    raidSession.setBossShieldRemaining(stage.getBoss().getBaseShield());
                    if (!solvedCoreBySubmit && activeCoreWord != null) {
                        raidSession.setClueProgressJson(appendCoreWordProgress(raidSession.getClueProgressJson(), activeCoreWord));
                        solvedIds.add(activeCoreWord.getStageCoreWordId());
                    }
                }
            }
        } else {
            raidSession.setComboCount(invalidComboAfter);
            raidSession.setRageValue(defaultIfNull(raidSession.getRageValue(), 0) + 1);
        }

        String wordCategory = !valid
                ? "INVALID"
                : (solvedCoreBySubmit ? "CORE" : (isTopicWord ? "TOPIC" : "GLOBAL"));
        String rejectionReason = valid ? null : resolveWordRejectionReason(lengthValid, pathValid, boardValid, alreadyUsed);
        boolean hasMeaningCard = matchedWord != null
                && (blankToNull(matchedWord.getMeaningVi()) != null || blankToNull(matchedWord.getMeaningEn()) != null);

        WordSubmitEvent event = new WordSubmitEvent();
        event.setRaidSession(raidSession);
        event.setRoundNo(raidSession.getCurrentRound());
        event.setSubmittedWord(submittedRaw);
        event.setVocabularyWord(matchedWord);
        event.setWordType(wordCategory);
        event.setPathJson(toPathJson(submittedPath));
        event.setLengthValue(length);
        event.setBaseScore(baseScore);
        event.setDamageValue(totalDamage);
        event.setCluePoints(cluePoints);
        event.setManaGain(manaGain);
        event.setComboAfter(comboAfter);
        event.setIsValid(valid);
        event.setRejectionReason(rejectionReason);
        // MUST persist event BEFORE finalizeGameSessionAndAward so final killing blow counts in reward totals!
        wordSubmitEventRepository.save(event);

        if (bossClearedAllWaves) {
            finalizeGameSessionAndAward(raidSession, WON, null);
        }

        StageCoreWord nextActiveCoreWord = resolveActiveCoreWord(coreWords, solvedIds);
        int activeCoreIndex = resolveActiveCoreIndex(coreWords, nextActiveCoreWord);
        List<List<String>> nextBoard = valid ? buildBoard(stage, vocabulary, nextActiveCoreWord) : authoritativeBoard;
        if (valid && !bossClearedAllWaves) {
            LexRaidSessionSyncRequest serverSnapshot = new LexRaidSessionSyncRequest();
            serverSnapshot.setBoardJson(toBoardJson(nextBoard));
            serverSnapshot.setSelectedPathJson(toPathJson(submittedPath));
            serverSnapshot.setCurrentRound(raidSession.getCurrentRound());
            saveSnapshotIfPresent(raidSession, serverSnapshot, "POST_SUBMIT");
        }

        raidSessionRepository.save(raidSession);

        return LexRaidActionResultDto.builder()
                .accepted(valid)
                .actionType("SUBMIT_WORD")
                .submittedWord(submittedRaw)
                .normalizedWord(normalizedWord)
                .vocabularyWordId(matchedWord != null ? matchedWord.getWordId() : null)
                .damageDealt(hpDamage)
                .shieldDamage(shieldDamage)
                .manaGain(manaGain)
                .scoreGain(baseScore)
                .comboAfter(raidSession.getComboCount())
                .bossHpRemaining(raidSession.getBossHpRemaining())
                .bossShieldRemaining(raidSession.getBossShieldRemaining())
                .rageValue(raidSession.getRageValue())
                .raidStatus(raidSession.getStatus())
                .resultCode(raidSession.getGameSession() != null ? raidSession.getGameSession().getResultCode() : null)
                .rejectionReason(rejectionReason)
                .clueProgressJson(raidSession.getClueProgressJson())
                .unlockedClues(valid && matchedWord != null ? List.of(buildWordMeaning(matchedWord)) : List.of())
                .activeCoreIndex(activeCoreIndex)
                .activeStageCoreWordId(nextActiveCoreWord != null ? nextActiveCoreWord.getStageCoreWordId() : null)
                .activeCoreWord(nextActiveCoreWord != null && nextActiveCoreWord.getWord() != null ? nextActiveCoreWord.getWord().getWordText() : null)
                .activeClueText(resolveClueText(nextActiveCoreWord))
                .coreSolved(solvedCoreBySubmit)
                .wordCategory(wordCategory)
                .topicBonusApplied(valid && isTopicWord)
                .bonusDamage(bonusDamage)
                .manaAfter(manaAfter)
                .hasMeaningCard(hasMeaningCard)
                .coreWords(toCoreWordDtos(coreWords, solvedIds))
                .board(nextBoard)
                .session(toSessionDto(raidSession))
                .build();
    }

    @Override
    @Transactional
    public LexRaidActionResultDto guessCoreWord(Long raidSessionId, LexRaidGuessCoreWordRequest request) {
        RaidSession raidSession = findSession(raidSessionId);
        if (isSessionClosed(raidSession)) {
            return LexRaidActionResultDto.builder()
                    .accepted(false)
                    .actionType("GUESS_CORE_WORD")
                    .submittedWord(request != null ? request.getGuessedWord() : null)
                    .rejectionReason("Session da ket thuc, khong the doan them")
                    .raidStatus(raidSession.getStatus())
                    .session(toSessionDto(raidSession))
                    .build();
        }
        Stage stage = raidSession.getStage();
        List<StageCoreWord> coreWords = stageCoreWordRepository.findByStageStageIdOrderByRevealOrderAsc(stage.getStageId());
        Set<Long> solvedIds = parseSolvedCoreWordIds(raidSession.getClueProgressJson());
        StageCoreWord stageCoreWord = resolveActiveCoreWord(coreWords, solvedIds);

        if (stageCoreWord == null) {
            return LexRaidActionResultDto.builder()
                    .accepted(false)
                    .actionType("GUESS_CORE_WORD")
                    .submittedWord(request.getGuessedWord())
                    .normalizedWord(normalizeWord(request.getGuessedWord()))
                    .rejectionReason("Khong con core word nao chua giai trong stage nay")
                    .clueProgressJson(raidSession.getClueProgressJson())
                    .coreWords(toCoreWordDtos(coreWords, solvedIds))
                    .session(toSessionDto(raidSession))
                    .build();
        }

        String expected = normalizeWord(stageCoreWord.getWord().getWordText());
        String guessed = normalizeWord(request.getGuessedWord());
        boolean correct = expected.equals(guessed);
        int rewardDamage = correct ? Math.max(20, defaultIfNull(stageCoreWord.getBonusDamage(), 0)) : 0;
        int penalty = correct ? 0 : 5;
        boolean finalizeWonNow = false;

        if (correct) {
            raidSession.setBossShieldRemaining(0);
            raidSession.setBossHpRemaining(0);
            raidSession.setTotalScore(defaultIfNull(raidSession.getTotalScore(), 0) + rewardDamage + defaultIfNull(stageCoreWord.getBonusXp(), 0));
            raidSession.setClueProgressJson(appendCoreWordProgress(raidSession.getClueProgressJson(), stageCoreWord));
            solvedIds.add(stageCoreWord.getStageCoreWordId());
            updateWordMastery(raidSession.getGameSession().getUser(), stageCoreWord.getWord(), true, true);
            updateStageWordProgress(raidSession, 0, 1);

            StageCoreWord nextWordCheck = resolveActiveCoreWord(coreWords, solvedIds);
            if (nextWordCheck == null) {
                raidSession.setStatus(WON);
                raidSession.setEndedAt(LocalDateTime.now());
                finalizeWonNow = true;
            } else {
                raidSession.setBossHpRemaining(stage.getBoss().getBaseHp());
                raidSession.setBossShieldRemaining(stage.getBoss().getBaseShield());
            }
        } else {
            raidSession.setBossShieldRemaining(Math.max(0, defaultIfNull(raidSession.getBossShieldRemaining(), 0) + penalty));
            raidSession.setComboCount(0);
        }

        CoreWordGuessEvent event = new CoreWordGuessEvent();
        event.setRaidSession(raidSession);
        event.setRoundNo(raidSession.getCurrentRound());
        event.setStageCoreWord(stageCoreWord);
        event.setGuessedWord(request.getGuessedWord());
        event.setIsCorrect(correct);
        event.setPenaltyValue(penalty);
        event.setRewardDamage(rewardDamage);
        // Save CoreWordGuessEvent BEFORE finalizeGameSessionAndAward so killing Core Word score counts in rewards!
        coreWordGuessEventRepository.save(event);

        if (finalizeWonNow) {
            finalizeGameSessionAndAward(raidSession, WON, null);
        }

        raidSessionRepository.save(raidSession);
        StageCoreWord nextActiveCoreWord = resolveActiveCoreWord(coreWords, solvedIds);
        int activeCoreIndex = resolveActiveCoreIndex(coreWords, nextActiveCoreWord);
        VocabularySet set = stage.getVocabularySet();
        List<VocabularyWord> vocabulary = set != null
                ? vocabularyWordRepository.findTop40ByVocabularySetVocabularySetIdOrderByWordTextAsc(set.getVocabularySetId())
                : List.of();
        List<List<String>> currentAuthoritativeBoard = resolveAuthoritativeBoard(raidSession, stage, vocabulary, stageCoreWord);
        long nextSeedSalt = solvedIds.size() * 31L + defaultIfNull(raidSession.getCurrentRound(), 1);
        List<List<String>> nextBoard = (correct && !finalizeWonNow)
                ? buildBoard(stage, vocabulary, nextActiveCoreWord, nextSeedSalt)
                : currentAuthoritativeBoard;
        if (correct && !finalizeWonNow) {
            LexRaidSessionSyncRequest serverSnapshot = new LexRaidSessionSyncRequest();
            serverSnapshot.setBoardJson(toBoardJson(nextBoard));
            serverSnapshot.setCurrentRound(raidSession.getCurrentRound());
            saveSnapshotIfPresent(raidSession, serverSnapshot, "POST_CORE_GUESS");
        }
        return LexRaidActionResultDto.builder()
                .accepted(correct)
                .actionType("GUESS_CORE_WORD")
                .submittedWord(request.getGuessedWord())
                .normalizedWord(guessed)
                .vocabularyWordId(stageCoreWord.getWord().getWordId())
                .damageDealt(correct ? rewardDamage : 0)
                .shieldDamage(correct ? 0 : penalty)
                .manaGain(0)
                .scoreGain(correct ? rewardDamage + defaultIfNull(stageCoreWord.getBonusXp(), 0) : 0)
                .comboAfter(raidSession.getComboCount())
                .bossHpRemaining(raidSession.getBossHpRemaining())
                .bossShieldRemaining(raidSession.getBossShieldRemaining())
                .rageValue(raidSession.getRageValue())
                .raidStatus(raidSession.getStatus())
                .resultCode(raidSession.getGameSession().getResultCode())
                .rejectionReason(correct ? null : "Core word chua dung")
                .clueProgressJson(raidSession.getClueProgressJson())
                .unlockedClues(correct ? List.of(buildWordMeaning(stageCoreWord.getWord())) : List.of())
                .activeCoreIndex(activeCoreIndex)
                .activeStageCoreWordId(nextActiveCoreWord != null ? nextActiveCoreWord.getStageCoreWordId() : null)
                .activeCoreWord(nextActiveCoreWord != null && nextActiveCoreWord.getWord() != null ? nextActiveCoreWord.getWord().getWordText() : null)
                .activeClueText(resolveClueText(nextActiveCoreWord))
                .coreSolved(correct)
                .coreWords(toCoreWordDtos(coreWords, solvedIds))
                .board(nextBoard)
                .session(toSessionDto(raidSession))
                .build();
    }

    private void finalizeGameSessionAndAward(RaidSession raidSession, String incomingResultCode, Integer incomingDurationSec) {
        GameSession gameSession = raidSession.getGameSession();
        if (gameSession == null) {
            return;
        }

        // PESSIMISTIC LOCK: Lock game session row to serialize concurrent completion calls
        GameSession lockedGameSession = gameSession;
        if (gameSession.getGameSessionId() != null) {
            lockedGameSession = gameSessionRepository.findByIdForUpdate(gameSession.getGameSessionId())
                    .orElse(gameSession);
        }

        // STRICT IDEMPOTENCY: If session is already COMPLETED, skip duplicate
        if (COMPLETED.equalsIgnoreCase(lockedGameSession.getStatus())) {
            return;
        }

        // Calculate verified score from saved backend events
        int wordScore = wordSubmitEventRepository.findByRaidSessionRaidSessionIdAndIsValidTrue(raidSession.getRaidSessionId())
                .stream()
                .mapToInt(e -> defaultIfNull(e.getBaseScore(), 0))
                .sum();

        int guessScore = coreWordGuessEventRepository.findByRaidSessionRaidSessionIdAndIsCorrectTrue(raidSession.getRaidSessionId())
                .stream()
                .mapToInt(e -> defaultIfNull(e.getRewardDamage(), 0) + (e.getStageCoreWord() != null ? defaultIfNull(e.getStageCoreWord().getBonusXp(), 0) : 0))
                .sum();

        int verifiedScore = wordScore + guessScore;
        // Keep raidSession.totalScore synchronized with verified backend events
        raidSession.setTotalScore(verifiedScore);

        // Verify win condition from backend state: only WON if boss was defeated on backend
        boolean verifiedWon = WON.equalsIgnoreCase(raidSession.getStatus())
                || (defaultIfNull(raidSession.getBossHpRemaining(), 1) <= 0);

        String resultCode = verifiedWon ? WON : LOST;

        lockedGameSession.setStatus(COMPLETED);
        lockedGameSession.setResultCode(resultCode);
        lockedGameSession.setEndedAt(LocalDateTime.now());
        lockedGameSession.setDurationSec(resolveDurationSec(lockedGameSession.getStartedAt(), incomingDurationSec));
        lockedGameSession.setScoreTotal(verifiedScore);

        // Only award rewards if there was verified gameplay activity (verifiedScore > 0 or verifiedWon)
        int xpReward = 0;
        int coinReward = 0;
        if (verifiedScore > 0 || verifiedWon) {
            xpReward = rpgProgressionService.calculateLexRaidXp(verifiedWon, verifiedScore);
            coinReward = rpgProgressionService.calculateLexRaidCoins(verifiedWon, verifiedScore);
        }

        lockedGameSession.setXpEarned(xpReward);
        lockedGameSession.setCoinsEarned(coinReward);
        gameSessionRepository.save(lockedGameSession);

        if (gameSession != lockedGameSession) {
            gameSession.setStatus(COMPLETED);
            gameSession.setResultCode(resultCode);
            gameSession.setScoreTotal(verifiedScore);
            gameSession.setXpEarned(xpReward);
            gameSession.setCoinsEarned(coinReward);
        }

        // Update User stats with atomic locking inside applyReward
        User user = lockedGameSession.getUser();
        if (user != null && (xpReward > 0 || coinReward > 0)) {
            rpgProgressionService.applyReward(user, xpReward, coinReward);
        }

        // Increment clearCount or failCount exactly once on completion
        updateStageProgressOnCompletion(raidSession, verifiedWon);
    }

    private void applySync(RaidSession raidSession, LexRaidSessionSyncRequest request, boolean markFinished) {
        if (request == null) return;
        // Authoritative backend owns currentRound & clueProgressJson; only increment round safely by +1 at most when unclosed
        int curRound = defaultIfNull(raidSession.getCurrentRound(), 1);
        if (request.getCurrentRound() != null && request.getCurrentRound() == curRound + 1) {
            raidSession.setCurrentRound(curRound + 1);
        }
        if (markFinished) {
            boolean verifiedWon = WON.equalsIgnoreCase(raidSession.getStatus())
                    || (defaultIfNull(raidSession.getBossHpRemaining(), 1) <= 0);
            raidSession.setStatus(verifiedWon ? WON : LOST);
            raidSession.setEndedAt(LocalDateTime.now());
        }
    }

    private void saveSnapshotIfPresent(RaidSession raidSession, LexRaidSessionSyncRequest request, String reasonCode) {
        if (blankToNull(request.getBoardJson()) == null) {
            return;
        }
        BoardSnapshot snapshot = new BoardSnapshot();
        snapshot.setRaidSession(raidSession);
        snapshot.setRoundNo(defaultIfNull(request.getCurrentRound(), raidSession.getCurrentRound()));
        snapshot.setSnapshotNo((int) boardSnapshotRepository.countByRaidSessionRaidSessionId(raidSession.getRaidSessionId()) + 1);
        snapshot.setBoardJson(request.getBoardJson());
        snapshot.setSelectedPathJson(blankToNull(request.getSelectedPathJson()));
        snapshot.setReasonCode(reasonCode);
        boardSnapshotRepository.save(snapshot);
    }

    private void updateWordMastery(User user, VocabularyWord word, boolean found, boolean guessed) {
        if (user == null || word == null) return;
        UserWordMastery mastery = userWordMasteryRepository.findByUserUserIdAndWordWordId(user.getUserId(), word.getWordId())
                .orElseGet(() -> {
                    UserWordMastery created = new UserWordMastery();
                    created.setUser(user);
                    created.setWord(word);
                    created.setTimesSeen(0);
                    created.setTimesFound(0);
                    created.setTimesGuessed(0);
                    created.setTimesReviewed(0);
                    created.setTimesAnsweredCorrect(0);
                    created.setMasteryScore(BigDecimal.ZERO);
                    created.setWeaknessScore(BigDecimal.ZERO);
                    created.setMasteryState("UNSEEN");
                    return created;
                });
        mastery.setTimesSeen(defaultIfNull(mastery.getTimesSeen(), 0) + 1);
        if (found) {
            mastery.setTimesFound(defaultIfNull(mastery.getTimesFound(), 0) + 1);
            mastery.setLastFoundAt(LocalDateTime.now());
        }
        if (guessed) {
            mastery.setTimesGuessed(defaultIfNull(mastery.getTimesGuessed(), 0) + 1);
        }
        mastery.setLastSeenAt(LocalDateTime.now());
        int score = defaultIfNull(mastery.getMasteryScore() != null ? mastery.getMasteryScore().intValue() : null, 0) + (found ? 8 : 0) + (guessed ? 12 : 0);
        mastery.setMasteryScore(BigDecimal.valueOf(score));
        mastery.setMasteryState(score >= 50 ? "MASTERED" : guessed ? "GUESSED" : found ? "FOUND" : "SEEN");
        if (score >= 50 && mastery.getLastMasteredAt() == null) {
            mastery.setLastMasteredAt(LocalDateTime.now());
        }
        userWordMasteryRepository.save(mastery);
    }

    private UserStageProgress getOrCreateStageProgress(User user, Stage stage) {
        return userStageProgressRepository.findByUserUserIdAndStageStageId(user.getUserId(), stage.getStageId())
                .orElseGet(() -> {
                    UserStageProgress created = new UserStageProgress();
                    created.setUser(user);
                    created.setStage(stage);
                    created.setBestScore(0);
                    created.setClearCount(0);
                    created.setFailCount(0);
                    created.setStarsEarned(0);
                    created.setHighestCombo(0);
                    created.setTotalWordsFound(0);
                    created.setTotalCoreWordsGuessed(0);
                    return created;
                });
    }

    private void updateStageWordProgress(RaidSession raidSession, int wordsFoundDelta, int coreWordsGuessedDelta) {
        User user = raidSession.getGameSession().getUser();
        Stage stage = raidSession.getStage();
        UserStageProgress progress = getOrCreateStageProgress(user, stage);
        progress.setBestScore(Math.max(defaultIfNull(progress.getBestScore(), 0), defaultIfNull(raidSession.getTotalScore(), 0)));
        progress.setHighestCombo(Math.max(defaultIfNull(progress.getHighestCombo(), 0), defaultIfNull(raidSession.getComboCount(), 0)));
        progress.setTotalWordsFound(defaultIfNull(progress.getTotalWordsFound(), 0) + wordsFoundDelta);
        progress.setTotalCoreWordsGuessed(defaultIfNull(progress.getTotalCoreWordsGuessed(), 0) + coreWordsGuessedDelta);
        progress.setLastPlayedAt(LocalDateTime.now());
        userStageProgressRepository.save(progress);
    }

    private void updateStageProgressOnCompletion(RaidSession raidSession, boolean won) {
        User user = raidSession.getGameSession().getUser();
        Stage stage = raidSession.getStage();
        UserStageProgress progress = getOrCreateStageProgress(user, stage);
        progress.setBestScore(Math.max(defaultIfNull(progress.getBestScore(), 0), defaultIfNull(raidSession.getTotalScore(), 0)));
        progress.setHighestCombo(Math.max(defaultIfNull(progress.getHighestCombo(), 0), defaultIfNull(raidSession.getComboCount(), 0)));
        progress.setLastPlayedAt(LocalDateTime.now());

        if (won) {
            progress.setClearCount(defaultIfNull(progress.getClearCount(), 0) + 1);
            progress.setLastResult(WON);
            int newStars = resolveStars(raidSession);
            progress.setStarsEarned(Math.max(defaultIfNull(progress.getStarsEarned(), 0), newStars));
            if (progress.getFirstClearedAt() == null) {
                progress.setFirstClearedAt(LocalDateTime.now());
            }
        } else {
            progress.setFailCount(defaultIfNull(progress.getFailCount(), 0) + 1);
            progress.setLastResult(LOST);
        }
        userStageProgressRepository.save(progress);
    }

    private int resolveStars(RaidSession raidSession) {
        int score = defaultIfNull(raidSession.getTotalScore(), 0);
        if (score >= 300) return 3;
        if (score >= 180) return 2;
        return 1;
    }

    private boolean pathFormsWord(List<WordPathTileDto> path, String normalizedWord) {
        if (path == null || path.isEmpty()) return false;
        StringBuilder sb = new StringBuilder();
        Set<String> seen = new HashSet<>();
        for (WordPathTileDto tile : path) {
            if (tile == null || tile.getRow() == null || tile.getCol() == null || blankToNull(tile.getValue()) == null) {
                return false;
            }
            if (tile.getRow() < 0 || tile.getCol() < 0) {
                return false;
            }
            String key = tile.getRow() + ":" + tile.getCol();
            if (!seen.add(key)) return false;
            sb.append(normalizeWord(tile.getValue()));
        }
        return sb.toString().equals(normalizedWord);
    }

    private boolean pathMatchesBoard(List<WordPathTileDto> path, List<List<String>> board) {
        if (path == null || path.isEmpty() || board == null || board.isEmpty()) {
            return false;
        }
        for (WordPathTileDto tile : path) {
            int r = tile.getRow();
            int c = tile.getCol();
            if (r < 0 || r >= board.size()) {
                return false;
            }
            List<String> row = board.get(r);
            if (row == null || c < 0 || c >= row.size()) {
                return false;
            }
            String cellLetter = normalizeWord(row.get(c));
            String tileLetter = normalizeWord(tile.getValue());
            if (cellLetter.isEmpty() || !cellLetter.equals(tileLetter)) {
                return false;
            }
        }
        return true;
    }

    private String resolveWordRejectionReason(boolean lengthValid, boolean pathValid, boolean boardValid, boolean alreadyUsed) {
        if (!lengthValid) return "Tu phai co do dai tu 3 den 12 ky tu";
        if (!pathValid) return "Duong chon o chu khong hop le hoac bi trung o";
        if (!boardValid) return "O chu khong khop voi bang hien tai";
        if (alreadyUsed) return "Word da duoc dung trong tran nay";
        return "Tu khong co trong tu dien tieng Anh";
    }

    private void saveInitialBoardSnapshot(RaidSession raidSession, Stage stage) {
        if (raidSession == null || raidSession.getRaidSessionId() == null || stage == null) {
            return;
        }
        List<StageCoreWord> coreWords = stageCoreWordRepository.findByStageStageIdOrderByRevealOrderAsc(stage.getStageId());
        StageCoreWord activeCoreWord = resolveActiveCoreWord(coreWords, Set.of());
        VocabularySet set = stage.getVocabularySet();
        List<VocabularyWord> vocab = set != null
                ? vocabularyWordRepository.findTop40ByVocabularySetVocabularySetIdOrderByWordTextAsc(set.getVocabularySetId())
                : List.of();
        List<List<String>> initialBoard = buildBoard(stage, vocab, activeCoreWord);

        LexRaidSessionSyncRequest initSync = new LexRaidSessionSyncRequest();
        initSync.setBoardJson(toBoardJson(initialBoard));
        initSync.setCurrentRound(1);
        saveSnapshotIfPresent(raidSession, initSync, "SESSION_START");
    }

    private List<List<String>> resolveAuthoritativeBoard(
            RaidSession raidSession,
            Stage stage,
            List<VocabularyWord> vocabulary,
            StageCoreWord activeCoreWord
    ) {
        if (raidSession != null && raidSession.getRaidSessionId() != null) {
            Optional<BoardSnapshot> latestSnapshot = boardSnapshotRepository
                    .findTopByRaidSessionRaidSessionIdOrderBySnapshotNoDesc(raidSession.getRaidSessionId());
            if (latestSnapshot.isPresent()) {
                List<List<String>> parsed = parseBoardJson(latestSnapshot.get().getBoardJson());
                if (!parsed.isEmpty()) {
                    return parsed;
                }
            }
        }
        return buildBoard(stage, vocabulary, activeCoreWord);
    }

    private List<List<String>> parseBoardJson(String boardJson) {
        String clean = blankToNull(boardJson);
        if (clean == null) {
            return List.of();
        }
        List<List<String>> rows = new ArrayList<>();
        Matcher rowMatcher = Pattern.compile("\\[([^\\[\\]]+)\\]").matcher(clean);
        while (rowMatcher.find()) {
            String rowContent = rowMatcher.group(1);
            Matcher tokenMatcher = Pattern.compile("\"([^\"]+)\"|([A-Za-z]+)").matcher(rowContent);
            List<String> row = new ArrayList<>();
            while (tokenMatcher.find()) {
                String token = tokenMatcher.group(1) != null ? tokenMatcher.group(1) : tokenMatcher.group(2);
                String norm = normalizeWord(token);
                if (!norm.isEmpty()) {
                    row.add(norm);
                }
            }
            if (!row.isEmpty()) {
                rows.add(row);
            }
        }
        return rows;
    }

    private String toBoardJson(List<List<String>> board) {
        if (board == null || board.isEmpty()) {
            return "[]";
        }
        StringBuilder sb = new StringBuilder("[");
        for (int r = 0; r < board.size(); r++) {
            if (r > 0) sb.append(',');
            sb.append('[');
            List<String> row = board.get(r);
            if (row != null) {
                for (int c = 0; c < row.size(); c++) {
                    if (c > 0) sb.append(',');
                    sb.append('"').append(escapeJson(row.get(c))).append('"');
                }
            }
            sb.append(']');
        }
        sb.append(']');
        return sb.toString();
    }

    private String appendCoreWordProgress(String currentJson, StageCoreWord coreWord) {
        if (coreWord == null || coreWord.getStageCoreWordId() == null) {
            return blankToNull(currentJson) != null ? currentJson : "[]";
        }
        Set<Long> solvedIds = parseSolvedCoreWordIds(currentJson);
        if (!solvedIds.add(coreWord.getStageCoreWordId())) {
            return isCoreProgressPayload(currentJson) ? currentJson : "[]";
        }
        StringBuilder sb = new StringBuilder("[");
        boolean first = true;
        for (Long id : solvedIds) {
            if (!first) sb.append(',');
            first = false;
            sb.append("{\"stageCoreWordId\":").append(id).append('}');
        }
        sb.append(']');
        return sb.toString();
    }

    private boolean isCoreProgressPayload(String value) {
        String normalized = blankToNull(value);
        if (normalized == null) {
            return false;
        }
        String trimmed = normalized.trim();
        return "[]".equals(trimmed) || (trimmed.startsWith("[") && trimmed.contains("stageCoreWordId"));
    }

    private Set<Long> parseSolvedCoreWordIds(String currentJson) {
        Set<Long> solvedIds = new LinkedHashSet<>();
        String normalized = blankToNull(currentJson);
        if (normalized == null) {
            return solvedIds;
        }
        Matcher matcher = Pattern.compile("\"stageCoreWordId\"\\s*:\\s*(\\d+)").matcher(normalized);
        while (matcher.find()) {
            solvedIds.add(Long.parseLong(matcher.group(1)));
        }
        return solvedIds;
    }

    private StageCoreWord resolveActiveCoreWord(List<StageCoreWord> coreWords, Set<Long> solvedIds) {
        if (coreWords == null || coreWords.isEmpty()) {
            return null;
        }
        for (StageCoreWord coreWord : coreWords) {
            if (coreWord != null && coreWord.getStageCoreWordId() != null && !solvedIds.contains(coreWord.getStageCoreWordId())) {
                return coreWord;
            }
        }
        return null;
    }

    private int resolveActiveCoreIndex(List<StageCoreWord> coreWords, StageCoreWord activeCoreWord) {
        if (coreWords == null || coreWords.isEmpty()) {
            return 0;
        }
        if (activeCoreWord == null || activeCoreWord.getStageCoreWordId() == null) {
            return Math.max(0, coreWords.size() - 1);
        }
        for (int i = 0; i < coreWords.size(); i++) {
            StageCoreWord entry = coreWords.get(i);
            if (entry != null && Objects.equals(entry.getStageCoreWordId(), activeCoreWord.getStageCoreWordId())) {
                return i;
            }
        }
        return 0;
    }

    private List<LexRaidCoreWordDto> toCoreWordDtos(List<StageCoreWord> coreWords, Set<Long> solvedIds) {
        if (coreWords == null || coreWords.isEmpty()) {
            return List.of();
        }
        return coreWords.stream().map(entry -> LexRaidCoreWordDto.builder()
                .stageCoreWordId(entry.getStageCoreWordId())
                .revealOrder(entry.getRevealOrder())
                .coreWord(entry.getWord() != null ? entry.getWord().getWordText() : null)
                .clueText(resolveClueText(entry))
                .solved(entry.getStageCoreWordId() != null && solvedIds.contains(entry.getStageCoreWordId()))
                .build()).toList();
    }

    private String resolveClueText(StageCoreWord coreWord) {
        return coreWord != null && blankToNull(coreWord.getClueTextOverride()) != null
                ? coreWord.getClueTextOverride()
                : buildFallbackClue(coreWord);
    }

    private RaidSession findSession(Long raidSessionId) {
        return raidSessionRepository.findById(raidSessionId)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay raid session voi id = " + raidSessionId));
    }

    private String resolveGameSessionStatus(String raidStatus) {
        if (raidStatus == null) return IN_PROGRESS;
        return switch (raidStatus.toUpperCase(Locale.ROOT)) {
            case WON -> COMPLETED;
            case LOST -> FAILED;
            case ABANDONED -> ABANDONED;
            default -> IN_PROGRESS;
        };
    }

    private int resolveDurationSec(LocalDateTime startedAt, Integer incomingDuration) {
        if (incomingDuration != null && incomingDuration >= 0) return incomingDuration;
        if (startedAt == null) return 0;
        return (int) Math.max(0, Duration.between(startedAt, LocalDateTime.now()).getSeconds());
    }

    private Stage getStageOrThrow(Long stageId) {
        return stageRepository.findById(stageId)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay stage voi id = " + stageId));
    }

    private StageCardDto toStageCardDto(Stage stage) {
        List<Boss> allBosses = bossRepository.findAll();
        Boss boss = stage.getBoss();
        if (allBosses != null && !allBosses.isEmpty()) {
            Random random = new Random(stage.getStageId() != null ? stage.getStageId() + 99L : 42L);
            boss = allBosses.get(random.nextInt(allBosses.size()));
        }
        return StageCardDto.builder()
                .stageId(stage.getStageId())
                .code(stage.getCode())
                .chapterNo(stage.getChapterNo())
                .stageNo(stage.getStageNo())
                .name(stage.getName())
                .difficulty(stage.getDifficulty())
                .boardRows(stage.getBoardRows())
                .boardCols(stage.getBoardCols())
                .turnLimit(stage.getTurnLimit())
                .timePerRoundSec(stage.getTimePerRoundSec())
                .description(stage.getDescription())
                .boss(BossSummaryDto.builder()
                        .bossId(boss.getBossId())
                        .code(boss.getCode())
                        .name(boss.getName())
                        .avatarUrl(boss.getAvatarUrl())
                        .baseHp(boss.getBaseHp())
                        .baseShield(boss.getBaseShield())
                        .rageThreshold(boss.getRageThreshold())
                        .elementType(boss.getElementType())
                        .build())
                .build();
    }

    private VocabularyWordDto toVocabularyWordDto(VocabularyWord word) {
        String pos = standardizePos(word.getPartOfSpeech());
        boolean eligible = isBoardEligible(word.getWordText());
        String topicCode = (word.getVocabularySet() != null && word.getVocabularySet().getTopic() != null)
                ? word.getVocabularySet().getTopic().getCode()
                : "GENERAL";
        String tier = mapTier(word.getVocabularySet() != null ? word.getVocabularySet().getDifficulty() : null);

        return VocabularyWordDto.builder()
                .wordId(word.getWordId())
                .wordText(word.getWordText())
                .normalizedText(word.getNormalizedText())
                .partOfSpeech(pos)
                .meaningVi(word.getMeaningVi())
                .meaningEn(word.getMeaningEn() != null && !word.getMeaningEn().isBlank() ? word.getMeaningEn() : null)
                .levelCefr(word.getLevelCefr())
                .itDomain(topicCode)
                .itTier(tier)
                .boardEligible(eligible)
                .build();
    }

    private boolean isEnglishLexiconWord(VocabularyWord word) {
        if (word == null || word.getWordText() == null) return false;
        String text = word.getWordText().trim();
        return text.matches("^[A-Za-z\\s\\-]+$");
    }

    private boolean isBoardEligible(String wordText) {
        if (wordText == null) return false;
        String trimmed = wordText.trim();
        if (trimmed.length() < 3 || trimmed.length() > 10) return false;
        return trimmed.matches("^[A-Za-z]+$");
    }

    private char getRandomEnglishLetter(Random random) {
        return ENGLISH_LETTER_POOL.charAt(random.nextInt(ENGLISH_LETTER_POOL.length()));
    }

    private String standardizePos(String rawPos) {
        if (rawPos == null || rawPos.isBlank()) return "noun";
        String cleaned = rawPos.trim().toLowerCase(Locale.ROOT);
        return switch (cleaned) {
            case "n.", "n", "noun" -> "noun";
            case "v.", "v", "verb" -> "verb";
            case "adj.", "adj", "adjective" -> "adjective";
            case "adv.", "adv", "adverb" -> "adverb";
            case "prep.", "prep", "preposition" -> "preposition";
            case "conj.", "conj", "conjunction" -> "conjunction";
            case "phr.", "phrase", "idiom" -> "phrase";
            default -> cleaned;
        };
    }

    private String mapTier(String difficulty) {
        if (difficulty == null) return "Foundation";
        return switch (difficulty.trim().toUpperCase(Locale.ROOT)) {
            case "EXPERT", "SPECIALIST" -> "Specialist";
            case "HARD", "ADVANCED" -> "Advanced";
            case "MEDIUM", "INTERMEDIATE", "PRACTITIONER" -> "Practitioner";
            default -> "Foundation";
        };
    }

    private String buildFallbackClue(StageCoreWord coreWord) {
        if (coreWord == null || coreWord.getWord() == null) {
            return "Hay tao topic words de lo dan core word cua man choi.";
        }
        VocabularyWord word = coreWord.getWord();
        String pos = word.getPartOfSpeech() != null ? word.getPartOfSpeech() : "Word";
        String meaning = word.getMeaningVi() != null ? word.getMeaningVi() : word.getMeaningEn();
        return pos + " - " + (meaning != null ? meaning : "Mo them clue bang cach tao tu dung chu de.");
    }

    private List<List<String>> buildBoard(Stage stage, List<VocabularyWord> vocabulary, StageCoreWord coreWord) {
        return buildBoard(stage, vocabulary, coreWord, 0L);
    }

    private List<List<String>> buildBoard(Stage stage, List<VocabularyWord> vocabulary, StageCoreWord coreWord, long seedSalt) {
        int rows = stage.getBoardRows() != null ? stage.getBoardRows() : 5;
        int cols = stage.getBoardCols() != null ? stage.getBoardCols() : 5;
        int totalCells = rows * cols;

        long baseSeed = stage.getStageId() != null ? stage.getStageId() : 1L;
        Random random = new Random(baseSeed + seedSalt * 101L);

        // Step 1: Initialize all board cells with frequency-balanced English letters (42% vowels)
        List<List<String>> board = new ArrayList<>();
        for (int r = 0; r < rows; r++) {
            List<String> row = new ArrayList<>();
            for (int c = 0; c < cols; c++) {
                row.add(String.valueOf(getRandomEnglishLetter(random)));
            }
            board.add(row);
        }

        // Step 2: Collect guaranteed letters from core word and 1-2 eligible bonus vocabulary words
        List<String> guaranteedLetters = new ArrayList<>();
        String normalizedCore = "";
        if (coreWord != null && coreWord.getWord() != null) {
            normalizedCore = normalizeWord(coreWord.getWord().getWordText());
        }

        if (!normalizedCore.isBlank()) {
            for (char ch : normalizedCore.toCharArray()) {
                guaranteedLetters.add(String.valueOf(ch));
            }
        }

        // Add 1-2 valid bonus vocabulary words from stage vocabulary set (length 3..7)
        if (vocabulary != null && !vocabulary.isEmpty()) {
            int bonusAdded = 0;
            for (VocabularyWord vWord : vocabulary) {
                if (bonusAdded >= 2) break;
                if (vWord == null || vWord.getWordText() == null) continue;
                String normV = normalizeWord(vWord.getWordText());
                if (normV.length() >= 3 && normV.length() <= 7 && !normV.equals(normalizedCore)) {
                    if (guaranteedLetters.size() + normV.length() <= totalCells - 4) {
                        for (char ch : normV.toCharArray()) {
                            guaranteedLetters.add(String.valueOf(ch));
                        }
                        bonusAdded++;
                    }
                }
            }
        }

        if (guaranteedLetters.isEmpty()) {
            return board;
        }

        // Step 3: Prioritize positions near the center for high connectivity
        class Cell {
            int row;
            int col;
            int distance;

            Cell(int row, int col, int distance) {
                this.row = row;
                this.col = col;
                this.distance = distance;
            }
        }

        int centerRow = rows / 2;
        int centerCol = cols / 2;

        List<Cell> cells = new ArrayList<>();
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                int distance = Math.abs(r - centerRow) + Math.abs(c - centerCol);
                cells.add(new Cell(r, c, distance));
            }
        }

        cells.sort(Comparator.comparingInt(cell -> cell.distance));

        int placeCount = Math.min(guaranteedLetters.size(), cells.size());
        List<Cell> chosen = new ArrayList<>(cells.subList(0, placeCount));
        Collections.shuffle(chosen, random);

        for (int i = 0; i < placeCount; i++) {
            Cell cell = chosen.get(i);
            board.get(cell.row).set(cell.col, guaranteedLetters.get(i));
        }

        return board;
    }

    private LexRaidSessionDto toSessionDto(RaidSession raidSession) {
        if (raidSession == null) {
            return null;
        }
        GameSession gameSession = raidSession.getGameSession();
        User user = gameSession != null ? gameSession.getUser() : null;
        Integer stars = null;
        if (user != null && raidSession.getStage() != null) {
            stars = userStageProgressRepository.findByUserUserIdAndStageStageId(user.getUserId(), raidSession.getStage().getStageId())
                    .map(UserStageProgress::getStarsEarned)
                    .orElse(null);
        }

        Boolean levelUpOccurred = null;
        Integer levelsGained = null;
        if (user != null && gameSession != null && gameSession.getXpEarned() != null && gameSession.getXpEarned() > 0) {
            int prevXp = Math.max(0, defaultIfNull(user.getXpTotal(), 0) - gameSession.getXpEarned());
            int prevLevel = rpgProgressionService.calculateLevel(prevXp);
            int curLevel = defaultIfNull(user.getLevelCurrent(), 1);
            levelUpOccurred = curLevel > prevLevel;
            levelsGained = Math.max(0, curLevel - prevLevel);
        }

        return LexRaidSessionDto.builder()
                .raidSessionId(raidSession.getRaidSessionId())
                .gameSessionId(gameSession != null ? gameSession.getGameSessionId() : null)
                .stageId(raidSession.getStage() != null ? raidSession.getStage().getStageId() : null)
                .userId(user != null ? user.getUserId() : null)
                .status(raidSession.getStatus())
                .resultCode(gameSession != null ? gameSession.getResultCode() : null)
                .currentRound(raidSession.getCurrentRound())
                .bossHpRemaining(raidSession.getBossHpRemaining())
                .bossShieldRemaining(raidSession.getBossShieldRemaining())
                .rageValue(raidSession.getRageValue())
                .comboCount(raidSession.getComboCount())
                .manaValue(raidSession.getManaValue())
                .totalScore(raidSession.getTotalScore())
                .clueProgressJson(raidSession.getClueProgressJson())
                .xpEarned(gameSession != null ? gameSession.getXpEarned() : null)
                .coinsEarned(gameSession != null ? gameSession.getCoinsEarned() : null)
                .userLevelCurrent(user != null ? user.getLevelCurrent() : null)
                .userXpTotal(user != null ? user.getXpTotal() : null)
                .userCoins(user != null ? user.getCoins() : null)
                .levelUpOccurred(levelUpOccurred)
                .levelsGained(levelsGained)
                .starsEarned(stars)
                .build();
    }

    private Integer defaultIfNull(Integer incoming, Integer fallback) {
        return incoming != null ? incoming : fallback;
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    private String normalizeWord(String value) {
        return value == null ? "" : value.replaceAll("[^A-Za-z]", "").toUpperCase(Locale.ROOT);
    }

    private String buildWordMeaning(VocabularyWord word) {
        if (word == null) return "";
        String meaning = blankToNull(word.getMeaningVi()) != null ? word.getMeaningVi() : word.getMeaningEn();
        return word.getWordText() + (meaning != null ? " = " + meaning : "");
    }

    private String toPathJson(List<WordPathTileDto> path) {
        if (path == null || path.isEmpty()) return "[]";
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < path.size(); i++) {
            WordPathTileDto tile = path.get(i);
            if (i > 0) sb.append(',');
            sb.append("{\"row\":").append(tile.getRow())
                    .append(",\"col\":").append(tile.getCol())
                    .append(",\"value\":\"").append(escapeJson(tile.getValue())).append("\"}");
        }
        sb.append(']');
        return sb.toString();
    }

    private String escapeJson(String value) {
        return value == null ? "" : value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
