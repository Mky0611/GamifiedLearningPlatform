package org.example.service;

import lombok.RequiredArgsConstructor;
import org.example.dto.MasteryRecallRequest;
import org.example.dto.MasterySummaryDto;
import org.example.entity.MasteryRecallChallenge;
import org.example.entity.User;
import org.example.entity.UserWordMastery;
import org.example.entity.VocabularyWord;
import org.example.repository.MasteryRecallChallengeRepository;
import org.example.repository.UserRepository;
import org.example.repository.UserWordMasteryRepository;
import org.example.repository.VocabularyWordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor(onConstructor_ = @Autowired)
public class MasteryServiceImpl implements MasteryService {

    private static final long CHALLENGE_TTL_MINUTES = 5L;

    private final UserRepository userRepository;
    private final UserWordMasteryRepository wordMasteryRepository;
    private final VocabularyWordRepository vocabularyWordRepository;
    private final MasteryRecallChallengeRepository challengeRepository;

    @Override
    @Transactional(readOnly = true)
    public MasterySummaryDto getMasterySummary(Long userId) {
        requireUser(userId);
        List<UserWordMastery> rows = wordMasteryRepository.findByUserUserIdOrderByLastSeenAtDesc(userId);
        List<MasterySummaryDto.MasteryWordItemDto> items = rows.stream()
                .map(m -> MasterySummaryDto.MasteryWordItemDto.builder()
                        .wordId(m.getWord().getWordId())
                        .wordText(m.getWord().getWordText())
                        .meaningVi(m.getWord().getMeaningVi())
                        .meaningEn(m.getWord().getMeaningEn())
                        .masteryState(m.getMasteryState())
                        .timesFound(defaultZero(m.getTimesFound()))
                        .timesGuessed(defaultZero(m.getTimesGuessed()))
                        .timesReviewed(defaultZero(m.getTimesReviewed()))
                        .timesAnsweredCorrect(defaultZero(m.getTimesAnsweredCorrect()))
                        .masteryScore(m.getMasteryScore() != null ? m.getMasteryScore().intValue() : 0)
                        .build())
                .toList();

        int uniqueReviewed = (int) rows.stream().filter(m -> defaultZero(m.getTimesAnsweredCorrect()) > 0).count();
        int mastered = (int) rows.stream().filter(m -> "MASTERED".equalsIgnoreCase(m.getMasteryState())).count();
        int topicFound = (int) rows.stream().filter(m -> defaultZero(m.getTimesFound()) > 0).count();

        return MasterySummaryDto.builder()
                .userId(userId)
                .totalTrackedWords(items.size())
                .uniqueReviewedCount(uniqueReviewed)
                .masteredCount(mastered)
                .topicWordsSolved(topicFound)
                .items(items)
                .build();
    }

    @Override
    @Transactional
    public MasterySummaryDto.RecallChallengeDto generateRecallChallenge(Long userId, Long wordId) {
        User user = requireUser(userId);
        if (wordId == null) throw new IllegalArgumentException("Thieu wordId de tao thu thach Recall");
        VocabularyWord target = vocabularyWordRepository.findById(wordId)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay tu vung voi id = " + wordId));

        String targetText = normalize(target.getWordText());
        List<String> pool = new ArrayList<>();
        if (target.getVocabularySet() != null) {
            for (VocabularyWord sibling : vocabularyWordRepository
                    .findTop40ByVocabularySetVocabularySetIdOrderByWordTextAsc(target.getVocabularySet().getVocabularySetId())) {
                String cand = normalize(sibling.getWordText());
                if (!cand.isEmpty() && !cand.equals(targetText) && !pool.contains(cand)) {
                    pool.add(cand);
                    if (pool.size() >= 2) break;
                }
            }
        }
        for (String fallback : List.of("LEARN", "CACHE", "QUERY", "STACK")) {
            if (pool.size() >= 2) break;
            if (!fallback.equals(targetText) && !pool.contains(fallback)) pool.add(fallback);
        }

        List<String> options = new ArrayList<>();
        options.add(targetText);
        options.addAll(pool.subList(0, Math.min(2, pool.size())));
        Collections.sort(options);

        String meaning = target.getMeaningVi() != null && !target.getMeaningVi().isBlank()
                ? target.getMeaningVi()
                : target.getMeaningEn();

        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(CHALLENGE_TTL_MINUTES);
        MasteryRecallChallenge entity = new MasteryRecallChallenge();
        entity.setChallengeId(UUID.randomUUID().toString());
        entity.setUser(user);
        entity.setWord(target);
        entity.setOptionsJson(toJsonStringArray(options));
        entity.setExpiresAt(expiresAt);
        challengeRepository.save(entity);

        // Strictly do NOT send correctAnswer / isCorrect flag in challenge payload
        return MasterySummaryDto.RecallChallengeDto.builder()
                .challengeId(entity.getChallengeId())
                .wordId(target.getWordId())
                .promptMeaning(meaning != null ? meaning : targetText)
                .partOfSpeech(target.getPartOfSpeech())
                .options(options)
                .expiresAt(expiresAt.toString())
                .build();
    }

