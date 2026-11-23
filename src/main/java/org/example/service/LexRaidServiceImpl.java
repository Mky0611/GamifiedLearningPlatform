package org.example.service;

import lombok.RequiredArgsConstructor;
import org.example.dto.*;
import org.example.entity.*;
import org.example.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
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
        applySync(raidSession, request, false);
        saveSnapshotIfPresent(raidSession, request, reasonCode == null ? DEFAULT_BOARD_REASON : reasonCode);
        return toSessionDto(raidSessionRepository.save(raidSession));
    }

    @Override
    @Transactional
    public LexRaidSessionDto finishSession(Long raidSessionId, LexRaidSessionSyncRequest request) {
        RaidSession raidSession = findSession(raidSessionId);
        applySync(raidSession, request, true);
        saveSnapshotIfPresent(raidSession, request, DEFAULT_BOARD_REASON);
        finalizeGameSession(raidSession, request.getResultCode(), request.getDurationSec());
        updateStageProgress(raidSession, 0, 0);
        return toSessionDto(raidSessionRepository.save(raidSession));
    }

    @Override
    @Transactional
    public LexRaidActionResultDto submitWord(Long raidSessionId, LexRaidSubmitWordRequest request) {
        RaidSession raidSession = findSession(raidSessionId);
        Stage stage = raidSession.getStage();
        String normalizedWord = normalizeWord(request.getSubmittedWord());
        VocabularySet set = stage.getVocabularySet();
        Optional<VocabularyWord> matchedWordOpt = vocabularyWordRepository.findByVocabularySetVocabularySetIdAndNormalizedText(set.getVocabularySetId(), normalizedWord);
        boolean alreadyUsed = wordSubmitEventRepository.findByRaidSessionRaidSessionIdAndIsValidTrue(raidSessionId).stream()
                .anyMatch(event -> Boolean.TRUE.equals(event.getIsValid()) && normalizeWord(event.getSubmittedWord()).equals(normalizedWord));
        boolean valid = matchedWordOpt.isPresent() && !alreadyUsed;

        VocabularyWord matchedWord = matchedWordOpt.orElse(null);
        int oldCombo = defaultIfNull(raidSession.getComboCount(), 0);
        int comboAfter = valid ? oldCombo + 1 : 0;
        int length = normalizedWord.length();
        int baseScore = valid ? Math.max(10, length * 8) : 0;
        int manaGain = valid ? Math.min(6, Math.max(1, length / 2)) : 0;
        int cluePoints = valid ? Math.max(1, length / 3) : 0;
        int totalDamage = valid ? (length * 5) + (comboAfter * 2) : 0;
        int shieldDamage = Math.min(defaultIfNull(raidSession.getBossShieldRemaining(), 0), totalDamage);
        int hpDamage = Math.max(0, totalDamage - shieldDamage);

        List<StageCoreWord> coreWords = stageCoreWordRepository.findByStageStageIdOrderByRevealOrderAsc(stage.getStageId());
        Set<Long> solvedIds = parseSolvedCoreWordIds(raidSession.getClueProgressJson());
        StageCoreWord activeCoreWord = resolveActiveCoreWord(coreWords, solvedIds);
        boolean solvedCoreBySubmit = false;

        if (valid) {
            raidSession.setBossShieldRemaining(defaultIfNull(raidSession.getBossShieldRemaining(), 0) - shieldDamage);
            raidSession.setBossHpRemaining(Math.max(0, defaultIfNull(raidSession.getBossHpRemaining(), 0) - hpDamage));
            raidSession.setComboCount(comboAfter);
            raidSession.setManaValue(defaultIfNull(raidSession.getManaValue(), 0) + manaGain);
            raidSession.setRageValue(defaultIfNull(raidSession.getRageValue(), 0) + Math.max(1, length));
            raidSession.setTotalScore(defaultIfNull(raidSession.getTotalScore(), 0) + baseScore);

            if (activeCoreWord != null
                    && matchedWord != null
                    && activeCoreWord.getWord() != null
                    && Objects.equals(activeCoreWord.getWord().getWordId(), matchedWord.getWordId())
                    && !solvedIds.contains(activeCoreWord.getStageCoreWordId())) {
                raidSession.setClueProgressJson(appendCoreWordProgress(raidSession.getClueProgressJson(), activeCoreWord));
                solvedIds.add(activeCoreWord.getStageCoreWordId());
                solvedCoreBySubmit = true;
                raidSession.setBossHpRemaining(0);
            }

            updateWordMastery(raidSession.getGameSession().getUser(), matchedWord, true, solvedCoreBySubmit);
            updateStageProgress(raidSession, 1, solvedCoreBySubmit ? 1 : 0);

            if (raidSession.getBossHpRemaining() <= 0) {
                StageCoreWord nextWordCheck = resolveActiveCoreWord(coreWords, solvedIds);
                if (nextWordCheck == null) {
                    raidSession.setStatus(WON);
                    raidSession.setEndedAt(LocalDateTime.now());
                    finalizeGameSession(raidSession, WON, null);
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
            raidSession.setComboCount(0);
            raidSession.setRageValue(defaultIfNull(raidSession.getRageValue(), 0) + 1);
        }

        WordSubmitEvent event = new WordSubmitEvent();
        event.setRaidSession(raidSession);
        event.setRoundNo(defaultIfNull(request.getRoundNo(), raidSession.getCurrentRound()));
        event.setSubmittedWord(request.getSubmittedWord());
        event.setVocabularyWord(matchedWord);
        event.setWordType(valid ? (solvedCoreBySubmit ? "CORE" : "NORMAL") : "INVALID");
        event.setPathJson(toPathJson(request.getPath()));
        event.setLengthValue(length);
        event.setBaseScore(baseScore);
        event.setDamageValue(totalDamage);
        event.setCluePoints(cluePoints);
        event.setManaGain(manaGain);
        event.setComboAfter(comboAfter);
        event.setIsValid(valid);
        event.setRejectionReason(valid ? null : (alreadyUsed ? "Word da duoc dung trong tran nay" : "Word khong hop le"));
        wordSubmitEventRepository.save(event);

        if (blankToNull(request.getBoardJson()) != null) {
            LexRaidSessionSyncRequest sync = new LexRaidSessionSyncRequest();
            sync.setBoardJson(request.getBoardJson());
            sync.setSelectedPathJson(toPathJson(request.getPath()));
            sync.setCurrentRound(raidSession.getCurrentRound());
            saveSnapshotIfPresent(raidSession, sync, "POST_SUBMIT");
        }

        raidSessionRepository.save(raidSession);

        StageCoreWord nextActiveCoreWord = resolveActiveCoreWord(coreWords, solvedIds);
        int activeCoreIndex = resolveActiveCoreIndex(coreWords, nextActiveCoreWord);
        List<VocabularyWord> vocabulary = vocabularyWordRepository.findTop40ByVocabularySetVocabularySetIdOrderByWordTextAsc(set.getVocabularySetId());

        return LexRaidActionResultDto.builder()
                .accepted(valid)
                .actionType("SUBMIT_WORD")
                .submittedWord(request.getSubmittedWord())
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
                .resultCode(raidSession.getGameSession().getResultCode())
                .rejectionReason(valid ? null : (alreadyUsed ? "Word da duoc dung trong tran nay" : "Word khong hop le"))
                .clueProgressJson(raidSession.getClueProgressJson())
                .unlockedClues(valid && matchedWord != null ? List.of(buildWordMeaning(matchedWord)) : List.of())
                .activeCoreIndex(activeCoreIndex)
                .activeStageCoreWordId(nextActiveCoreWord != null ? nextActiveCoreWord.getStageCoreWordId() : null)
                .activeCoreWord(nextActiveCoreWord != null && nextActiveCoreWord.getWord() != null ? nextActiveCoreWord.getWord().getWordText() : null)
                .activeClueText(resolveClueText(nextActiveCoreWord))
                .coreSolved(solvedCoreBySubmit)
                .coreWords(toCoreWordDtos(coreWords, solvedIds))
                .board(buildBoard(stage, vocabulary, nextActiveCoreWord))
                .session(toSessionDto(raidSession))
                .build();
    }

    @Override
    @Transactional
    public LexRaidActionResultDto guessCoreWord(Long raidSessionId, LexRaidGuessCoreWordRequest request) {
        RaidSession raidSession = findSession(raidSessionId);
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

        if (correct) {
            raidSession.setBossShieldRemaining(0);
            raidSession.setBossHpRemaining(0);
            raidSession.setTotalScore(defaultIfNull(raidSession.getTotalScore(), 0) + rewardDamage + defaultIfNull(stageCoreWord.getBonusXp(), 0));
            raidSession.setClueProgressJson(appendCoreWordProgress(raidSession.getClueProgressJson(), stageCoreWord));
            solvedIds.add(stageCoreWord.getStageCoreWordId());
            updateWordMastery(raidSession.getGameSession().getUser(), stageCoreWord.getWord(), true, true);
            updateStageProgress(raidSession, 0, 1);
            
            StageCoreWord nextWordCheck = resolveActiveCoreWord(coreWords, solvedIds);
            if (nextWordCheck == null) {
                raidSession.setStatus(WON);
                raidSession.setEndedAt(LocalDateTime.now());
                finalizeGameSession(raidSession, WON, null);
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
        coreWordGuessEventRepository.save(event);

        raidSessionRepository.save(raidSession);
        StageCoreWord nextActiveCoreWord = resolveActiveCoreWord(coreWords, solvedIds);
        int activeCoreIndex = resolveActiveCoreIndex(coreWords, nextActiveCoreWord);
        List<VocabularyWord> vocabulary = vocabularyWordRepository.findTop40ByVocabularySetVocabularySetIdOrderByWordTextAsc(stage.getVocabularySet().getVocabularySetId());
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
                .board(buildBoard(stage, vocabulary, nextActiveCoreWord))
                .session(toSessionDto(raidSession))
                .build();
    }

    private void finalizeGameSession(RaidSession raidSession, String incomingResultCode, Integer incomingDurationSec) {
        GameSession gameSession = raidSession.getGameSession();
        gameSession.setScoreTotal(raidSession.getTotalScore());
        gameSession.setResultCode(blankToNull(incomingResultCode) != null ? incomingResultCode : (WON.equalsIgnoreCase(raidSession.getStatus()) ? WON : LOST));
        gameSession.setStatus(resolveGameSessionStatus(raidSession.getStatus()));
        gameSession.setEndedAt(LocalDateTime.now());
        gameSession.setDurationSec(resolveDurationSec(gameSession.getStartedAt(), incomingDurationSec));
        gameSession.setXpEarned(defaultIfNull(gameSession.getXpEarned(), 0) + Math.max(5, defaultIfNull(raidSession.getTotalScore(), 0) / 20));
        gameSessionRepository.save(gameSession);
    }

    private void applySync(RaidSession raidSession, LexRaidSessionSyncRequest request, boolean markFinished) {
        raidSession.setCurrentRound(defaultIfNull(request.getCurrentRound(), raidSession.getCurrentRound()));
        raidSession.setBossHpRemaining(defaultIfNull(request.getBossHpRemaining(), raidSession.getBossHpRemaining()));
        raidSession.setBossShieldRemaining(defaultIfNull(request.getBossShieldRemaining(), raidSession.getBossShieldRemaining()));
        raidSession.setRageValue(defaultIfNull(request.getRageValue(), raidSession.getRageValue()));
        raidSession.setComboCount(defaultIfNull(request.getComboCount(), raidSession.getComboCount()));
        raidSession.setManaValue(defaultIfNull(request.getManaValue(), raidSession.getManaValue()));
        raidSession.setTotalScore(defaultIfNull(request.getTotalScore(), raidSession.getTotalScore()));
        if (isCoreProgressPayload(request.getClueProgressJson())) {
            raidSession.setClueProgressJson(request.getClueProgressJson());
        }
        if (markFinished) {
            raidSession.setStatus(blankToNull(request.getStatus()) != null ? request.getStatus() : raidSession.getBossHpRemaining() <= 0 ? WON : LOST);
            raidSession.setEndedAt(LocalDateTime.now());
        } else if (blankToNull(request.getStatus()) != null) {
            raidSession.setStatus(request.getStatus());
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

    private void updateStageProgress(RaidSession raidSession, int wordsFoundDelta, int coreWordsGuessedDelta) {
        User user = raidSession.getGameSession().getUser();
        Stage stage = raidSession.getStage();
        UserStageProgress progress = userStageProgressRepository.findByUserUserIdAndStageStageId(user.getUserId(), stage.getStageId())
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
        progress.setBestScore(Math.max(defaultIfNull(progress.getBestScore(), 0), defaultIfNull(raidSession.getTotalScore(), 0)));
        progress.setHighestCombo(Math.max(defaultIfNull(progress.getHighestCombo(), 0), defaultIfNull(raidSession.getComboCount(), 0)));
        progress.setTotalWordsFound(defaultIfNull(progress.getTotalWordsFound(), 0) + wordsFoundDelta);
        progress.setTotalCoreWordsGuessed(defaultIfNull(progress.getTotalCoreWordsGuessed(), 0) + coreWordsGuessedDelta);
        progress.setLastPlayedAt(LocalDateTime.now());
        if (WON.equalsIgnoreCase(raidSession.getStatus())) {
            progress.setClearCount(defaultIfNull(progress.getClearCount(), 0) + 1);
            progress.setLastResult(WON);
            progress.setStarsEarned(resolveStars(raidSession));
            if (progress.getFirstClearedAt() == null) {
                progress.setFirstClearedAt(LocalDateTime.now());
            }
        } else if (LOST.equalsIgnoreCase(raidSession.getStatus())) {
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
        WordPathTileDto prev = null;
        Set<String> seen = new HashSet<>();
        for (WordPathTileDto tile : path) {
            if (tile == null || tile.getRow() == null || tile.getCol() == null || blankToNull(tile.getValue()) == null) {
                return false;
            }
            String key = tile.getRow() + ":" + tile.getCol();
            if (!seen.add(key)) return false;
            if (prev != null) {
                int dr = Math.abs(tile.getRow() - prev.getRow());
                int dc = Math.abs(tile.getCol() - prev.getCol());
                if (dr > 1 || dc > 1 || (dr == 0 && dc == 0)) return false;
            }
            sb.append(normalizeWord(tile.getValue()));
            prev = tile;
        }
        return sb.toString().equals(normalizedWord);
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
        int rows = stage.getBoardRows() != null ? stage.getBoardRows() : 5;
        int cols = stage.getBoardCols() != null ? stage.getBoardCols() : 5;
        int totalCells = rows * cols;

        Random random = new Random(stage.getStageId() != null ? stage.getStageId() : 1L);

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
        return LexRaidSessionDto.builder()
                .raidSessionId(raidSession.getRaidSessionId())
                .gameSessionId(raidSession.getGameSession().getGameSessionId())
                .stageId(raidSession.getStage().getStageId())
                .userId(raidSession.getGameSession().getUser().getUserId())
                .status(raidSession.getStatus())
                .resultCode(raidSession.getGameSession().getResultCode())
                .currentRound(raidSession.getCurrentRound())
                .bossHpRemaining(raidSession.getBossHpRemaining())
                .bossShieldRemaining(raidSession.getBossShieldRemaining())
                .rageValue(raidSession.getRageValue())
                .comboCount(raidSession.getComboCount())
                .manaValue(raidSession.getManaValue())
                .totalScore(raidSession.getTotalScore())
                .clueProgressJson(raidSession.getClueProgressJson())
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
