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
    monsterAnimator: null,
    unitCode: 'warrior',
    avatarCode: 'avatar1',
    renderer: null,
    currentCoreIndex: 0,
    currentBossDetails: null,
    transitioning: false,
    isSubmitting: false
  };

  const monsterFrames = Object.fromEntries(
    Object.entries((window.RaidPhaserConfig && window.RaidPhaserConfig.bosses) || {}).map(([key, value]) => [
      key,
      {
        idle: value.idle.frames,
        attack: value.attack.frames,
        hit: value.hit.frames
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

  function rebuildBoardForActiveCoreWord(){
    if(!applyBoardFromPayload(state.runtime?.board)){
      state.board = buildFallbackBoard(getActiveCoreWord(), state.stage?.boardRows || 5, state.stage?.boardCols || 5);
    }
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
    if(roleEl) roleEl.textContent = `${role} · Chọn chữ bất kỳ để ghép thành từ rồi tung đòn.`;
  }

  function boardKey(row, col){ return `${row}:${col}`; }
  function randomLetter(){ return alphabet[Math.floor(Math.random() * alphabet.length)]; }
  function normalizeWord(word){ return String(word || '').trim().toUpperCase().replace(/[^A-Z]/g, ''); }

  function renderStatus(message, tone = 'danger'){
    const el = document.getElementById('raidStatus');
    if(!el) return;
    if(typeof message === 'string' && message.trim().startsWith('<')){
      el.innerHTML = message;
    } else {
      el.innerHTML = `<div class="inline-message" data-tone="${tone}">${window.appApi.escapeHtml(message)}</div>`;
    }
  }

  function currentWord(){
    return state.selected.map((tile)=>tile.value || state.board[tile.row]?.[tile.col] || '').join('');
  }

  function allRuntimeWords(){
    const raw = state.runtime?.vocabulary || state.runtime?.vocabularyWords || state.runtime?.words || [];
    return raw.map((entry)=>normalizeWord(entry.wordText || entry.word || entry.normalizedText)).filter(Boolean);
  }

  function isValidWord(word){
    const normalized = normalizeWord(word);
    if(normalized.length < 3) return false;
    return allRuntimeWords().includes(normalized) || normalized === getActiveCoreWord();
  }

  function parseStageChip(){
    const stage = state.stage || {};
    document.getElementById('stageChipRow').innerHTML = `
      <span class="raid-chip">Chapter ${stage.chapterNo || 1}</span>
      <span class="raid-chip">${stage.boardRows || 5} x ${stage.boardCols || 5}</span>
      <span class="raid-chip">${stage.timePerRoundSec || 20}s / turn</span>
      <span class="raid-chip">${window.appApi.escapeHtml(stage.difficulty || 'NORMAL')}</span>`;
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

  function buildFallbackBoard(coreWord, rows = 5, cols = 5){
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
    const maxHp = Number(boss.baseHp || 100);
    const maxShield = Number(boss.baseShield || 30);
    const maxRage = Number(boss.rageThreshold || 20);
    const hp = Math.max(0, state.bossHp);
    const shield = Math.max(0, state.bossShield);
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
    if (state.transitioning) return;
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
    if (state.transitioning) return;
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

  function tickTimer(){
    clearInterval(state.timer);
    state.timeLeft = Number(state.stage?.timePerRoundSec || 20);
    const timeFormatted = `00:${String(state.timeLeft).padStart(2,'0')}`;
    document.getElementById('timerValue').textContent = timeFormatted;
    const timerHud = document.getElementById('timerHudValue');
    if (timerHud) timerHud.textContent = timeFormatted;
    state.timer = setInterval(()=>{
      state.timeLeft -= 1;
      const formatted = `00:${String(Math.max(0, state.timeLeft)).padStart(2,'0')}`;
      document.getElementById('timerValue').textContent = formatted;
      if (timerHud) timerHud.textContent = formatted;
      if(state.timeLeft <= 0){
        clearInterval(state.timer);
        bossTurn('Hết thời gian, boss phản công.');
      }
    }, 1000);
  }

  function bossTurn(message){
    state.turn += 1;
    state.rage = Math.min(999, state.rage + 3);
    state.playerHp = Math.max(0, state.playerHp - 8);
    syncRendererState({ playBossTurn: true });
    setHeroMode('guard', 600);
    playFrameMonster(state.bossTheme, 'attack', 750);
    fillBars();
    renderObjectives();
    renderStatus(message);
    if(state.playerHp <= 0 || state.turn > (state.stage?.turnLimit || 5)){
      finishBattle(false);
      return;
    }
    resetSelection();
    tickTimer();
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
  }

  function finishBattle(win){
    if (state.transitioning && !win) return;
    clearInterval(state.timer);
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
    
    // Play death sequence on Phaser
    updateRaidRenderer({ playBossDeath: true });
    playFrameMonster(state.bossTheme, 'hit', 500);
    renderStatus("Quái vật đã bị tiêu diệt! Đợt tiếp theo sắp xuất hiện...", "success");

    // Wait 1.5 seconds for death animation
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Select new boss theme & details
    state.bossTheme = getRandomBossTheme(state.bossTheme);
    state.currentBossDetails = randomBosses.filter(b => b.name !== state.currentBossDetails?.name)[Math.floor(Math.random() * (randomBosses.length - 1))];
    
    // Reset HP & Shield
    state.bossHp = Number(state.stage?.boss?.baseHp || 100);
    state.bossShield = Number(state.stage?.boss?.baseShield || 30);

    // Rebuild board for the new core word
    rebuildBoardForActiveCoreWord();

    // Spawn the new boss on Phaser
    updateRaidRenderer({ playBossSpawn: true, bossTheme: state.bossTheme });
    playFrameMonster(state.bossTheme, 'idle');

    // Reset selection and refresh UI
    state.selected = [];
    fillBars();
    renderCore();
    renderObjectives();
    renderBoard(true);

    // Sync state with backend
    await syncSession();

    state.transitioning = false;
    tickTimer();
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
    if (state.transitioning || state.isSubmitting) return;
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
      const invalidKeys = state.selected.map((tile)=>boardKey(tile.row, tile.col));
      if(state.recentWords.includes(word)){
        flashInvalidSelection(invalidKeys, 'Từ này đã dùng rồi, hãy ghép từ khác.');
        return;
      }
      if(!isValidWord(word)){
        flashInvalidSelection(invalidKeys, 'Từ không hợp lệ, reset lựa chọn ngay.');
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
          backendResult = null;
        }
      }

      if(backendResult && backendResult.accepted === false){
        flashInvalidSelection(invalidKeys, backendResult.rejectionReason || `Backend từ chối từ ${word}.`);
        return;
      }

      let accepted = false;
      let movedCoreFromSubmit = false;
      let coreSolved = false;

      if(backendResult && backendResult.accepted){
        accepted = true;
        const previousIndex = state.currentCoreIndex;
        state.score += Number(backendResult.scoreGain || 0);
        state.combo = Number(backendResult.comboAfter || (state.combo + 1));
        state.rage = Number(backendResult.rageValue ?? state.rage);
        state.bossShield = Number(backendResult.bossShieldRemaining ?? state.bossShield);
        state.bossHp = Number(backendResult.bossHpRemaining ?? state.bossHp);
        state.topicCount += 1;
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
        // Fallback
        if (word === getActiveCoreWord()) {
          accepted = true;
          coreSolved = true;
          state.score += 40;
          state.bossHp = 0;
          const moved = advanceCoreWord();
          movedCoreFromSubmit = moved;
          state.guessed = !moved;
          state.revealedIndexes = moved ? [] : Array.from({ length: word.length }, (_, index) => index);
        } else {
          const damage = Math.max(8, word.length * 4 + (state.combo - 1) * 2);
          state.score += damage * 2;
          state.combo += 1;
          state.topicCount += 1;
          if(word.length >= 5) state.longWord += 1;
          if(state.bossShield > 0){
            const remainingShield = Math.max(0, state.bossShield - damage);
            const spill = Math.max(0, damage - state.bossShield);
            state.bossShield = remainingShield;
            state.bossHp = Math.max(0, state.bossHp - spill);
          }else{
            state.bossHp = Math.max(0, state.bossHp - damage);
          }
        }
      }

      state.recentWords.unshift(word);
      state.recentWords = [...new Set(state.recentWords)].slice(0, 10);
      if(!movedCoreFromSubmit && !coreSolved){
        nextReveal();
      }

      syncRendererState({ playAttack: true });
      setHeroMode('attack', 650);
      playFrameMonster(state.bossTheme, 'hit', 420);

      refillSelected();
      state.selected = [];
      fillBars();
      renderCore();
      renderObjectives();
      renderRecent();

      if(coreSolved) {
        if (movedCoreFromSubmit) {
          triggerBossDeathAndNextWave();
        } else {
          triggerBossDeathAndVictory();
        }
        return;
      }

      if(state.bossHp <= 0){
        const moved = advanceCoreWord();
        if(moved){
          triggerBossDeathAndNextWave();
        }else{
          triggerBossDeathAndVictory();
        }
        return;
      }

      renderStatus(accepted ? `Backend đã nhận từ ${word}, hero tung đòn.` : `Frontend fallback chấp nhận từ ${word}, hero tung đòn.`, 'success');
      renderBoard(false);
      tickTimer();
      syncSession();
    } finally {
      state.isSubmitting = false;
    }
  }

  async function guessCoreWord(){
    if (state.transitioning || state.isSubmitting) return;
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
          backendResult = null;
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
        state.score += 40;
        state.bossHp = 0;
        state.bossShield = 0;
        syncRendererState({ playAttack: true });
        setHeroMode('attack', 650);
        playFrameMonster(state.bossTheme, 'hit', 500);

        const moved = advanceCoreWord();
        state.guessed = !moved;
        state.revealedIndexes = moved ? [] : Array.from({ length: target.length }, (_, index) => index);

        fillBars();
        renderCore();
        renderObjectives();
        
        if(moved){
          triggerBossDeathAndNextWave();
        }else{
          triggerBossDeathAndVictory();
        }
      }else{
        renderStatus('Sai core word, path reset và boss phản công.');
        bossTurn('Đoán sai core word, boss phản công.');
      }
      syncSession();
    } finally {
      state.isSubmitting = false;
    }
  }

  async function init(){
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
        description: 'Board nằm giữa, knight và boss đối đầu trực tiếp.',
        boardRows: 5,
        boardCols: 5,
        turnLimit: 5,
        timePerRoundSec: 20,
        difficulty: 'NORMAL',
        boss: { name: 'Raincap Warden', baseHp: 100, baseShield: 30, rageThreshold: 20, elementType: 'SHADOW', code: 'MUSHROOM_WARDEN' }
      };
      renderStatus('<span class="pixel-chip" style="background:#451a03;color:#fbbf24;border:1px solid #d97706;padding:4px 8px;font-size:0.85rem"><i class="bi bi-eye"></i> Preview Mode: Đang dùng stage demo độc lập (không kết nối SQL Server)</span>');
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
    parseStageChip();
    state.bossTheme = detectBossTheme();
    state.currentBossDetails = {
      name: state.stage?.boss?.name || 'Raincap Warden',
      element: state.stage?.boss?.elementType || 'SHADOW'
    };
    state.bossHp = Number(state.stage?.boss?.baseHp || 100);
    state.bossShield = Number(state.stage?.boss?.baseShield || 30);

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
        }
      } else {
        state.raidSessionId = null;
      }
    }catch(error){
      state.raidSessionId = null;
    }

    await mountRaidRenderer(true);
    syncRendererState();
    setTimeout(()=>syncRendererState(), 80);

    renderCore();
    renderObjectives();
    renderRecent();
    fillBars();
    renderBoard(true);
    playFrameMonster(state.bossTheme, 'idle');
    tickTimer();

    document.getElementById('submitWordBtn').onclick = submitWord;
    document.getElementById('guessCoreBtn').onclick = guessCoreWord;
    document.getElementById('clearPathBtn').onclick = ()=>resetSelection();
    document.getElementById('finishBattleBtn').onclick = ()=>finishBattle(false);

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
      };
    }

    if (bossInfoModal && closeBossInfoBtn) {
      closeBossInfoBtn.onclick = () => {
        bossInfoModal.classList.remove('is-open');
      };
      bossInfoModal.onclick = (e) => {
        if (e.target === bossInfoModal) {
          bossInfoModal.classList.remove('is-open');
        }
      };
    }

    if (typeof window !== 'undefined') {
      window.__LEX_RAID_TEST_HOOKS__ = {
        getActiveCoreWord: () => getActiveCoreWord(),
        getValidWords: () => allRuntimeWords(),
        getScore: () => state.score,
        getBossHp: () => state.bossHp,
        getBossShield: () => state.bossShield,
        isSubmitting: () => state.isSubmitting,
        isFallback: () => !state.raidSessionId
      };
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();