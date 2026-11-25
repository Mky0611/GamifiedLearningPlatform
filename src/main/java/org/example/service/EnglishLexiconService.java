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
    private final Set<String> words;

    public EnglishLexiconService() {
        this.words = loadWordsFromClasspath();
    }

    public EnglishLexiconService(Set<String> customWords) {
        Set<String> normalized = new HashSet<>();
        if (customWords != null) {
            for (String w : customWords) {
                String clean = normalize(w);
                if (clean.length() >= 3 && clean.length() <= 12) {
                    normalized.add(clean);
                }
            }
        }
        this.words = Collections.unmodifiableSet(normalized);
    }

    public boolean isValidEnglishWord(String word) {
        String normalized = normalize(word);
        if (normalized.length() < 3 || normalized.length() > 12) {
            return false;
        }
        return words.contains(normalized);
    }

    public int size() {
        return words.size();
    }

    public static String normalize(String raw) {
        if (raw == null) {
            return "";
        }
        return raw.replaceAll("[^A-Za-z]", "").toUpperCase(Locale.ROOT);
    }

    private Set<String> loadWordsFromClasspath() {
        ClassPathResource resource = new ClassPathResource(LEXICON_RESOURCE);
        if (!resource.exists()) {
            return Set.of("LEARN", "RAID", "CLUE", "WORD", "GAME", "BATTLE", "TIME", "WATER", "BOOK", "LIGHT", "SWORD", "KNIGHT");
        }
        Set<String> loaded = new HashSet<>(82000);
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                String token = line.trim().toUpperCase(Locale.ROOT);
                if (token.length() >= 3 && token.length() <= 12 && token.matches("^[A-Z]+$")) {
                    loaded.add(token);
                }
            }
        } catch (IOException e) {
            return Set.of("LEARN", "RAID", "CLUE", "WORD", "GAME", "BATTLE", "TIME", "WATER", "BOOK", "LIGHT", "SWORD", "KNIGHT");
        }
        return Collections.unmodifiableSet(loaded);
    }
}
