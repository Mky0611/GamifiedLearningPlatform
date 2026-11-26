package org.example.service;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

/**
 * Verified offline English lexicon service sourced from en-wl/wordlist (ESDB / SCOWLv2 + 12Dicts + hacker).
 * Used purely for lexical validation; educational meanings/CEFR remain strictly in database VocabularyWord records.
 */
@Service
public class EnglishLexiconService {

    private static final String LEXICON_RESOURCE = "lexicon/english-words.txt";
    private static final String COMMON_RESOURCE = "lexicon/common-words.txt";
    public static final Set<String> TWO_LETTER_COMMON_WHITELIST = Set.of(
            "AM", "AN", "AS", "AT", "BE", "BY", "DO", "GO", "HE", "IF", "IN", "IS",
            "IT", "ME", "MY", "NO", "OF", "ON", "OR", "SO", "TO", "UP", "US", "WE"
    );

    private final Set<String> words;
    private final Set<String> commonWords;

    public EnglishLexiconService() {
        this.words = loadWordsFromClasspath(LEXICON_RESOURCE, Set.of("LEARN", "RAID", "CLUE", "WORD", "GAME", "BATTLE", "TIME", "WATER", "BOOK", "LIGHT", "SWORD", "KNIGHT"));
        this.commonWords = loadWordsFromClasspath(COMMON_RESOURCE, Set.of("LEARN", "WORD", "GAME", "TIME", "WATER", "BOOK", "LIGHT"));
    }

    public EnglishLexiconService(Set<String> customWords) {
        Set<String> normalized = new HashSet<>();
        if (customWords != null) {
            for (String w : customWords) {
                String clean = normalize(w);
                if ((clean.length() >= 3 && clean.length() <= 12) || TWO_LETTER_COMMON_WHITELIST.contains(clean)) {
                    normalized.add(clean);
                }
            }
        }
        this.words = Collections.unmodifiableSet(normalized);
        this.commonWords = this.words;
    }

    public boolean isValidEnglishWord(String word) {
        String normalized = normalize(word);
        if (normalized.length() == 2) {
            return TWO_LETTER_COMMON_WHITELIST.contains(normalized) && (words.contains(normalized) || commonWords.contains(normalized) || true);
        }
        if (normalized.length() < 3 || normalized.length() > 12) {
            return false;
        }
        return words.contains(normalized);
    }

    public boolean isCommonEnglishWord(String word) {
        String normalized = normalize(word);
        if (normalized.length() == 2) {
            return TWO_LETTER_COMMON_WHITELIST.contains(normalized);
        }
        return normalized.length() >= 3 && normalized.length() <= 12 && commonWords.contains(normalized);
    }

    public int size() {
        return words.size();
    }

    public int commonSize() {
        return commonWords.size();
    }

    public static String normalize(String raw) {
        if (raw == null) {
            return "";
        }
        return raw.replaceAll("[^A-Za-z]", "").toUpperCase(Locale.ROOT);
    }

    private Set<String> loadWordsFromClasspath(String path, Set<String> fallback) {
        ClassPathResource resource = new ClassPathResource(path);
        if (!resource.exists()) {
            return fallback;
        }
        Set<String> loaded = new HashSet<>(82000);
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                String token = line.trim().toUpperCase(Locale.ROOT);
                if (((token.length() >= 3 && token.length() <= 12) || TWO_LETTER_COMMON_WHITELIST.contains(token))
                        && token.matches("^[A-Z]+$")) {
                    loaded.add(token);
                }
            }
        } catch (IOException e) {
            return fallback;
        }
        return Collections.unmodifiableSet(loaded);
    }
}
