/**
 * 5-Wave Encounter Registry & Monster Trait Mechanics (Phase P4-B.3 Milestone D)
 * Runs multi-wave sequencing and monster traits cleanly in Preview Mode while leaving
 * live server RaidSession state strictly authoritative.
 */
(function () {
  const WAVE_TIERS = [
    { waveIndex: 1, rarity: 'NORMAL',       label: 'Thường (Đợt 1)', hpScale: 0.78, shieldScale: 0.55, atkScale: 0.85 },
    { waveIndex: 2, rarity: 'NORMAL',       label: 'Thường (Đợt 2)', hpScale: 0.88, shieldScale: 0.70, atkScale: 0.92 },
    { waveIndex: 3, rarity: 'ELITE',        label: 'Tinh Anh (Đợt 3)', hpScale: 1.00, shieldScale: 0.95, atkScale: 1.05 },
    { waveIndex: 4, rarity: 'GUARDIAN',     label: 'Hộ Vệ (Đợt 4)', hpScale: 1.14, shieldScale: 1.15, atkScale: 1.15 },
    { waveIndex: 5, rarity: 'CHAPTER_BOSS', label: 'Thủ Lĩnh Ải',   hpScale: 1.32, shieldScale: 1.35, atkScale: 1.30 }
  ];

  const POOLS = {
    NORMAL: ['crabby', 'slime', 'seashell', 'pink', 'fierce'],
    ELITE: ['fierce', 'pink', 'skeleton', 'totem1', 'cannon'],
    GUARDIAN: ['totem2', 'totem3', 'cannon', 'skeleton', 'crabby'],
    CHAPTER_BOSS: ['captain', 'totem3', 'skeleton']
  };

  const MONSTER_TRAITS = {
    crabby: {
      id: 'SHELL_GUARD',
      name: 'Vỏ Cứng Đại Dương',
      telegraph: 'Mỗi 3 lượt tự gia cố +8 Shield',
      weakness: 'Thunder Strike phá giáp x2',
      onBossTurn: (ctx) => {
        if (ctx.waveTurn % 3 === 0) {
          return { addShield: 8, note: 'Crabby dựng mai (+8 Shield)!' };
        }
        return null;
      }
    },
    slime: {
      id: 'ACID_REGEN',
      name: 'Tái Tạo Tinh Linh',
      telegraph: 'Hồi +8 HP mỗi lượt (Fire đốt cháy sẽ ngắt hồi)',
      weakness: 'Fire Blade ngăn hồi máu',
      onBossTurn: (ctx) => {
        if (!ctx.hasBurn) {
          return { healHp: 8, note: 'Verdant Slime tái tạo +8 HP!' };
        }
        return { note: 'Ngọn lửa ngăn Slime hồi máu!' };
      }
    },
    fierce: {
      id: 'FRENZY_BITE',
      name: 'Cuồng Nộ Săn Mồi',
      telegraph: 'Tăng nộ nhanh; Phase 2 cắn x1.35 DMG',
      weakness: 'Frost Seal làm chậm đòn',
      onBossTurn: (ctx) => ({
        addRage: 2,
        dmgMultiplier: ctx.phase >= 2 ? 1.35 : 1.0,
        note: ctx.phase >= 2 ? 'Fierce Tooth nổi điên x1.35 sát thương!' : null
      })
    },
    skeleton: {
      id: 'BONE_ARMOR',
      name: 'Xương Cổ Giáp Sắt',
      telegraph: 'Kháng 20% từ thường · Yếu x1.35 với từ Chủ đề',
      weakness: 'Topic Words gây x1.35 sát thương',
      modifyIncomingDamage: ({ damage, isTopicWord }) => (
        isTopicWord ? Math.round(damage * 1.35) : Math.max(4, Math.round(damage * 0.8))
      )
    },
    pink: {
      id: 'PRISM_COUNTER',
      name: 'Phản Quang San Hô',
      telegraph: 'Cảnh báo: từ 3 chữ chỉ x0.85 DMG · từ dài x1.25',
      weakness: 'Từ >= 5 ký tự xuyên lăng kính',
      modifyIncomingDamage: ({ damage, wordLength }) => (
        wordLength >= 5 ? Math.round(damage * 1.25) : Math.max(4, Math.round(damage * 0.85))
      )
    },
    totem1: {
      id: 'RUNE_WARD',
      name: 'Cổ Ngữ Phù Chú',
      telegraph: 'Từ >= 5 ký tự phá xuyên Shield',
      weakness: 'Long Word (>= 5 ký tự)',
      bypassShieldIfLong: true
    },
    totem2: {
      id: 'RUNE_WARD',
      name: 'Cổ Ngữ Phù Chú II',
      telegraph: 'Từ >= 5 ký tự phá xuyên Shield',
      weakness: 'Long Word (>= 5 ký tự)',
      bypassShieldIfLong: true
    },
    totem3: {
      id: 'RUNE_WARD',
      name: 'Cổ Ngữ Tối Thượng',
      telegraph: 'Từ >= 5 ký tự phá xuyên Shield · Phase 2 tụ nộ',
      weakness: 'Long Word (>= 5 ký tự)',
      bypassShieldIfLong: true
    },
    seashell: {
      id: 'PEARL_VAULT',
      name: 'Ngọc Trai Đóng Mở',
      telegraph: 'Lượt chẵn mở vỏ nhận x1.3 DMG · Lượt lẻ giảm 20%',
      weakness: 'Đánh mạnh ở lượt chẵn',
      modifyIncomingDamage: ({ damage, turn }) => (
        turn % 2 === 0 ? Math.round(damage * 1.3) : Math.max(4, Math.round(damage * 0.8))
      )
    },
    cannon: {
      id: 'BARRAGE_CHARGE',
      name: 'Nạp Pháo Hạng Nặng',
      telegraph: 'Mỗi 2 lượt bắn pháo x1.4 DMG (Royal Guard để chặn)',
      weakness: 'Royal Guard hoặc Frost Seal',
      onBossTurn: (ctx) => {
        if (ctx.waveTurn % 2 === 0) {
          return { dmgMultiplier: 1.4, note: 'Cannon Golem khai hỏa x1.4 DMG!' };
        }
        return { note: 'Cannon Golem đang nạp đạn cho lượt sau!' };
      }
    },
    captain: {
      id: 'PIRATE_CAPTAIN',
      name: 'Thuyền Trưởng Hải Tặc',
      telegraph: 'Dưới 50% HP kích hoạt Phase 2 (+14 Shield & Nộ)',
      weakness: 'Core Word & Lexical Judgment',
      hasPhase2: true
    }
  };

  function mulberry32(seedNum) {
    let a = (Number(seedNum) || 2026) >>> 0;
    return function () {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function generateFiveWavePlan({ chapterNo = 1, seed = 101, chapterBossTheme = null } = {}) {
    const ch = Math.max(1, Number(chapterNo || 1));
    const rng = mulberry32(seed + ch * 409);
    const plan = [];
    let prevTheme = null;

    for (let i = 0; i < WAVE_TIERS.length; i++) {
      const tier = WAVE_TIERS[i];
      let theme;
      if (tier.rarity === 'CHAPTER_BOSS') {
        const fallbackBoss = POOLS.CHAPTER_BOSS[(ch - 1) % POOLS.CHAPTER_BOSS.length];
        theme = chapterBossTheme || fallbackBoss;
      } else {
        const pool = POOLS[tier.rarity].filter((t) => t !== prevTheme);
        theme = pool[Math.floor(rng() * pool.length)] || POOLS[tier.rarity][0];
      }
      prevTheme = theme;
      const traitsActive = ch >= 2 || tier.rarity !== 'NORMAL';
      const trait = MONSTER_TRAITS[theme] || MONSTER_TRAITS.crabby;
      plan.push({
        ...tier,
        theme,
        chapterNo: ch,
        traitsActive,
        traitId: trait.id,
        traitName: trait.name,
        telegraph: traitsActive ? trait.telegraph : 'Chapter 1 nhập môn: đòn đánh cân bằng, chưa kích hoạt hiệu ứng phức tạp.',
        weakness: trait.weakness
      });
    }
    return plan;
  }

  function getMonsterTrait(theme) {
    return MONSTER_TRAITS[theme] || MONSTER_TRAITS.crabby;
  }

  window.LexRaidEncounters = {
    TOTAL_WAVES: 5,
    WAVE_TIERS,
    MONSTER_TRAITS,
    generateFiveWavePlan,
    getMonsterTrait
  };
})();