    @Override
    @Transactional
    public MasterySummaryDto.RecallAttemptResultDto submitRecallAttempt(MasteryRecallRequest request) {
        if (request == null || request.getUserId() == null || request.getWordId() == null) {
            throw new IllegalArgumentException("Thieu userId hoac wordId khi kiem tra Recall");
        }
        if (request.getChallengeId() == null || request.getChallengeId().isBlank()) {
            throw new IllegalArgumentException("Thieu challengeId hop le tu server.");
        }
        User user = requireUser(request.getUserId());
        MasteryRecallChallenge challenge = challengeRepository.findByIdForUpdate(request.getChallengeId().trim())
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay thu thach Recall: " + request.getChallengeId()));

        if (challenge.getUser() == null || !Objects.equals(challenge.getUser().getUserId(), user.getUserId())) {
            throw new SecurityException("Thu thach Recall thuoc ve tai khoan khac.");
        }
        if (challenge.getWord() == null || !Objects.equals(challenge.getWord().getWordId(), request.getWordId())) {
            throw new IllegalArgumentException("wordId khong khop voi thu thach Recall.");
        }
        if (challenge.getConsumedAt() != null) {
            throw new IllegalStateException("Thu thach Recall nay da duoc su dung (single-use).");
        }
        if (challenge.getExpiresAt() != null && LocalDateTime.now().isAfter(challenge.getExpiresAt())) {
            throw new IllegalStateException("Thu thach Recall da het han; vui long tao thu thach moi.");
        }

        VocabularyWord word = vocabularyWordRepository.findById(request.getWordId())
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay tu vung voi id = " + request.getWordId()));

        String expected = normalize(word.getWordText());
        String submitted = normalize(request.getSelectedWord());
        boolean isCorrect = !submitted.isEmpty() && expected.equals(submitted);

        challenge.setConsumedAt(LocalDateTime.now());
        challenge.setIsCorrect(isCorrect);
        challengeRepository.save(challenge);

        UserWordMastery mastery = wordMasteryRepository.findByUserUserIdAndWordWordId(user.getUserId(), word.getWordId())
                .orElseGet(() -> {
                    UserWordMastery m = new UserWordMastery();
                    m.setUser(user);
                    m.setWord(word);
                    m.setTimesSeen(1);
                    m.setTimesFound(0);
                    m.setTimesGuessed(0);
                    m.setTimesReviewed(0);
                    m.setTimesAnsweredCorrect(0);
                    m.setMasteryScore(BigDecimal.ZERO);
                    m.setWeaknessScore(BigDecimal.ZERO);
                    m.setMasteryState("SEEN");
                    return m;
                });

        int prevCorrect = defaultZero(mastery.getTimesAnsweredCorrect());
        mastery.setTimesReviewed(defaultZero(mastery.getTimesReviewed()) + 1);
        mastery.setLastReviewedAt(LocalDateTime.now());

        boolean newUniqueReview = false;
        int curScore = mastery.getMasteryScore() != null ? mastery.getMasteryScore().intValue() : 0;
        if (isCorrect) {
            mastery.setTimesAnsweredCorrect(prevCorrect + 1);
            newUniqueReview = prevCorrect == 0;
            curScore = Math.min(100, curScore + 15);
            mastery.setMasteryScore(BigDecimal.valueOf(curScore));
            if (curScore >= 50 || "MASTERED".equalsIgnoreCase(mastery.getMasteryState())) {
                mastery.setMasteryState("MASTERED");
                if (mastery.getLastMasteredAt() == null) mastery.setLastMasteredAt(LocalDateTime.now());
            } else {
                mastery.setMasteryState("REVIEWED_CORRECT");
            }
        } else {
            BigDecimal weak = mastery.getWeaknessScore() != null ? mastery.getWeaknessScore() : BigDecimal.ZERO;
            mastery.setWeaknessScore(weak.add(BigDecimal.valueOf(5)));
        }
        wordMasteryRepository.save(mastery);

        int uniqueCount = (int) wordMasteryRepository.countByUserUserIdAndTimesAnsweredCorrectGreaterThan(user.getUserId(), 0);
        int masteredCount = (int) wordMasteryRepository.findByUserUserIdOrderByLastSeenAtDesc(user.getUserId()).stream()
                .filter(m -> "MASTERED".equalsIgnoreCase(m.getMasteryState())).count();

        return MasterySummaryDto.RecallAttemptResultDto.builder()
                .userId(user.getUserId())
                .wordId(word.getWordId())
                .correct(isCorrect)
                .newUniqueReview(newUniqueReview)
                .masteryState(mastery.getMasteryState())
                .uniqueReviewedCount(uniqueCount)
                .masteredCount(masteredCount)
                .message(isCorrect ? "Chinh xac! Da xac nhan Recall tu DB." : "Chua dung, hay thu lai voi challenge moi.")
                .build();
    }

    private User requireUser(Long userId) {
        if (userId == null || userId <= 0) {
            throw new IllegalArgumentException("Thieu userId hop le");
        }
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay user voi id = " + userId));
    }

    private static int defaultZero(Integer v) {
        return v != null ? v : 0;
    }

    private static String normalize(String s) {
        return s == null ? "" : s.trim().toUpperCase(Locale.ROOT).replaceAll("[^A-Z]", "");
    }

    private static String toJsonStringArray(List<String> items) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < items.size(); i++) {
            if (i > 0) sb.append(',');
            sb.append('"').append(items.get(i).replace("\"", "")).append('"');
        }
        return sb.append(']').toString();
    }
}
