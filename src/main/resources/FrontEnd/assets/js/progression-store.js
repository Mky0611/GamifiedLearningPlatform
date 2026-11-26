/**
 * LEX RAID P5 — Local Demo Progression Store (strictly separated from SQL Server DB state).
 * Persists hero unlocks, skill levels (Lv 1..3), loadouts (4 Active + max 1 Ultimate),
 * chapter progress, learning milestones, reward deduplication, and battle history.
 */
(function (root) {
  const STORE_KEY = 'glp.p5.demoProgression.v1';

  function createDefaultState() {
    const reg = root.RaidRegistry;
    const starterSkills = {};
    // Preserve all P4-B.2 / P4-B.3 baseline starter skills cleanly so existing experiences remain intact
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
        archer: [...(reg?.getHero('archer')?.defaultLoadout || ['quick_shot', 'piercing_arrow', 'triple_shot', 'sacred_recovery', 'celestial_arrow'])],
        lancer: [...(reg?.getHero('lancer')?.defaultLoadout || ['spear_thrust', 'impaling_charge', 'iron_fortress', 'sacred_recovery', 'dragon_lance'])],
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
      const merged = {
        ...def,
        ...parsed,
        skillLevels: { ...def.skillLevels, ...(parsed.skillLevels || {}) },
        loadouts: { ...def.loadouts, ...(parsed.loadouts || {}) },
        chapterProgress: { ...def.chapterProgress, ...(parsed.chapterProgress || {}) },
        learningStats: { ...def.learningStats, ...(parsed.learningStats || {}) },
        unlockedHeroes: Array.from(new Set([...(def.unlockedHeroes), ...(Array.isArray(parsed.unlockedHeroes) ? parsed.unlockedHeroes : [])])),
        rewardedMilestones: Array.isArray(parsed.rewardedMilestones) ? parsed.rewardedMilestones : [],
        battleHistory: Array.isArray(parsed.battleHistory) ? parsed.battleHistory.slice(0, 20) : []
      };
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
      if (prefs.unitCode !== heroId && root.GLP_API?.saveAccountPreferences) {
        root.GLP_API.saveAccountPreferences({ ...prefs, unitCode: heroId });
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

  function checkLearningCondition(rule, state) {
    if (!rule) return { met: true };
    const stats = state.learningStats || {};
    if (rule.type === 'STAGE_CLEAR' && rule.stageId) {
      const st = state.chapterProgress?.[rule.stageId];
      if (!st || (st.clears || 0) < 1) {
        return { met: false, reason: `Cần hoàn thành Stage ${rule.stageId} trước (hoặc đạt điều kiện nhánh).` };
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
    if (rule.minReviewedWords && Number(stats.reviewedWordsCount || 0) < rule.minReviewedWords) {
      return { met: false, reason: `Cần ôn tập >= ${rule.minReviewedWords} từ trong Vocabulary Journal.` };
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
      return {
        state: hasSp ? 'UPGRADE_AVAILABLE' : (equipped ? 'EQUIPPED' : 'LEARNED'),
        level,
        equipped,
        canLearn: false,
        canUpgrade: hasSp,
        reason: hasSp ? `Cần 1 SP để nâng cấp lên Lv ${level + 1}.` : 'Cần 1 Skill Point để nâng cấp.'
      };
    }
    if (missingPre.length > 0) {
      const names = missingPre.map((id) => reg.SKILL_MAP[id]?.name || id).join(', ');
      return { state: 'LOCKED', level: 0, equipped: false, canLearn: false, canUpgrade: false, reason: `Cần học kỹ năng tiên quyết: ${names}` };
    }
    if (!cond.met && !hasSp) {
      return { state: 'LOCKED', level: 0, equipped: false, canLearn: false, canUpgrade: false, reason: cond.reason };
    }
    if (!cond.met && sk.unlockRule?.type === 'LEARNING') {
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
    const rawIds = state.loadouts?.[h] || reg?.getHero(h)?.defaultLoadout || [];
    const resolved = [];
    for (const sid of rawIds) {
      const lv = Number(state.skillLevels?.[sid] || 0);
      if (lv < 1) continue;
      const sk = reg?.getSkill(sid, lv);
      if (sk && sk.allowedHeroes.includes(h)) resolved.push(sk);
    }
    if (resolved.length === 0) {
      const fallbackId = reg?.getHero(h)?.starterSkillIds?.[0] || 'knight_slash';
      const sk = reg?.getSkill(fallbackId, 1);
      if (sk) resolved.push(sk);
    }
    return resolved;
  }

  function recordJournalReview(countDelta = 1) {
    const state = loadState();
    state.learningStats.reviewedWordsCount = Number(state.learningStats.reviewedWordsCount || 0) + Math.max(0, Number(countDelta || 0));
    saveState(state);
    return state;
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
      stProg.status = meetsMastery ? 'MASTERED' : 'COMPLETED';
      state.chapterProgress[stageId] = stProg;

      const nextStage = state.chapterProgress[stageId + 1];
      if (nextStage && nextStage.status === 'LOCKED') {
        nextStage.status = 'AVAILABLE';
        state.chapterProgress[stageId + 1] = nextStage;
      }

      const stageCfg = reg?.getStage(stageId);
      const milestoneKey = `stage_first_clear_${stageId}`;
      if (!state.rewardedMilestones.includes(milestoneKey) && stageCfg?.rewards) {
        state.rewardedMilestones.push(milestoneKey);
        const rw = stageCfg.rewards;
        if (rw.skillPoints) {
          state.skillPoints += Number(rw.skillPoints);
          grantedRewards.push({ type: 'SP', label: `+${rw.skillPoints} Skill Points` });
        }
        if (rw.skillUnlock && !state.skillLevels[rw.skillUnlock]) {
          state.skillLevels[rw.skillUnlock] = 1;
          const sk = reg.SKILL_MAP[rw.skillUnlock];
          grantedRewards.push({
            type: 'SKILL',
            id: rw.skillUnlock,
            label: `Mở khóa Skill: ${sk?.name || rw.skillUnlock}`,
            icon: sk?.icon,
            rarity: sk?.rarity || 'RARE'
          });
        }
        if (rw.heroUnlock) {
          const hero = reg.getHero(rw.heroUnlock);
          const minTopics = hero?.unlockRule?.minTopicWords || 1;
          if (!state.unlockedHeroes.includes(rw.heroUnlock) && state.learningStats.topicWordsSolved >= minTopics) {
            state.unlockedHeroes.push(rw.heroUnlock);
            hero.starterSkillIds.forEach((sid) => {
              if (!state.skillLevels[sid]) state.skillLevels[sid] = 1;
            });
            grantedRewards.push({
              type: 'HERO',
              id: rw.heroUnlock,
              label: `Mở khóa Hero mới: ${hero.name}`,
              icon: hero.portrait,
              rarity: 'EPIC'
            });
          }
        }
      }
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

  root.RaidProgressionStore = {
    STORE_KEY,
    loadState,
    saveState,
    isHeroUnlocked,
    selectHero,
    getSkillStatus,
    learnOrUpgradeSkill,
    validateLoadoutForHero,
    setHeroLoadout,
    toggleSkillInLoadout,
    getActiveCombatLoadout,
    recordJournalReview,
    recordBattleCompletion,
    resetDemoProgression
  };
})(window);
