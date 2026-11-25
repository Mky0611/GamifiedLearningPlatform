(function(){
  const query = new URLSearchParams(location.search);
  const stageId = Number(query.get('stageId') || 1);
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  const state = {
    stage: null,
    runtime: null,
    raidSessionId: null,
    board: [],
    selected: [],
    currentWord: '',
    score: 0,
    combo: 1,
    bossHp: 100,
    bossShield: 30,
    rage: 0,
    playerHp: 100,
    turn: 1,
    recentWords: [],
    revealedIndexes: [],
    topicCount: 0,
    longWord: 0,
    coreGuess: 0,
    guessed: false,
    timeLeft: 20,
    timer: null,
    dragging: false,
    lastHoveredKey: '',
    invalidResetTimer: null,
    bossTheme: 'crabby',
    bossRarity: 'NORMAL',
    bossPhase: 1,
    waveIndex: 1,
    totalWaves: 5,
    monsterAnimator: null,
    unitCode: 'warrior',
    avatarCode: 'avatar1',
    renderer: null,
    currentCoreIndex: 0,
    currentBossDetails: null,
    transitioning: false,
    isSubmitting: false,
    finished: false,
    previewMana: 4,
    maxPreviewMana: 6,
    skillCooldowns: {},
    activeSkillId: null,
    royalGuardActive: false,
    royalGuardMitigationPct: 0,
    royalGuardReflect: 0,
    soundEnabled: false,
    hintCharges: 3,
    hintsUsedCount: 0,
    boardSeedOffset: 0,
    discoveredWords: [],
    playMode: 'campaign',
    wavePlan: [],
    waveTurn: 1,
    bossMaxHp: 100,
    bossMaxShield: 30,
    bossStatuses: {},
    timerPaused: false,
    skillDeck: 'knight'
  };

  function isQaEnvironment(){
    if (typeof window === 'undefined' || !window.location) return false;
    const host = String(window.location.hostname || '').toLowerCase();
    const isLoopback = host === '127.0.0.1' || host === 'localhost' || host === '::1';
    if (!isLoopback) return false;
    return new URLSearchParams(window.location.search || '').get('qa') === '1';
  }

  function isBattleAnimationBusy(){
    return Boolean(state.renderer && typeof state.renderer.isBusy === 'function' && state.renderer.isBusy());
  }

  const monsterFrames = Object.fromEntries(
    Object.entries((window.RaidPhaserConfig && window.RaidPhaserConfig.bosses) || {}).map(([key, value]) => [
      key,
      {
        idle: Array.isArray(value.idle?.frames) ? value.idle.frames : (value.portrait ? [value.portrait] : []),
        attack: Array.isArray(value.attack?.frames) ? value.attack.frames : (value.portrait ? [value.portrait] : []),
        hit: Array.isArray(value.hit?.frames) ? value.hit.frames : (value.portrait ? [value.portrait] : [])
      }
    ])
  );

  const themeLabel = {
    captain: 'Captain Clown Nose',
    crabby: 'Crabby',
    fierce: 'Fierce Tooth',
    pink: 'Pink Star',
    totem1: 'Totem Head I',
    totem2: 'Totem Head II',
    totem3: 'Totem Head III',
    seashell: 'Seashell',
    cannon: 'Cannon',
    slime: 'Verdant Slime (Preview)',
    skeleton: 'Cursed Skeleton (Preview)'
  };

  const bossLore = {
    captain: {
      title: 'Captain Clown Nose',
      desc: 'Một tên cướp biển hề đáng sợ, chỉ huy tàu hải tặc khét tiếng. Hắn sử dụng những trò đùa tai quái và quả bom hề để tàn phá đối thủ.',
      element: 'FIRE'
    },
    crabby: {
      title: 'Crabby',
      desc: 'Cua chiến binh khổng lồ được gia cố lớp vỏ giáp sắt kiên cố dưới biển sâu. Đôi càng sắc bén có thể bẻ gãy mọi vũ khí của các hiệp sĩ.',
      element: 'WATER'
    },
    fierce: {
      title: 'Fierce Tooth',
      desc: 'Sinh vật hoang dã khát máu với hàm răng sắc nhọn như dao cạo. Nó sở hữu tốc độ săn mồi cực nhanh và sự hung tợn bộc phát từ bóng đêm.',
      element: 'SHADOW'
    },
    pink: {
      title: 'Pink Star',
      desc: 'Một sinh vật cổ xưa mang hình dáng sao biển màu hồng đầy bí ẩn. Hắn hấp thụ sức mạnh ma thuật từ các rạn san hô cổ đại để hồi phục vết thương.',
      element: 'ARCANE'
    },
    totem1: {
      title: 'Totem Head I',
      desc: 'Cột đá Totem ma thuật đầu tiên, chứa đựng linh hồn bảo vệ rừng già. Có khả năng phòng ngự vững chắc trước mọi sát thương vật lý.',
      element: 'VOID'
    },
    totem2: {
      title: 'Totem Head II',
      desc: 'Cột Totem thứ hai được truyền sức mạnh thần bí từ đất đá, kiểm soát các xúc tu đá khổng lồ để tấn công kẻ xâm nhập.',
      element: 'VOID'
    },
    totem3: {
      title: 'Totem Head III',
      desc: 'Cột Totem tối thượng mang lời nguyền hủy diệt của bộ tộc cổ xưa. Nó sẽ giải phóng cơn thịnh nộ thiêu rụi bất cứ kẻ nào dám đối đầu.',
      element: 'VOID'
    },
    seashell: {
      title: 'Seashell Sentry',
      desc: 'Vệ binh vỏ sò khổng lồ bảo vệ kho báu đại dương. Lớp vỏ ngọc trai phản chiếu ánh sáng ma pháp có thể hấp thụ mọi đòn đánh phép thuật.',
      element: 'ICE'
    },
    cannon: {
      title: 'Cannon Golem',
      desc: 'Một cỗ máy chiến tranh cổ đại chạy bằng năng lượng lõi lửa. Họng pháo khổng lồ sẵn sàng nã đạn quét sạch đấu trường.',
      element: 'TECH'
    },
    slime: {
      title: 'Verdant Slime (Preview)',
      desc: 'Tinh linh nhớt rừng thẳm mang tinh thể cổ ngữ. Xuất hiện trong chế độ xem trước P4-B.2 để thử nghiệm hoạt ảnh và hiệu ứng chiến đấu.',
      element: 'TOXIN'
    },
    skeleton: {
      title: 'Cursed Skeleton (Preview)',
      desc: 'Bộ xương kỵ sĩ canh giữ pháo đài cổ. Xuất hiện trong chế độ xem trước P4-B.2 với hiệu ứng chém và đỡ đòn.',
      element: 'SHADOW'
    }
  };

  const bossOrder = ((window.RaidPhaserConfig && window.RaidPhaserConfig.bossOrder) || ['crabby']);

  const randomBosses = [
    { name: 'Raincap Warden', element: 'SHADOW' },
    { name: 'Spore Monarch', element: 'VOID' },
    { name: 'Compiler Wraith', element: 'TECH' },
    { name: 'Archive Phantom', element: 'ARCANE' },
    { name: 'Ledger Golem', element: 'VOID' },
    { name: 'Toxic Tyrant', element: 'FIRE' },
    { name: 'Swamp Oracle', element: 'WATER' },
    { name: 'Scholar Mycel', element: 'ARCANE' },
    { name: 'Forest Hexcap', element: 'ICE' },
    { name: 'Gilded Merchant', element: 'FIRE' }
  ];

  function getRandomBossTheme(excludeTheme) {
    const list = bossOrder.filter(theme => theme !== excludeTheme);
    return list[Math.floor(Math.random() * list.length)];
  }

  const unitTheme = {
    warrior: {label:'Warrior · Sát thương chủ lực'},
    lancer: {label:'Lancer · Phòng tuyến phản đòn'},
    archer: {label:'Archer · Tầm xa áp lực'},
  };

  function setFillBar(id, current, max){
    const el = document.getElementById(id);
    if(!el) return;
    const pct = Math.max(0, Math.min(100, (Number(current || 0) / Math.max(1, Number(max || 1))) * 100));
    el.style.transform = `scaleX(${pct / 100})`;
    el.dataset.percent = String(pct);
  }

  function getCoreWordEntries(){
    const raw = Array.isArray(state.runtime?.coreWords)
      ? state.runtime.coreWords
      : Array.isArray(state.runtime?.stageCoreWords)
      ? state.runtime.stageCoreWords
      : [];

    const mapped = raw.map((entry)=>{
      if(typeof entry === 'string'){
        return {
          stageCoreWordId: null,
          coreWord: normalizeWord(entry),
          clueText: state.runtime?.clueText || state.runtime?.clue || ''
        };
      }
      return {
        stageCoreWordId: entry?.stageCoreWordId ?? entry?.id ?? null,
        coreWord: normalizeWord(entry?.coreWord || entry?.wordText || entry?.word || entry?.normalizedWord || ''),
        clueText: entry?.clueText || entry?.clue || entry?.clueTextOverride || state.runtime?.clueText || state.runtime?.clue || ''
      };
    }).filter((entry)=>entry.coreWord);

    if(mapped.length) return mapped;

    const fallback = normalizeWord(state.runtime?.coreWord || '');
    if(fallback){
      return [{
        stageCoreWordId: state.runtime?.stageCoreWordId || null,
        coreWord: fallback,
        clueText: state.runtime?.clueText || state.runtime?.clue || ''
      }];
    }

    return [{
      stageCoreWordId: null,
      coreWord: 'LEARN',
      clueText: 'Tìm topic words để mở clue rồi đoán core word.'
    }];
  }

  function getActiveCoreEntry(){
    const entries = getCoreWordEntries();
    const index = Math.max(0, Math.min(state.currentCoreIndex, entries.length - 1));
    state.currentCoreIndex = index;
    return entries[index];
  }

  function getActiveCoreWord(){
    return normalizeWord(getActiveCoreEntry()?.coreWord || 'LEARN');
  }

  function getActiveCoreWordId(){
    return getActiveCoreEntry()?.stageCoreWordId || state.runtime?.stageCoreWordId || null;
  }

  function getActiveClueText(){
    return getActiveCoreEntry()?.clueText || state.runtime?.clueText || state.runtime?.clue || 'Tìm topic words để mở clue rồi đoán core word.';
  }

  function applyBoardFromPayload(board){
    if(!Array.isArray(board) || !board.length) return false;
    state.board = board.map((row)=>Array.isArray(row)
      ? row.map((ch)=>normalizeWord(String(ch || '')).slice(0, 1) || randomLetter())
      : []);
    return true;
  }

  function rebuildBoardForActiveCoreWord(forceRegenerate = false){
    if(!forceRegenerate && applyBoardFromPayload(state.runtime?.board)){
      renderBoard(true);
      return;
    }
    state.board = buildFallbackBoard(getActiveCoreWord(), state.stage?.boardRows || 5, state.stage?.boardCols || 5);
    renderBoard(true);
  }

  function syncRuntimeCoreFromResult(result){
    if(!result) return false;
    state.runtime = state.runtime || {};
    let changed = false;

    if(Array.isArray(result.coreWords) && result.coreWords.length){
      state.runtime.coreWords = result.coreWords;
      changed = true;
    }

    if(typeof result.activeCoreIndex === 'number' && Number.isFinite(result.activeCoreIndex)){
      state.currentCoreIndex = Math.max(0, result.activeCoreIndex);
      state.runtime.activeCoreIndex = state.currentCoreIndex;
      changed = true;
    }

    if(result.activeStageCoreWordId != null){
      state.runtime.stageCoreWordId = result.activeStageCoreWordId;
      changed = true;
    }
    if(result.activeCoreWord){
      state.runtime.coreWord = result.activeCoreWord;
      changed = true;
    }
    if(result.activeClueText){
      state.runtime.clueText = result.activeClueText;
      changed = true;
    }
    if(applyBoardFromPayload(result.board)){
      state.runtime.board = state.board;
      changed = true;
    }

    return changed;
  }

  function advanceCoreWord(){
    const entries = getCoreWordEntries();
    if(state.currentCoreIndex < entries.length - 1){
      state.currentCoreIndex += 1;
      state.guessed = false;
      state.revealedIndexes = [];
      return true;
    }
    state.guessed = true;
    return false;
  }

  async function mountRaidRenderer(forceRemount = false){
    const mount = document.getElementById('raidPhaserMount');
    if(!mount || !window.RaidPhaserBridge) return;

    if(forceRemount && state.renderer && state.renderer.destroy){
      state.renderer.destroy();
      state.renderer = null;
    }

    if(!state.renderer){
      state.renderer = await window.RaidPhaserBridge.mount(mount, {
        unitCode: state.unitCode,
        bossTheme: state.bossTheme,
        heroMode: 'idle',
        bossMode: 'idle'
      });
    }else if(state.renderer.setState){
      state.renderer.setState({
        unitCode: state.unitCode,
        bossTheme: state.bossTheme,
        heroMode: 'idle',
        bossMode: 'idle'
      });
    }

    const note = document.getElementById('raidEngineNote');
    if(note){
      const message = state.renderer?.errorText || '';
      note.textContent = message;
      note.classList.toggle('is-visible', Boolean(message));
      const stage = note.closest('.battle-stage');
      if(stage) stage.dataset.renderer = state.renderer?.renderer || '';
    }
  }

  function updateRaidRenderer(next){
    if(state.renderer && state.renderer.setState) state.renderer.setState(next || {});
  }

  function syncRendererState(extra = {}){
    updateRaidRenderer({
      unitCode: state.unitCode,
      bossTheme: state.bossTheme,
      bossRarity: state.bossRarity || 'NORMAL',
      waveIndex: state.waveIndex || 1,
      ...extra
    });
  }

  async function applyLoadout(){
    const prefs = window.appApi.getAccountPreferences() || {};
    const userId = window.appApi.getCurrentUserId ? window.appApi.getCurrentUserId() : null;
    let remote = null;

    if(userId){
      try{
        remote = await window.appApi.getAccountLoadout(userId);
      }catch(error){
        remote = null;
      }
    }

    const mergedUnitCode = remote?.selectedUnitCode || remote?.unitCode || prefs?.selectedUnitCode || prefs?.unitCode || 'warrior';
    const mergedAvatarCode = remote?.selectedAvatarKey || remote?.avatarCode || remote?.avatarKey || prefs?.selectedAvatarKey || prefs?.avatarCode || prefs?.avatarKey || 'avatar1';

    state.unitCode = window.appApi.normalizeUnitCode(mergedUnitCode);
    state.avatarCode = window.appApi.normalizeAvatarCode(mergedAvatarCode);

    window.appApi.saveAccountPreferences({
      unitCode: state.unitCode,
      avatarCode: state.avatarCode,
      selectedUnitCode: state.unitCode,
      selectedAvatarKey: window.appApi.toDbAvatarKey ? window.appApi.toDbAvatarKey(state.avatarCode) : state.avatarCode
    });

    const avatarUrl = window.appApi.getAvatarUrl
      ? window.appApi.getAvatarUrl(state.avatarCode)
      : '/ui/assets/imgs/avatar1.png';

    const heroName = window.appApi.getAuth()?.displayName || window.appApi.getAuth()?.username || 'Knight Learner';
    const role = unitTheme[state.unitCode]?.label || unitTheme.warrior.label;

    ['heroSprite','heroStageSprite'].forEach((id)=>{
      const el = document.getElementById(id);
      if(el) el.className = `pixel-unit pixel-unit--${state.unitCode} is-idle`;
    });

    const avatarEl = document.getElementById('heroAvatarImg');
    if(avatarEl) avatarEl.src = avatarUrl;

    const nameEl = document.getElementById('playerName');
    if(nameEl) nameEl.textContent = heroName;

    const roleEl = document.getElementById('heroRoleText');
    if(roleEl) roleEl.textContent = `${role} · Chiến binh từ vựng`;
  }

  function boardKey(row, col){ return `${row}:${col}`; }
  function randomLetter(){ return alphabet[Math.floor(Math.random() * alphabet.length)]; }
  function normalizeWord(word){ return String(word || '').trim().toUpperCase().replace(/[^A-Z]/g, ''); }

  function renderStatus(message, tone = 'danger', options = {}){
    const el = document.getElementById('raidStatus');
    if(!el) return;
    el.replaceChildren();

    const cfg = (message && typeof message === 'object' && !Array.isArray(message))
      ? message
      : { text: message, tone, ...options };

    const textValue = String(cfg.text ?? '').trim();
    if(!textValue && !cfg.badge) return;

    const box = document.createElement('div');
    box.className = 'inline-message';
    box.dataset.tone = cfg.isPreview ? 'preview' : (cfg.tone || 'danger');

    if(cfg.badge){
      const badgeEl = document.createElement('span');
      badgeEl.className = 'pixel-badge pixel-badge--status';
      if(cfg.icon){
        const iconEl = document.createElement('i');
        iconEl.className = cfg.icon;
        badgeEl.appendChild(iconEl);
      }
      const badgeLabel = document.createElement('span');
      badgeLabel.textContent = String(cfg.badge);
      badgeEl.appendChild(badgeLabel);
      box.appendChild(badgeEl);
    } else if(cfg.icon){
      const iconEl = document.createElement('i');
      iconEl.className = cfg.icon;
      box.appendChild(iconEl);
    }

    const msgSpan = document.createElement('span');
    msgSpan.className = 'status-message-text';
    msgSpan.textContent = textValue;
    box.appendChild(msgSpan);

    el.appendChild(box);
  }

  function currentWord(){
    return state.selected.map((tile)=>tile.value || state.board[tile.row]?.[tile.col] || '').join('');
  }

  function allRuntimeWords(){
    const raw = state.runtime?.vocabulary || state.runtime?.vocabularyWords || state.runtime?.words || [];
    return raw.map((entry)=>normalizeWord(entry.wordText || entry.word || entry.normalizedText)).filter(Boolean);
  }

  function isTopicWord(word){
    const normalized = normalizeWord(word);
    if (!normalized) return false;
    return allRuntimeWords().includes(normalized) || normalized === getActiveCoreWord();
  }

  function isValidWord(word){
    const normalized = normalizeWord(word);
    if(normalized.length < 3 || normalized.length > 12) return false;
    if (isTopicWord(normalized)) return true;
    return Boolean(window.LexRaidBalance && window.LexRaidBalance.isEnglishLexiconWord(normalized));
  }

  function getEffectiveChapterRules(){
    const chapterNo = Number(state.stage?.chapterNo || 1);
    if (window.LexRaidBalance && typeof window.LexRaidBalance.getChapterRules === 'function') {
      return window.LexRaidBalance.getChapterRules(chapterNo, state.playMode);
    }
    return {
      mode: state.playMode,
      chapterNo,
      timeSec: state.playMode === 'practice' ? 0 : (chapterNo === 1 ? 45 : 35),
      freeHints: state.playMode === 'practice' ? 99 : (chapterNo === 1 ? 3 : 2),
      bossAtkBase: chapterNo === 1 ? 6 : 8,
      shieldFactor: chapterNo === 1 ? 0.75 : 1.0,
      traitsUnlocked: chapterNo >= 2
    };
  }

  function parseStageChip(){
    const stage = state.stage || {};
    const rules = getEffectiveChapterRules();
    const timerChip = rules.timeSec > 0 ? `${rules.timeSec}s / turn` : 'Practice ∞';
    document.getElementById('stageChipRow').innerHTML = `
      <span class="raid-chip">Chapter ${stage.chapterNo || 1}</span>
      <span class="raid-chip">${stage.boardRows || 5} x ${stage.boardCols || 5}</span>
      <span class="raid-chip">${timerChip}</span>
      <span class="raid-chip">${window.appApi.escapeHtml(stage.difficulty || 'NORMAL')}</span>`;
  }

  function getCurrentWaveEntry(){
    if (!Array.isArray(state.wavePlan) || !state.wavePlan.length) return null;
    return state.wavePlan[Math.min(state.wavePlan.length - 1, Math.max(0, (state.waveIndex || 1) - 1))];
  }

  function renderBossTelegraphAndStatuses(){
    const wave = getCurrentWaveEntry();
    const telEl = document.getElementById('bossTelegraphText');
    if (telEl) {
      if (state.bossStatuses?.stun > 0) {
        telEl.textContent = 'Choáng: Quái vật mất lượt phản công sắp tới!';
      } else if (state.bossPhase >= 2) {
        telEl.textContent = `Phase 2! ${wave?.telegraph || 'Thủ lĩnh tung đòn mạnh!'}`;
      } else {
        telEl.textContent = wave?.telegraph || 'Sẵn sàng công kích';
      }
    }
    const statusEl = document.getElementById('bossStatusPills');
    if (statusEl) {
      const chips = [];
      if (state.bossStatuses?.burn > 0) chips.push(`<span class="status-pill status-pill--burn">Thiêu đốt (${state.bossStatuses.burn})</span>`);
      if (state.bossStatuses?.frost > 0) chips.push(`<span class="status-pill status-pill--frost">Băng giá (${state.bossStatuses.frost})</span>`);
      if (state.bossStatuses?.stun > 0) chips.push(`<span class="status-pill status-pill--stun">Choáng (${state.bossStatuses.stun})</span>`);
      if (state.royalGuardActive) chips.push('<span class="status-pill status-pill--guard">Khiên Hoàng Gia</span>');
      statusEl.innerHTML = chips.join('');
    }
  }

  function initEncounterPlan(){
    if (state.raidSessionId || !window.LexRaidEncounters) {
      state.totalWaves = state.raidSessionId ? Math.max(1, getCoreWordEntries().length || 1) : 5;
      return;
    }
    const ch = Number(state.stage?.chapterNo || 1);
    const seed = Number(state.stage?.stageId || 1) * 97 + ch * 31;
    state.wavePlan = window.LexRaidEncounters.generateFiveWavePlan({
      chapterNo: ch,
      seed,
      chapterBossTheme: detectBossTheme()
    });
    state.totalWaves = state.wavePlan.length || 5;
  }

  function applyWaveEncounter(waveNumber, isInitial = false){
    if (state.raidSessionId) return;
    const plan = state.wavePlan;
    if (!Array.isArray(plan) || !plan.length) return;
    const idx = Math.max(1, Math.min(plan.length, Number(waveNumber || 1)));
    const entry = plan[idx - 1];
    state.waveIndex = idx;
    state.waveTurn = 1;
    state.bossTheme = entry.theme;
    state.bossRarity = entry.rarity;
    state.bossPhase = 1;
    state.bossStatuses = {};

    const rules = getEffectiveChapterRules();
    const baseHp = Number(state.stage?.boss?.baseHp || 100);
    const baseShield = Number(state.stage?.boss?.baseShield || 30);
    state.bossMaxHp = Math.max(60, Math.round(baseHp * entry.hpScale));
    state.bossMaxShield = Math.max(10, Math.round(baseShield * entry.shieldScale * rules.shieldFactor));
    state.bossHp = state.bossMaxHp;
    state.bossShield = state.bossMaxShield;

    const meta = window.RaidPhaserConfig?.bosses?.[entry.theme];
    const lore = bossLore[entry.theme];
    state.currentBossDetails = {
      name: `${meta?.label || themeLabel[entry.theme] || 'Boss'}`,
      element: lore?.element || 'SHADOW'
    };
    if (!isInitial) {
      renderStatus(`Đợt ${idx}/${state.totalWaves}: ${state.currentBossDetails.name} (${entry.label}) xuất trận!`, 'warning');
    }
  }

  function setPlayMode(nextMode){
    const mode = nextMode === 'practice' ? 'practice' : 'campaign';
    state.playMode = mode;
    const campaignBtn = document.getElementById('modeCampaignBtn');
    const practiceBtn = document.getElementById('modePracticeBtn');
    const modeBadge = document.getElementById('raidModeBadge');
    if (campaignBtn) campaignBtn.classList.toggle('is-active', mode === 'campaign');
    if (practiceBtn) practiceBtn.classList.toggle('is-active', mode === 'practice');
    if (modeBadge) {
      modeBadge.innerHTML = mode === 'practice'
        ? '<i class="bi bi-cup-hot-fill"></i> Practice Mode · Học thư giãn'
        : '<i class="bi bi-shield-shaded"></i> Campaign · Boss Hunt';
    }
    const rules = getEffectiveChapterRules();
    state.hintCharges = rules.freeHints;
    updateHintControls();
    parseStageChip();
    tickTimer(true);
    renderStatus(mode === 'practice'
      ? 'Practice Mode: không giới hạn thời gian · mở rộng gợi ý học từ vựng (không tính thưởng xếp hạng).'
      : `Campaign Mode · Chapter ${rules.chapterNo}: ${rules.timeSec}s mỗi lượt.`,
      mode === 'practice' ? 'success' : 'warning');
  }

  function detectBossTheme(){
    const bossCode = String(state.stage?.boss?.code || '').toUpperCase();
    const bossName = String(state.stage?.boss?.name || '').toUpperCase();
    if (bossCode.includes('CAPTAIN') || bossName.includes('CAPTAIN')) return 'captain';
    if (bossCode.includes('CRAB') || bossName.includes('CRAB')) return 'crabby';
    if (bossCode.includes('FIERCE') || bossCode.includes('TOOTH') || bossName.includes('FIERCE')) return 'fierce';
    if (bossCode.includes('PINK') || bossName.includes('STAR')) return 'pink';
    if (bossCode.includes('TOTEM') || bossName.includes('TOTEM')) {
      if (bossCode.includes('III') || bossName.includes('III')) return 'totem3';
      if (bossCode.includes('II') || bossName.includes('II')) return 'totem2';
      return 'totem1';
    }
    if (bossCode.includes('SHELL') || bossName.includes('SHELL')) return 'seashell';
    if (bossCode.includes('CANNON') || bossName.includes('CANNON')) return 'cannon';
    const stageNo = Math.max(0, Number(state.stage?.stageNo || state.stage?.stageId || 1) - 1);
    return bossOrder[stageNo % bossOrder.length];
  }

  function stopMonsterAnimator(){
    if(state.monsterAnimator){
      clearInterval(state.monsterAnimator);
      state.monsterAnimator = null;
    }
  }

  function playFrameMonster(theme, mode = 'idle', duration){
    stopMonsterAnimator();

    const stageContainer = document.querySelector('.battle-stage');
    const isFallback = stageContainer && stageContainer.getAttribute('data-renderer') === 'canvas-fallback';
    if (!isFallback) {
      return;
    }

    const img = document.getElementById('bossFrameSprite');
    if (!img) return;
    const sheet = document.getElementById('bossSpriteSheet');
    if (sheet) sheet.style.display = 'none';

    const frames = monsterFrames[theme]?.[mode] || monsterFrames[theme]?.idle;
    if(!frames || !frames.length) return;
    sheet.style.display = 'none';
    img.classList.add('is-visible');
    let index = 0;
    img.src = frames[0];
    state.monsterAnimator = setInterval(()=>{
      index = (index + 1) % frames.length;
      img.src = frames[index];
    }, 110);
    if(duration){
      setTimeout(()=>{
        stopMonsterAnimator();
        playFrameMonster(theme, 'idle');
      }, duration);
    }
  }

  function setHeroMode(mode = 'idle', duration){
    ['heroSprite','heroStageSprite'].forEach((id)=>{
      const el = document.getElementById(id);
      if(el) el.className = `pixel-unit pixel-unit--${state.unitCode} is-${mode}`;
    });
    if(duration) setTimeout(()=>setHeroMode('idle'), duration);
  }

  function findVocabMetadata(word){
    const target = normalizeWord(word);
    if (!target) return null;
    const raw = Array.isArray(state.runtime?.vocabulary)
      ? state.runtime.vocabulary
      : (Array.isArray(state.runtime?.vocabularyWords) ? state.runtime.vocabularyWords : []);
    const match = raw.find((entry) => normalizeWord(entry?.wordText || entry?.normalizedText || entry?.word) === target);
    if (match) {
      return {
        wordText: match.wordText || target,
        partOfSpeech: match.partOfSpeech || null,
        meaningVi: match.meaningVi || null,
        meaningEn: match.meaningEn || null,
        levelCefr: match.levelCefr || null
      };
    }
    const core = getActiveCoreEntry();
    if (core && normalizeWord(core.coreWord) === target) {
      return {
        wordText: core.coreWord,
        partOfSpeech: null,
        meaningVi: core.clueText || null,
        meaningEn: null,
        levelCefr: null
      };
    }
    return null;
  }

  function speakEnglishWord(word){
    const clean = String(word || '').trim();
    if (!clean) return false;
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance === 'function') {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(clean);
        utter.lang = 'en-US';
        utter.rate = 0.92;
        window.speechSynthesis.speak(utter);
        return true;
      }
    } catch (e) {
      // Ignore audio errors cleanly in headless browsers
    }
    return false;
  }

  function renderWordFeedback(entry){
    const toast = document.getElementById('wordFeedbackToast');
    if (!toast || !entry) return;
    const badgeClass = entry.wordCategory === 'TOPIC' || entry.wordCategory === 'CORE'
      ? 'word-feedback-badge word-feedback-badge--topic'
      : 'word-feedback-badge';
    const badgeLabel = entry.wordCategory === 'CORE'
      ? 'CORE WORD'
      : (entry.wordCategory === 'TOPIC' ? 'TOPIC +30%' : 'GLOBAL LEXICON');
    const meaningText = entry.meaningText
      ? window.appApi.escapeHtml(entry.meaningText)
      : 'Từ tiếng Anh hợp lệ (chưa có thẻ nghĩa đầy đủ trong DB)';
    const statsText = `${entry.damageDealt} DMG · +${entry.manaGain} MP`;
    toast.innerHTML = `
      <span class="${badgeClass}">${badgeLabel}</span>
      <strong>${window.appApi.escapeHtml(entry.word)}</strong>
      <span>(${statsText})</span>
      <span>· ${meaningText}</span>
      <button type="button" class="word-tts-btn" id="wordTtsBtn" aria-label="Phát âm từ ${window.appApi.escapeHtml(entry.word)}">
        <i class="bi bi-volume-up-fill"></i> Nghe
      </button>`;
    toast.classList.add('is-visible');
    const ttsBtn = document.getElementById('wordTtsBtn');
    if (ttsBtn) ttsBtn.onclick = () => speakEnglishWord(entry.word);
  }

  function recordWordJournal(entry){
    if (!entry || !entry.word) return;
    const exists = state.discoveredWords.some((item) => item.word === entry.word);
    if (!exists) {
      state.discoveredWords.push(entry);
    }
    try {
      const key = 'glp.wordJournal';
      const current = JSON.parse(localStorage.getItem(key) || '[]');
      const list = Array.isArray(current) ? current : [];
      const idx = list.findIndex((item) => item && item.word === entry.word);
      const record = {
        word: entry.word,
        wordCategory: entry.wordCategory,
        meaningText: entry.meaningText || null,
        hasMeaningCard: Boolean(entry.meaningText),
        learnedAt: new Date().toISOString()
      };
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...record };
      } else {
        list.unshift(record);
      }
      localStorage.setItem(key, JSON.stringify(list.slice(0, 80)));
    } catch (e) {
      // Ignore storage quota errors
    }
  }

  function updateHintControls(){
    const chargeEl = document.getElementById('hintChargeVal');
    if (chargeEl) chargeEl.textContent = String(Math.max(0, state.hintCharges));
    const revealBtn = document.getElementById('hintRevealBtn');
    if (revealBtn) revealBtn.disabled = state.hintCharges <= 0 || state.finished;
  }

  function useMeaningHint(){
    if (state.finished) return;
    const word = getActiveCoreWord();
    const clue = getActiveClueText();
    const firstLetter = word ? word[0] : '?';
    state.hintsUsedCount += 1;
    const hintText = `Gợi ý: ${clue} (${word.length} chữ cái · Bắt đầu bằng "${firstLetter}")`;
    const clueEl = document.getElementById('clueText');
    if (clueEl) clueEl.textContent = hintText;
    renderStatus(hintText, 'success');
  }

  function useRevealLetterHint(){
    if (state.finished) return;
    const word = getActiveCoreWord();
    if (!word) return;
    if (state.hintCharges <= 0) {
      renderStatus('Hết lượt mở chữ cho chapter này!', 'warning');
      return;
    }
    if (state.revealedIndexes.length >= word.length) {
      renderStatus('Core Word đã mở đủ các chữ cái!', 'success');
      return;
    }
    state.hintCharges -= 1;
    state.hintsUsedCount += 1;
    nextReveal();
    renderCore();
    updateHintControls();
    renderStatus(`Đã mở gợi ý chữ cái (${state.revealedIndexes.length}/${word.length}).`, 'success');
  }

  function refreshSolvableBoard(){
    if (state.finished || state.transitioning) return;
    state.boardSeedOffset += 1;
    state.selected = [];
    rebuildBoardForActiveCoreWord(true);
    updateHintControls();
    if (state.raidSessionId) syncSession();
    renderStatus('Đã tạo bảng chữ mới (đảm bảo có từ hợp lệ & Core Word).', 'success');
  }

  function buildFallbackBoard(coreWord, rows = 5, cols = 5){
    if (window.LexRaidBalance && typeof window.LexRaidBalance.generateSolvableBoard === 'function') {
      const seed = Number(state.stage?.stageId || 1) * 131 + Number(state.waveIndex || 1) * 17 + Number(state.boardSeedOffset || 0) * 53;
      const generated = window.LexRaidBalance.generateSolvableBoard({
        coreWord,
        topicWords: allRuntimeWords(),
        rows,
        cols,
        seed,
        minGlobalWords: 8
      });
      if (generated && Array.isArray(generated.board) && generated.board.length) {
        return generated.board;
      }
    }
    const totalCells = rows * cols;
    const board = Array.from({ length: rows }, () => Array.from({ length: cols }, randomLetter));
    const letters = normalizeWord(coreWord).split('').filter(Boolean);

    if (!letters.length) return board;

    const answerLetters = letters.slice(0, totalCells);
    const centerRow = Math.floor(rows / 2);
    const centerCol = Math.floor(cols / 2);

    const positions = [];
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const distance = Math.abs(r - centerRow) + Math.abs(c - centerCol);
        positions.push({ row: r, col: c, distance });
      }
    }

    positions.sort((a, b) => a.distance - b.distance);

    const chosen = positions.slice(0, answerLetters.length);
    for (let i = chosen.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [chosen[i], chosen[j]] = [chosen[j], chosen[i]];
    }

    answerLetters.forEach((ch, index) => {
      const pos = chosen[index];
      board[pos.row][pos.col] = ch;
    });

    return board;
  }

  function fillBars(){
    const boss = state.stage?.boss || {};
    const hp = Math.max(0, state.bossHp);
    const maxHp = Math.max(Number(state.bossMaxHp || boss.baseHp || 100), hp);
    const shield = Math.max(0, state.bossShield);
    const maxShield = Math.max(Number(state.bossMaxShield || boss.baseShield || 30), shield, 1);
    const maxRage = Number(boss.rageThreshold || 20);
    const rage = Math.max(0, state.rage);

    document.getElementById('bossName').textContent = state.currentBossDetails?.name || boss.name || 'Boss';
    const bossElementEl = document.getElementById('bossElement');
    if (bossElementEl) {
      const elementVal = state.currentBossDetails?.element || boss.elementType || 'Arcane';
      bossElementEl.textContent = elementVal;
      bossElementEl.className = 'element-badge element-badge--' + String(elementVal).toLowerCase();
    }
    document.getElementById('bossHpValue').textContent = `${hp} / ${maxHp}`;
    document.getElementById('bossShieldValue').textContent = `${shield} / ${maxShield}`;
    document.getElementById('bossRageValue').textContent = `${rage} / ${maxRage}`;
    
    const bossHpHud = document.getElementById('bossHpHudValue');
    if (bossHpHud) bossHpHud.textContent = String(hp);
    
    const bossShieldHud = document.getElementById('bossShieldHudValue');
    if (bossShieldHud) bossShieldHud.textContent = String(shield);
    
    const playerHpHud = document.getElementById('playerHpHudValue');
    if (playerHpHud) playerHpHud.textContent = String(state.playerHp);
    
    document.getElementById('playerHpValue').textContent = `${state.playerHp} / 100`;
    setFillBar('playerHpBar', state.playerHp, 100);
    setFillBar('playerHpBarGhost', state.playerHp, 100);
    setFillBar('bossHpBar', hp, maxHp);
    setFillBar('bossHpBarGhost', hp, maxHp);
    setFillBar('bossShieldBar', shield, maxShield || 1);
    setFillBar('bossShieldBarGhost', shield, maxShield || 1);
    setFillBar('bossRageBar', rage, maxRage);
    setFillBar('bossRageBarGhost', rage, maxRage);

    const bossAvatarImg = document.querySelector('.avatar-boss img');
    if (bossAvatarImg) {
      const theme = state.bossTheme || 'crabby';
      bossAvatarImg.src = `/ui/assets/ui/avatars/portrait-boss-${theme}.png`;
      bossAvatarImg.alt = themeLabel[theme] || 'Boss';
    }
    const heroAvatarImg = document.getElementById('heroAvatarImg');
    if (heroAvatarImg) {
      const unit = state.unitCode || 'warrior';
      heroAvatarImg.src = `/ui/assets/ui/avatars/portrait-hero-${unit}.png`;
    }
    const roleEl = document.getElementById('heroRoleText');
    if (roleEl) {
      const unit = state.unitCode || 'warrior';
      const role = unitTheme[unit]?.label || unitTheme.warrior.label;
      roleEl.textContent = `${role} · Chiến binh từ vựng`;
    }
    const bossNameEl = document.getElementById('bossName');
    if (bossNameEl) {
      const theme = state.bossTheme || 'crabby';
      const cfg = window.RaidPhaserConfig;
      const bossMeta = cfg?.bosses?.[theme];
      bossNameEl.textContent = bossMeta?.label || state.stage?.boss?.name || 'Raincap Warden';
    }
    document.getElementById('comboValue').textContent = `x${state.combo}`;
    document.getElementById('scoreValue').textContent = String(state.score);
    document.getElementById('turnValue').textContent = `${state.turn}/${state.stage?.turnLimit || 5}`;
    document.getElementById('topicCountValue').textContent = String(state.topicCount);
    document.getElementById('coreGuessValue').textContent = String(state.coreGuess);
    document.getElementById('monsterThemeLabel').textContent = themeLabel[state.bossTheme] || 'Boss';
    const rarity = String(state.bossRarity || 'NORMAL').toUpperCase();
    const rarityEl = document.getElementById('bossRarityBadge');
    if (rarityEl) {
      rarityEl.textContent = rarity.replace('_', ' ');
      rarityEl.className = `rarity-pill rarity-pill--${rarity.toLowerCase()}`;
    }
    const phaseEl = document.getElementById('bossPhaseBadge');
    if (phaseEl) phaseEl.textContent = `P${state.bossPhase || 1}`;
    const waveText = `Wave ${state.waveIndex || 1}/${state.totalWaves || 5}`;
    const waveEl = document.getElementById('waveBadge');
    if (waveEl) waveEl.textContent = waveText;
    const waveHudEl = document.getElementById('waveHudValue');
    if (waveHudEl) waveHudEl.textContent = `W${state.waveIndex || 1}/${state.totalWaves || 5}`;
    renderBossTelegraphAndStatuses();
  }

  function renderCore(){
    const word = getActiveCoreWord();
    const slots = Array.from(word).map((ch, index)=>state.guessed || state.revealedIndexes.includes(index) ? ch : '?');
    document.getElementById('coreMask').innerHTML = slots.map((slot)=>`<div class="core-mask__slot">${slot}</div>`).join('');
    document.getElementById('clueText').textContent = getActiveClueText();
  }

  function renderObjectives(){
    const list = document.getElementById('objectiveList');
    const objectives = state.runtime?.objectives || [
      { objectiveType: 'TOPIC_WORD_COUNT', description: 'Tạo 3 topic words', targetValue: 3 },
      { objectiveType: 'CORE_GUESS_COUNT', description: 'Đoán core word', targetValue: 1 }
    ];
    list.innerHTML = objectives.map((objective)=>{
      let current = 0;
      if(objective.objectiveType === 'TOPIC_WORD_COUNT') current = state.topicCount;
      if(objective.objectiveType === 'LONG_WORD_COUNT') current = state.longWord;
      if(objective.objectiveType === 'CORE_GUESS_COUNT') current = state.coreGuess;
      const done = current >= Number(objective.targetValue || 1);
      return `
        <div class="objective-item ${done ? 'is-done' : ''}">
          <div class="objective-dot">${done ? '✓' : '○'}</div>
          <div>
            <strong>${window.appApi.escapeHtml(objective.description || 'Objective')}</strong>
            <div class="small-muted">${current}/${objective.targetValue || 1}</div>
          </div>
        </div>`;
    }).join('');
  }

  function renderRecent(){
    const el = document.getElementById('recentWords');
    el.innerHTML = state.recentWords.length
      ? state.recentWords.slice(0, 10).map((word)=>`<span class="recent-word-chip">${window.appApi.escapeHtml(word)}</span>`).join('')
      : '<span class="small-muted">Chưa có từ nào được submit.</span>';
  }

  function renderWord(){
    state.currentWord = state.selected.map((tile)=>String(tile.value || state.board[tile.row]?.[tile.col] || '')).join('');
    const wordEl = document.getElementById('currentWordValue') || document.querySelector('.attack-dock__word');
    const metaEl = document.getElementById('currentWordMeta') || document.querySelector('.attack-dock__meta');
    if (wordEl) wordEl.textContent = state.currentWord || '—';
    if (metaEl) {
      metaEl.textContent = state.currentWord
        ? `Độ dài ${state.currentWord.length} · chữ đang ghép: ${state.currentWord} · đúng thì tấn công, sai sẽ reset.`
        : 'Chọn các ô chữ bất kỳ để ghép thành từ. Không cần đi liền kề.';
    }
  }

  function renderTileLetter(letter){
    const value = String(letter || '').toUpperCase();
    const klass = value === 'I' ? 'is-i' : (value === 'L' ? 'is-l' : '');
    return `<span class="board-tile__letter ${klass}">${value || '&nbsp;'}</span>`;
  }

  function buildBoardMarkup(){
    return state.board.flatMap((row, rowIndex)=>row.map((ch, colIndex)=>`
      <button class="board-tile" data-key="${boardKey(rowIndex, colIndex)}" data-row="${rowIndex}" data-col="${colIndex}" data-letter="${ch}" type="button">${renderTileLetter(ch)}</button>`)).join('');
  }

  function syncBoardTiles(){
    const el = document.getElementById('boardGrid');
    if (!el) return;
    el.querySelectorAll('.board-tile').forEach((button)=>{
      const row = Number(button.dataset.row);
      const col = Number(button.dataset.col);
      const letter = state.board[row]?.[col] || '';
      button.dataset.letter = letter;
      button.innerHTML = renderTileLetter(letter);
    });
  }

  function updateBoardSelection(invalidKeys = []){
    const el = document.getElementById('boardGrid');
    if (!el) return;
    const selected = new Set(state.selected.map((tile)=>boardKey(tile.row, tile.col)));
    const invalid = new Set(invalidKeys);
    el.querySelectorAll('.board-tile').forEach((button)=>{
      const key = button.dataset.key || boardKey(Number(button.dataset.row), Number(button.dataset.col));
      button.classList.toggle('is-selected', selected.has(key));
      button.classList.toggle('is-invalid', invalid.has(key));
    });
  }

  function renderBoard(force = false, invalidKeys = []){
    const cols = state.stage?.boardCols || 5;
    const rows = state.stage?.boardRows || state.board.length || 5;
    const el = document.getElementById('boardGrid');
    if (!el) return;
    el.style.setProperty('--board-cols', cols);
    el.style.gridTemplateColumns = `repeat(${cols}, var(--tile-size, minmax(0, 1fr)))`;
    const expectedCount = rows * cols;
    if (force || el.children.length !== expectedCount) {
      el.innerHTML = buildBoardMarkup();
    }
    syncBoardTiles();
    updateBoardSelection(invalidKeys);
    renderWord();
    initBoardInteractions();
  }

  function clearPendingReset(){
    if (state.invalidResetTimer) {
      clearTimeout(state.invalidResetTimer);
      state.invalidResetTimer = null;
    }
  }

  function resetSelection(message, tone = 'danger'){
    if (state.finished || state.transitioning) return;
    clearPendingReset();
    state.selected = [];
    state.dragging = false;
    state.lastHoveredKey = '';
    renderBoard(false);
    if (message) renderStatus(message, tone);
  }

  function flashInvalidSelection(invalidKeys, message){
    clearPendingReset();
    state.dragging = false;
    state.lastHoveredKey = '';
    renderBoard(false, invalidKeys);
    if (message) renderStatus(message, 'danger');
    state.invalidResetTimer = setTimeout(()=>{
      state.selected = [];
      renderBoard(false);
      state.invalidResetTimer = null;
    }, 180);
  }

  function addTileToPath(row, col){
    if (state.finished || state.transitioning) return;
    clearPendingReset();
    const index = state.selected.findIndex((tile)=>tile.row === row && tile.col === col);
    if (index > -1) {
      if (index === state.selected.length - 1) {
        state.selected.pop();
        renderWord();
        updateBoardSelection();
      }
      return;
    }
    state.selected.push({ row, col, value: String(state.board[row]?.[col] || '').toUpperCase() });
    renderWord();
    updateBoardSelection();
  }

  function initBoardInteractions(){
    const el = document.getElementById('boardGrid');
    if (!el || el.dataset.bound === 'true') return;
    el.dataset.bound = 'true';

    el.addEventListener('click', (event)=>{
      const button = event.target.closest('.board-tile');
      if (!button) return;
      addTileToPath(Number(button.dataset.row), Number(button.dataset.col));
    });
  }

  function refillSelected(){
    state.selected.forEach((tile)=>{ state.board[tile.row][tile.col] = randomLetter(); });
    // Guarantee active core word remains formable on the board
    const core = getActiveCoreWord();
    if (core) {
      const flat = [];
      state.board.forEach((row, r) => row.forEach((ch, c) => flat.push({ r, c, ch: String(ch || '').toUpperCase() })));
      const available = {};
      flat.forEach((cell) => { available[cell.ch] = (available[cell.ch] || 0) + 1; });
      const needed = {};
      for (const ch of core) needed[ch] = (needed[ch] || 0) + 1;
      const missing = [];
      Object.keys(needed).forEach((ch) => {
        const diff = needed[ch] - (available[ch] || 0);
        for (let i = 0; i < diff; i += 1) missing.push(ch);
      });
      if (missing.length && state.selected.length) {
        for (let i = 0; i < Math.min(missing.length, state.selected.length); i += 1) {
          const slot = state.selected[i];
          if (state.board[slot.row]) state.board[slot.row][slot.col] = missing[i];
        }
      }
    }
  }

  function nextReveal(){
    const word = getActiveCoreWord();
    for(let index = 0; index < word.length; index += 1){
      if(!state.revealedIndexes.includes(index)){
        state.revealedIndexes.push(index);
        break;
      }
    }
  }

  function pauseTimer(paused){
    state.timerPaused = Boolean(paused);
    if (state.timerPaused) {
      clearInterval(state.timer);
      state.timer = null;
      return;
    }
    if (!state.finished && !state.transitioning) {
      tickTimer(false);
    }
  }

  function tickTimer(resetDuration = true){
    clearInterval(state.timer);
    state.timer = null;
    if (state.finished || state.transitioning || state.timerPaused) return;
    const rules = getEffectiveChapterRules();
    const timerEl = document.getElementById('timerValue');
    const timerHud = document.getElementById('timerHudValue');
    if (rules.timeSec <= 0) {
      state.timeLeft = 0;
      if (timerEl) timerEl.textContent = '∞';
      if (timerHud) timerHud.textContent = '∞';
      return;
    }
    if (resetDuration || !Number.isFinite(state.timeLeft) || state.timeLeft <= 0) {
      state.timeLeft = rules.timeSec;
    }
    const formatSecs = (s) => `00:${String(Math.max(0, s)).padStart(2, '0')}`;
    if (timerEl) timerEl.textContent = formatSecs(state.timeLeft);
    if (timerHud) timerHud.textContent = formatSecs(state.timeLeft);
    state.timer = setInterval(()=>{
      if (state.timerPaused || state.transitioning || state.finished) return;
      state.timeLeft -= 1;
      const formatted = formatSecs(state.timeLeft);
      if (timerEl) timerEl.textContent = formatted;
      if (timerHud) timerHud.textContent = formatted;
      if(state.timeLeft <= 0){
        clearInterval(state.timer);
        bossTurn('Hết thời gian, boss phản công.');
      }
    }, 1000);
  }

  function checkAndTriggerBossPhase2(){
    if (state.raidSessionId || state.bossPhase >= 2 || state.bossHp <= 0) return false;
    const wave = getCurrentWaveEntry();
    const halfHp = Math.floor(Math.max(1, state.bossMaxHp) * 0.5);
    const eligible = state.bossRarity === 'CHAPTER_BOSS' || state.bossRarity === 'GUARDIAN' || (wave && wave.traitsActive);
    if (eligible && state.bossHp <= halfHp) {
      state.bossPhase = 2;
      state.bossShield = Math.min(state.bossMaxShield + 15, state.bossShield + 12);
      state.rage = Math.min(999, state.rage + 4);
      renderStatus(`${themeLabel[state.bossTheme] || 'Boss'} bước vào Phase 2! (+12 Shield)`, 'warning');
      return true;
    }
    return false;
  }

  function bossTurn(message){
    if (state.finished) return;
    state.turn += 1;
    state.waveTurn += 1;
    const wave = getCurrentWaveEntry();
    const rules = getEffectiveChapterRules();

    // Burn status damage ticks cleanly in Preview Mode
    let extraNote = '';
    if (!state.raidSessionId && state.bossStatuses?.burn > 0) {
      const burnDmg = 7;
      state.bossHp = Math.max(1, state.bossHp - burnDmg);
      state.bossStatuses.burn -= 1;
      extraNote += ` (Thiêu đốt -${burnDmg} HP)`;
    }

    // Stun skips enemy counter-attack turn
    if (!state.raidSessionId && state.bossStatuses?.stun > 0) {
      state.bossStatuses.stun -= 1;
      if (state.bossStatuses.frost > 0) state.bossStatuses.frost -= 1;
      fillBars();
      renderObjectives();
      renderStatus(`Boss bị Choáng, bỏ qua lượt phản công!${extraNote}`, 'success');
      resetSelection();
      tickTimer(true);
      return;
    }

    state.rage = Math.min(999, state.rage + 3);
    let bossDmg = state.raidSessionId
      ? 8
      : Math.max(4, Math.round(rules.bossAtkBase * (wave?.atkScale || 1)));
    let finalMessage = message;

    if (!state.raidSessionId && wave?.traitsActive && window.LexRaidEncounters) {
      const trait = window.LexRaidEncounters.getMonsterTrait(state.bossTheme);
      if (trait && typeof trait.onBossTurn === 'function') {
        const traitFx = trait.onBossTurn({
          waveTurn: state.waveTurn,
          phase: state.bossPhase,
          hasBurn: Boolean(state.bossStatuses?.burn > 0)
        });
        if (traitFx) {
          if (traitFx.addShield) state.bossShield = Math.min(state.bossMaxShield + 20, state.bossShield + traitFx.addShield);
          if (traitFx.healHp && state.bossHp > 0) state.bossHp = Math.min(state.bossMaxHp, state.bossHp + traitFx.healHp);
          if (traitFx.addRage) state.rage = Math.min(999, state.rage + traitFx.addRage);
          if (traitFx.dmgMultiplier) bossDmg = Math.max(4, Math.round(bossDmg * traitFx.dmgMultiplier));
          if (traitFx.note) extraNote += ` · ${traitFx.note}`;
        }
      }
    }

    if (!state.raidSessionId && state.bossStatuses?.frost > 0) {
      bossDmg = Math.max(2, Math.round(bossDmg * 0.7));
      state.bossStatuses.frost -= 1;
      extraNote += ' · Băng giá giảm 30% sát thương địch';
    }

    if (!state.raidSessionId && state.royalGuardActive) {
      const pct = Math.min(90, Math.max(0, Number(state.royalGuardMitigationPct || 75)));
      const rawBossDmg = bossDmg;
      bossDmg = Math.max(1, Math.round(bossDmg * (1 - pct / 100)));
      const reflect = Math.max(0, Number(state.royalGuardReflect || 6));
      state.royalGuardActive = false;
      state.royalGuardMitigationPct = 0;
      state.royalGuardReflect = 0;
      if (reflect > 0) {
        if (state.bossShield > 0) {
          const spill = Math.max(0, reflect - state.bossShield);
          state.bossShield = Math.max(0, state.bossShield - reflect);
          state.bossHp = Math.max(1, state.bossHp - spill);
        } else {
          state.bossHp = Math.max(1, state.bossHp - reflect);
        }
      }
      finalMessage = `${message} Royal Guard chặn đòn (-${bossDmg} HP thay vì -${rawBossDmg}${reflect ? `, phản ${reflect} băng` : ''}).`;
    }
    state.playerHp = Math.max(0, state.playerHp - bossDmg);
    syncRendererState({ playBossTurn: true });
    setHeroMode('guard', 600);
    playFrameMonster(state.bossTheme, 'attack', 750);
    fillBars();
    renderObjectives();
    renderStatus(`${finalMessage}${extraNote}`);
    if (typeof renderSkillBar === 'function') renderSkillBar();
    const maxTurns = state.playMode === 'practice' ? 99 : Math.max(Number(state.stage?.turnLimit || 5), 10);
    if(state.playerHp <= 0 || state.turn > maxTurns){
      finishBattle(false);
      return;
    }
    resetSelection();
    tickTimer(true);
    syncSession();
  }

  function renderBattleResultOverlay(stateType, data, win){
    const star1 = document.getElementById('finishStar1');
    const star2 = document.getElementById('finishStar2');
    const star3 = document.getElementById('finishStar3');
    const xpEl = document.getElementById('finishXpVal');
    const coinsEl = document.getElementById('finishCoinsVal');
    const scoreEl = document.getElementById('finishScoreVal');
    const levelUpBanner = document.getElementById('finishLevelUpBanner');
    const finishText = document.getElementById('finishText');

    if(scoreEl) scoreEl.textContent = state.score.toLocaleString('vi-VN');

    if(stateType === 'PENDING'){
      if(star1) star1.className = 'pixel-star';
      if(star2) star2.className = 'pixel-star';
      if(star3) star3.className = 'pixel-star';
      if(xpEl) xpEl.innerHTML = '<span class="small-muted" style="font-size:0.85rem"><i class="bi bi-hourglass-split"></i> Đang xác nhận...</span>';
      if(coinsEl) coinsEl.innerHTML = '<span class="small-muted" style="font-size:0.85rem"><i class="bi bi-hourglass-split"></i> Đang xác nhận...</span>';
      if(levelUpBanner) levelUpBanner.style.display = 'none';
      if(finishText) finishText.textContent = `Score ${state.score} · Topic words ${state.topicCount} · Core guesses ${state.coreGuess} · Quái vật: ${themeLabel[state.bossTheme] || 'Boss'} (Đang xác nhận kết quả với máy chủ...)`;
    } else if(stateType === 'CONFIRMED'){
      const stars = Number(data?.starsEarned || (win ? 3 : 1));
      if(star1) star1.className = `pixel-star ${stars >= 1 ? 'is-active' : ''}`;
      if(star2) star2.className = `pixel-star ${stars >= 2 ? 'is-active' : ''}`;
      if(star3) star3.className = `pixel-star ${stars >= 3 ? 'is-active' : ''}`;
      
      const xpEarned = Number(data?.xpEarned || 0);
      const coinsEarned = Number(data?.coinsEarned || 0);
      if(xpEl) xpEl.textContent = `+${xpEarned.toLocaleString('vi-VN')} XP`;
      if(coinsEl) coinsEl.textContent = `+${coinsEarned.toLocaleString('vi-VN')} Gold`;

      if(levelUpBanner){
        if(data?.levelUpOccurred){
          levelUpBanner.style.display = 'flex';
          const sub = document.getElementById('finishLevelUpSub');
          if(sub) sub.textContent = `Bạn đã thăng cấp lên Level ${data.userLevelCurrent || ''}!`;
        } else {
          levelUpBanner.style.display = 'none';
        }
      }
      if(finishText) finishText.textContent = `Score ${state.score} · Topic words ${state.topicCount} · Core guesses ${state.coreGuess} · Quái vật: ${themeLabel[state.bossTheme] || 'Boss'}`;
    } else if(stateType === 'ERROR'){
      if(star1) star1.className = 'pixel-star';
      if(star2) star2.className = 'pixel-star';
      if(star3) star3.className = 'pixel-star';
      if(xpEl) xpEl.innerHTML = '<span class="text-danger small-muted" style="font-size:0.8rem"><i class="bi bi-exclamation-triangle"></i> Chưa lưu (Lỗi mạng)</span>';
      if(coinsEl) coinsEl.innerHTML = '<span class="text-danger small-muted" style="font-size:0.8rem"><i class="bi bi-exclamation-triangle"></i> Chưa lưu (Lỗi mạng)</span>';
      if(levelUpBanner) levelUpBanner.style.display = 'none';
      if(finishText) finishText.textContent = `Không thể kết nối máy chủ để ghi nhận phần thưởng. Điểm lượt chơi: ${state.score}. Vui lòng kiểm tra kết nối mạng.`;
    } else if(stateType === 'PREVIEW'){
      const stars = win ? 3 : 1;
      if(star1) star1.className = `pixel-star ${stars >= 1 ? 'is-active' : ''}`;
      if(star2) star2.className = `pixel-star ${stars >= 2 ? 'is-active' : ''}`;
      if(star3) star3.className = `pixel-star ${stars >= 3 ? 'is-active' : ''}`;
      if(xpEl) xpEl.innerHTML = '<span class="small-muted" style="font-size:0.85rem">Chế độ xem trước</span>';
      if(coinsEl) coinsEl.innerHTML = '<span class="small-muted" style="font-size:0.85rem">Chế độ xem trước</span>';
      if(levelUpBanner) levelUpBanner.style.display = 'none';
      if(finishText) finishText.textContent = `Score ${state.score} · Quái vật: ${themeLabel[state.bossTheme] || 'Boss'} (Trận đấu xem trước, không tích lũy phần thưởng)`;
    }

    const reviewPanel = document.getElementById('finishReviewPanel');
    if (reviewPanel && (stateType === 'CONFIRMED' || stateType === 'PREVIEW' || stateType === 'ERROR')) {
      const coreWord = getActiveCoreWord();
      const coreMeta = findVocabMetadata(coreWord);
      const coreDesc = coreMeta && (coreMeta.meaningVi || coreMeta.meaningEn)
        ? `${coreMeta.meaningVi || coreMeta.meaningEn}`
        : getActiveClueText();
      const prompts = state.discoveredWords.slice(0, 4);
      const promptHtml = prompts.length
        ? prompts.map((item) => {
            const desc = item.meaningText
              ? window.appApi.escapeHtml(item.meaningText)
              : 'Từ tiếng Anh hợp lệ — bấm Ôn Volcard để luyện sâu.';
            return `<div class="review-prompt-chip"><strong>${window.appApi.escapeHtml(item.word)}</strong> <span class="small-muted">(${item.wordCategory})</span> · ${desc}</div>`;
          }).join('')
        : `<div class="review-prompt-chip">Core Word: <strong>${window.appApi.escapeHtml(coreWord)}</strong> — ${window.appApi.escapeHtml(coreDesc)}</div>`;
      reviewPanel.style.display = 'grid';
      reviewPanel.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">
          <strong><i class="bi bi-journal-bookmark-fill"></i> Sổ Tay Từ Vựng Trận Đấu</strong>
          <span>Tìm thấy ${state.discoveredWords.length} từ (${state.topicCount} từ chủ đề · ${state.hintsUsedCount} gợi ý)</span>
        </div>
        <div class="small-muted">Core Word: <strong>${window.appApi.escapeHtml(coreWord)}</strong> · ${window.appApi.escapeHtml(coreDesc)}</div>
        <div class="review-prompt-list">${promptHtml}</div>`;
    } else if (reviewPanel && stateType === 'PENDING') {
      reviewPanel.style.display = 'none';
    }
  }

  function finishBattle(win){
    if (state.finished || (state.transitioning && !win)) return;
    state.finished = true;
    clearInterval(state.timer);
    if (typeof renderSkillBar === 'function') renderSkillBar();
    document.getElementById('finishOverlay').classList.add('is-open');
    document.getElementById('finishTitle').textContent = win ? 'Victory' : 'Battle ended';
    document.getElementById('finishHeading').textContent = win ? 'Boss Defeated!' : 'Trận đấu kết thúc';

    if(!state.raidSessionId){
      renderBattleResultOverlay('PREVIEW', null, win);
      return;
    }

    renderBattleResultOverlay('PENDING', null, win);

    window.appApi.finishRaidSession(state.raidSessionId, {
      resultCode: win ? 'WON' : 'LOST',
      scoreTotal: state.score,
      xpEarned: state.score,
      coinsEarned: Math.floor(state.score / 5)
    }).then(res => {
      if(res){
        renderBattleResultOverlay('CONFIRMED', res, win);
        const auth = window.appApi.getAuth();
        if(auth && res.userLevelCurrent){
          auth.levelCurrent = res.userLevelCurrent;
          auth.xpTotal = res.userXpTotal;
          auth.coins = res.userCoins;
          window.appApi.saveAuth(auth);
          window.appApi.renderNavUser();
        }
      } else {
        renderBattleResultOverlay('ERROR', null, win);
      }
    }).catch(() => {
      renderBattleResultOverlay('ERROR', null, win);
    });
  }

  async function syncSession(){
    if(!state.raidSessionId) return;
    try{
      await window.appApi.syncRaidSession(state.raidSessionId, {
        currentRound: state.turn,
        bossHpRemaining: state.bossHp,
        bossShieldRemaining: state.bossShield,
        rageValue: state.rage,
        comboCount: state.combo,
        manaValue: 0,
        totalScore: state.score,
        boardJson: JSON.stringify(state.board),
        selectedPathJson: JSON.stringify(state.selected),
        clueProgressJson: JSON.stringify(state.revealedIndexes)
      });
    }catch(error){
    }
  }

  async function triggerBossDeathAndNextWave() {
    state.transitioning = true;
    clearInterval(state.timer);
    
    updateRaidRenderer({ playBossDeath: true });
    playFrameMonster(state.bossTheme, 'hit', 500);
    renderStatus(`Đợt ${state.waveIndex}/${state.totalWaves} hoàn tất! Quái vật tiếp theo đang tiến vào...`, "success");

    await new Promise(resolve => setTimeout(resolve, 950));

    if (!state.raidSessionId && state.wavePlan.length) {
      const nextWave = Math.min(state.totalWaves, (state.waveIndex || 1) + 1);
      applyWaveEncounter(nextWave, false);
    } else {
      state.waveIndex = Math.min(state.totalWaves, (state.waveIndex || 1) + 1);
      state.bossTheme = getRandomBossTheme(state.bossTheme);
      state.bossHp = Number(state.stage?.boss?.baseHp || 100);
      state.bossShield = Number(state.stage?.boss?.baseShield || 30);
    }

    rebuildBoardForActiveCoreWord(true);
    updateRaidRenderer({ playBossSpawn: true, bossTheme: state.bossTheme, bossRarity: state.bossRarity, waveIndex: state.waveIndex });
    playFrameMonster(state.bossTheme, 'idle');

    state.selected = [];
    fillBars();
    renderCore();
    renderObjectives();
    renderBoard(true);

    await syncSession();

    state.transitioning = false;
    tickTimer(true);
  }

  async function triggerBossDeathAndVictory() {
    state.transitioning = true;
    clearInterval(state.timer);
    
    updateRaidRenderer({ playBossDeath: true });
    playFrameMonster(state.bossTheme, 'hit', 500);
    renderStatus("Quái vật cuối cùng đã bị hạ gục! Chiến thắng!", "success");

    await new Promise(resolve => setTimeout(resolve, 1500));
    
    finishBattle(true);
    state.transitioning = false;
  }

  async function submitWord(){
    if (state.finished || state.transitioning || state.isSubmitting) return;
    state.isSubmitting = true;
    try {
      const word = normalizeWord(state.currentWord);
      if(word.length < 3){
        renderStatus('Từ phải có ít nhất 3 ký tự.');
        return;
      }
      if(!state.selected.length){
        renderStatus('Hãy bấm các ô chữ trước khi attack.');
        return;
      }
      const uniqueSelectedKeys = new Set(state.selected.map((tile) => boardKey(tile.row, tile.col)));
      if (uniqueSelectedKeys.size !== state.selected.length) {
        renderStatus('Mỗi ô trên bảng chỉ được dùng một lần cho mỗi từ.');
        return;
      }
      const invalidKeys = state.selected.map((tile)=>boardKey(tile.row, tile.col));
      if(state.recentWords.includes(word)){
        flashInvalidSelection(invalidKeys, 'Từ này đã dùng rồi, hãy ghép từ khác.');
        return;
      }
      if(!isValidWord(word)){
        flashInvalidSelection(invalidKeys, 'Từ không có trong từ điển tiếng Anh hoặc chủ đề, reset lựa chọn.');
        return;
      }

      const pathPayload = state.selected.map((tile)=>(
        { row: tile.row, col: tile.col, value: tile.value || state.board[tile.row]?.[tile.col] || '' }
      ));

      let backendResult = null;
      if(state.raidSessionId){
        try{
          backendResult = await window.appApi.submitRaidWord(state.raidSessionId, { submittedWord: word, word, normalizedWord: word, path: pathPayload, boardJson: JSON.stringify(state.board), roundNo: state.turn, selectedPathJson: JSON.stringify(pathPayload) });
        }catch(error){
          renderStatus(error?.message || 'Lỗi kết nối máy chủ khi gửi từ (không tự chuyển sang Preview Mode).');
          return;
        }
      }

      if(backendResult && backendResult.accepted === false){
        flashInvalidSelection(invalidKeys, backendResult.rejectionReason || `Backend từ chối từ ${word}.`);
        return;
      }

      let accepted = false;
      let movedCoreFromSubmit = false;
      let coreSolved = false;
      let wordCategory = 'GLOBAL';
      let damageDealt = 0;
      let bonusDamage = 0;
      let manaGain = 0;
      let isTopicMatch = isTopicWord(word);

      if(backendResult && backendResult.accepted){
        accepted = true;
        const previousIndex = state.currentCoreIndex;
        state.score += Number(backendResult.scoreGain || 0);
        state.combo = Number(backendResult.comboAfter || (state.combo + 1));
        state.rage = Number(backendResult.rageValue ?? state.rage);
        state.bossShield = Number(backendResult.bossShieldRemaining ?? state.bossShield);
        state.bossHp = Number(backendResult.bossHpRemaining ?? state.bossHp);
        isTopicMatch = Boolean(backendResult.topicBonusApplied || backendResult.wordCategory === 'TOPIC' || backendResult.wordCategory === 'CORE');
        wordCategory = backendResult.wordCategory || (isTopicMatch ? 'TOPIC' : 'GLOBAL');
        damageDealt = Number(backendResult.damageDealt || 0) + Number(backendResult.shieldDamage || 0);
        bonusDamage = Number(backendResult.bonusDamage || 0);
        manaGain = Number(backendResult.manaGain || 0);
        if (backendResult.manaAfter !== undefined && backendResult.manaAfter !== null) {
          state.previewMana = Math.min(state.maxPreviewMana, Number(backendResult.manaAfter));
        } else {
          state.previewMana = Math.min(state.maxPreviewMana, state.previewMana + manaGain);
        }
        if (isTopicMatch) state.topicCount += 1;
        if(word.length >= 5) state.longWord += 1;
        coreSolved = backendResult.coreSolved || false;
        if(syncRuntimeCoreFromResult(backendResult)){
          movedCoreFromSubmit = state.currentCoreIndex > previousIndex;
          state.guessed = !movedCoreFromSubmit;
          state.revealedIndexes = movedCoreFromSubmit
            ? []
            : Array.from({ length: getActiveCoreWord().length }, (_, index) => index);
        }
      } else {
        // Preview Mode deterministic combat metrics matching backend LexRaidBalanceConfig
        const balance = window.LexRaidBalance;
        const nextCombo = state.combo + 1;
        const metrics = balance
          ? balance.calculateAttackMetrics(word.length, nextCombo, isTopicMatch)
          : {
              baseDamage: word.length * 5 + nextCombo * 2,
              bonusDamage: isTopicMatch ? Math.round((word.length * 5 + nextCombo * 2) * 0.3) : 0,
              totalDamage: isTopicMatch ? Math.round((word.length * 5 + nextCombo * 2) * 1.3) : (word.length * 5 + nextCombo * 2),
              manaGain: Math.min(6, Math.max(1, Math.floor(word.length / 2)) + (isTopicMatch ? 1 : 0))
            };
        damageDealt = metrics.totalDamage;
        bonusDamage = metrics.bonusDamage;
        manaGain = metrics.manaGain;

        if (word === getActiveCoreWord()) {
          accepted = true;
          coreSolved = true;
          wordCategory = 'CORE';
          state.score += 40 + metrics.totalDamage;
          state.combo = nextCombo;
          state.bossHp = 0;
          state.previewMana = Math.min(state.maxPreviewMana, state.previewMana + Math.min(state.maxPreviewMana, manaGain + 2));
          state.topicCount += 1;
          if(word.length >= 5) state.longWord += 1;
          const moved = advanceCoreWord();
          movedCoreFromSubmit = moved;
          state.guessed = !moved;
          state.revealedIndexes = moved ? [] : Array.from({ length: word.length }, (_, index) => index);
        } else {
          wordCategory = isTopicMatch ? 'TOPIC' : 'GLOBAL';
          const wave = getCurrentWaveEntry();
          if (wave?.traitsActive && window.LexRaidEncounters) {
            const trait = window.LexRaidEncounters.getMonsterTrait(state.bossTheme);
            if (trait && typeof trait.modifyIncomingDamage === 'function') {
              damageDealt = trait.modifyIncomingDamage({
                damage: damageDealt,
                isTopicWord: isTopicMatch,
                wordLength: word.length,
                turn: state.turn
              });
            }
          }
          state.score += Math.max(10, word.length * 8 + (isTopicMatch ? 8 : 0));
          state.combo = nextCombo;
          if (isTopicMatch) state.topicCount += 1;
          if(word.length >= 5) state.longWord += 1;
          state.previewMana = Math.min(state.maxPreviewMana, state.previewMana + manaGain);
          const bypassShield = Boolean(wave?.traitsActive && word.length >= 5 && window.LexRaidEncounters?.getMonsterTrait(state.bossTheme)?.bypassShieldIfLong);
          if(state.bossShield > 0 && !bypassShield){
            const remainingShield = Math.max(0, state.bossShield - damageDealt);
            const spill = Math.max(0, damageDealt - state.bossShield);
            state.bossShield = remainingShield;
            state.bossHp = Math.max(0, state.bossHp - spill);
          }else{
            state.bossHp = Math.max(0, state.bossHp - damageDealt);
          }
          checkAndTriggerBossPhase2();
        }
      }

      state.recentWords.unshift(word);
      state.recentWords = [...new Set(state.recentWords)].slice(0, 10);
      const meta = findVocabMetadata(word);
      const meaningText = (backendResult && Array.isArray(backendResult.unlockedClues) && backendResult.unlockedClues.length)
        ? backendResult.unlockedClues[0]
        : (meta ? [meta.partOfSpeech, meta.meaningVi || meta.meaningEn, meta.levelCefr].filter(Boolean).join(' · ') : null);
      const wordEntry = {
        word,
        wordCategory,
        damageDealt,
        manaGain,
        meaningText: meaningText || null,
        hasMeaningCard: Boolean(meaningText)
      };
      recordWordJournal(wordEntry);
      renderWordFeedback(wordEntry);

      if(!movedCoreFromSubmit && !coreSolved){
        nextReveal();
      }

      syncRendererState({ playAttack: true });
      setHeroMode('attack', 650);
      playFrameMonster(state.bossTheme, 'hit', 420);

      refillSelected();
      state.selected = [];
      tickSkillCooldowns();
      fillBars();
      renderCore();
      renderObjectives();
      renderRecent();
      if (typeof renderSkillBar === 'function') renderSkillBar();

      const hasMorePreviewWaves = !state.raidSessionId && state.waveIndex < state.totalWaves;
      if(coreSolved) {
        if (movedCoreFromSubmit || hasMorePreviewWaves) {
          triggerBossDeathAndNextWave();
        } else {
          triggerBossDeathAndVictory();
        }
        return;
      }

      if(state.bossHp <= 0){
        const moved = advanceCoreWord();
        if(moved || hasMorePreviewWaves){
          triggerBossDeathAndNextWave();
        }else{
          triggerBossDeathAndVictory();
        }
        return;
      }

      const categoryTag = wordCategory === 'TOPIC'
        ? `Chủ đề +${bonusDamage} sát thương`
        : (wordCategory === 'CORE' ? 'Core Word!' : 'Từ tiếng Anh');
      renderStatus(`${word} (${categoryTag}) · ${damageDealt} DMG · +${manaGain} MP`, 'success');
      renderBoard(false);
      tickTimer(true);
      syncSession();
    } finally {
      state.isSubmitting = false;
    }
  }

  async function guessCoreWord(){
    if (state.finished || state.transitioning || state.isSubmitting) return;
    state.isSubmitting = true;
    try {
      const target = getActiveCoreWord();
      const guess = normalizeWord(currentWord() || state.currentWord || '');
      if(!guess){
        renderStatus('Hãy chọn các chữ để ghép từ rồi mới guess core word.');
        return;
      }

      let backendResult = null;
      const activeCoreWordId = getActiveCoreWordId();

      if(state.raidSessionId && activeCoreWordId){
        try{
          backendResult = await window.appApi.guessCoreWord(state.raidSessionId, {
            stageCoreWordId: activeCoreWordId,
            guessedWord: guess
          });
        }catch(error){
          renderStatus(error?.message || 'Lỗi kết nối máy chủ khi đoán Core Word.');
          return;
        }
      }

      state.coreGuess += 1;

      if(backendResult){
        if(backendResult.accepted){
          const previousIndex = state.currentCoreIndex;
          state.score += Number(backendResult.scoreGain || 0);
          state.bossHp = 0; // set HP to 0 for transition
          state.bossShield = 0;
          state.rage = Number(backendResult.rageValue ?? state.rage);
          syncRendererState({ playAttack: true });
          setHeroMode('attack', 650);
          playFrameMonster(state.bossTheme, 'hit', 500);

          syncRuntimeCoreFromResult(backendResult);
          const moved = state.currentCoreIndex > previousIndex;
          state.guessed = !moved;
          state.revealedIndexes = moved ? [] : Array.from({ length: getActiveCoreWord().length }, (_, index) => index);

          fillBars();
          renderCore();
          renderObjectives();

          if(moved){
            triggerBossDeathAndNextWave();
          }else{
            triggerBossDeathAndVictory();
          }
          return;
        }

        renderStatus(backendResult.rejectionReason || 'Sai core word, boss phản công.');
        bossTurn('Đoán sai core word, boss phản công.');
        syncSession();
        return;
      }

      if(guess === target){
        state.score += 80;
        state.bossHp = 0;
        state.bossShield = 0;
        syncRendererState({ playAttack: true });
        setHeroMode('attack', 650);
        playFrameMonster(state.bossTheme, 'hit', 500);

        const moved = advanceCoreWord();
        const hasMorePreviewWaves = !state.raidSessionId && state.waveIndex < state.totalWaves;
        state.guessed = !moved && !hasMorePreviewWaves;
        state.revealedIndexes = (moved || hasMorePreviewWaves) ? [] : Array.from({ length: target.length }, (_, index) => index);

        fillBars();
        renderCore();
        renderObjectives();

        if(moved || hasMorePreviewWaves){
          renderStatus('Lexical Judgment! Core Word khai mở đòn kết liễu quái vật!', 'success');
          triggerBossDeathAndNextWave();
        }else{
          triggerBossDeathAndVictory();
        }
        return;
      } else {
        renderStatus('Sai core word, path reset và boss phản công.');
        bossTurn('Đoán sai core word, boss phản công.');
      }
      syncSession();
    } finally {
      state.isSubmitting = false;
    }
  }

  function getStaticSkillEligibility(skill){
    if (!skill) return { ok: false, code: 'MISSING', reason: 'Kỹ năng không tồn tại.' };
    if (state.raidSessionId) {
      return { ok: false, code: 'BACKEND_LOCKED', reason: 'Kỹ năng Preview tạm khóa trong trận đấu Backend (chưa được máy chủ hỗ trợ).' };
    }
    if (state.finished) {
      return { ok: false, code: 'FINISHED', reason: 'Trận đấu đã kết thúc.' };
    }
    if (Array.isArray(skill.allowedHeroes) && !skill.allowedHeroes.includes(state.unitCode)) {
      return { ok: false, code: 'HERO_MISMATCH', reason: `${skill.name} chỉ dành cho ${skill.allowedHeroes.join('/')} (đang chọn ${state.unitCode}).` };
    }
    const cd = Number(state.skillCooldowns[skill.id] || 0);
    if (cd > 0) {
      return { ok: false, code: 'COOLDOWN', reason: `${skill.name} đang hồi chiêu (${cd} lượt).` };
    }
    if (skill.minCombo && state.combo < skill.minCombo) {
      return { ok: false, code: 'COMBO', reason: `${skill.name} yêu cầu Combo >= x${skill.minCombo} (hiện tại x${state.combo}).` };
    }
    if (skill.requiresCoreClue && !(state.revealedIndexes.length >= 1 || state.coreGuess >= 1 || state.guessed)) {
      return { ok: false, code: 'CORE_CLUE', reason: `${skill.name} yêu cầu mở ít nhất 1 manh mối Core Word trước.` };
    }
    if (skill.manaCost > state.previewMana) {
      return { ok: false, code: 'NO_MANA', reason: `Chưa đủ Preview Mana (${state.previewMana}/${skill.manaCost}). Ghép từ hợp lệ để hồi MP!` };
    }
    return { ok: true, code: 'READY', reason: skill.desc };
  }

  function getSkillEligibility(skill){
    const baseCheck = getStaticSkillEligibility(skill);
    if (!baseCheck.ok) return baseCheck;
    if (state.transitioning || state.isSubmitting) {
      return { ok: false, code: 'STATE_BUSY', reason: 'Đang chuyển lượt hoặc gửi dữ liệu, vui lòng chờ.' };
    }
    if (isBattleAnimationBusy()) {
      return { ok: false, code: 'ANIM_BUSY', reason: 'Nhân vật đang thực hiện động tác chiến đấu.' };
    }
    return baseCheck;
  }

  function getVisibleSkillsForDeck(){
    const all = (window.RaidPhaserConfig && window.RaidPhaserConfig.knightSkills) || [];
    const deck = state.skillDeck === 'spell' ? 'spell' : 'knight';
    let filtered = [];
    if (deck === 'spell') {
      filtered = all.filter((s) => s.deckGroup === 'spell' || s.id === 'sacred_recovery' || s.id === 'lexical_judgment');
    } else if (state.unitCode === 'warrior') {
      filtered = all.filter((s) => s.deckGroup === 'knight' || s.deckGroup === 'both');
    } else {
      filtered = all.filter((s) => Array.isArray(s.allowedHeroes) && s.allowedHeroes.includes(state.unitCode));
    }
    return filtered.slice(0, 6);
  }

  function renderSkillBar(){
    const bar = document.getElementById('knightSkillBar');
    if(!bar) return;
    const isBackend = Boolean(state.raidSessionId);
    const skills = getVisibleSkillsForDeck();
    const cycleBtn = document.getElementById('cycleBossPreviewBtn');
    if (cycleBtn) {
      cycleBtn.disabled = isBackend || state.finished;
      cycleBtn.title = isBackend ? 'Đổi quái vật Preview chỉ dùng trong chế độ xem trước' : 'Đổi quái vật Preview (Slime & Skeleton)';
    }
    const cdHtml = (s, elig) => {
      const cd = Number(state.skillCooldowns[s.id] || 0);
      if (isBackend) return '<span class="skill-preview-chip__cd">LOCK</span>';
      if (cd > 0) return `<span class="skill-preview-chip__cd">CD:${cd}T</span>`;
      if (elig.code === 'HERO_MISMATCH') return '<span class="skill-preview-chip__cd">HERO</span>';
      if (elig.code === 'COMBO') return `<span class="skill-preview-chip__cd">x${s.minCombo}+</span>`;
      if (elig.code === 'CORE_CLUE') return '<span class="skill-preview-chip__cd">CORE</span>';
      return s.manaCost > 0 ? `<span class="skill-preview-chip__cd">${s.manaCost}MP</span>` : '';
    };
    const guardPill = state.royalGuardActive ? '<span class="skill-mp-pill skill-mp-pill--guard" title="Khiên Hoàng Gia đang kích hoạt (-75% sát thương đòn kế)">GUARD</span>' : '';
    const metaPill = isBackend
      ? '<span class="skill-mp-pill skill-mp-pill--locked" title="Máy chủ chưa hỗ trợ Knight Skill Preview">Backend · Skill Off</span>'
      : `<span class="skill-mp-pill" title="Preview Skill Mana (không ghi DB)">MP ${state.previewMana}/${state.maxPreviewMana}</span>${guardPill}`;
    const deckLabel = state.skillDeck === 'spell' ? 'Kiếm Kỹ' : 'Phép (3)';

    bar.innerHTML = `
      <div class="skill-bar-preview__meta">
        ${metaPill}
        <button class="skill-deck-tab ${state.skillDeck === 'spell' ? 'is-active' : ''}" id="skillDeckToggle" type="button" title="Chuyển giữa Kiếm Kỹ & Phép Thuật">${deckLabel}</button>
        <button class="skill-sound-toggle ${state.soundEnabled ? 'is-on' : ''}" id="raidSoundBtn" type="button" title="${state.soundEnabled ? 'Tắt âm thanh VFX' : 'Bật âm thanh VFX (Mặc định tắt)'}" aria-label="Bật tắt âm thanh"><i class="bi ${state.soundEnabled ? 'bi-volume-up-fill' : 'bi-volume-mute-fill'}"></i></button>
      </div>
      ${skills.map((s) => {
        const elig = getStaticSkillEligibility(s);
        const active = !isBackend && state.activeSkillId === s.id;
        return `<button class="skill-preview-chip ${active ? 'is-active' : ''}" data-skill-id="${s.id}" data-lock-reason="${window.appApi.escapeHtml(elig.code)}" type="button" title="${window.appApi.escapeHtml(elig.reason)}" ${elig.ok ? '' : 'disabled'}>
          <img src="${s.icon}" alt="">
          <span class="skill-preview-chip__label">${window.appApi.escapeHtml(s.name)}</span>
          ${cdHtml(s, elig)}
        </button>`;
      }).join('')}`;

    bar.querySelectorAll('[data-skill-id]').forEach((btn) => {
      btn.addEventListener('click', () => castKnightSkill(btn.dataset.skillId));
    });
    document.getElementById('skillDeckToggle')?.addEventListener('click', () => {
      state.skillDeck = state.skillDeck === 'spell' ? 'knight' : 'spell';
      renderSkillBar();
    });
    const sndBtn = document.getElementById('raidSoundBtn');
    if (sndBtn) {
      sndBtn.addEventListener('click', () => {
        state.soundEnabled = !state.soundEnabled;
        renderSkillBar();
      });
    }
  }

  function playSwingSfx(){
    if (!state.soundEnabled || typeof Audio === 'undefined') return;
    try {
      const audio = new Audio('/ui/assets/audio/fx-slash-swing.wav');
      audio.volume = 0.25;
      audio.play().catch(() => {});
    } catch (e) {}
  }

  function castKnightSkill(skillId){
    const skills = (window.RaidPhaserConfig && window.RaidPhaserConfig.knightSkills) || [];
    const skill = skills.find((s) => s.id === skillId);
    const elig = getSkillEligibility(skill);
    if (!elig.ok) {
      renderStatus(elig.reason, 'warning', { badge: 'SKILL PREVIEW', isPreview: true });
      renderSkillBar();
      return false;
    }

    state.previewMana = Math.max(0, state.previewMana - skill.manaCost);
    if (skill.cooldown > 0) state.skillCooldowns[skill.id] = skill.cooldown;
    state.activeSkillId = skill.id;
    playSwingSfx();
    syncRendererState({ playSkill: true, skillMeta: skill });
    setHeroMode(skill.heroAnim === 'guard' ? 'guard' : 'attack', 650);

    // Client-only preview feedback (never alters SQL Server / P3 XP or coins)
    if (skill.id === 'sacred_recovery') {
      state.playerHp = Math.min(100, state.playerHp + Number(skill.healHp || 18));
    } else if (skill.id === 'royal_guard') {
      state.royalGuardActive = true;
      state.royalGuardMitigationPct = Number(skill.mitigationPct || 75);
      state.royalGuardReflect = Number(skill.reflectDmg || 6);
    } else {
      const previewDmg = Number(skill.previewDmg || 14);
      const shieldMult = Number(skill.shieldMultiplier || 1);
      if (skill.applyStatus === 'burn') {
        state.bossStatuses.burn = Math.max(Number(state.bossStatuses.burn || 0), Number(skill.statusTurns || 2));
      } else if (skill.applyStatus === 'frost') {
        state.bossStatuses.frost = Math.max(Number(state.bossStatuses.frost || 0), Number(skill.statusTurns || 2));
        if (skill.timeBonusSec && state.playMode === 'campaign') {
          state.timeLeft = Math.min(60, state.timeLeft + Number(skill.timeBonusSec));
        }
      }
      const hadShieldBefore = state.bossShield > 0;
      if (state.bossShield > 0) {
        const shieldDmg = previewDmg * shieldMult;
        const absorbed = Math.min(state.bossShield, shieldDmg);
        const leftover = Math.max(0, previewDmg - Math.ceil(absorbed / shieldMult));
        state.bossShield = Math.max(0, state.bossShield - shieldDmg);
        state.bossHp = Math.max(1, state.bossHp - leftover);
      } else {
        state.bossHp = Math.max(1, state.bossHp - previewDmg);
      }
      if (skill.applyStatus === 'stunOnBreak' && state.bossShield === 0 && hadShieldBefore) {
        state.bossStatuses.stun = 1;
      }
      checkAndTriggerBossPhase2();
    }
    fillBars();
    renderSkillBar();
    renderStatus(`${skill.name}: ${skill.desc} (Preview Mode · không ghi DB)`, 'success', { badge: 'SKILL PREVIEW', isPreview: true });
    return true;
  }

  function tickSkillCooldowns(){
    Object.keys(state.skillCooldowns).forEach((k) => {
      if (state.skillCooldowns[k] > 0) state.skillCooldowns[k] -= 1;
    });
    renderSkillBar();
  }

  function cyclePreviewBoss(){
    if (state.raidSessionId || state.finished || state.transitioning) return;
    const cfg = window.RaidPhaserConfig || {};
    const order = cfg.previewBossOrder || cfg.bossOrder || ['crabby', 'slime', 'skeleton'];
    const curIdx = order.indexOf(state.bossTheme);
    const nextTheme = order[(curIdx + 1) % order.length];
    state.bossTheme = nextTheme;
    const meta = cfg.bosses?.[nextTheme];
    const lore = bossLore[nextTheme];
    state.currentBossDetails = {
      name: meta?.label || themeLabel[nextTheme] || nextTheme,
      element: lore?.element || 'SHADOW'
    };
    if (window.WorldEnvironment) {
      const biome = nextTheme === 'slime' ? 'forest' : (nextTheme === 'crabby' || nextTheme === 'seashell' ? 'waterfall' : 'mountain-dusk');
      window.WorldEnvironment.setBiome(biome);
    }
    syncRendererState({ bossTheme: nextTheme, biome: nextTheme === 'slime' ? 'forest' : 'dusk', resetActors: true });
    playFrameMonster(nextTheme, 'idle');
    fillBars();
    renderStatus(`Boss Preview: ${state.currentBossDetails.name}`, 'success', { badge: 'MONSTER PREVIEW', isPreview: true });
  }

  async function init(){
    window.LexRaidBalance?.loadOfflineLexicon();
    await applyLoadout();
    window.appApi.renderNavUser();
    window.appApi.bindMobileNav();

    try{
      state.stage = await window.appApi.getStageDetail(stageId);
    }catch(error){
      state.stage = {
        stageId,
        stageNo: stageId,
        chapterNo: 1,
        name: 'Whispering Rain Gate',
        description: 'Cửa ải Mưa Thầm — ghép từ vựng mở phong ấn và hạ gục quái vật cổ đại.',
        boardRows: 5,
        boardCols: 5,
        turnLimit: 5,
        timePerRoundSec: 20,
        difficulty: 'NORMAL',
        boss: { name: 'Raincap Warden', baseHp: 100, baseShield: 30, rageThreshold: 20, elementType: 'SHADOW', code: 'MUSHROOM_WARDEN' }
      };
      renderStatus('Đang dùng màn chơi xem trước độc lập (không kết nối SQL Server).', 'warning', {
        badge: 'Preview Mode',
        icon: 'bi bi-eye',
        isPreview: true
      });
    }

    try{
      state.runtime = await window.appApi.getStageRuntime(stageId);
    }catch(error){
      state.runtime = {
        coreWord: 'LEARN',
        clueText: 'A verb about gaining knowledge.',
        vocabulary: [{ wordText: 'learn' }, { wordText: 'raid' }, { wordText: 'clue' }, { wordText: 'word' }, { wordText: 'game' }, { wordText: 'battle' }],
        objectives: [
          { objectiveType: 'TOPIC_WORD_COUNT', description: 'Tạo 3 topic words', targetValue: 3 },
          { objectiveType: 'CORE_GUESS_COUNT', description: 'Đoán core word 1 lần', targetValue: 1 }
        ]
      };
    }

    state.currentCoreIndex = Number.isFinite(Number(state.runtime?.activeCoreIndex)) ? Number(state.runtime.activeCoreIndex) : 0;
    state.guessed = false;
    state.revealedIndexes = [];

    document.getElementById('stageTitle').textContent = state.stage.name || 'Lex Raid';
    document.getElementById('stageSubtitle').textContent = state.stage.description || 'Boss Hunt';
    state.bossTheme = detectBossTheme();
    state.currentBossDetails = {
      name: state.stage?.boss?.name || 'Raincap Warden',
      element: state.stage?.boss?.elementType || 'SHADOW'
    };
    state.bossMaxHp = Number(state.stage?.boss?.baseHp || 100);
    state.bossMaxShield = Number(state.stage?.boss?.baseShield || 30);
    state.bossHp = state.bossMaxHp;
    state.bossShield = state.bossMaxShield;

    if(!applyBoardFromPayload(state.runtime?.board)){
      state.board = buildFallbackBoard(getActiveCoreWord(), state.stage.boardRows || 5, state.stage.boardCols || 5);
    }

    try{
      const userId = window.appApi.getCurrentUserId ? window.appApi.getCurrentUserId() : null;
      if(userId){
        const session = await window.appApi.startRaidSession({ userId, stageId: state.stage.stageId || stageId });
        state.raidSessionId = session?.raidSessionId || session?.id || null;
        if(session) {
          state.bossHp = Number(session.bossHpRemaining ?? state.bossHp);
          state.bossShield = Number(session.bossShieldRemaining ?? state.bossShield);
          state.bossMaxHp = Math.max(state.bossMaxHp, state.bossHp);
          state.bossMaxShield = Math.max(state.bossMaxShield, state.bossShield);
        }
      } else {
        state.raidSessionId = null;
      }
    }catch(error){
      state.raidSessionId = null;
    }

    initEncounterPlan();
    if (!state.raidSessionId) {
      applyWaveEncounter(1, true);
    }
    state.hintCharges = getEffectiveChapterRules().freeHints;
    parseStageChip();

    await mountRaidRenderer(true);
    syncRendererState();
    setTimeout(()=>syncRendererState(), 80);

    renderCore();
    renderObjectives();
    renderRecent();
    renderSkillBar();
    fillBars();
    renderBoard(true);
    playFrameMonster(state.bossTheme, 'idle');
    // Start turn timer only after interactive board is mounted and rendered
    tickTimer(true);

    document.getElementById('submitWordBtn').onclick = () => { playSwingSfx(); return submitWord(); };
    document.getElementById('guessCoreBtn').onclick = () => { playSwingSfx(); return guessCoreWord(); };
    document.getElementById('clearPathBtn').onclick = ()=>resetSelection();
    document.getElementById('finishBattleBtn').onclick = ()=>finishBattle(false);
    document.getElementById('cycleBossPreviewBtn')?.addEventListener('click', cyclePreviewBoss);
    document.getElementById('hintMeaningBtn')?.addEventListener('click', useMeaningHint);
    document.getElementById('hintRevealBtn')?.addEventListener('click', useRevealLetterHint);
    document.getElementById('boardRefreshBtn')?.addEventListener('click', refreshSolvableBoard);
    document.getElementById('modeCampaignBtn')?.addEventListener('click', () => setPlayMode('campaign'));
    document.getElementById('modePracticeBtn')?.addEventListener('click', () => setPlayMode('practice'));
    updateHintControls();

    // Initialize boss info modal
    const bossInfoBtn = document.getElementById('bossInfoBtn');
    const bossInfoModal = document.getElementById('bossInfoModal');
    const closeBossInfoBtn = document.getElementById('closeBossInfoBtn');

    if (bossInfoBtn && bossInfoModal) {
      bossInfoBtn.onclick = () => {
        const theme = state.bossTheme || 'crabby';
        const lore = bossLore[theme] || {
          title: state.currentBossDetails?.name || 'Raincap Warden',
          desc: 'Quái vật canh giữ cổng Lex Raid. Hãy cẩn thận sức mạnh ma pháp của chúng.',
          element: state.currentBossDetails?.element || 'SHADOW'
        };

        document.getElementById('modalBossName').textContent = lore.title;
        document.getElementById('modalBossElement').textContent = lore.element;
        document.getElementById('modalBossDesc').textContent = lore.desc;

        const avatarImg = document.querySelector('.avatar-boss img');
        if (avatarImg) {
          document.getElementById('modalBossAvatar').src = avatarImg.src;
        }

        bossInfoModal.classList.add('is-open');
        pauseTimer(true);
      };
    }

    if (bossInfoModal && closeBossInfoBtn) {
      closeBossInfoBtn.onclick = () => {
        bossInfoModal.classList.remove('is-open');
        pauseTimer(false);
      };
      bossInfoModal.onclick = (e) => {
        if (e.target === bossInfoModal) {
          bossInfoModal.classList.remove('is-open');
          pauseTimer(false);
        }
      };
    }

    if (isQaEnvironment()) {
      window.__LEX_RAID_TEST_HOOKS__ = {
        getActiveCoreWord: () => getActiveCoreWord(),
        getValidWords: () => allRuntimeWords(),
        getScore: () => state.score,
        getBossHp: () => state.bossHp,
        getBossShield: () => state.bossShield,
        getPlayerHp: () => state.playerHp,
        getTurn: () => state.turn,
        getCombo: () => state.combo,
        getUnitCode: () => state.unitCode,
        getRevealedCount: () => state.revealedIndexes.length,
        getRoyalGuard: () => state.royalGuardActive,
        getBossTheme: () => state.bossTheme,
        getSkillState: () => ({
          previewMana: state.previewMana,
          cooldowns: { ...state.skillCooldowns },
          activeSkillId: state.activeSkillId,
          royalGuardActive: state.royalGuardActive,
          soundEnabled: state.soundEnabled,
          skillDeck: state.skillDeck,
          bossStatuses: { ...state.bossStatuses }
        }),
        castSkill: (skillId) => castKnightSkill(skillId),
        cycleBossPreview: () => cyclePreviewBoss(),
        resetSceneActors: () => syncRendererState({ resetActors: true }),
        getRenderer: () => state.renderer?.renderer || null,
        isAnimationBusy: () => isBattleAnimationBusy(),
        isFinished: () => state.finished,
        isBackendMode: () => Boolean(state.raidSessionId),
        setLoadoutAndBoss: ({ unitCode, bossTheme } = {}) => {
          if (unitCode) state.unitCode = unitCode;
          if (bossTheme) state.bossTheme = bossTheme;
          syncRendererState();
          fillBars();
          renderSkillBar();
        },
        triggerBossTurn: () => bossTurn('Boss phản công (kiểm thử).'),
        isSubmitting: () => state.isSubmitting,
        isFallback: () => !state.raidSessionId,
        isValidWord: (w) => isValidWord(w),
        isTopicWord: (w) => isTopicWord(w),
        getDiscoveredWords: () => [...state.discoveredWords],
        getBoard: () => state.board.map((r) => [...r]),
        getHintCharges: () => state.hintCharges,
        useHintMeaning: () => useMeaningHint(),
        useHintReveal: () => useRevealLetterHint(),
        refreshBoard: () => refreshSolvableBoard(),
        speakWord: (w) => speakEnglishWord(w),
        setPlayMode: (m) => setPlayMode(m),
        getPlayMode: () => state.playMode,
        getChapterRules: () => getEffectiveChapterRules(),
        getWaveState: () => ({
          waveIndex: state.waveIndex,
          totalWaves: state.totalWaves,
          bossRarity: state.bossRarity,
          bossPhase: state.bossPhase,
          bossTheme: state.bossTheme,
          wavePlanThemes: state.wavePlan.map((w) => ({ waveIndex: w.waveIndex, theme: w.theme, rarity: w.rarity }))
        }),
        setChapterPreview: (ch) => {
          if (state.raidSessionId) return;
          if (!state.stage) state.stage = {};
          state.stage.chapterNo = Number(ch || 1);
          initEncounterPlan();
          applyWaveEncounter(1, true);
          state.hintCharges = getEffectiveChapterRules().freeHints;
          updateHintControls();
          parseStageChip();
          syncRendererState();
          fillBars();
          tickTimer(true);
        },
        advanceWaveForTest: () => triggerBossDeathAndNextWave()
      };
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();