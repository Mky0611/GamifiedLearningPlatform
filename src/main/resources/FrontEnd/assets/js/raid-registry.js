/**
 * LEX RAID P5 — Hero, Skill Evolution, Animation Profile & Chapter Progression Registry
 * Single source of truth consumed by Character Hall, Spellbook, BattleScene, and API integration.
 */
(function (root) {
  const ANIMATION_PROFILES = {
    MELEE_SLASH: { id: 'MELEE_SLASH', label: 'Melee Slash', isRanged: false, selfTarget: false, description: 'Áp sát nhanh -> vung vũ khí cận chiến -> tia lửa va chạm -> lùi về.' },
    DASH_STRIKE: { id: 'DASH_STRIKE', label: 'Dash Strike', isRanged: false, selfTarget: false, description: 'Tụ lực -> lướt bóng ảnh (Blink Dash) -> chém xuyên tâm -> hồi vị trí.' },
    PROJECTILE: { id: 'PROJECTILE', label: 'Projectile', isRanged: true, selfTarget: false, description: 'Đứng giữ vị trí tầm xa -> bắn đạn/tiễn bay tới mục tiêu -> nổ va chạm.' },
    CHANNEL_BEAM: { id: 'CHANNEL_BEAM', label: 'Channel Beam', isRanged: true, selfTarget: false, description: 'Triệu hồi vòng ma pháp -> phóng tia năng lượng nối tới Boss -> nhiều nhịp trúng.' },
    GROUND_CAST: { id: 'GROUND_CAST', label: 'Ground Cast', isRanged: true, selfTarget: false, description: 'Niệm chú từ xa -> khắc ấn cổ ngữ dưới chân Boss -> bùng nổ trồi lên.' },
    SKY_STRIKE: { id: 'SKY_STRIKE', label: 'Sky Strike', isRanged: true, selfTarget: false, description: 'Cảnh báo trên không -> sấm sét / thiên thạch / thánh kiếm giáng xuống Boss.' },
    SHIELD_CAST: { id: 'SHIELD_CAST', label: 'Shield Cast', isRanged: true, selfTarget: true, description: 'Thế phòng ngự -> dựng kết giới bảo vệ quanh Hero -> giảm sát thương & phản đòn.' },
    SELF_HEAL: { id: 'SELF_HEAL', label: 'Self Heal', isRanged: true, selfTarget: true, description: 'Niệm chú/bình hồi phục -> vầng hào quang sinh lực -> cộng HP màu xanh.' },
    MULTI_HIT: { id: 'MULTI_HIT', label: 'Multi-Hit Flurry', isRanged: false, selfTarget: false, description: 'Ra đòn liên hoàn 2-3 nhịp với số sát thương tách rời từng đòn.' },
    ULTIMATE: { id: 'ULTIMATE', label: 'Ultimate Burst', isRanged: true, selfTarget: false, description: 'Vòng trận triệu hồi trung tâm -> chiêu cuối bùng nổ & hiệu ứng kết thúc.' }
  };

  const HEROES = {
    warrior: {
      heroId: 'warrior',
      name: 'Knight (Warrior)',
      shortName: 'Knight',
      title: 'Cận Vệ Hoàng Gia',
      role: 'Cân bằng • 3 nhánh kỹ năng',
      archetype: 'MELEE',
      isRanged: false,
      baseHp: 112,
      baseMp: 6,
      maxMp: 8,
      attackScale: 1.0,
      portrait: '/ui/assets/ui/avatars/portrait-hero-warrior.png',
      strengths: [
        'Sở hữu 3 nhánh Sword Master / Guardian / Holy Knight',
        'Thích nghi tốt cả công, thủ, hồi máu & phá khiên'
      ],
      weaknesses: [
        'Phần lớn kỹ năng cần áp sát Boss',
        'Chiêu cuối phụ thuộc manh mối Core Word'
      ],
      unlockRule: { type: 'STARTER', label: 'Starter (Mở khóa sẵn)' },
      starterSkillIds: ['knight_slash', 'heavy_slash', 'royal_guard', 'blade_storm', 'sacred_recovery', 'lexical_judgment'],
      defaultLoadout: ['knight_slash', 'heavy_slash', 'royal_guard', 'sacred_recovery', 'lexical_judgment'],
      trees: [
        { branchId: 'sword_master', label: 'Sword Master', skillIds: ['knight_slash', 'heavy_slash', 'phantom_dash', 'blade_storm', 'earthbreaker'] },
        { branchId: 'guardian', label: 'Guardian', skillIds: ['royal_guard', 'shield_counter', 'divine_aegis'] },
        { branchId: 'holy_knight', label: 'Holy Knight', skillIds: ['sacred_recovery', 'rune_prison', 'heavens_pillar', 'lexical_judgment'] }
      ]
    },
    archer: {
      heroId: 'archer',
      name: 'Ranger (Archer)',
      shortName: 'Archer',
      title: 'Xạ Thủ Rừng Thẳm',
      role: 'Tầm xa • Bắn đa tiễn',
      archetype: 'RANGED',
      isRanged: true,
      baseHp: 96,
      baseMp: 7,
      maxMp: 9,
      attackScale: 1.06,
      portrait: '/ui/assets/ui/avatars/portrait-hero-archer.png',
      strengths: [
        'Bắn tiễn tầm xa từ vị trí an toàn, không lao vào Boss',
        'Liên hoàn Triple Shot bào mòn HP & Shield nhanh'
      ],
      weaknesses: [
        'Lượng máu cơ bản thấp hơn Knight và Lancer'
      ],
      unlockRule: { type: 'STARTER', label: 'Starter / Chapter 1 Ranger' },
      starterSkillIds: ['quick_shot', 'piercing_arrow', 'triple_shot', 'sacred_recovery'],
      defaultLoadout: ['quick_shot', 'piercing_arrow', 'triple_shot', 'sacred_recovery'],
      trees: [
        { branchId: 'marksman', label: 'Marksman Path', skillIds: ['quick_shot', 'piercing_arrow', 'triple_shot', 'celestial_arrow'] }
      ]
    },
    lancer: {
      heroId: 'lancer',
      name: 'Vanguard (Lancer)',
      shortName: 'Lancer',
      title: 'Thương Kỵ Tiên Phong',
      role: 'Phá giáp • Phản công',
      archetype: 'MELEE',
      isRanged: false,
      baseHp: 118,
      baseMp: 6,
      maxMp: 8,
      attackScale: 1.04,
      portrait: '/ui/assets/ui/avatars/portrait-hero-lancer.png',
      strengths: [
        'Đột kích phá giáp cực mạnh và Iron Fortress giảm 82% sát thương',
        'Sinh lực cao, bền bỉ trong trận đánh dài hơi'
      ],
      weaknesses: [
        'Ít kỹ năng phép thuật diện rộng'
      ],
      unlockRule: { type: 'STARTER', label: 'Starter / Chapter 2 Vanguard' },
      starterSkillIds: ['spear_thrust', 'impaling_charge', 'iron_fortress', 'sacred_recovery'],
      defaultLoadout: ['spear_thrust', 'impaling_charge', 'iron_fortress', 'sacred_recovery'],
      trees: [
        { branchId: 'vanguard', label: 'Vanguard Path', skillIds: ['spear_thrust', 'impaling_charge', 'iron_fortress', 'dragon_lance'] }
      ]
    },
    arcane_mage: {
      heroId: 'arcane_mage',
      name: 'Arcane Mage',
      shortName: 'Mage',
      title: 'Hiền Triết Ngôn Từ',
      role: 'Pháp sư • Sky Strike & Beam',
      archetype: 'RANGED',
      isRanged: true,
      baseHp: 94,
      baseMp: 8,
      maxMp: 10,
      attackScale: 1.12,
      portrait: '/ui/assets/ui/avatars/portrait-hero-arcane_mage.png',
      strengths: [
        'Toàn bộ chiêu thức đánh tầm xa bằng Projectile, Beam và Meteor Sky Strike',
        'Sức chứa Mana tối đa cao (10 MP), tối ưu chuỗi combo từ vựng'
      ],
      weaknesses: [
        'Lượng HP thấp nhất đội hình, cần tận dụng Mana & khiên hợp lý'
      ],
      unlockRule: {
        type: 'STAGE_AND_LEARNING',
        stageId: 1,
        minTopicWords: 1,
        label: 'Hoàn thành Stage 1 (Bến Cảng Khởi Đầu) & giải >= 1 từ Topic'
      },
      starterSkillIds: ['magic_bolt', 'fireball', 'sacred_recovery'],
      defaultLoadout: ['magic_bolt', 'fireball', 'arcane_beam', 'sacred_recovery', 'meteor_fall'],
      trees: [
        { branchId: 'elementalist', label: 'Elementalist Path', skillIds: ['magic_bolt', 'fireball', 'arcane_beam', 'meteor_fall'] }
      ]
    }
  };

  const BACKLOG_HEROES = [
    {
      heroId: 'monk',
      name: 'Monk',
      status: 'LICENSE_PENDING',
      reason: 'Chưa có file LICENSE hợp lệ trong gói Tiny Swords (Free Pack)/Units/Monk; không đưa vào roster public.'
    },
    {
      heroId: 'rogue',
      name: 'Rogue',
      status: 'BACKLOG',
      reason: 'Spritesheet 32x32 top-down 4 hướng không đồng bộ tỷ lệ side-view 192px/210px và thiếu license riêng.'
    }
  ];

  const CHAPTER_STAGES = [
    {
      stageId: 1,
      chapter: 1,
      title: 'Bến Cảng Khởi Đầu',
      subtitle: 'Chapter 1 • Khởi hành',
      biome: 'dusk',
      bossTheme: 'crabby',
      bossRarity: 'CHAPTER_BOSS',
      topicBias: 'basic',
      waves: 5,
      bossHpBase: 140,
      minTopicWordsForClear: 1,
      unlockAfterStage: null,
      lore: 'Cửa biển yên ả nơi Cua Khổng Lồ Crabby trấn giữ những từ vựng nền tảng đầu tiên.',
      rewards: {
        skillPoints: 2,
        heroUnlock: 'arcane_mage',
        skillUnlock: 'phantom_dash',
        badge: 'Dấu Ấn Bến Cảng'
      }
    },
    {
      stageId: 2,
      chapter: 2,
      title: 'Đầm Lầy Răng Nanh',
      subtitle: 'Chapter 2 • Thử lửa',
      biome: 'forest',
      bossTheme: 'fierce',
      bossRarity: 'CHAPTER_BOSS',
      topicBias: 'nature',
      waves: 5,
      bossHpBase: 175,
      minTopicWordsForClear: 1,
      unlockAfterStage: 1,
      lore: 'Rừng rậm u tối bị Fierce Tooth chiếm cứ — nơi rèn kỹ năng phòng thủ phản công.',
      rewards: {
        skillPoints: 2,
        heroUnlock: null,
        skillUnlock: 'shield_counter',
        badge: 'Khiên Đầm Lầy'
      }
    },
    {
      stageId: 3,
      chapter: 3,
      title: 'Đền Thờ Totem Cổ',
      subtitle: 'Chapter 3 • Cổ ngữ',
      biome: 'canyon',
      bossTheme: 'totem1',
      bossRarity: 'CHAPTER_BOSS',
      topicBias: 'knowledge',
      waves: 5,
      bossHpBase: 205,
      minTopicWordsForClear: 2,
      unlockAfterStage: 2,
      lore: 'Tượng thần cổ đại giữ phong ấn cổ ngữ; đòi hỏi từ đúng chủ đề để phá giáp.',
      rewards: {
        skillPoints: 2,
        heroUnlock: null,
        skillUnlock: 'rune_prison',
        badge: 'Ấn Ký Totem'
      }
    },
    {
      stageId: 4,
      chapter: 4,
      title: 'Pháo Đài Đại Bác',
      subtitle: 'Chapter 4 • Thiết giáp',
      biome: 'town',
      bossTheme: 'cannon',
      bossRarity: 'CHAPTER_BOSS',
      topicBias: 'technology',
      waves: 5,
      bossHpBase: 235,
      minTopicWordsForClear: 2,
      unlockAfterStage: 3,
      lore: 'Pháo đài sắt thép với lớp khiên dày đặc, thử thách sức mạnh phá giáp Earthbreaker.',
      rewards: {
        skillPoints: 3,
        heroUnlock: null,
        skillUnlock: 'earthbreaker',
        badge: 'Chìa Khóa Pháo Đài'
      }
    },
    {
      stageId: 5,
      chapter: 5,
      title: 'Đỉnh Hoàng Hôn Captain',
      subtitle: 'Chapter 5 • Huyền thoại',
      biome: 'dusk',
      bossTheme: 'captain',
      bossRarity: 'CHAPTER_BOSS',
      topicBias: 'fantasy',
      waves: 5,
      bossHpBase: 270,
      minTopicWordsForClear: 3,
      unlockAfterStage: 4,
      lore: 'Trận quyết đấu cuối cùng chống Captain Clown Nose để khai mở Thánh Trụ Ngôn Từ.',
      rewards: {
        skillPoints: 4,
        heroUnlock: null,
        skillUnlock: 'heavens_pillar',
        badge: 'Huy Chương Đường Huyền Thoại'
      }
    }
  ];

  // 27 active working skills across 4 verified hero classes + shared elemental spells
  const SKILLS = [
    // === KNIGHT: SWORD MASTER ===
    {
      id: 'knight_slash', name: 'Knight Slash', heroId: 'warrior', allowedHeroes: ['warrior'],
      branch: 'Sword Master', deckGroup: 'knight', tier: 1, rarity: 'COMMON', isUltimate: false,
      icon: '/ui/assets/ui/kibyra/icon17.png', manaCost: 0, cooldown: 0,
      animationProfile: 'MELEE_SLASH', heroAnim: 'attack', vfxAnim: 'vfx-slash-side', vfxHitAnim: 'vfx-spark-ember-anim', vfxScale: 2.2,
      prerequisites: [], unlockRule: { type: 'STARTER', label: 'Kỹ năng khởi đầu Knight' },
      levels: {
        1: { dmg: 14, manaCost: 0, cooldown: 0, summary: '14 DMG cận chiến, 0 MP, hồi nhịp giữa combo từ.' },
        2: { dmg: 18, manaCost: 0, cooldown: 0, summary: 'Tiến hóa Lv2: 18 DMG + tăng 15% xuyên khiên.' },
        3: { dmg: 23, manaCost: 0, cooldown: 0, shieldMultiplier: 1.25, summary: 'Tiến hóa Lv3: 23 DMG + 1.25x phá khiên.' }
      },
      previewDmg: 14, desc: 'Nhát chém hiệp sĩ chuẩn mực, tiêu hao 0 Mana.'
    },
    {
      id: 'heavy_slash', name: 'Heavy Slash', heroId: 'warrior', allowedHeroes: ['warrior'],
      branch: 'Sword Master', deckGroup: 'knight', tier: 2, rarity: 'RARE', isUltimate: false,
      icon: '/ui/assets/ui/kibyra/icon18.png', manaCost: 2, cooldown: 2,
      animationProfile: 'MELEE_SLASH', heroAnim: 'attack2', vfxAnim: 'vfx-slash-down', vfxHitAnim: 'vfx-fire-burst-anim', vfxScale: 2.5, hitStopMs: 45,
      prerequisites: ['knight_slash'], unlockRule: { type: 'STARTER', label: 'Học hoặc nâng cấp bằng Skill Point' },
      levels: {
        1: { dmg: 22, manaCost: 2, cooldown: 2, summary: '22 DMG chém bổ hạng nặng kích nổ hỏa diễm.' },
        2: { dmg: 28, manaCost: 2, cooldown: 2, applyStatus: 'burn', statusTurns: 1, summary: 'Tiến hóa Lv2: 28 DMG + Burn 1 lượt (-7 HP).' },
        3: { dmg: 35, manaCost: 2, cooldown: 2, applyStatus: 'burn', statusTurns: 2, summary: 'Tiến hóa Lv3: 35 DMG + Burn 2 lượt & choáng nhẹ.' }
      },
      previewDmg: 22, desc: 'Bổ kiếm hạng nặng kích nổ hỏa diễm, nâng Lv2-3 thêm hiệu ứng Thiêu đốt.'
    },
    {
      id: 'phantom_dash', name: 'Phantom Dash', heroId: 'warrior', allowedHeroes: ['warrior'],
      branch: 'Sword Master', deckGroup: 'knight', tier: 2, rarity: 'RARE', isUltimate: false,
      icon: '/ui/assets/ui/questwood/Skills/shadow_step.png', manaCost: 2, cooldown: 2,
      animationProfile: 'DASH_STRIKE', heroAnim: 'attack2', vfxAnim: 'vfx-pvfx-blink-dash', vfxHitAnim: 'vfx-slash-hit', vfxScale: 2.2,
      prerequisites: ['knight_slash'], unlockRule: { type: 'STAGE_CLEAR', stageId: 1, label: 'Đánh bại Boss Stage 1' },
      levels: {
        1: { dmg: 20, manaCost: 2, cooldown: 2, hitCount: 2, summary: 'Lướt bóng chém 2 nhịp (20 DMG tổng).' },
        2: { dmg: 27, manaCost: 2, cooldown: 2, hitCount: 2, summary: 'Tiến hóa Lv2: Lướt kép nhanh hơn (27 DMG).' },
        3: { dmg: 34, manaCost: 2, cooldown: 1, hitCount: 2, summary: 'Tiến hóa Lv3: 34 DMG, giảm Cooldown còn 1 lượt.' }
      },
      previewDmg: 20, hitCount: 2, desc: 'Lướt bóng Blink Dash áp sát chém chớp nhoáng 2 nhịp.'
    },
    {
      id: 'blade_storm', name: 'Blade Storm', heroId: 'warrior', allowedHeroes: ['warrior'],
      branch: 'Sword Master', deckGroup: 'knight', tier: 3, rarity: 'EPIC', isUltimate: false,
      icon: '/ui/assets/ui/kibyra/icon26.png', manaCost: 3, cooldown: 3, minCombo: 2,
      animationProfile: 'MULTI_HIT', heroAnim: 'attack2', vfxAnim: 'vfx-slash-spin', vfxExtraAnim: 'vfx-slash-side', vfxHitAnim: 'vfx-ring-ember-anim', vfxScale: 2.6,
      prerequisites: ['heavy_slash'], unlockRule: { type: 'STARTER', label: 'Yêu cầu Heavy Slash Lv1 + Combo >= x2 khi dùng' },
      levels: {
        1: { dmg: 24, hitCount: 3, manaCost: 3, cooldown: 3, summary: '3 nhát xoáy kiếm liên hoàn (24 DMG tổng, cần Combo >= x2).' },
        2: { dmg: 32, hitCount: 3, manaCost: 3, cooldown: 3, summary: 'Tiến hóa Lv2: 32 DMG qua 3 nhát xoáy kiếm.' },
        3: { dmg: 42, hitCount: 3, manaCost: 3, cooldown: 2, summary: 'Tiến hóa Lv3: 42 DMG, giảm Cooldown còn 2 lượt.' }
      },
      previewDmg: 24, hitCount: 3, desc: 'Xoáy kiếm 3 nhịp liên hoàn càn quét Boss (cần Combo >= x2).'
    },
    {
      id: 'earthbreaker', name: 'Earthbreaker', heroId: 'warrior', allowedHeroes: ['warrior'],
      branch: 'Sword Master', deckGroup: 'knight', tier: 3, rarity: 'EPIC', isUltimate: false,
      icon: '/ui/assets/ui/questwood/Skills/earth_spike.png', manaCost: 3, cooldown: 3,
      animationProfile: 'GROUND_CAST', heroAnim: 'attack2', vfxAnim: 'vfx-pvfx-ground-slam', vfxHitAnim: 'vfx-ice-spikes-anim', vfxScale: 2.2,
      prerequisites: ['phantom_dash'], unlockRule: { type: 'STAGE_CLEAR', stageId: 4, label: 'Đánh bại Boss Stage 4' },
      levels: {
        1: { dmg: 24, manaCost: 3, cooldown: 3, shieldMultiplier: 2.2, summary: '24 DMG nứt đất + x2.2 phá giáp Boss.' },
        2: { dmg: 31, manaCost: 3, cooldown: 3, shieldMultiplier: 2.6, summary: 'Tiến hóa Lv2: 31 DMG + x2.6 phá giáp Boss.' },
        3: { dmg: 39, manaCost: 3, cooldown: 2, shieldMultiplier: 3.0, applyStatus: 'stunOnBreak', summary: 'Tiến hóa Lv3: 39 DMG + x3 phá giáp & Choáng khi vỡ khiên.' }
      },
      previewDmg: 24, shieldMultiplier: 2.2, desc: 'Đập vỡ địa tầng ngay dưới Boss, chuyên trị phá giáp dày.'
    },

    // === KNIGHT: GUARDIAN ===
    {
      id: 'royal_guard', name: 'Royal Guard', heroId: 'warrior', allowedHeroes: ['warrior', 'lancer'],
      branch: 'Guardian', deckGroup: 'both', tier: 1, rarity: 'COMMON', isUltimate: false,
      icon: '/ui/assets/ui/kibyra/icon19.png', manaCost: 1, cooldown: 2, selfTarget: true,
      animationProfile: 'SHIELD_CAST', heroAnim: 'guard', vfxAnim: 'vfx-parry-frost-anim', vfxHitAnim: 'vfx-ring-frost-anim', vfxScale: 2.7,
      prerequisites: [], unlockRule: { type: 'STARTER', label: 'Kỹ năng phòng ngự cơ bản' },
      levels: {
        1: { mitigationPct: 75, reflectDmg: 6, manaCost: 1, cooldown: 2, summary: 'Giảm 75% sát thương Boss đòn kế & phản 6 DMG.' },
        2: { mitigationPct: 82, reflectDmg: 10, manaCost: 1, cooldown: 2, summary: 'Tiến hóa Lv2: Giảm 82% sát thương & phản 10 DMG.' },
        3: { mitigationPct: 90, reflectDmg: 15, manaCost: 1, cooldown: 1, summary: 'Tiến hóa Lv3: Giảm 90% sát thương & phản 15 DMG, CD 1.' }
      },
      mitigationPct: 75, reflectDmg: 6, desc: 'Dựng khiên hoàng gia hấp thụ phần lớn đòn Boss kế và phản đòn.'
    },
    {
      id: 'shield_counter', name: 'Shield Counter', heroId: 'warrior', allowedHeroes: ['warrior'],
      branch: 'Guardian', deckGroup: 'knight', tier: 2, rarity: 'RARE', isUltimate: false,
      icon: '/ui/assets/ui/questwood/Skills/magic_barrier.png', manaCost: 2, cooldown: 2, selfTarget: true,
      animationProfile: 'SHIELD_CAST', heroAnim: 'guard', vfxAnim: 'vfx-pvfx-shield-bubble', vfxHitAnim: 'vfx-ring-frost-anim', vfxScale: 2.3,
      prerequisites: ['royal_guard'], unlockRule: { type: 'STAGE_CLEAR', stageId: 2, label: 'Đánh bại Boss Stage 2' },
      levels: {
        1: { mitigationPct: 85, reflectDmg: 12, manaCost: 2, cooldown: 2, summary: 'Giảm 85% sát thương + phản 12 DMG xuyên giáp.' },
        2: { mitigationPct: 88, reflectDmg: 18, applyStatus: 'stun', statusTurns: 1, manaCost: 2, cooldown: 2, summary: 'Tiến hóa Lv2: Phản 18 DMG + làm Boss khựng 1 nhịp.' },
        3: { mitigationPct: 95, reflectDmg: 24, applyStatus: 'stun', statusTurns: 1, manaCost: 2, cooldown: 2, summary: 'Tiến hóa Lv3: Giảm 95% sát thương + phản 24 DMG.' }
      },
      mitigationPct: 85, reflectDmg: 12, desc: 'Kết giới ma pháp bọc quanh Knight, chặn gần như toàn bộ sát thương và phản lực mạnh.'
    },
    {
      id: 'divine_aegis', name: 'Divine Aegis', heroId: 'warrior', allowedHeroes: ['warrior'],
      branch: 'Guardian', deckGroup: 'knight', tier: 3, rarity: 'EPIC', isUltimate: false,
      icon: '/ui/assets/ui/questwood/Skills/magic_barrier.png', manaCost: 3, cooldown: 3, selfTarget: true,
      animationProfile: 'SHIELD_CAST', heroAnim: 'guard', vfxAnim: 'vfx-pvfx-holy-cast', vfxHitAnim: 'vfx-pvfx-shield-bubble', vfxScale: 2.3,
      prerequisites: ['shield_counter'], unlockRule: { type: 'LEARNING', minUniqueReviewedWords: 2, minStageCleared: 2, label: 'Vượt Stage 2 & ôn tập >= 2 từ duy nhất + có Shield Counter' },
      levels: {
        1: { mitigationPct: 90, reflectDmg: 14, healHp: 12, manaCost: 3, cooldown: 3, summary: 'Giảm 90% DMG, hồi 12 HP & phản 14 DMG.' },
        2: { mitigationPct: 92, reflectDmg: 18, healHp: 18, manaCost: 3, cooldown: 3, summary: 'Tiến hóa Lv2: Giảm 92% DMG, hồi 18 HP & phản 18 DMG.' },
        3: { mitigationPct: 96, reflectDmg: 24, healHp: 24, manaCost: 3, cooldown: 2, summary: 'Tiến hóa Lv3: Giảm 96% DMG, hồi 24 HP & phản 24 DMG.' }
      },
      mitigationPct: 90, reflectDmg: 14, healHp: 12, desc: 'Thánh thuẫn bảo hộ tối thượng: vừa chặn 90% sát thương vừa hồi phục HP.'
    },

    // === KNIGHT: HOLY KNIGHT & SHARED SUPPORT ===
    {
      id: 'sacred_recovery', name: 'Sacred Recovery', heroId: 'warrior', allowedHeroes: ['warrior', 'archer', 'lancer', 'arcane_mage'],
      branch: 'Holy Knight', deckGroup: 'both', tier: 1, rarity: 'COMMON', isUltimate: false,
      icon: '/ui/assets/ui/questwood/Skills/healing_spark.png', manaCost: 2, cooldown: 3, selfTarget: true,
      animationProfile: 'SELF_HEAL', heroAnim: 'guard', vfxAnim: 'vfx-pvfx-holy-heal', vfxHitAnim: 'vfx-heal-frost-anim', vfxScale: 2.2,
      prerequisites: [], unlockRule: { type: 'STARTER', label: 'Hồi phục thánh quang dùng chung các Class' },
      levels: {
        1: { healHp: 20, manaCost: 2, cooldown: 3, summary: 'Hồi phục +20 HP tức thì dưới hào quang thánh.' },
        2: { healHp: 28, manaCost: 2, cooldown: 3, summary: 'Tiến hóa Lv2: Hồi phục +28 HP + xóa khựng.' },
        3: { healHp: 38, manaCost: 2, cooldown: 2, summary: 'Tiến hóa Lv3: Hồi phục +38 HP, Cooldown giảm còn 2 lượt.' }
      },
      healHp: 20, desc: 'Triệu hồi ánh sáng thánh hồi phục HP, tương thích mọi lớp nhân vật.'
    },
    {
      id: 'rune_prison', name: 'Rune Prison', heroId: 'warrior', allowedHeroes: ['warrior'],
      branch: 'Holy Knight', deckGroup: 'knight', tier: 2, rarity: 'RARE', isUltimate: false,
      icon: '/ui/assets/ui/questwood/Skills/ice_spike.png', manaCost: 2, cooldown: 3, isRemoteSpell: true,
      animationProfile: 'GROUND_CAST', heroAnim: 'guard', vfxAnim: 'vfx-pvfx-rune-trap', vfxHitAnim: 'vfx-spell-ice-shatter', vfxScale: 2.3,
      prerequisites: ['sacred_recovery'], unlockRule: { type: 'STAGE_CLEAR', stageId: 3, label: 'Đánh bại Boss Stage 3' },
      levels: {
        1: { dmg: 18, applyStatus: 'frost', statusTurns: 2, manaCost: 2, cooldown: 3, summary: '18 DMG bẫy cổ ngữ + Frost giảm 30% công Boss 2 lượt.' },
        2: { dmg: 24, applyStatus: 'frost', statusTurns: 2, timeBonusSec: 3, manaCost: 2, cooldown: 3, summary: 'Tiến hóa Lv2: 24 DMG + Frost & +3s thời gian lượt.' },
        3: { dmg: 31, applyStatus: 'frost', statusTurns: 3, timeBonusSec: 4, manaCost: 2, cooldown: 2, summary: 'Tiến hóa Lv3: 31 DMG + Frost 3 lượt & +4s lượt.' }
      },
      previewDmg: 18, applyStatus: 'frost', statusTurns: 2, desc: 'Giam Boss trong vòng cổ ngữ dưới mặt đất, giảm sức công.'
    },
    {
      id: 'heavens_pillar', name: 'Heaven Pillar', heroId: 'warrior', allowedHeroes: ['warrior'],
      branch: 'Holy Knight', deckGroup: 'knight', tier: 3, rarity: 'EPIC', isUltimate: false,
      icon: '/ui/assets/ui/questwood/Skills/holy_beam.png', manaCost: 3, cooldown: 3, isRemoteSpell: true,
      animationProfile: 'CHANNEL_BEAM', heroAnim: 'attack2', vfxAnim: 'vfx-pvfx-divine-beam', vfxHitAnim: 'vfx-pvfx-holy-cast', vfxScale: 2.5,
      prerequisites: ['rune_prison'], unlockRule: { type: 'STAGE_CLEAR', stageId: 5, label: 'Đánh bại Boss Stage 5' },
      levels: {
        1: { dmg: 30, hitCount: 3, manaCost: 3, cooldown: 3, summary: 'Cột sáng thánh giáng 3 nhịp (30 DMG tổng).' },
        2: { dmg: 39, hitCount: 3, healHp: 8, manaCost: 3, cooldown: 3, summary: 'Tiến hóa Lv2: 39 DMG 3 nhịp + hồi nhẹ 8 HP.' },
        3: { dmg: 48, hitCount: 3, healHp: 12, manaCost: 3, cooldown: 2, summary: 'Tiến hóa Lv3: 48 DMG + hồi 12 HP, Cooldown 2.' }
      },
      previewDmg: 30, hitCount: 3, desc: 'Truyền dẫn cột quang năng thánh khiết thiêu rụi Boss từ tầm xa.'
    },
    {
      id: 'lexical_judgment', name: 'Lexical Judgment', heroId: 'warrior', allowedHeroes: ['warrior', 'archer', 'lancer'],
      branch: 'Legendary Ultimate', deckGroup: 'both', tier: 4, rarity: 'LEGENDARY', isUltimate: true, requiresCoreClue: true,
      icon: '/ui/assets/ui/kibyra/icon59.png', manaCost: 4, cooldown: 4, isRemoteSpell: true,
      animationProfile: 'ULTIMATE', heroAnim: 'attack2', vfxAnim: 'vfx-pvfx-holy-sword-fall', vfxExtraAnim: 'vfx-pvfx-magic-circle', vfxHitAnim: 'vfx-fire-burst-anim', vfxScale: 2.5, hitStopMs: 55,
      prerequisites: ['heavy_slash'], unlockRule: { type: 'STARTER', label: 'Chiêu cuối phán quyết (Cần mở manh mối Core Word trong trận)' },
      upgradeRequirements: {
        2: { minStageCleared: 1, minTopicWords: 1, label: 'Vượt Stage 1 & giải >= 1 từ Topic để nâng Lv 2' },
        3: { minStageCleared: 2, minUniqueReviewedWords: 2, label: 'Vượt Stage 2 & ôn tập >= 2 từ duy nhất để nâng Lv 3' }
      },
      levels: {
        1: { dmg: 38, manaCost: 4, cooldown: 4, shieldMultiplier: 2.0, summary: '38 DMG Thánh Kiếm từ trời giáng xuống (cần Core Clue).' },
        2: { dmg: 48, manaCost: 4, cooldown: 4, shieldMultiplier: 2.5, summary: 'Tiến hóa Lv2: 48 DMG + x2.5 sát thương khiên.' },
        3: { dmg: 60, manaCost: 4, cooldown: 3, shieldMultiplier: 3.0, summary: 'Tiến hóa Lv3: 60 DMG tuyệt kỹ Phán Quyết Ngôn Từ.' }
      },
      previewDmg: 38, shieldMultiplier: 2.0, desc: 'Thánh Kiếm Phán Quyết giáng từ thiên không (Ultimate, cần Core Clue).'
    },

    // === ARCHER: MARKSMAN PATH ===
    {
      id: 'quick_shot', name: 'Quick Shot', heroId: 'archer', allowedHeroes: ['archer'],
      branch: 'Marksman Path', deckGroup: 'knight', tier: 1, rarity: 'COMMON', isUltimate: false,
      icon: '/ui/assets/ui/kibyra/icon17.png', manaCost: 0, cooldown: 0, isRemoteSpell: true,
      animationProfile: 'PROJECTILE', heroAnim: 'attack', vfxAnim: 'vfx-proj-steel', vfxHitAnim: 'vfx-impact-steel', vfxScale: 1.9,
      prerequisites: [], unlockRule: { type: 'STARTER', label: 'Đòn bắn cơ bản của Archer' },
      levels: {
        1: { dmg: 14, manaCost: 0, cooldown: 0, summary: '14 DMG tên thép tầm xa, giữ nguyên vị trí an toàn.' },
        2: { dmg: 18, manaCost: 0, cooldown: 0, summary: 'Tiến hóa Lv2: 18 DMG tên tốc độ cao.' },
        3: { dmg: 23, manaCost: 0, cooldown: 0, summary: 'Tiến hóa Lv3: 23 DMG chí mạng nhẹ tầm xa.' }
      },
      previewDmg: 14, desc: 'Bắn mũi tên thép từ xa vào Boss, không lao vào cận chiến.'
    },
    {
      id: 'piercing_arrow', name: 'Piercing Arrow', heroId: 'archer', allowedHeroes: ['archer'],
      branch: 'Marksman Path', deckGroup: 'knight', tier: 2, rarity: 'RARE', isUltimate: false,
      icon: '/ui/assets/ui/kibyra/icon20.png', manaCost: 2, cooldown: 2, isRemoteSpell: true,
      animationProfile: 'PROJECTILE', heroAnim: 'attack2', vfxAnim: 'vfx-proj-arcane', vfxHitAnim: 'vfx-impact-arcane', vfxScale: 2.1,
      prerequisites: ['quick_shot'], unlockRule: { type: 'STARTER', label: 'Mũi tên xuyên giáp Archer' },
      levels: {
        1: { dmg: 22, manaCost: 2, cooldown: 2, shieldMultiplier: 1.8, summary: '22 DMG tên ma năng xuyên giáp x1.8 Shield.' },
        2: { dmg: 28, manaCost: 2, cooldown: 2, shieldMultiplier: 2.2, summary: 'Tiến hóa Lv2: 28 DMG + x2.2 phá giáp.' },
        3: { dmg: 35, manaCost: 2, cooldown: 1, shieldMultiplier: 2.6, summary: 'Tiến hóa Lv3: 35 DMG + x2.6 phá giáp, CD 1.' }
      },
      previewDmg: 22, shieldMultiplier: 1.8, desc: 'Mũi tên năng lượng xuyên thủng lớp khiên phòng hộ của Boss.'
    },
    {
      id: 'triple_shot', name: 'Triple Shot', heroId: 'archer', allowedHeroes: ['archer'],
      branch: 'Marksman Path', deckGroup: 'knight', tier: 3, rarity: 'EPIC', isUltimate: false,
      icon: '/ui/assets/ui/questwood/Skills/arrow_volley.png', manaCost: 3, cooldown: 3, isRemoteSpell: true,
      animationProfile: 'MULTI_HIT', subProfile: 'PROJECTILE', heroAnim: 'attack2', vfxAnim: 'vfx-proj-steel', vfxHitAnim: 'vfx-impact-steel', vfxScale: 2.0, hitCount: 3,
      prerequisites: ['piercing_arrow'], unlockRule: { type: 'STARTER', label: 'Mưa tên 3 mũi liên hoàn' },
      levels: {
        1: { dmg: 27, hitCount: 3, manaCost: 3, cooldown: 3, summary: 'Phóng 3 mũi tên liên tiếp từ xa (27 DMG tổng).' },
        2: { dmg: 36, hitCount: 3, manaCost: 3, cooldown: 3, summary: 'Tiến hóa Lv2: 36 DMG qua 3 phát bắn tách biệt.' },
        3: { dmg: 45, hitCount: 3, manaCost: 3, cooldown: 2, summary: 'Tiến hóa Lv3: 45 DMG liên hoàn 3 tiễn, CD 2.' }
      },
      previewDmg: 27, hitCount: 3, desc: 'Bắn liên tiếp 3 mũi tên từ xa gây sát thương đa nhịp.'
    },
    {
      id: 'celestial_arrow', name: 'Celestial Arrow', heroId: 'archer', allowedHeroes: ['archer'],
      branch: 'Marksman Path', deckGroup: 'both', tier: 4, rarity: 'LEGENDARY', isUltimate: true, isRemoteSpell: true,
      icon: '/ui/assets/ui/kibyra/icon59.png', manaCost: 4, cooldown: 4,
      animationProfile: 'ULTIMATE', subProfile: 'PROJECTILE', heroAnim: 'attack2', vfxAnim: 'vfx-proj-plasma', vfxExtraAnim: 'vfx-pvfx-magic-circle', vfxHitAnim: 'vfx-thunder-burst-anim', vfxScale: 2.4,
      prerequisites: ['triple_shot'], unlockRule: { type: 'LEARNING', minStageCleared: 2, minTopicWords: 2, label: 'Đánh bại Boss Stage 2, giải >= 2 từ Topic & có Triple Shot' },
      upgradeRequirements: {
        2: { minStageCleared: 2, minTopicWords: 3, label: 'Đạt >= 3 từ Topic để nâng Lv 2' },
        3: { minStageCleared: 3, minUniqueReviewedWords: 2, label: 'Vượt Stage 3 & ôn tập >= 2 từ duy nhất để nâng Lv 3' }
      },
      levels: {
        1: { dmg: 40, applyStatus: 'stunOnBreak', manaCost: 4, cooldown: 4, summary: '40 DMG Mũi Tên Thiên Tinh tối thượng + phá khiên choáng.' },
        2: { dmg: 50, applyStatus: 'stunOnBreak', manaCost: 4, cooldown: 4, summary: 'Tiến hóa Lv2: 50 DMG Plasma Thiên Tinh.' },
        3: { dmg: 62, applyStatus: 'stun', statusTurns: 1, manaCost: 4, cooldown: 3, summary: 'Tiến hóa Lv3: 62 DMG + chắc chắn làm choáng Boss 1 lượt.' }
      },
      previewDmg: 40, desc: 'Chiêu cuối bắn tia mũi tên Plasma xuyên không phá tan Boss.'
    },

    // === LANCER: VANGUARD PATH ===
    {
      id: 'spear_thrust', name: 'Spear Thrust', heroId: 'lancer', allowedHeroes: ['lancer'],
      branch: 'Vanguard Path', deckGroup: 'knight', tier: 1, rarity: 'COMMON', isUltimate: false,
      icon: '/ui/assets/ui/kibyra/icon17.png', manaCost: 0, cooldown: 0,
      animationProfile: 'MELEE_SLASH', heroAnim: 'attack', vfxAnim: 'vfx-slash-side', vfxHitAnim: 'vfx-spark-frost-anim', vfxScale: 2.2,
      prerequisites: [], unlockRule: { type: 'STARTER', label: 'Đâm thương cơ bản Lancer' },
      levels: {
        1: { dmg: 15, shieldMultiplier: 1.4, manaCost: 0, cooldown: 0, summary: '15 DMG đâm thương xuyên khiên x1.4, 0 MP.' },
        2: { dmg: 19, shieldMultiplier: 1.6, manaCost: 0, cooldown: 0, summary: 'Tiến hóa Lv2: 19 DMG + x1.6 phá khiên.' },
        3: { dmg: 24, shieldMultiplier: 1.9, manaCost: 0, cooldown: 0, summary: 'Tiến hóa Lv3: 24 DMG + x1.9 phá khiên.' }
      },
      previewDmg: 15, shieldMultiplier: 1.4, desc: 'Cú đâm thương chuẩn xác có hệ số bào giáp Boss cao.'
    },
    {
      id: 'impaling_charge', name: 'Impaling Charge', heroId: 'lancer', allowedHeroes: ['lancer'],
      branch: 'Vanguard Path', deckGroup: 'knight', tier: 2, rarity: 'RARE', isUltimate: false,
      icon: '/ui/assets/ui/questwood/Skills/shadow_step.png', manaCost: 2, cooldown: 2,
      animationProfile: 'DASH_STRIKE', heroAnim: 'attack2', vfxAnim: 'vfx-pvfx-blink-dash', vfxHitAnim: 'vfx-ring-frost-anim', vfxScale: 2.3,
      prerequisites: ['spear_thrust'], unlockRule: { type: 'STARTER', label: 'Xung kích thương kỵ' },
      levels: {
        1: { dmg: 24, hitCount: 2, manaCost: 2, cooldown: 2, summary: 'Lao thương tốc độ cao 2 nhịp (24 DMG tổng).' },
        2: { dmg: 31, hitCount: 2, manaCost: 2, cooldown: 2, summary: 'Tiến hóa Lv2: 31 DMG đâm liên hoàn.' },
        3: { dmg: 38, hitCount: 2, manaCost: 2, cooldown: 1, summary: 'Tiến hóa Lv3: 38 DMG xung kích, giảm CD còn 1.' }
      },
      previewDmg: 24, hitCount: 2, desc: 'Xung kích chớp nhoáng với mũi thương tạo 2 nhịp va chạm.'
    },
    {
      id: 'iron_fortress', name: 'Iron Fortress', heroId: 'lancer', allowedHeroes: ['lancer'],
      branch: 'Vanguard Path', deckGroup: 'both', tier: 3, rarity: 'EPIC', isUltimate: false, selfTarget: true,
      icon: '/ui/assets/ui/questwood/Skills/magic_barrier.png', manaCost: 2, cooldown: 2,
      animationProfile: 'SHIELD_CAST', heroAnim: 'guard', vfxAnim: 'vfx-pvfx-shield-bubble', vfxHitAnim: 'vfx-ring-frost-anim', vfxScale: 2.4,
      prerequisites: ['impaling_charge'], unlockRule: { type: 'STARTER', label: 'Phòng tuyến thiết giáp Lancer' },
      levels: {
        1: { mitigationPct: 82, reflectDmg: 10, manaCost: 2, cooldown: 2, summary: 'Giảm 82% sát thương đòn Boss & phản 10 DMG.' },
        2: { mitigationPct: 88, reflectDmg: 15, manaCost: 2, cooldown: 2, summary: 'Tiến hóa Lv2: Giảm 88% sát thương & phản 15 DMG.' },
        3: { mitigationPct: 94, reflectDmg: 22, manaCost: 2, cooldown: 1, summary: 'Tiến hóa Lv3: Giảm 94% sát thương & phản 22 DMG.' }
      },
      mitigationPct: 82, reflectDmg: 10, desc: 'Dựng pháo đài thép hấp thụ 82% đòn đánh và phản sát thương.'
    },
    {
      id: 'dragon_lance', name: 'Dragon Lance', heroId: 'lancer', allowedHeroes: ['lancer'],
      branch: 'Vanguard Path', deckGroup: 'both', tier: 4, rarity: 'LEGENDARY', isUltimate: true, isRemoteSpell: true,
      icon: '/ui/assets/ui/questwood/Skills/holy_beam.png', manaCost: 4, cooldown: 4,
      animationProfile: 'ULTIMATE', subProfile: 'CHANNEL_BEAM', heroAnim: 'attack2', vfxAnim: 'vfx-pvfx-divine-beam', vfxExtraAnim: 'vfx-pvfx-magic-circle', vfxHitAnim: 'vfx-thunder-burst-anim', vfxScale: 2.5,
      prerequisites: ['iron_fortress'], unlockRule: { type: 'LEARNING', minStageCleared: 3, minTopicWords: 2, label: 'Đánh bại Boss Stage 3, giải >= 2 từ Topic & có Iron Fortress' },
      upgradeRequirements: {
        2: { minStageCleared: 3, minTopicWords: 3, label: 'Đạt >= 3 từ Topic để nâng Lv 2' },
        3: { minStageCleared: 4, minUniqueReviewedWords: 2, label: 'Vượt Stage 4 & ôn tập >= 2 từ duy nhất để nâng Lv 3' }
      },
      levels: {
        1: { dmg: 40, hitCount: 3, shieldMultiplier: 2.2, manaCost: 4, cooldown: 4, summary: '40 DMG cột quang thương 3 nhịp xuyên phá toàn bộ giáp.' },
        2: { dmg: 50, hitCount: 3, shieldMultiplier: 2.6, manaCost: 4, cooldown: 4, summary: 'Tiến hóa Lv2: 50 DMG Long Thương.' },
        3: { dmg: 62, hitCount: 3, shieldMultiplier: 3.0, manaCost: 4, cooldown: 3, summary: 'Tiến hóa Lv3: 62 DMG Long Thương hủy diệt.' }
      },
      previewDmg: 40, hitCount: 3, desc: 'Phóng luồng Long Thương thánh quang 3 nhịp xuyên thẳng Boss.'
    },

    // === ARCANE MAGE: ELEMENTALIST PATH ===
    {
      id: 'magic_bolt', name: 'Magic Bolt', heroId: 'arcane_mage', allowedHeroes: ['arcane_mage'],
      branch: 'Elementalist Path', deckGroup: 'knight', tier: 1, rarity: 'COMMON', isUltimate: false, isRemoteSpell: true,
      icon: '/ui/assets/ui/questwood/Skills/arcane_orb.png', manaCost: 0, cooldown: 0,
      animationProfile: 'PROJECTILE', heroAnim: 'attack', vfxAnim: 'vfx-proj-arcane', vfxHitAnim: 'vfx-impact-arcane', vfxScale: 2.0,
      prerequisites: [], unlockRule: { type: 'STARTER', label: 'Phép cơ bản của Arcane Mage (0 MP)' },
      levels: {
        1: { dmg: 15, manaCost: 0, cooldown: 0, summary: '15 DMG cầu ma năng phóng từ đầu trượng, 0 MP.' },
        2: { dmg: 19, manaCost: 0, cooldown: 0, summary: 'Tiến hóa Lv2: 19 DMG cầu ma năng tốc độ cao.' },
        3: { dmg: 24, manaCost: 0, cooldown: 0, summary: 'Tiến hóa Lv3: 24 DMG cầu ma năng tinh luyện.' }
      },
      previewDmg: 15, desc: 'Bắn cầu ma năng tầm xa tiêu hao 0 Mana.'
    },
    {
      id: 'fireball', name: 'Fireball', heroId: 'arcane_mage', allowedHeroes: ['arcane_mage'],
      branch: 'Elementalist Path', deckGroup: 'spell', tier: 2, rarity: 'RARE', isUltimate: false, isRemoteSpell: true,
      icon: '/ui/assets/ui/questwood/Skills/fireball.png', manaCost: 2, cooldown: 2,
      animationProfile: 'PROJECTILE', heroAnim: 'attack2', vfxAnim: 'vfx-spell-fireball', vfxHitAnim: 'vfx-spell-fire-burst', vfxScale: 2.3,
      prerequisites: ['magic_bolt'], unlockRule: { type: 'STARTER', label: 'Cầu lửa tiến hóa Burn -> Flame Burst' },
      levels: {
        1: { dmg: 22, manaCost: 2, cooldown: 2, summary: '22 DMG cầu lửa tầm xa kích nổ hỏa cầu.' },
        2: { dmg: 28, applyStatus: 'burn', statusTurns: 2, manaCost: 2, cooldown: 2, summary: 'Tiến hóa Lv2: 28 DMG + Burn thiêu đốt 2 lượt.' },
        3: { dmg: 36, applyStatus: 'burn', statusTurns: 3, manaCost: 2, cooldown: 1, summary: 'Tiến hóa Lv3: 36 DMG Flame Burst + Burn 3 lượt.' }
      },
      previewDmg: 22, applyStatus: 'burn', statusTurns: 1, desc: 'Phóng hỏa cầu nổ tung khi trúng Boss; tiến hóa Lv2-3 thêm Thiêu đốt diện rộng.'
    },
    {
      id: 'arcane_beam', name: 'Arcane Beam', heroId: 'arcane_mage', allowedHeroes: ['arcane_mage'],
      branch: 'Elementalist Path', deckGroup: 'spell', tier: 3, rarity: 'EPIC', isUltimate: false, isRemoteSpell: true,
      icon: '/ui/assets/ui/questwood/Skills/holy_beam.png', manaCost: 3, cooldown: 3,
      animationProfile: 'CHANNEL_BEAM', heroAnim: 'attack3', vfxAnim: 'vfx-pvfx-arcane-beam', vfxHitAnim: 'vfx-impact-arcane', vfxScale: 2.3,
      prerequisites: ['fireball'], unlockRule: { type: 'LEARNING', minStageCleared: 1, label: 'Mở khóa Arcane Mage (Stage 1) + học Fireball' },
      levels: {
        1: { dmg: 30, hitCount: 3, manaCost: 3, cooldown: 3, summary: 'Tia Arcane hội tụ quét Boss 3 nhịp (30 DMG tổng).' },
        2: { dmg: 39, hitCount: 3, manaCost: 3, cooldown: 3, summary: 'Tiến hóa Lv2: Tia Arcane cường hóa 39 DMG.' },
        3: { dmg: 48, hitCount: 3, manaCost: 3, cooldown: 2, summary: 'Tiến hóa Lv3: Tia Arcane 48 DMG, Cooldown giảm còn 2.' }
      },
      previewDmg: 30, hitCount: 3, desc: 'Dẫn truyền chùm tia ma năng xanh lam đánh 3 nhịp liên tục.'
    },
    {
      id: 'meteor_fall', name: 'Meteor Fall', heroId: 'arcane_mage', allowedHeroes: ['arcane_mage'],
      branch: 'Elementalist Path', deckGroup: 'both', tier: 4, rarity: 'LEGENDARY', isUltimate: true, isRemoteSpell: true,
      icon: '/ui/assets/ui/questwood/Skills/fireball.png', manaCost: 4, cooldown: 4,
      animationProfile: 'ULTIMATE', subProfile: 'SKY_STRIKE', heroAnim: 'attack3', vfxAnim: 'vfx-pvfx-meteor-strike', vfxExtraAnim: 'vfx-pvfx-magic-circle', vfxHitAnim: 'vfx-spell-fire-burst', vfxScale: 2.6,
      prerequisites: ['arcane_beam'], unlockRule: { type: 'LEARNING', minStageCleared: 2, minTopicWords: 2, label: 'Đánh bại Boss Stage 2, giải >= 2 từ Topic & có Arcane Beam' },
      upgradeRequirements: {
        2: { minStageCleared: 2, minTopicWords: 3, label: 'Đạt >= 3 từ Topic để nâng Lv 2' },
        3: { minStageCleared: 3, minUniqueReviewedWords: 2, label: 'Vượt Stage 3 & ôn tập >= 2 từ duy nhất để nâng Lv 3' }
      },
      levels: {
        1: { dmg: 44, applyStatus: 'burn', statusTurns: 2, manaCost: 4, cooldown: 4, summary: '44 DMG Thiên Thạch giáng từ trời + Burn 2 lượt.' },
        2: { dmg: 54, applyStatus: 'burn', statusTurns: 3, manaCost: 4, cooldown: 4, summary: 'Tiến hóa Lv2: 54 DMG Đại Thiên Thạch.' },
        3: { dmg: 68, applyStatus: 'burn', statusTurns: 3, shieldMultiplier: 2.0, manaCost: 4, cooldown: 3, summary: 'Tiến hóa Lv3: 68 DMG Hủy Diệt + x2 phá khiên.' }
      },
      previewDmg: 44, applyStatus: 'burn', statusTurns: 2, desc: 'Triệu hồi trận pháp và kéo Thiên Thạch khổng lồ giáng xuống Boss.'
    },

    // === SHARED ELEMENTAL SPELLS ===
    {
      id: 'fire_blade', name: 'Fire Blade', heroId: 'shared', allowedHeroes: ['warrior', 'archer', 'lancer', 'arcane_mage'],
      branch: 'Elemental Spellbook', deckGroup: 'spell', tier: 2, rarity: 'RARE', isUltimate: false,
      icon: '/ui/assets/ui/kibyra/icon11.png', manaCost: 2, cooldown: 2,
      animationProfile: 'MELEE_SLASH', rangedFallbackProfile: 'PROJECTILE', heroAnim: 'attack2', vfxAnim: 'vfx-slash-side', vfxExtraAnim: 'vfx-spark-ember-anim', vfxHitAnim: 'vfx-spell-fire-burst', vfxScale: 2.4,
      prerequisites: [], unlockRule: { type: 'STARTER', label: 'Phép lửa dùng chung' },
      levels: {
        1: { dmg: 16, applyStatus: 'burn', statusTurns: 2, manaCost: 2, cooldown: 2, summary: '16 DMG + Thiêu đốt 2 lượt (-7 HP/lượt, khóa hồi Slime).' },
        2: { dmg: 22, applyStatus: 'burn', statusTurns: 2, manaCost: 2, cooldown: 2, summary: 'Tiến hóa Lv2: 22 DMG + Burn 2 lượt.' },
        3: { dmg: 29, applyStatus: 'burn', statusTurns: 3, manaCost: 2, cooldown: 1, summary: 'Tiến hóa Lv3: 29 DMG + Burn 3 lượt.' }
      },
      previewDmg: 16, applyStatus: 'burn', statusTurns: 2, desc: 'Phủ lửa lên đòn đánh gây sát thương Burn 2 lượt và khắc chế Slime hồi máu.'
    },
    {
      id: 'frost_seal', name: 'Frost Seal', heroId: 'shared', allowedHeroes: ['warrior', 'archer', 'lancer', 'arcane_mage'],
      branch: 'Elemental Spellbook', deckGroup: 'spell', tier: 2, rarity: 'RARE', isUltimate: false, isRemoteSpell: true,
      icon: '/ui/assets/ui/questwood/Skills/ice_spike.png', manaCost: 2, cooldown: 3,
      animationProfile: 'GROUND_CAST', heroAnim: 'guard', vfxAnim: 'vfx-spell-rune-ring', vfxExtraAnim: 'vfx-ring-frost-anim', vfxHitAnim: 'vfx-spell-ice-shatter', vfxScale: 2.5,
      prerequisites: [], unlockRule: { type: 'STARTER', label: 'Ấn băng dùng chung' },
      levels: {
        1: { dmg: 14, applyStatus: 'frost', statusTurns: 2, timeBonusSec: 4, manaCost: 2, cooldown: 3, summary: '14 DMG + giảm 30% công Boss 2 lượt & +4s thời gian lượt.' },
        2: { dmg: 20, applyStatus: 'frost', statusTurns: 2, timeBonusSec: 5, manaCost: 2, cooldown: 3, summary: 'Tiến hóa Lv2: 20 DMG + Frost & +5s lượt.' },
        3: { dmg: 27, applyStatus: 'frost', statusTurns: 3, timeBonusSec: 6, manaCost: 2, cooldown: 2, summary: 'Tiến hóa Lv3: 27 DMG + Frost 3 lượt & +6s lượt.' }
      },
      previewDmg: 14, applyStatus: 'frost', statusTurns: 2, timeBonusSec: 4, desc: 'Khắc ấn băng dưới Boss giảm 30% công địch và cộng thêm giây suy nghĩ.'
    },
    {
      id: 'thunder_strike', name: 'Thunder Strike', heroId: 'shared', allowedHeroes: ['warrior', 'archer', 'lancer', 'arcane_mage'],
      branch: 'Elemental Spellbook', deckGroup: 'spell', tier: 3, rarity: 'EPIC', isUltimate: false, isRemoteSpell: true,
      icon: '/ui/assets/ui/questwood/Skills/lightning_burst.png', manaCost: 3, cooldown: 3,
      animationProfile: 'SKY_STRIKE', heroAnim: 'attack2', vfxAnim: 'vfx-spell-lightning-strike', vfxExtraAnim: 'vfx-thunder-burst-anim', vfxHitAnim: 'vfx-ring-arcane-anim', vfxScale: 2.5, hitStopMs: 50,
      prerequisites: [], unlockRule: { type: 'STARTER', label: 'Thiên lôi phá giáp dùng chung' },
      levels: {
        1: { dmg: 18, shieldMultiplier: 2.0, applyStatus: 'stunOnBreak', manaCost: 3, cooldown: 3, summary: '18 DMG Sét giáng từ trời, x2 phá khiên & Choáng 1 lượt khi vỡ khiên.' },
        2: { dmg: 25, shieldMultiplier: 2.4, applyStatus: 'stunOnBreak', manaCost: 3, cooldown: 3, summary: 'Tiến hóa Lv2: 25 DMG + x2.4 phá khiên.' },
        3: { dmg: 33, shieldMultiplier: 2.8, applyStatus: 'stunOnBreak', manaCost: 3, cooldown: 2, summary: 'Tiến hóa Lv3: 33 DMG + x2.8 phá khiên, CD 2.' }
      },
      previewDmg: 18, shieldMultiplier: 2.0, applyStatus: 'stunOnBreak', desc: 'Kéo sét từ bầu trời xuống phá tan Shield Boss và gây Choáng.'
    }
  ];

  const SKILL_MAP = Object.fromEntries(SKILLS.map((s) => [s.id, s]));

  function getHero(heroId) {
    return HEROES[String(heroId || 'warrior').toLowerCase()] || HEROES.warrior;
  }

  function getSkill(skillId, level = 1) {
    const base = SKILL_MAP[String(skillId || '')];
    if (!base) return null;
    const lv = Math.max(1, Math.min(3, Number(level || 1)));
    const lvData = (base.levels && base.levels[lv]) || base.levels?.[1] || {};
    return {
      ...base,
      level: lv,
      manaCost: Number(lvData.manaCost ?? base.manaCost ?? 0),
      cooldown: Number(lvData.cooldown ?? base.cooldown ?? 0),
      previewDmg: Number(lvData.dmg ?? base.previewDmg ?? 0),
      healHp: Number(lvData.healHp ?? base.healHp ?? 0),
      mitigationPct: Number(lvData.mitigationPct ?? base.mitigationPct ?? 0),
      reflectDmg: Number(lvData.reflectDmg ?? base.reflectDmg ?? 0),
      shieldMultiplier: Number(lvData.shieldMultiplier ?? base.shieldMultiplier ?? 1),
      hitCount: Number(lvData.hitCount ?? base.hitCount ?? 1),
      applyStatus: lvData.applyStatus ?? base.applyStatus ?? null,
      statusTurns: Number(lvData.statusTurns ?? base.statusTurns ?? 0),
      timeBonusSec: Number(lvData.timeBonusSec ?? base.timeBonusSec ?? 0),
      levelSummary: lvData.summary || base.desc
    };
  }

  function getSkillsForHero(heroId) {
    const h = String(heroId || 'warrior').toLowerCase();
    return SKILLS.filter((s) => Array.isArray(s.allowedHeroes) && s.allowedHeroes.includes(h));
  }

  function getStage(stageId) {
    const id = Number(stageId || 1);
    return CHAPTER_STAGES.find((st) => st.stageId === id) || CHAPTER_STAGES[0];
  }

  function resolveAnimationProfile(skill, heroId) {
    if (!skill) return 'MELEE_SLASH';
    const hero = getHero(heroId || skill.heroId);
    if (hero.isRanged && skill.rangedFallbackProfile && !skill.selfTarget) {
      return skill.rangedFallbackProfile;
    }
    return skill.animationProfile || 'MELEE_SLASH';
  }

  function validateRegistry() {
    const errors = [];
    const heroIds = new Set();
    Object.values(HEROES).forEach((h) => {
      if (heroIds.has(h.heroId)) errors.push(`Duplicate heroId: ${h.heroId}`);
      heroIds.add(h.heroId);
    });
    const skillIds = new Set();
    SKILLS.forEach((s) => {
      if (skillIds.has(s.id)) errors.push(`Duplicate skillId: ${s.id}`);
      skillIds.add(s.id);
      if (!ANIMATION_PROFILES[s.animationProfile]) errors.push(`Invalid animationProfile on ${s.id}: ${s.animationProfile}`);
      if (!s.icon || !s.vfxAnim) errors.push(`Missing icon/vfxAnim on ${s.id}`);
    });
    // Cycle detection across prerequisites
    const visiting = new Set();
    const visited = new Set();
    function visit(id) {
      if (visited.has(id)) return;
      if (visiting.has(id)) {
        errors.push(`Circular prerequisite detected at skill: ${id}`);
        return;
      }
      visiting.add(id);
      const sk = SKILL_MAP[id];
      (sk?.prerequisites || []).forEach((pre) => {
        if (!SKILL_MAP[pre]) errors.push(`Missing prerequisite ${pre} for ${id}`);
        else visit(pre);
      });
      visiting.delete(id);
      visited.add(id);
    }
    SKILLS.forEach((s) => visit(s.id));
    CHAPTER_STAGES.forEach((st) => {
      if (st.rewards?.heroUnlock && !HEROES[st.rewards.heroUnlock]) errors.push(`Unknown hero reward on stage ${st.stageId}`);
      if (st.rewards?.skillUnlock && !SKILL_MAP[st.rewards.skillUnlock]) errors.push(`Unknown skill reward on stage ${st.stageId}`);
    });
    return { valid: errors.length === 0, heroCount: heroIds.size, skillCount: skillIds.size, stageCount: CHAPTER_STAGES.length, errors };
  }

  root.RaidRegistry = {
    ANIMATION_PROFILES,
    HEROES,
    BACKLOG_HEROES,
    CHAPTER_STAGES,
    SKILLS,
    SKILL_MAP,
    getHero,
    getSkill,
    getSkillsForHero,
    getStage,
    resolveAnimationProfile,
    validateRegistry
  };
})(window);
