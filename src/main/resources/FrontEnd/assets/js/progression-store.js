/**
 * LEX RAID P5.1 — Local Demo Progression Store (strictly separated from SQL Server DB state).
 * Separates first-clear SP, skill unlocks, and hero unlocks cleanly; enforces strict Stage/Prerequisite/Learning checks;
 * separates pronunciation plays vs unique reviewed/mastered words; preserves existing localStorage ownership safely.
 */
(function (root) {
  const STORE_KEY = 'glp.p5.demoProgression.v1';

  function createDefaultState() {
    const reg = root.RaidRegistry;
    const starterSkills = {};
    ['warrior', 'archer', 'lancer'].forEach((hid) => {
      const h = reg?.getHero(hid);
      (h?.starterSkillIds || []).forEach((sid) => { starterSkills[sid] = 1; });
    });
    ['fire_blade', 'frost_seal', 'thunder_strike', 'sacred_recovery'].forEach((sid) => {
      starterSkills[sid] = 1;
    });

    return {
      schema: 'glp.p5.demoProgression/1',
      modeLabel: 'Demo Progression (chưa đồng bộ SQL Server)',
      skillPoints: 3,
      selectedHero: 'warrior',
      selectedStageId: 1,
      unlockedHeroes: ['warrior', 'archer', 'lancer'],
      skillLevels: starterSkills,
      loadouts: {
        warrior: [...(reg?.getHero('warrior')?.defaultLoadout || ['knight_slash', 'heavy_slash', 'royal_guard', 'sacred_recovery', 'lexical_judgment'])],
        archer: [...(reg?.getHero('archer')?.defaultLoadout || ['quick_shot', 'piercing_arrow', 'triple_shot', 'sacred_recovery'])],
        lancer: [...(reg?.getHero('lancer')?.defaultLoadout || ['spear_thrust', 'impaling_charge', 'iron_fortress', 'sacred_recovery'])],
        arcane_mage: [...(reg?.getHero('arcane_mage')?.defaultLoadout || ['magic_bolt', 'fireball', 'arcane_beam', 'sacred_recovery', 'meteor_fall'])]
      },
      chapterProgress: {
        1: { status: 'AVAILABLE', clears: 0, bestScore: 0, stars: 0 },
        2: { status: 'LOCKED', clears: 0, bestScore: 0, stars: 0 },
        3: { status: 'LOCKED', clears: 0, bestScore: 0, stars: 0 },
        4: { status: 'LOCKED', clears: 0, bestScore: 0, stars: 0 },
        5: { status: 'LOCKED', clears: 0, bestScore: 0, stars: 0 }
      },
      learningStats: {
        validWordsSolved: 0,
        topicWordsSolved: 0,
        coreWordsSolved: 0,
        pronunciationPlays: 0,
        correctRecallAttempts: 0,
        uniqueReviewedWords: [],
        masteredWords: [],
        reviewedWordsCount: 0,
        bossesDefeated: 0,
        victories: 0,
        totalRuns: 0
      },
      rewardedMilestones: [],
      battleHistory: []
    };
  }

  function loadState() {
    const def = createDefaultState();
    try {
      const raw = root.localStorage?.getItem(STORE_KEY);
      if (!raw) {
        syncLegacyUnitPref(def.selectedHero);
        return def;
      }
      const parsed = JSON.parse(raw);
      const parsedStats = parsed.learningStats || {};
      const uniqueReviewed = Array.isArray(parsedStats.uniqueReviewedWords)
        ? Array.from(new Set(parsedStats.uniqueReviewedWords.map((w) => String(w || '').trim().toUpperCase()).filter(Boolean)))
        : [];
      const mastered = Array.isArray(parsedStats.masteredWords)
        ? Array.from(new Set(parsedStats.masteredWords.map((w) => String(w || '').trim().toUpperCase()).filter(Boolean)))
        : [];

      // Preserve legacy learned skills in parsed.skillLevels without wiping existing user progression
      const mergedSkills = { ...def.skillLevels, ...(parsed.skillLevels || {}) };

      const merged = {
        ...def,
        ...parsed,
        skillLevels: mergedSkills,
        loadouts: { ...def.loadouts, ...(parsed.loadouts || {}) },
        chapterProgress: { ...def.chapterProgress, ...(parsed.chapterProgress || {}) },
        learningStats: {
          ...def.learningStats,
          ...parsedStats,
          uniqueReviewedWords: uniqueReviewed,
          masteredWords: mastered,
          reviewedWordsCount: Math.max(uniqueReviewed.length, Number(parsedStats.reviewedWordsCount || 0) && uniqueReviewed.length ? uniqueReviewed.length : 0)
        },
        unlockedHeroes: Array.from(new Set([...(def.unlockedHeroes), ...(Array.isArray(parsed.unlockedHeroes) ? parsed.unlockedHeroes : [])])),
        rewardedMilestones: Array.isArray(parsed.rewardedMilestones) ? Array.from(new Set(parsed.rewardedMilestones)) : [],
        battleHistory: Array.isArray(parsed.battleHistory) ? parsed.battleHistory.slice(0, 20) : []
      };

      // Also migrate old stage_first_clear_1 rewards non-destructively into split keys in memory
      if (merged.unlockedHeroes.includes('arcane_mage') && !merged.rewardedMilestones.includes('hero_unlock_arcane_mage')) {
        merged.rewardedMilestones.push('hero_unlock_arcane_mage');
      }

      if (!merged.unlockedHeroes.includes(merged.selectedHero)) {
        merged.selectedHero = 'warrior';
      }
      return merged;
    } catch (_) {
      return def;
    }
  }

  function syncLegacyUnitPref(heroId) {
    try {
      const prefs = root.GLP_API?.getAccountPreferences?.() || {};
      const safeLegacy = heroId === 'arcane_mage' ? (prefs.unitCode || 'warrior') : heroId;
      if (prefs.unitCode !== safeLegacy && root.GLP_API?.saveAccountPreferences) {
        root.GLP_API.saveAccountPreferences({ ...prefs, unitCode: safeLegacy });
      }
    } catch (_) {}
  }

  function saveState(state) {
    try {
      root.localStorage?.setItem(STORE_KEY, JSON.stringify(state));
    } catch (_) {}
    return state;
  }

  function isHeroUnlocked(heroId, state = loadState()) {
    return Array.isArray(state.unlockedHeroes) && state.unlockedHeroes.includes(heroId);
  }

  function selectHero(heroId) {
    const reg = root.RaidRegistry;
    const state = loadState();
    if (!reg?.HEROES[heroId]) return { ok: false, reason: 'Hero không tồn tại trong Registry.' };
    if (!isHeroUnlocked(heroId, state)) {
      const rule = reg.getHero(heroId).unlockRule?.label || 'Chưa đạt điều kiện mở khóa.';
      return { ok: false, reason: `Hero đang khóa: ${rule}` };
    }
    state.selectedHero = heroId;
    saveState(state);
    syncLegacyUnitPref(heroId);
    return { ok: true, state };
  }

  function getUniqueReviewedCount(state) {
    const stats = state?.learningStats || {};
    if (Array.isArray(stats.uniqueReviewedWords) && stats.uniqueReviewedWords.length > 0) {
      return stats.uniqueReviewedWords.length;
    }
    return Number(stats.reviewedWordsCount || 0);
  }

  function checkLearningCondition(rule, state) {
    if (!rule) return { met: true };
    const stats = state.learningStats || {};
    if (rule.type === 'STAGE_CLEAR' && rule.stageId) {
      const st = state.chapterProgress?.[rule.stageId];
      if (!st || (st.clears || 0) < 1) {
        return { met: false, reason: `Cần đánh bại Boss Stage ${rule.stageId} trước.` };
      }
    }
    if (rule.minStageCleared) {
      const st = state.chapterProgress?.[rule.minStageCleared];
      if (!st || (st.clears || 0) < 1) {
        return { met: false, reason: `Cần vượt Stage ${rule.minStageCleared}.` };
      }
    }
    if (rule.minTopicWords && Number(stats.topicWordsSolved || 0) < rule.minTopicWords) {
      return { met: false, reason: `Cần giải >= ${rule.minTopicWords} từ đúng Topic.` };
    }
    const reqReviewed = Number(rule.minUniqueReviewedWords || rule.minReviewedWords || 0);
    if (reqReviewed > 0 && getUniqueReviewedCount(state) < reqReviewed) {
      return { met: false, reason: `Cần ôn tập đúng >= ${reqReviewed} từ duy nhất trong Word Mastery.` };
    }
    return { met: true };
  }

  function getSkillStatus(skillId, heroId, state = loadState()) {
    const reg = root.RaidRegistry;
    const sk = reg?.SKILL_MAP[skillId];
    if (!sk) return { state: 'LOCKED', level: 0, canLearn: false, canUpgrade: false, reason: 'Skill không hợp lệ.' };
    const targetHero = heroId || state.selectedHero;
    if (!sk.allowedHeroes.includes(targetHero)) {
      return { state: 'LOCKED', level: 0, canLearn: false, canUpgrade: false, reason: 'Không thuộc lớp Hero này.' };
    }
    const level = Number(state.skillLevels?.[skillId] || 0);
    const equipped = (state.loadouts?.[targetHero] || []).includes(skillId);
    const missingPre = (sk.prerequisites || []).filter((pre) => Number(state.skillLevels?.[pre] || 0) < 1);
    const cond = checkLearningCondition(sk.unlockRule, state);
    const hasSp = Number(state.skillPoints || 0) >= 1;

    if (level >= 3) {
      return { state: 'MAX_LEVEL', level, equipped, canLearn: false, canUpgrade: false, reason: 'Đã đạt cấp tối đa Lv 3.' };
    }
    if (level >= 1) {
      const nextLv = level + 1;
      const upgRule = sk.upgradeRequirements && sk.upgradeRequirements[nextLv];
      const upgCheck = checkLearningCondition(upgRule, state);
      if (!upgCheck.met) {
        return {
          state: equipped ? 'EQUIPPED' : 'LEARNED',
          level,
          equipped,
          canLearn: false,
          canUpgrade: false,
          reason: upgRule?.label || upgCheck.reason
        };
      }
      return {
        state: hasSp ? 'UPGRADE_AVAILABLE' : (equipped ? 'EQUIPPED' : 'LEARNED'),
        level,
        equipped,
        canLearn: false,
        canUpgrade: hasSp,
        reason: hasSp ? `Sẵn sàng nâng cấp lên Lv ${nextLv} (1 SP).` : 'Cần 1 Skill Point để nâng cấp.'
      };
    }
    if (missingPre.length > 0) {
      const names = missingPre.map((id) => reg.SKILL_MAP[id]?.name || id).join(', ');
      return { state: 'LOCKED', level: 0, equipped: false, canLearn: false, canUpgrade: false, reason: `Cần học kỹ năng tiên quyết: ${names}` };
    }
    // Strict: SP NEVER bypasses Stage/Chapter/Learning requirements!
    if (!cond.met) {
      return { state: 'LOCKED', level: 0, equipped: false, canLearn: false, canUpgrade: false, reason: cond.reason };
    }
    if (!hasSp) {
      return { state: 'LOCKED', level: 0, equipped: false, canLearn: false, canUpgrade: false, reason: 'Cần 1 Skill Point để học.' };
    }
    return { state: 'AVAILABLE', level: 0, equipped: false, canLearn: true, canUpgrade: false, reason: 'Sẵn sàng mở khóa (1 SP).' };
  }

  function learnOrUpgradeSkill(skillId, heroId) {
    const state = loadState();
    const status = getSkillStatus(skillId, heroId || state.selectedHero, state);
    if (!status.canLearn && !status.canUpgrade) {
      return { ok: false, reason: status.reason, state };
    }
    state.skillPoints = Math.max(0, Number(state.skillPoints || 0) - 1);
    const nextLv = Math.min(3, Number(state.skillLevels?.[skillId] || 0) + 1);
    state.skillLevels[skillId] = nextLv;
    saveState(state);
    return { ok: true, newLevel: nextLv, state };
  }

  function validateLoadoutForHero(heroId, skillIds, state = loadState()) {
    const reg = root.RaidRegistry;
    if (!isHeroUnlocked(heroId, state)) {
      return { ok: false, reason: `Hero ${heroId} chưa mở khóa.` };
    }
    const unique = Array.from(new Set(Array.isArray(skillIds) ? skillIds.filter(Boolean) : []));
    const active = [];
    const ultimates = [];
    for (const sid of unique) {
      const sk = reg?.SKILL_MAP[sid];
      if (!sk) return { ok: false, reason: `Skill không hợp lệ: ${sid}` };
      if (!sk.allowedHeroes.includes(heroId)) {
        return { ok: false, reason: `${sk.name} không dùng được cho ${reg.getHero(heroId).shortName}.` };
      }
      if (Number(state.skillLevels?.[sid] || 0) < 1) {
        return { ok: false, reason: `Chưa học kỹ năng: ${sk.name}.` };
      }
      const missingPre = (sk.prerequisites || []).filter((pre) => Number(state.skillLevels?.[pre] || 0) < 1);
      if (missingPre.length > 0) {
        return { ok: false, reason: `Thiếu kỹ năng tiên quyết cho ${sk.name}.` };
      }
      if (sk.isUltimate) ultimates.push(sid);
      else active.push(sid);
    }
    if (active.length > 4) return { ok: false, reason: 'Tối đa 4 Active Skill trong Loadout.' };
    if (ultimates.length > 1) return { ok: false, reason: 'Tối đa 1 Ultimate Skill trong Loadout.' };
    if (active.length === 0 && ultimates.length === 0) {
      return { ok: false, reason: 'Cần ít nhất 1 kỹ năng trong Loadout.' };
    }
    return { ok: true, normalized: [...active, ...ultimates] };
  }

  function setHeroLoadout(heroId, skillIds) {
    const state = loadState();
    const check = validateLoadoutForHero(heroId, skillIds, state);
    if (!check.ok) return { ok: false, reason: check.reason, state };
    state.loadouts[heroId] = check.normalized;
    saveState(state);
    return { ok: true, loadout: check.normalized, state };
  }

  function toggleSkillInLoadout(heroId, skillId) {
    const state = loadState();
    const current = [...(state.loadouts[heroId] || [])];
    const reg = root.RaidRegistry;
    const sk = reg?.SKILL_MAP[skillId];
    if (!sk) return { ok: false, reason: 'Skill không tồn tại.' };
    const idx = current.indexOf(skillId);
    if (idx >= 0) {
      current.splice(idx, 1);
      return setHeroLoadout(heroId, current);
    }
    if (sk.isUltimate) {
      const next = current.filter((id) => !reg.SKILL_MAP[id]?.isUltimate);
      next.push(skillId);
      return setHeroLoadout(heroId, next);
    }
    const activeOnly = current.filter((id) => !reg.SKILL_MAP[id]?.isUltimate);
    const ultOnly = current.filter((id) => reg.SKILL_MAP[id]?.isUltimate);
    if (activeOnly.length >= 4) {
      return { ok: false, reason: 'Loadout đã đủ 4 Active Skills. Hãy tháo bớt 1 chiêu trước khi lắp thêm.' };
    }
    return setHeroLoadout(heroId, [...activeOnly, skillId, ...ultOnly]);
  }

  function getActiveCombatLoadout(heroId, state = loadState()) {
    const reg = root.RaidRegistry;
    const h = heroId || state.selectedHero || 'warrior';
    if (!isHeroUnlocked(h, state)) return [];
    const rawIds = state.loadouts?.[h] || reg?.getHero(h)?.defaultLoadout || [];
    const resolved = [];
    for (const sid of rawIds) {
      const lv = Number(state.skillLevels?.[sid] || 0);
      if (lv < 1) continue;
      const sk = reg?.getSkill(sid, lv);
      if (!sk || !sk.allowedHeroes.includes(h)) continue;
      const missingPre = (sk.prerequisites || []).some((pre) => Number(state.skillLevels?.[pre] || 0) < 1);
      if (missingPre) continue;
      resolved.push(sk);
    }
    return resolved.slice(0, 5);
  }

  // Pronunciation audio playback does NOT count toward reviewed/mastered unlock milestones
  function recordPronunciationPlay(word) {
    const state = loadState();
    state.learningStats.pronunciationPlays = Number(state.learningStats.pronunciationPlays || 0) + 1;
    saveState(state);
    return state;
  }

  function recordWordRecallAttempt(word, isCorrect) {
    const state = loadState();
    const normalized = String(word || '').trim().toUpperCase().replace(/[^A-Z]/g, '');
    if (!normalized) return { ok: false, isNewUnique: false, state };

    const unique = Array.isArray(state.learningStats.uniqueReviewedWords)
      ? [...state.learningStats.uniqueReviewedWords]
      : [];
    const mastered = Array.isArray(state.learningStats.masteredWords)
      ? [...state.learningStats.masteredWords]
      : [];

    let isNewUnique = false;
    if (isCorrect) {
      state.learningStats.correctRecallAttempts = Number(state.learningStats.correctRecallAttempts || 0) + 1;
      if (!unique.includes(normalized)) {
        unique.push(normalized);
        isNewUnique = true;
      }
      if (!mastered.includes(normalized)) {
        mastered.push(normalized);
      }
    }
    state.learningStats.uniqueReviewedWords = unique;
    state.learningStats.masteredWords = mastered;
    state.learningStats.reviewedWordsCount = unique.length;
    saveState(state);
    return { ok: true, isNewUnique, uniqueCount: unique.length, state };
  }

  function recordJournalReview() {
    // Deprecated blind-increment path guarded against repeated farming
    return loadState();
  }

  function evaluateHeroUnlocks(state, grantedRewards = []) {
    const reg = root.RaidRegistry;
    if (!reg?.HEROES) return;
    Object.values(reg.HEROES).forEach((hero) => {
      const rule = hero.unlockRule;
      if (!rule || rule.type === 'STARTER') return;
      const heroKey = `hero_unlock_${hero.heroId}`;
      if (state.unlockedHeroes.includes(hero.heroId) && state.rewardedMilestones.includes(heroKey)) return;

      const stageOk = !rule.stageId || (Number(state.chapterProgress?.[rule.stageId]?.clears || 0) >= 1);
      const topicOk = !rule.minTopicWords || (Number(state.learningStats?.topicWordsSolved || 0) >= rule.minTopicWords);
      if (stageOk && topicOk) {
        if (!state.unlockedHeroes.includes(hero.heroId)) state.unlockedHeroes.push(hero.heroId);
        (hero.starterSkillIds || []).forEach((sid) => {
          if (!state.skillLevels[sid]) state.skillLevels[sid] = 1;
        });
        if (!state.rewardedMilestones.includes(heroKey)) {
          state.rewardedMilestones.push(heroKey);
          grantedRewards.push({
            type: 'HERO',
            id: hero.heroId,
            label: `Mở khóa Hero mới: ${hero.name}`,
            icon: hero.portrait,
            rarity: 'EPIC'
          });
        }
      }
    });
  }

  function recordBattleCompletion(summary = {}) {
    const reg = root.RaidRegistry;
    const state = loadState();
    const won = Boolean(summary.victory);
    const stageId = Number(summary.stageId || state.selectedStageId || 1);
    const isPractice = Boolean(summary.isPractice);
    const score = Number(summary.score || 0);
    const validWords = Number(summary.validWords || 0);
    const topicWords = Number(summary.topicWords || 0);
    const coreWords = Number(summary.coreWords || 0);

    state.learningStats.totalRuns += 1;
    state.learningStats.validWordsSolved += validWords;
    state.learningStats.topicWordsSolved += topicWords;
    state.learningStats.coreWordsSolved += coreWords;
    if (won) {
      state.learningStats.victories += 1;
      state.learningStats.bossesDefeated += 1;
    }

    const grantedRewards = [];
    if (won && !isPractice) {
      const stProg = state.chapterProgress[stageId] || { status: 'AVAILABLE', clears: 0, bestScore: 0, stars: 0 };
      const meetsMastery = topicWords >= (reg?.getStage(stageId)?.minTopicWordsForClear || 1);
      stProg.clears += 1;
      stProg.bestScore = Math.max(stProg.bestScore || 0, score);
      stProg.stars = Math.max(stProg.stars || 0, meetsMastery ? 3 : 2);
      // Never downgrade an already MASTERED chapter to COMPLETED
      if (stProg.status !== 'MASTERED') {
        stProg.status = meetsMastery ? 'MASTERED' : 'COMPLETED';
      }
      state.chapterProgress[stageId] = stProg;

      const nextStage = state.chapterProgress[stageId + 1];
      if (nextStage && nextStage.status === 'LOCKED') {
        nextStage.status = 'AVAILABLE';
        state.chapterProgress[stageId + 1] = nextStage;
      }

      const stageCfg = reg?.getStage(stageId);
      const rw = stageCfg?.rewards;
      if (rw) {
        // 1. Independent First-Clear Skill Points
        const firstClearKey = `stage_first_clear_${stageId}`;
        if (!state.rewardedMilestones.includes(firstClearKey)) {
          state.rewardedMilestones.push(firstClearKey);
          if (rw.skillPoints) {
            state.skillPoints += Number(rw.skillPoints);
            grantedRewards.push({ type: 'SP', label: `+${rw.skillPoints} Skill Points` });
          }
        }

        // 2. Independent Boss Skill Unlock (requires prerequisites already satisfied)
        if (rw.skillUnlock) {
          const sk = reg.SKILL_MAP[rw.skillUnlock];
          const skillKey = `skill_unlock_${rw.skillUnlock}`;
          const prereqsMet = (sk?.prerequisites || []).every((pre) => Number(state.skillLevels?.[pre] || 0) >= 1);
          if (sk && prereqsMet && !state.rewardedMilestones.includes(skillKey)) {
            state.rewardedMilestones.push(skillKey);
            if (!state.skillLevels[rw.skillUnlock]) state.skillLevels[rw.skillUnlock] = 1;
            grantedRewards.push({
              type: 'SKILL',
              id: rw.skillUnlock,
              label: `Mở khóa Skill: ${sk.name}`,
              icon: sk.icon,
              rarity: sk.rarity || 'RARE'
            });
          }
        }
      }

      // 3. Independent Hero Unlock evaluation (works on replay when missing topic condition is later fulfilled)
      evaluateHeroUnlocks(state, grantedRewards);
    }

    state.battleHistory.unshift({
      at: new Date().toISOString(),
      heroId: summary.heroId || state.selectedHero,
      stageId,
      mode: isPractice ? 'PRACTICE' : 'CAMPAIGN',
      victory: won,
      score,
      validWords,
      topicWords
    });
    state.battleHistory = state.battleHistory.slice(0, 20);
    saveState(state);
    return { state, grantedRewards };
  }

  function resetDemoProgression() {
    const fresh = createDefaultState();
    saveState(fresh);
    syncLegacyUnitPref(fresh.selectedHero);
    return fresh;
  }

  function hydrateFromServerSnapshot(snapshot, masterySummary) {
    if (!snapshot || typeof snapshot !== 'object') return loadState();
    const base = createDefaultState();
    const loadouts = { ...base.loadouts };
    if (snapshot.loadouts && typeof snapshot.loadouts === 'object') {
      Object.entries(snapshot.loadouts).forEach(([heroCode, hl]) => {
        const active = Array.isArray(hl?.activeSkillCodes) ? [...hl.activeSkillCodes] : [];
        if (hl?.ultimateSkillCode) active.push(hl.ultimateSkillCode);
        loadouts[heroCode] = active;
      });
    }
    const chapters = { ...base.chapterProgress };
    if (Array.isArray(snapshot.chapters)) {
      snapshot.chapters.forEach((ch) => {
        if (ch && ch.stageId) {
          chapters[ch.stageId] = {
            status: ch.status || 'LOCKED',
            clears: Number(ch.clears || 0),
            bestScore: Number(ch.bestScore || 0),
            stars: Number(ch.stars || 0)
          };
        }
      });
    }
    const reviewedWords = Array.isArray(masterySummary?.items)
      ? masterySummary.items.filter((m) => Number(m.timesAnsweredCorrect || 0) > 0).map((m) => String(m.wordText || '').trim().toUpperCase()).filter(Boolean)
      : [];
    const masteredWords = Array.isArray(masterySummary?.items)
      ? masterySummary.items.filter((m) => String(m.masteryState || '').toUpperCase() === 'MASTERED').map((m) => String(m.wordText || '').trim().toUpperCase()).filter(Boolean)
      : [];

    const hydrated = {
      ...base,
      modeLabel: 'BACKEND_CONNECTED (SQL Server)',
      serverSynced: true,
      skillPoints: Number(snapshot.skillPoints ?? 3),
      selectedHero: snapshot.selectedHeroCode || 'warrior',
      unlockedHeroes: Array.isArray(snapshot.unlockedHeroes) && snapshot.unlockedHeroes.length
        ? snapshot.unlockedHeroes
        : base.unlockedHeroes,
      skillLevels: snapshot.skillLevels && typeof snapshot.skillLevels === 'object'
        ? { ...snapshot.skillLevels }
        : base.skillLevels,
      loadouts,
      chapterProgress: chapters,
      rewardedMilestones: Array.isArray(snapshot.rewardedMilestones) ? snapshot.rewardedMilestones : [],
      learningStats: {
        ...base.learningStats,
        topicWordsSolved: Number(masterySummary?.topicWordsSolved ?? snapshot.topicWordsSolved ?? 0),
        uniqueReviewedWords: reviewedWords,
        masteredWords,
        reviewedWordsCount: Number(masterySummary?.uniqueReviewedCount ?? snapshot.uniqueReviewedWordsCount ?? reviewedWords.length)
      }
    };
    saveState(hydrated);
    syncLegacyUnitPref(hydrated.selectedHero);
    return hydrated;
  }

  root.RaidProgressionStore = {
    STORE_KEY,
    loadState,
    saveState,
    hydrateFromServerSnapshot,
    isHeroUnlocked,
    selectHero,
    getUniqueReviewedCount,
    getSkillStatus,
    learnOrUpgradeSkill,
    validateLoadoutForHero,
    setHeroLoadout,
    toggleSkillInLoadout,
    getActiveCombatLoadout,
    recordPronunciationPlay,
    recordWordRecallAttempt,
    recordJournalReview,
    evaluateHeroUnlocks,
    recordBattleCompletion,
    resetDemoProgression
  };
})(window);
