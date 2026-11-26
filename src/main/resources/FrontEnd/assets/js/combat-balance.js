/**
 * Shared Lex Raid Balance, Global English Lexicon Loader & Solvable Board Generator (Phase P4-B.3)
 * Mirrors backend LexRaidBalanceConfig & EnglishLexiconService rules so Preview Mode and backend share
 * deterministic normalization, damage, mana cap, chapter difficulty, and board generation policy.
 */
(function () {
  const BALANCE = {
    minWordLength: 3,
    whitelistMinLength: 2,
    maxWordLength: 12,
    damagePerChar: 5,
    damagePerCombo: 2,
    topicBonusPct: 30,
    minManaGain: 1,
    maxManaGain: 6,
    maxManaCap: 6,
    topicExtraMana: 1,
    coreSolveMana: 2,
    longWordThreshold: 5,
    chapterRules: {
      1: { timeSec: 45, freeHints: 3, bossAtkBase: 6, shieldFactor: 0.75, traitsUnlocked: false },
      2: { timeSec: 38, freeHints: 2, bossAtkBase: 8, shieldFactor: 1.0, traitsUnlocked: true },
      3: { timeSec: 32, freeHints: 2, bossAtkBase: 10, shieldFactor: 1.15, traitsUnlocked: true },
      4: { timeSec: 28, freeHints: 1, bossAtkBase: 12, shieldFactor: 1.3, traitsUnlocked: true }
    }
  };

  // Curated 24 high-frequency everyday 2-letter English words (synchronized with backend EnglishLexiconService)
  const TWO_LETTER_WHITELIST = new Set([
    'AM', 'AN', 'AS', 'AT', 'BE', 'BY', 'DO', 'GO', 'HE', 'IF', 'IN', 'IS',
    'IT', 'ME', 'MY', 'NO', 'OF', 'ON', 'OR', 'SO', 'TO', 'UP', 'US', 'WE'
  ]);

  // Curated immediate starter set while async full 76k en-wl/v2 dictionary loads cleanly in background
  const SEED_ENGLISH_WORDS = new Set([
    'ABLE','ABOUT','ABOVE','ACID','ACT','ACTION','ADD','AFTER','AGAIN','AGE','AGENT','AIR','ALL','ALLOW','ALSO','AND','ANGLE','ANY',
    'API','APP','AREA','ARMOR','ARRAY','ART','ASK','ASYNC','ATTACK','AUDIT','AUTH','AUTO','AWAIT','BACK','BAD','BALANCE','BAND','BANK',
    'BASE','BASIC','BATTLE','BEAM','BEAR','BEAT','BEGIN','BEST','BETA','BINARY','BIND','BIT','BLADE','BLOCK','BLUE','BOARD','BODY',
    'BOOK','BOOST','BOSS','BOTH','BOW','BRANCH','BRAVE','BREAK','BRIDGE','BRIGHT','BRING','BUFFER','BUG','BUILD','BURN','BYTE','CACHE',
    'CALL','CALM','CAMP','CAN','CARD','CARE','CASE','CAST','CATCH','CAUSE','CELL','CHAIN','CHANCE','CHANGE','CHAR','CHART','CHECK',
    'CHEST','CHILD','CHIP','CHOICE','CHOOSE','CITY','CLASS','CLEAN','CLEAR','CLICK','CLIENT','CLIMB','CLOCK','CLONE','CLOSE','CLOUD',
    'CLUE','CODE','COIN','COLD','COLOR','COMBO','COME','COMMON','CONFIG','CORE','COST','COULD','COUNT','COURSE','COVER','CRAFT','CRAB',
    'CRASH','CREATE','CRIT','CROP','CROSS','CROWN','CURSE','CURVE','CYCLE','DAILY','DAMAGE','DARK','DATA','DATE','DAY','DEAD','DEAL',
    'DEATH','DEBUG','DEEP','DEFEND','DELAY','DEMO','DEPTH','DESIGN','DEV','DICT','DIFF','DISK','DOCK','DONE','DOOR','DOWN','DRAFT',
    'DRAG','DRAW','DREAM','DROP','DUST','DUTY','EARLY','EARTH','EAST','EASY','ECHO','EDGE','EDIT','EFFECT','ELITE','ELSE','EMBER',
    'EMPTY','END','ENEMY','ENGINE','ENTER','ENTRY','ENUM','EQUAL','ERROR','EVENT','EVER','EVERY','EXACT','EXIT','EXPAND','EXTRA',
    'FACE','FACT','FAIL','FAIR','FALL','FALSE','FAST','FATE','FEAR','FEED','FEEL','FIELD','FIGHT','FILE','FILL','FILTER','FIND',
    'FINE','FIRE','FIRM','FIRST','FIVE','FIX','FLAME','FLASH','FLEX','FLIP','FLOAT','FLOW','FLOWER','FLY','FOCUS','FOG','FOLD',
    'FONT','FOOD','FOOT','FORCE','FOREST','FORGE','FORM','FORMAT','FORT','FOUND','FOUR','FRAME','FREE','FRESH','FROM','FRONT','FROST',
    'FUEL','FULL','FUNC','FUN','GAIN','GAME','GAMING','GATE','GEAR','GEM','GHOST','GIFT','GIVE','GLASS','GLOBAL','GLOW','GOAL',
    'GOLD','GOOD','GRAB','GRADE','GRANT','GRAPH','GREAT','GREEN','GRID','GROUND','GROUP','GROW','GUARD','GUESS','GUIDE','GUILD',
    'HALL','HAND','HARD','HASH','HAVE','HEAD','HEAL','HEALTH','HEART','HEAT','HEAVY','HELP','HERO','HIGH','HINT','HIT','HOLD',
    'HOME','HOPE','HOST','HOUR','HOUSE','HTTP','HUNT','ICE','ICON','IDEA','IDLE','IMAGE','IMPACT','INDEX','INFO','INIT','INPUT',
    'INSIDE','ITEM','JAVA','JOIN','JUDGE','JUMP','JUST','KEEP','KEY','KILL','KIND','KING','KNIGHT','KNOW','LABEL','LANCE','LAND',
    'LARGE','LAST','LATE','LAYER','LAYOUT','LEAD','LEAF','LEARN','LEARNED','LEFT','LESS','LETTER','LEVEL','LIFE','LIFT','LIGHT',
    'LIKE','LINE','LINK','LIST','LIVE','LOAD','LOCAL','LOCK','LOG','LOGIC','LONG','LOOK','LOOP','LORE','LOST','LOOT','LOVE','LOW',
    'LUCK','LUNGE','MAGIC','MAIN','MAKE','MANA','MAP','MARK','MASK','MASTER','MATCH','MATH','MATRIX','MAX','MEAN','MEDIA','MEMORY',
    'MENU','MERGE','META','METHOD','MIGHT','MIND','MINE','MINIMAL','MISS','MOCK','MODE','MODEL','MOON','MORE','MOST','MOUNT','MOVE',
    'MUSIC','NAME','NEAR','NEED','NEST','NET','NETWORK','NEW','NEXT','NIGHT','NODE','NONE','NORM','NORMAL','NORTH','NOTE','NULL',
    'NUMBER','OAK','OBJECT','OFF','OFFER','OFFICE','OPEN','OPTION','ORDER','ORIGIN','OTHER','OUT','OUTPUT','OVER','PACK','PAGE',
    'PAIR','PANEL','PARRY','PARSE','PART','PASS','PATCH','PATH','PAUSE','PEAK','PHASE','PIXEL','PLACE','PLAN','PLANT','PLAY','PLAYER',
    'PLOT','PLUS','POINT','POOL','PORT','POST','POWER','PRESS','PRICE','PRIME','PRINT','PRIZE','PROBE','PROOF','PROPS','PROXY',
    'PULSE','PURE','PUSH','PUZZLE','QUERY','QUEST','QUEUE','QUICK','QUIET','QUIZ','RACE','RAGE','RAID','RAIN','RANDOM','RANGE',
    'RANK','RATE','RAW','REACH','READ','READY','REAL','RECALL','RECORD','REDUCE','REF','REFILL','REFRESH','REGION','RELIC','RENDER',
    'REPLAY','REPORT','RESET','RESIZE','REST','RESULT','RETRY','RETURN','REVEAL','REVIEW','REWARD','RIBBON','RICH','RIGHT','RING',
    'RISK','RIVER','ROAD','ROCK','ROLE','ROLL','ROOM','ROOT','ROUND','ROUTE','ROYAL','RULE','RUN','RUNE','RUSH','SAFE','SAVE',
    'SCALE','SCAN','SCENE','SCORE','SCREEN','SCROLL','SEAL','SEARCH','SECOND','SECRET','SEED','SEEK','SELECT','SELF','SEND','SENSE',
    'SERVER','SESSION','SET','SETTLE','SHADE','SHADOW','SHAPE','SHARE','SHARP','SHEET','SHIELD','SHIFT','SHINE','SHIP','SHOP','SHORT',
    'SHOT','SHOW','SIDE','SIGN','SILENT','SILVER','SIMPLE','SINCE','SIZE','SKILL','SKY','SLASH','SLATE','SLEEP','SLICE','SLIME',
    'SLOW','SMALL','SMART','SMOKE','SNAP','SNOW','SOFT','SOLO','SOLVE','SOME','SONG','SORT','SOUL','SOUND','SOURCE','SOUTH','SPACE',
    'SPARK','SPEAK','SPEED','SPELL','SPEND','SPIN','SPIRIT','SPLIT','SPOT','SPRITE','SQUAD','STACK','STAGE','STAND','STAR','START',
    'STATE','STATIC','STATS','STATUS','STAY','STEADY','STEEL','STEP','STICK','STONE','STOP','STORE','STORM','STORY','STRIKE','STRING',
    'STRONG','STUDY','STUN','STYLE','SUBMIT','SUM','SUN','SUPER','SUPPLY','SUPPORT','SURE','SWING','SWITCH','SWORD','SYNC','SYSTEM',
    'TAB','TABLE','TAG','TAKE','TALK','TALL','TAP','TARGET','TASK','TEAM','TECH','TERM','TEST','TEXT','THEME','THEN','THINK',
    'THIRD','THREE','THROW','THUNDER','TICK','TILE','TIME','TIMER','TITLE','TOKEN','TONE','TOOL','TOP','TOPIC','TORCH','TOTAL',
    'TOUCH','TOWN','TRACE','TRACK','TRADE','TRAIN','TRAIT','TRAP','TREE','TRIAL','TRICK','TRUE','TRUST','TRY','TUNE','TURN',
    'TWEEN','TWO','TYPE','UI','UNIT','UNLOCK','UNTIL','UPDATE','UPGRADE','UPLOAD','UPPER','USE','USER','VALID','VALUE','VECTOR',
    'VERIFY','VIEW','VILLAGE','VOID','VOTE','WAIT','WAKE','WALK','WALL','WAND','WAR','WARD','WARM','WARN','WATER','WAVE','WAY',
    'WEAK','WEAPON','WEAR','WEB','WEEK','WEIGHT','WELL','WEST','WHAT','WHEN','WHERE','WHICH','WHILE','WHITE','WHOLE','WIDE','WILD',
    'WIN','WIND','WINDOW','WING','WINTER','WISE','WISH','WITH','WOLF','WOOD','WORD','WORK','WORLD','WORTH','WOULD','WRITE','YEAR',
    'YELLOW','YES','YIELD','YOU','YOUNG','ZERO','ZONE'
  ]);

  let lexiconSet = new Set([...SEED_ENGLISH_WORDS, ...TWO_LETTER_WHITELIST]);
  let commonSet = new Set([...SEED_ENGLISH_WORDS, ...TWO_LETTER_WHITELIST]);
  let lexiconLoaded = false;
  let lexiconLoadingPromise = null;
  let lexiconStatus = {
    status: 'STARTER_ONLY',
    fullLoaded: false,
    commonLoaded: false,
    fullCount: lexiconSet.size,
    commonCount: commonSet.size,
    checksumMatch: null,
    manifest: null
  };

  function normalizeWord(word) {
    return String(word || '').trim().toUpperCase().replace(/[^A-Z]/g, '');
  }

  async function computeSha256Hex(text) {
    try {
      if (typeof crypto !== 'undefined' && crypto.subtle && typeof TextEncoder !== 'undefined') {
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
        return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
      }
    } catch (e) {}
    return null;
  }

  async function loadOfflineLexicon(url = '/ui/assets/data/english-words.txt', commonUrl = '/ui/assets/data/common-words.txt', manifestUrl = '/ui/assets/data/lexicon-manifest.json') {
    if (lexiconLoaded) return lexiconSet;
    if (lexiconLoadingPromise) return lexiconLoadingPromise;
    lexiconLoadingPromise = (async () => {
      try {
        if (typeof fetch !== 'function') {
          lexiconStatus.status = 'DEGRADED_STARTER';
          return lexiconSet;
        }
        const [fullRes, commonRes, manRes] = await Promise.all([
          fetch(url, { cache: 'force-cache' }).catch(() => null),
          fetch(commonUrl, { cache: 'force-cache' }).catch(() => null),
          fetch(manifestUrl, { cache: 'force-cache' }).catch(() => null)
        ]);
        let manifest = null;
        if (manRes && manRes.ok) {
          try { manifest = await manRes.json(); } catch (e) {}
        }
        let fullOk = false;
        let commonOk = false;
        let fullShaActual = null;
        let commonShaActual = null;

        if (fullRes && fullRes.ok) {
          const txt = await fullRes.text();
          fullShaActual = await computeSha256Hex(txt.replace(/\r\n/g, '\n'));
          const lines = txt.split(/\r?\n/);
          const merged = new Set([...SEED_ENGLISH_WORDS, ...TWO_LETTER_WHITELIST]);
          for (let i = 0; i < lines.length; i++) {
            const w = lines[i].trim().toUpperCase();
            if ((w.length >= BALANCE.minWordLength && w.length <= BALANCE.maxWordLength) || TWO_LETTER_WHITELIST.has(w)) {
              merged.add(w);
            }
          }
          lexiconSet = merged;
          fullOk = merged.size > 5000;
        }

        if (commonRes && commonRes.ok) {
          const cTxt = await commonRes.text();
          commonShaActual = await computeSha256Hex(cTxt.replace(/\r\n/g, '\n'));
          const cLines = cTxt.split(/\r?\n/);
          const cMerged = new Set([...TWO_LETTER_WHITELIST]);
          for (let i = 0; i < cLines.length; i++) {
            const w = cLines[i].trim().toUpperCase();
            if ((w.length >= BALANCE.minWordLength && w.length <= BALANCE.maxWordLength) || TWO_LETTER_WHITELIST.has(w)) {
              cMerged.add(w);
            }
          }
          commonSet = cMerged;
          commonOk = cMerged.size >= 1000;
        }

        const checksumMatch = (manifest && fullShaActual && commonShaActual)
          ? (manifest.fullSha256 === fullShaActual && manifest.commonSha256 === commonShaActual)
          : null;

        lexiconLoaded = fullOk;
        lexiconStatus = {
          status: fullOk ? (commonOk ? 'FULL_READY' : 'PARTIAL_COMMON_MISSING') : 'DEGRADED_STARTER',
          fullLoaded: fullOk,
          commonLoaded: commonOk,
          fullCount: lexiconSet.size,
          commonCount: commonSet.size,
          checksumMatch,
          manifest
        };
      } catch (e) {
        lexiconLoaded = false;
        lexiconStatus = {
          status: 'DEGRADED_STARTER',
          fullLoaded: false,
          commonLoaded: false,
          fullCount: lexiconSet.size,
          commonCount: commonSet.size,
          checksumMatch: false,
          manifest: null
        };
      }
      return lexiconSet;
    })();
    return lexiconLoadingPromise;
  }

  function isEnglishLexiconWord(word, extraAllowedSet = null) {
    const clean = normalizeWord(word);
    if (clean.length === 2) {
      if (extraAllowedSet && extraAllowedSet.has(clean)) return true;
      return TWO_LETTER_WHITELIST.has(clean);
    }
    if (clean.length < BALANCE.minWordLength || clean.length > BALANCE.maxWordLength) return false;
    if (extraAllowedSet && extraAllowedSet.has(clean)) return true;
    return lexiconSet.has(clean);
  }

  function isCommonEnglishWord(word) {
    const clean = normalizeWord(word);
    if (clean.length === 2) return TWO_LETTER_WHITELIST.has(clean);
    if (clean.length < BALANCE.minWordLength || clean.length > BALANCE.maxWordLength) return false;
    return commonSet.has(clean);
  }

  function getChapterRules(chapterNo = 1, mode = 'campaign') {
    const ch = Math.max(1, Number(chapterNo || 1));
    const base = BALANCE.chapterRules[Math.min(4, ch)] || BALANCE.chapterRules[1];
    if (mode === 'practice') {
      return {
        mode: 'practice',
        chapterNo: ch,
        timeSec: 0, // Untimed / relaxed
        freeHints: 99,
        bossAtkBase: Math.max(4, Math.round(base.bossAtkBase * 0.7)),
        shieldFactor: Math.max(0.6, base.shieldFactor * 0.8),
        traitsUnlocked: ch >= 2
      };
    }
    return { mode: 'campaign', chapterNo: ch, ...base };
  }

  function calculateAttackMetrics(wordLength, comboAfter, isTopicWord) {
    const len = Math.max(0, Number(wordLength || 0));
    if (len < BALANCE.whitelistMinLength) {
      return { baseDamage: 0, bonusDamage: 0, totalDamage: 0, manaGain: 0 };
    }
    const baseDamage = (len * BALANCE.damagePerChar) + (Math.max(0, Number(comboAfter || 0)) * BALANCE.damagePerCombo);
    const totalDamage = isTopicWord
      ? Math.round(baseDamage * (1 + BALANCE.topicBonusPct / 100))
      : baseDamage;
    const bonusDamage = Math.max(0, totalDamage - baseDamage);
    let manaGain = Math.min(BALANCE.maxManaGain, Math.max(BALANCE.minManaGain, Math.floor(len / 2)));
    if (isTopicWord) manaGain = Math.min(BALANCE.maxManaCap, manaGain + BALANCE.topicExtraMana);
    return { baseDamage, bonusDamage, totalDamage, manaGain };
  }

  // Everyday recognizable anchors + rare-letter guards (avoid >1 Q/X/Z/J unless Core/Topic requires)
  const FREQ_POOL = 'EEEEEEEAAAAAIIIIIOOOOUUUTTTTNNNNSSSSRRRRHHHHLLLLDDDDCCCMMMPPPBBBFFFGGWWYYK';
  const VOWELS = 'AEIOU';
  const COMMON_3_5_ANCHORS = [
    'TIME', 'WATER', 'BOOK', 'HOME', 'WORK', 'FOOD', 'TREE', 'STAR', 'FIRE', 'WIND',
    'HOPE', 'GAME', 'WORD', 'PLAY', 'MIND', 'GOLD', 'LIGHT', 'HOUSE', 'SMILE', 'MUSIC',
    'EARTH', 'PLANT', 'APPLE', 'BREAD', 'CLOUD', 'RIVER', 'HEART', 'TRAIN', 'WORLD', 'STUDY'
  ];

  function mulberry32(seedNum) {
    let a = (Number(seedNum) || 1337) >>> 0;
    return function () {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function countFormableWords(board, wordList) {
    const freq = {};
    for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board[r].length; c++) {
        const ch = String(board[r][c] || '').toUpperCase();
        freq[ch] = (freq[ch] || 0) + 1;
      }
    }
    let count = 0;
    const matched = [];
    for (let i = 0; i < wordList.length; i++) {
      const w = normalizeWord(wordList[i]);
      if (w.length < 2 || w.length > 10) continue;
      if (w.length === 2 && !TWO_LETTER_WHITELIST.has(w)) continue;
      const need = {};
      let ok = true;
      for (let j = 0; j < w.length; j++) {
        const ch = w[j];
        need[ch] = (need[ch] || 0) + 1;
        if (need[ch] > (freq[ch] || 0)) { ok = false; break; }
      }
      if (ok) {
        count += 1;
        if (matched.length < 24) matched.push(w);
      }
    }
    return { count, matched };
  }

  function generateSolvableBoard({ coreWord = 'LEARN', topicWords = [], rows = 5, cols = 5, seed = Date.now(), minGlobalWords = 8, minCommonWords = 6, commonPoolOverride = null } = {}) {
    const cleanCore = normalizeWord(coreWord) || 'LEARN';
    const cleanTopics = topicWords.map(normalizeWord).filter((w) => w.length >= 3 && w.length <= 8 && w !== cleanCore);
    const activeCommonPool = Array.isArray(commonPoolOverride) && commonPoolOverride.length
      ? commonPoolOverride
      : [...COMMON_3_5_ANCHORS, ...Array.from(commonSet).filter((w) => w.length >= 3 && w.length <= 6).slice(0, 320)];
    const probePool = Array.from(new Set([...cleanTopics, ...activeCommonPool, ...Array.from(SEED_ENGLISH_WORDS).slice(0, 140)]));

    let bestBoard = null;
    let bestScore = -1;
    let bestCommonEstimate = 0;
    const maxAttempts = 8;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const rng = mulberry32(Number(seed) + attempt * 977);
      const board = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => FREQ_POOL[Math.floor(rng() * FREQ_POOL.length)])
      );

      // Build guaranteed letters using overlap compression: Core Word + up to 2 topic words + 2 common everyday anchors
      const guaranteed = cleanCore.split('');
      const addWordLettersWithBudget = (w, reserveLeft) => {
        if (!w) return;
        if (guaranteed.length + w.length <= rows * cols - reserveLeft) {
          guaranteed.push(...w.split(''));
          return;
        }
        // Only add missing letters not yet in guaranteed pool so multiple everyday words fit cleanly
        const have = {};
        guaranteed.forEach((ch) => { have[ch] = (have[ch] || 0) + 1; });
        const need = {};
        w.split('').forEach((ch) => { need[ch] = (need[ch] || 0) + 1; });
        const delta = [];
        Object.keys(need).forEach((ch) => {
          const diff = need[ch] - (have[ch] || 0);
          for (let k = 0; k < diff; k++) delta.push(ch);
        });
        if (guaranteed.length + delta.length <= rows * cols - Math.max(0, reserveLeft - 2)) {
          guaranteed.push(...delta);
        }
      };

      for (let t = 0; t < cleanTopics.length && t < 2; t++) {
        addWordLettersWithBudget(cleanTopics[t], 5);
      }
      for (let a = 0; a < 2; a++) {
        const anchor = COMMON_3_5_ANCHORS[Math.floor(rng() * COMMON_3_5_ANCHORS.length)];
        addWordLettersWithBudget(anchor, 3);
      }

      const cells = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) cells.push({ r, c });
      }
      for (let i = cells.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [cells[i], cells[j]] = [cells[j], cells[i]];
      }
      for (let i = 0; i < Math.min(guaranteed.length, cells.length); i++) {
        board[cells[i].r][cells[i].c] = guaranteed[i];
      }

      // Enforce healthy vowel floor (>= 32% vowels -> 8+ on 5x5)
      let vowelCount = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (VOWELS.includes(board[r][c])) vowelCount += 1;
        }
      }
      for (let i = guaranteed.length; i < cells.length && vowelCount < Math.ceil(rows * cols * 0.32); i++) {
        const cell = cells[i];
        if (!VOWELS.includes(board[cell.r][cell.c])) {
          board[cell.r][cell.c] = VOWELS[Math.floor(rng() * VOWELS.length)];
          vowelCount += 1;
        }
      }

      const check = countFormableWords(board, probePool);
      const commonCheck = countFormableWords(board, activeCommonPool);
      if (check.count >= minGlobalWords && commonCheck.count >= minCommonWords) {
        return {
          board,
          formableEstimate: check.count,
          commonEstimate: commonCheck.count,
          matchedSample: commonCheck.matched.slice(0, 8),
          attempt: attempt + 1
        };
      }
      if (check.count + commonCheck.count > bestScore) {
        bestScore = check.count + commonCheck.count;
        bestBoard = board;
        bestCommonEstimate = commonCheck.count;
      }
    }

    const finalCheck = countFormableWords(bestBoard, probePool);
    return {
      board: bestBoard,
      formableEstimate: finalCheck.count,
      commonEstimate: bestCommonEstimate,
      attempt: maxAttempts
    };
  }

  window.LexRaidBalance = {
    BALANCE,
    SEED_ENGLISH_WORDS,
    TWO_LETTER_WHITELIST,
    normalizeWord,
    loadOfflineLexicon,
    isEnglishLexiconWord,
    isCommonEnglishWord,
    isLexiconLoaded: () => lexiconLoaded,
    getLexiconStatus: () => ({ ...lexiconStatus }),
    getLexiconSize: () => lexiconSet.size,
    getCommonLexiconSize: () => commonSet.size,
    getChapterRules,
    calculateAttackMetrics,
    countFormableWords,
    generateSolvableBoard
  };
})();
