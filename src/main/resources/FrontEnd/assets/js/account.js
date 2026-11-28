/**
 * LEX RAID P5 — Path of Legends Character Hall, Skill Tree, Spellbook, Loadout & Chapter Map
 */
(function () {
  const reg = () => window.RaidRegistry;
  const store = () => window.RaidProgressionStore;

  const avatars = [
    { code: 'avatar1', dbKey: 'avatar-a', name: 'Knight Warrior', url: '/ui/assets/ui/avatars/avatar-ts-1.png', desc: 'Chiến binh quả cảm' },
    { code: 'avatar2', dbKey: 'avatar-b', name: 'Royal Lancer', url: '/ui/assets/ui/avatars/avatar-ts-18.png', desc: 'Kỵ sĩ hoàng gia' },
    { code: 'avatar3', dbKey: 'avatar-c', name: 'Elven Archer', url: '/ui/assets/ui/avatars/avatar-ts-8.png', desc: 'Xạ thủ tinh linh' }
  ];

  const state = {
    unitCode: 'warrior',
    avatarCode: 'avatar1',
    activeTab: 'heroes',
    treeHero: 'warrior',
    selectedSkillId: 'knight_slash',
    spellFilterHero: 'ALL',
    spellFilterProfile: 'ALL',
    loadoutHero: 'warrior',
    lastDummySkillId: 'knight_slash',
    lastDummyHeroId: 'warrior',
    dummyRenderer: null
  };
  let liveProfile = null;
  let liveMastery = null;

  async function saveServerHeroLoadout(heroId, showSuccessMsg = true) {
    if (!window.appApi.isBackendConnected?.()) return null;
    const prog = store()?.loadState();
    const list = prog?.loadouts?.[heroId] || [];
    const activeSkillCodes = list.filter((id) => !reg()?.SKILL_MAP[id]?.isUltimate).slice(0, 4);
    const ultimateSkillCode = list.find((id) => reg()?.SKILL_MAP[id]?.isUltimate) || null;
    const snap = await window.appApi.saveProgressionLoadout({ heroCode: heroId, activeSkillCodes, ultimateSkillCode });
    store()?.hydrateFromServerSnapshot(snap, liveMastery);
    if (showSuccessMsg) {
      showStatus(`Đã lưu Hero ${reg()?.getHero(heroId)?.shortName || heroId} & Loadout vào SQL Server!`, 'success');
    }
    return snap;
  }

  function normalizeAvatarCode(input) {
    const value = String(input || '').trim().toLowerCase();
    if (value === 'avatar-a' || value === 'avatar1') return 'avatar1';
    if (value === 'avatar-b' || value === 'avatar2') return 'avatar2';
    if (value === 'avatar-c' || value === 'avatar3') return 'avatar3';
    return 'avatar1';
  }

  function toDbAvatarKey(input) {
    const code = normalizeAvatarCode(input);
    if (code === 'avatar1') return 'avatar-a';
    if (code === 'avatar2') return 'avatar-b';
    if (code === 'avatar3') return 'avatar-c';
    return 'avatar-a';
  }

  function normalizeIncoming(payload = {}) {
    return {
      unitCode: window.appApi.normalizeUnitCode(payload.selectedUnitCode || payload.unitCode || state.unitCode),
      avatarCode: normalizeAvatarCode(payload.selectedAvatarKey || payload.avatarCode || payload.avatarKey || state.avatarCode)
    };
  }

  function showStatus(msg, tone = 'success') {
    const el = document.getElementById('accountStatus');
    if (!el) return;
    el.innerHTML = `<div class="inline-message" data-tone="${tone}">${window.appApi.escapeHtml(msg)}</div>`;
  }

  function renderProfile() {
    const auth = window.appApi.getAuth() || {};
    const prog = store()?.loadState();
    const name = liveProfile?.displayName || auth.displayName || auth.username || 'Knight Learner';
    const level = liveProfile?.levelCurrent || Number(auth.levelCurrent || 1);
    const xpTotal = liveProfile?.xpTotal !== undefined ? liveProfile.xpTotal : Number(auth.xpTotal || 0);
    const coins = liveProfile?.coins !== undefined ? liveProfile.coins : Number(auth.coins || 0);
    const streak = liveProfile?.streakDays !== undefined ? liveProfile.streakDays : Number(auth.streakDays || 0);

    const xpInLevel = liveProfile?.xpCurrentInLevel !== undefined ? liveProfile.xpCurrentInLevel : 0;
    const xpNeeded = liveProfile?.xpNeededForNextLevel !== undefined ? liveProfile.xpNeededForNextLevel : 100;
    const levelSpan = xpInLevel + xpNeeded;
    const progressPercent = liveProfile?.levelProgressPercent !== undefined
      ? liveProfile.levelProgressPercent
      : (levelSpan > 0 ? (xpInLevel / levelSpan) * 100 : 0);

    const clearedCount = prog ? Object.values(prog.chapterProgress || {}).filter((c) => (c.clears || 0) > 0).length : 0;
    const totalBattles = liveProfile?.totalBattles ?? (prog?.learningStats?.totalRuns || 0);
    const bestScore = liveProfile?.bestScore ?? Math.max(0, ...(Object.values(prog?.chapterProgress || {}).map((c) => c.bestScore || 0)));

    document.getElementById('accountDisplayName').textContent = name;
    document.getElementById('accountLevelText').textContent = `Level ${level}`;
    document.getElementById('accountXpRatio').textContent = `${xpInLevel}/${levelSpan} XP (${xpTotal.toLocaleString('vi-VN')} tổng)`;
    document.getElementById('accountXpBar').style.width = `${Math.min(100, Math.max(0, progressPercent))}%`;
    document.getElementById('accountXpNeededText').textContent = `Còn ${xpNeeded.toLocaleString('vi-VN')} XP tới cấp tiếp theo (${progressPercent.toFixed(1)}%)`;
    document.getElementById('accountCoins').textContent = coins.toLocaleString('vi-VN');
    document.getElementById('accountStreak').textContent = streak;
    document.getElementById('accountStagesCleared').textContent = liveProfile?.stagesCleared ?? clearedCount;
    document.getElementById('accountTotalBattles').textContent = totalBattles;
    document.getElementById('accountBestScore').textContent = Number(bestScore || 0).toLocaleString('vi-VN');

    const spEl = document.getElementById('demoSpBadge');
    if (spEl && prog) {
      const modeTag = window.appApi.isBackendConnected?.() ? 'SQL Server' : 'Demo';
      spEl.innerHTML = `<i class="bi bi-gem"></i> ${modeTag} · ${prog.skillPoints} SP · ${prog.unlockedHeroes.length}/4 Heroes`;
    }

    const av = avatars.find((v) => v.code === state.avatarCode) || avatars[0];
    const heroMeta = reg()?.getHero(state.unitCode);
    document.getElementById('accountProfileAvatar').src = av.url;
    document.getElementById('accountSummary').textContent = `Đang xuất chiến: ${heroMeta?.name || state.unitCode} · ${av.name}`;
  }

  function renderHeroesTab() {
    const prog = store()?.loadState();
    const heroes = Object.values(reg()?.HEROES || {});
    const grid = document.getElementById('unitGrid');
    if (grid) {
      grid.innerHTML = heroes.map((h) => {
        const unlocked = store()?.isHeroUnlocked(h.heroId, prog);
        const selected = unlocked && h.heroId === state.unitCode;
        return `
          <div class="option-card ${selected ? 'is-selected' : ''} ${unlocked ? '' : 'is-locked'}" data-hero-card="${h.heroId}">
            <span class="option-card__badge"><i class="bi bi-check2"></i></span>
            <div class="unit-stage"><div class="pixel-unit pixel-unit--${h.heroId} is-idle"></div></div>
            <div>
              <strong style="display:block;font-size:1.1rem">${window.appApi.escapeHtml(h.name)}</strong>
              <div class="small-muted" style="margin:3px 0 6px">${window.appApi.escapeHtml(h.role)}</div>
              <div class="unit-meta-pills">
                <span class="unit-pill">HP ${h.baseHp}</span>
                <span class="unit-pill">MP ${h.baseMp}/${h.maxMp}</span>
                <span class="unit-pill ${unlocked ? '' : 'unit-pill--locked'}">${unlocked ? 'ĐÃ MỞ KHÓA' : 'ĐANG KHÓA'}</span>
              </div>
              <ul class="hero-strength-list">
                ${(h.strengths || []).map((s) => `<li>${window.appApi.escapeHtml(s)}</li>`).join('')}
              </ul>
              ${!unlocked ? `<div class="hero-lock-reason"><i class="bi bi-lock-fill"></i> ${window.appApi.escapeHtml(h.unlockRule?.label || '')}</div>` : ''}
              <div class="hero-card-actions">
                <button class="pixel-chip-btn ${selected ? 'is-active' : ''}" data-select-hero="${h.heroId}" type="button" ${unlocked ? '' : 'disabled'}>${selected ? 'Đang chọn' : (unlocked ? 'Chọn xuất chiến' : 'Đang khóa')}</button>
                <button class="pixel-chip-btn" data-preview-hero="${h.heroId}" type="button"><i class="bi bi-play-fill"></i> Thử Training Dummy</button>
              </div>
            </div>
          </div>`;
      }).join('');

      grid.querySelectorAll('[data-select-hero]').forEach((btn) => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const hid = btn.dataset.selectHero;
          const res = store()?.selectHero(hid);
          if (!res?.ok) {
            showStatus(res?.reason || 'Hero đang khóa.', 'warning');
            return;
          }
          state.unitCode = hid;
          state.treeHero = hid;
          state.loadoutHero = hid;
          if (window.appApi.isBackendConnected?.()) {
            try {
              await saveServerHeroLoadout(hid, true);
            } catch (err) {
              showStatus(`Không thể lưu vào SQL Server: ${err.message}`, 'warning');
            }
          } else {
            showStatus(`Đã chọn ${reg().getHero(hid).name} làm đơn vị xuất chiến (Demo Progression).`, 'success');
          }
          renderHeroesTab();
          renderProfile();
        });
      });

      grid.querySelectorAll('[data-preview-hero]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const hid = btn.dataset.previewHero;
          const hero = reg()?.getHero(hid);
          const firstSkillId = hero?.defaultLoadout?.[1] || hero?.defaultLoadout?.[0] || 'knight_slash';
          state.lastDummyHeroId = hid;
          state.lastDummySkillId = firstSkillId;
          switchTab('spellbook');
          setTimeout(() => runDummySkill(firstSkillId, hid), 180);
        });
      });
    }

    const backlogEl = document.getElementById('backlogHeroNotice');
    if (backlogEl && reg()?.BACKLOG_HEROES) {
      backlogEl.innerHTML = `<strong><i class="bi bi-info-circle"></i> Backlog Nhân Vật Tạm Hoãn (Không đưa vào bản public):</strong>` +
        reg().BACKLOG_HEROES.map((b) => `<div>• <strong>${window.appApi.escapeHtml(b.name)}</strong> (${b.status}): ${window.appApi.escapeHtml(b.reason)}</div>`).join('');
    }
  }

  function renderAvatars() {
    const html = avatars.map((avatar) => `
      <button class="option-card avatar-option ${avatar.code === state.avatarCode ? 'is-selected' : ''}" data-avatar="${avatar.code}" type="button">
        <span class="option-card__badge"><i class="bi bi-check2"></i></span>
        <div class="avatar-option__frame"><img src="${avatar.url}" alt="${avatar.name}"></div>
        <div><strong style="display:block;font-size:1.05rem">${avatar.name}</strong><div class="muted" style="font-size:0.85rem">${avatar.desc || 'Chân dung hiệp sĩ'}</div></div>
      </button>`).join('');
    const grid = document.getElementById('avatarGrid');
    if (!grid) return;
    grid.innerHTML = html;
    grid.querySelectorAll('[data-avatar]').forEach((el) => el.addEventListener('click', () => {
      state.avatarCode = el.dataset.avatar;
      renderAvatars();
      renderProfile();
    }));
  }

  function renderHeroSelectorChips(containerId, activeHeroId, onPick) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = Object.values(reg()?.HEROES || {}).map((h) => `
      <button class="pixel-chip-btn ${h.heroId === activeHeroId ? 'is-active' : ''}" data-pick-hero="${h.heroId}" type="button">${window.appApi.escapeHtml(h.shortName)}</button>
    `).join('');
    el.querySelectorAll('[data-pick-hero]').forEach((btn) => {
      btn.addEventListener('click', () => onPick(btn.dataset.pickHero));
    });
  }

  function stateLabel(st) {
    const map = {
      LOCKED: 'LOCKED 🔒',
      AVAILABLE: 'AVAILABLE ✨',
      LEARNED: 'LEARNED ✔',
      EQUIPPED: 'EQUIPPED ⚔',
      UPGRADE_AVAILABLE: 'UPGRADE ⬆',
      MAX_LEVEL: 'MAX Lv3 ★'
    };
    return map[st] || st;
  }

  function frameSpriteForState(st) {
    if (st === 'MAX_LEVEL') return '/ui/assets/ui/progression/skill-maxed@2x.png';
    if (st === 'LEARNED' || st === 'EQUIPPED' || st === 'UPGRADE_AVAILABLE') return '/ui/assets/ui/progression/skill-unlocked@2x.png';
    if (st === 'AVAILABLE') return '/ui/assets/ui/progression/skill-available@2x.png';
    return '/ui/assets/ui/progression/skill-locked@2x.png';
  }

  function renderSkillTreeTab() {
    const prog = store()?.loadState();
    const hero = reg()?.getHero(state.treeHero);
    renderHeroSelectorChips('treeHeroSelector', state.treeHero, (hid) => {
      state.treeHero = hid;
      const firstId = reg().getHero(hid)?.trees?.[0]?.skillIds?.[0];
      if (firstId) state.selectedSkillId = firstId;
      renderSkillTreeTab();
    });

    const container = document.getElementById('skillTreeContainer');
    if (container && hero) {
      const heroSkillsAll = reg().getSkillsForHero(hero.heroId);
      if (!heroSkillsAll.some((s) => s.id === state.selectedSkillId)) {
        state.selectedSkillId = hero.trees?.[0]?.skillIds?.[0] || heroSkillsAll[0]?.id;
      }

      container.innerHTML = (hero.trees || []).map((branch) => {
        const nodesHtml = (branch.skillIds || []).map((sid, idx) => {
          const sk = reg().SKILL_MAP[sid];
          if (!sk) return '';
          const status = store().getSkillStatus(sid, hero.heroId, prog);
          const stars = [1, 2, 3].map((lv) => `<img src="/ui/assets/ui/progression/${status.level >= lv ? 'star-full@2x.png' : 'star-empty@2x.png'}" alt="">`).join('');
          const connector = idx > 0
            ? `<div class="skill-node-connector ${status.level > 0 || status.state === 'AVAILABLE' ? 'is-active' : ''}"></div>`
            : '';
          return `${connector}
            <button class="skill-node-btn state-${status.state} ${state.selectedSkillId === sid ? 'is-selected' : ''}" data-tree-skill="${sid}" type="button">
              <span class="skill-node-frame">
                <img class="node-bg" src="${frameSpriteForState(status.state)}" alt="">
                <img class="node-icon" src="${sk.icon}" alt="">
              </span>
              <span class="skill-node-meta">
                <span class="skill-node-title">${window.appApi.escapeHtml(sk.name)}</span>
                <span class="skill-node-stars">${stars} <small>(${sk.animationProfile})</small></span>
                <span class="skill-state-pill st-${status.state}">${stateLabel(status.state)}</span>
              </span>
            </button>`;
        }).join('');

        return `<div class="skill-branch-col">
          <h3 class="skill-branch-title"><span>${window.appApi.escapeHtml(branch.label)}</span><small>SP: ${prog.skillPoints}</small></h3>
          <div class="skill-node-list">${nodesHtml}</div>
        </div>`;
      }).join('');

      container.querySelectorAll('[data-tree-skill]').forEach((btn) => {
        btn.addEventListener('click', () => {
          state.selectedSkillId = btn.dataset.treeSkill;
          renderSkillTreeTab();
        });
      });
    }

    renderSkillInspector(prog);
  }

  function renderSkillInspector(prog) {
    const el = document.getElementById('skillInspector');
    if (!el) return;
    const sk = reg()?.SKILL_MAP[state.selectedSkillId];
    if (!sk) { el.innerHTML = ''; return; }
    const status = store().getSkillStatus(sk.id, state.treeHero, prog);
    const levelsHtml = [1, 2, 3].map((lv) => `
      <div class="evo-step ${status.level === lv ? 'is-active' : ''}">
        <strong>Level ${lv}${status.level === lv ? ' (Hiện tại)' : ''}</strong>
        <div>${window.appApi.escapeHtml(sk.levels?.[lv]?.summary || sk.desc)}</div>
      </div>`).join('');

    const canLearnOrUp = status.canLearn || status.canUpgrade;
    const actionLabel = status.level === 0 ? 'Học kỹ năng (1 SP)' : (status.level < 3 ? `Nâng lên Lv ${status.level + 1} (1 SP)` : 'Đã tối đa Lv 3');
    const heroUnlocked = store().isHeroUnlocked(state.treeHero, prog);

    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:10px">
          <img src="${sk.icon}" alt="" style="width:40px;height:40px;image-rendering:pixelated;border:2px solid #3c2a1a;background:#1e130c">
          <div>
            <strong style="font-size:1.05rem">${window.appApi.escapeHtml(sk.name)} · Tier ${sk.tier} (${sk.rarity})</strong>
            <div class="small-muted">Profile: <strong>${sk.animationProfile}</strong> · Branch: ${window.appApi.escapeHtml(sk.branch)} · ${sk.manaCost} MP · CD ${sk.cooldown}T</div>
          </div>
        </div>
        <div class="account-actions">
          <button class="pixel-chip-btn" id="inspectTestAnimBtn" type="button"><i class="bi bi-play-fill"></i> Thử hoạt ảnh</button>
          <button class="pixel-btn pixel-btn--primary" id="inspectUpgradeBtn" type="button" ${canLearnOrUp ? '' : 'disabled'}>${actionLabel}</button>
          ${status.level >= 1 && heroUnlocked ? `<button class="pixel-btn pixel-btn--wood" id="inspectEquipBtn" type="button">${status.equipped ? 'Gỡ khỏi Loadout' : 'Trang bị vào Loadout'}</button>` : ''}
        </div>
      </div>
      <div class="small-muted">${window.appApi.escapeHtml(status.reason)}</div>
      <div class="evolution-steps">${levelsHtml}</div>`;

    document.getElementById('inspectUpgradeBtn')?.addEventListener('click', async () => {
      if (window.appApi.isBackendConnected?.()) {
        try {
          const snap = status.level === 0
            ? await window.appApi.learnProgressionSkill({ heroCode: state.treeHero, skillCode: sk.id })
            : await window.appApi.upgradeProgressionSkill({ heroCode: state.treeHero, skillCode: sk.id });
          store()?.hydrateFromServerSnapshot(snap, liveMastery);
          const nextLv = snap?.skillLevels?.[sk.id] || (status.level + 1);
          showStatus(`Đã nâng ${sk.name} lên Level ${nextLv} trong SQL Server!`, 'success');
        } catch (err) {
          showStatus(err.message, 'warning');
        }
      } else {
        const res = store().learnOrUpgradeSkill(sk.id, state.treeHero);
        showStatus(res.ok ? `Đã nâng ${sk.name} lên Level ${res.newLevel}!` : res.reason, res.ok ? 'success' : 'warning');
      }
      renderSkillTreeTab();
      renderProfile();
    });
    document.getElementById('inspectEquipBtn')?.addEventListener('click', async () => {
      const res = store().toggleSkillInLoadout(state.treeHero, sk.id);
      if (res.ok && window.appApi.isBackendConnected?.()) {
        try {
          await saveServerHeroLoadout(state.treeHero, false);
          showStatus(`Đã lưu Loadout ${reg().getHero(state.treeHero).shortName} lên SQL Server.`, 'success');
        } catch (err) {
          showStatus(err.message, 'warning');
        }
      } else {
        showStatus(res.ok ? `Đã cập nhật Loadout cho ${reg().getHero(state.treeHero).shortName}.` : res.reason, res.ok ? 'success' : 'warning');
      }
      renderSkillTreeTab();
    });
    document.getElementById('inspectTestAnimBtn')?.addEventListener('click', () => {
      state.lastDummyHeroId = state.treeHero;
      state.lastDummySkillId = sk.id;
      switchTab('spellbook');
      setTimeout(() => runDummySkill(sk.id, state.treeHero), 180);
    });
  }

  async function ensureDummyMounted(heroId = state.lastDummyHeroId) {
    const mount = document.getElementById('trainingStageMount');
    if (!mount || !window.RaidPhaserBridge) return null;
    if (!state.dummyRenderer) {
      state.dummyRenderer = await window.RaidPhaserBridge.mount(mount, {
        unitCode: heroId || 'warrior',
        bossTheme: 'crabby',
        biome: 'dusk',
        heroMode: 'idle',
        bossMode: 'idle'
      });
    } else if (state.dummyRenderer.setState) {
      state.dummyRenderer.setState({ unitCode: heroId || 'warrior', bossTheme: 'crabby', heroMode: 'idle', bossMode: 'idle' });
    }
    return state.dummyRenderer;
  }

  async function runDummySkill(skillId, heroIdOverride) {
    const prog = store()?.loadState();
    const sk = reg()?.getSkill(skillId, Math.max(1, Number(prog?.skillLevels?.[skillId] || 1)));
    if (!sk) return;
    const heroId = heroIdOverride || (sk.allowedHeroes.includes(state.lastDummyHeroId) ? state.lastDummyHeroId : sk.allowedHeroes[0]) || 'warrior';
    state.lastDummyHeroId = heroId;
    state.lastDummySkillId = skillId;

    const lbl = document.getElementById('trainingHeroLabel');
    if (lbl) lbl.textContent = `Training Dummy: ${reg().getHero(heroId).shortName} -> ${sk.name} [${sk.animationProfile}]`;

    const renderer = await ensureDummyMounted(heroId);
    if (renderer && renderer.setState) {
      renderer.setState({
        unitCode: heroId,
        bossTheme: 'crabby',
        playSkill: true,
        skillMeta: sk,
        damage: Number(sk.previewDmg || 18),
        isTopicWord: sk.tier >= 3
      });
    }
  }

  function renderSpellbookTab() {
    const filterEl = document.getElementById('spellbookFilterBar');
    if (filterEl) {
      const heroOpts = ['ALL', 'warrior', 'archer', 'lancer', 'arcane_mage'];
      filterEl.innerHTML = heroOpts.map((h) => `
        <button class="pixel-chip-btn ${state.spellFilterHero === h ? 'is-active' : ''}" data-sb-hero="${h}" type="button">${h === 'ALL' ? 'Tất cả (27)' : reg().getHero(h).shortName}</button>
      `).join('');
      filterEl.querySelectorAll('[data-sb-hero]').forEach((btn) => {
        btn.addEventListener('click', () => {
          state.spellFilterHero = btn.dataset.sbHero;
          renderSpellbookTab();
        });
      });
    }

    const prog = store()?.loadState();
    const list = (reg()?.SKILLS || []).filter((s) => state.spellFilterHero === 'ALL' || s.allowedHeroes.includes(state.spellFilterHero));
    const grid = document.getElementById('spellbookGrid');
    if (grid) {
      grid.innerHTML = list.map((sk) => {
        const lv = Number(prog?.skillLevels?.[sk.id] || 0);
        return `<div class="spell-card">
          <div>
            <div class="spell-card-head">
              <img src="${sk.icon}" alt="">
              <div>
                <strong>${window.appApi.escapeHtml(sk.name)}</strong>
                <div class="small-muted">${window.appApi.escapeHtml(sk.branch)} · Tier ${sk.tier}</div>
              </div>
            </div>
            <div class="spell-card-tags" style="margin:6px 0">
              <span class="spell-tag">${sk.animationProfile}</span>
              <span class="spell-tag">${sk.manaCost} MP</span>
              <span class="spell-tag">${lv > 0 ? `Lv ${lv}` : 'Chưa học'}</span>
            </div>
            <div style="font-size:.78rem">${window.appApi.escapeHtml(sk.desc)}</div>
          </div>
          <button class="pixel-chip-btn" data-dummy-cast="${sk.id}" type="button"><i class="bi bi-play-fill"></i> Thử hoạt ảnh trên Dummy</button>
        </div>`;
      }).join('');

      grid.querySelectorAll('[data-dummy-cast]').forEach((btn) => {
        btn.addEventListener('click', () => runDummySkill(btn.dataset.dummyCast));
      });
    }
    ensureDummyMounted(state.lastDummyHeroId);
  }

  function renderLoadoutTab() {
    const prog = store()?.loadState();
    renderHeroSelectorChips('loadoutHeroSelector', state.loadoutHero, (hid) => {
      state.loadoutHero = hid;
      renderLoadoutTab();
    });

    const hero = reg()?.getHero(state.loadoutHero);
    const currentIds = prog.loadouts?.[state.loadoutHero] || [];
    const activeIds = currentIds.filter((id) => !reg().SKILL_MAP[id]?.isUltimate).slice(0, 4);
    const ultId = currentIds.find((id) => reg().SKILL_MAP[id]?.isUltimate) || null;

    const slotsEl = document.getElementById('loadoutSlotsPanel');
    if (slotsEl) {
      const slotBoxes = [0, 1, 2, 3].map((i) => {
        const sid = activeIds[i];
        const sk = sid ? reg().getSkill(sid, prog.skillLevels?.[sid] || 1) : null;
        return `<div class="loadout-slot ${sk ? 'is-filled' : ''}">
          <small>Active Slot ${i + 1}</small>
          ${sk ? `<img src="${sk.icon}" alt=""><strong>${window.appApi.escapeHtml(sk.name)}</strong><small>Lv${sk.level} · ${sk.manaCost} MP</small><button class="pixel-chip-btn" data-unequip="${sk.id}" type="button">Gỡ</button>` : '<span class="small-muted">Trống</span>'}
        </div>`;
      });
      const ultSk = ultId ? reg().getSkill(ultId, prog.skillLevels?.[ultId] || 1) : null;
      slotBoxes.push(`<div class="loadout-slot is-ult ${ultSk ? 'is-filled' : ''}">
        <small>Ultimate Slot (Max 1)</small>
        ${ultSk ? `<img src="${ultSk.icon}" alt=""><strong>${window.appApi.escapeHtml(ultSk.name)}</strong><small>Lv${ultSk.level} · ${ultSk.manaCost} MP</small><button class="pixel-chip-btn" data-unequip="${ultSk.id}" type="button">Gỡ</button>` : '<span class="small-muted">Chưa trang bị</span>'}
      </div>`);
      slotsEl.innerHTML = slotBoxes.join('');

      slotsEl.querySelectorAll('[data-unequip]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const res = store().toggleSkillInLoadout(state.loadoutHero, btn.dataset.unequip);
          if (res.ok && window.appApi.isBackendConnected?.()) {
            try { await saveServerHeroLoadout(state.loadoutHero, false); } catch (err) { showStatus(err.message, 'warning'); }
          }
          showStatus(res.ok ? 'Đã gỡ kỹ năng khỏi Loadout.' : res.reason, res.ok ? 'success' : 'warning');
          renderLoadoutTab();
        });
      });
    }

    const poolEl = document.getElementById('loadoutPoolGrid');
    if (poolEl && hero) {
      const classSkills = reg().getSkillsForHero(hero.heroId);
      poolEl.innerHTML = classSkills.map((sk) => {
        const lv = Number(prog.skillLevels?.[sk.id] || 0);
        const equipped = currentIds.includes(sk.id);
        return `<div class="spell-card">
          <div>
            <div class="spell-card-head">
              <img src="${sk.icon}" alt="">
              <div>
                <strong>${window.appApi.escapeHtml(sk.name)}</strong>
                <div class="small-muted">${sk.isUltimate ? 'ULTIMATE' : 'Active'} · ${lv > 0 ? `Đã học Lv${lv}` : 'Chưa mở khóa'}</div>
              </div>
            </div>
            <div style="font-size:.76rem;margin-top:6px">${window.appApi.escapeHtml(sk.desc)}</div>
          </div>
          <button class="pixel-chip-btn ${equipped ? 'is-active' : ''}" data-toggle-loadout="${sk.id}" type="button" ${lv < 1 ? 'disabled' : ''}>${equipped ? 'Đang trang bị (Gỡ)' : (lv < 1 ? 'Chưa học' : 'Trang bị')}</button>
        </div>`;
      }).join('');

      poolEl.querySelectorAll('[data-toggle-loadout]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const res = store().toggleSkillInLoadout(state.loadoutHero, btn.dataset.toggleLoadout);
          if (res.ok && window.appApi.isBackendConnected?.()) {
            try { await saveServerHeroLoadout(state.loadoutHero, false); } catch (err) { showStatus(err.message, 'warning'); }
          }
          showStatus(res.ok ? 'Đã cập nhật Loadout xuất trận.' : res.reason, res.ok ? 'success' : 'warning');
          renderLoadoutTab();
        });
      });
    }
  }

  function renderChaptersTab() {
    const prog = store()?.loadState();
    const grid = document.getElementById('chapterMapGrid');
    if (!grid) return;
    grid.innerHTML = (reg()?.CHAPTER_STAGES || []).map((st) => {
      const stProg = prog.chapterProgress?.[st.stageId] || { status: st.stageId === 1 ? 'AVAILABLE' : 'LOCKED', clears: 0, bestScore: 0, stars: 0 };
      const locked = stProg.status === 'LOCKED';
      const bossCfg = window.RaidPhaserConfig?.bosses?.[st.bossTheme];
      return `<div class="chapter-card ${locked ? 'is-locked' : ''} ${stProg.status === 'MASTERED' ? 'is-mastered' : ''}">
        <div class="chapter-head">
          <img src="${bossCfg?.portrait || '/ui/assets/ui/avatars/portrait-boss-crabby.png'}" alt="${window.appApi.escapeHtml(st.bossTheme)}">
          <div>
            <span class="chapter-status-badge st-${stProg.status}">${stProg.status}</span>
            <strong style="display:block;margin-top:3px">Stage ${st.stageId}: ${window.appApi.escapeHtml(st.title)}</strong>
            <div class="small-muted">${window.appApi.escapeHtml(st.subtitle)} · Topic: ${st.topicBias}</div>
          </div>
        </div>
        <div style="font-size:.82rem">${window.appApi.escapeHtml(st.lore)}</div>
        <div class="small-muted"><strong>Thưởng:</strong> +${st.rewards.skillPoints} SP${st.rewards.heroUnlock ? `, Hero ${reg().getHero(st.rewards.heroUnlock).shortName}` : ''}${st.rewards.skillUnlock ? `, Skill ${reg().SKILL_MAP[st.rewards.skillUnlock]?.name}` : ''}</div>
        <div class="small-muted">Đã vượt: <strong>${stProg.clears}</strong> · Best Score: <strong>${stProg.bestScore}</strong></div>
        <div class="hero-card-actions">
          ${locked
            ? '<span class="chapter-locked-btn" aria-disabled="true"><i class="bi bi-lock-fill"></i> Chưa mở khóa</span>'
            : `<a class="pixel-btn pixel-btn--primary" href="/app/minigame?stage=${st.stageId}"><i class="bi bi-swords"></i> Vào Đấu Boss</a>`}
        </div>
      </div>`;
    }).join('');
  }

  function buildRecallQuizOptions(entry, journal) {
    const targetWord = String(entry?.word || '').trim().toUpperCase();
    const distractorPool = [
      ...(journal || []).map((j) => String(j.word || '').trim().toUpperCase()),
      'LEARN', 'QUEST', 'CACHE', 'QUERY', 'STACK', 'SHIELD', 'LIGHT', 'SWORD', 'BLADE', 'MAGE'
    ].filter((w) => w && w !== targetWord);
    const uniqueDist = Array.from(new Set(distractorPool)).slice(0, 6);
    const picks = [targetWord, ...uniqueDist.slice(0, 2)];
    // Deterministic order so UI doesn't jump randomly while keeping recall honest
    return picks.sort();
  }

  function renderMasteryTab() {
    const prog = store()?.loadState();
    let journal = [];
    try { journal = JSON.parse(localStorage.getItem('glp.wordJournal') || '[]'); } catch (_) {}
    const stats = prog?.learningStats || {};
    const uniqueReviewed = Array.isArray(stats.uniqueReviewedWords) ? stats.uniqueReviewedWords : [];
    const container = document.getElementById('wordMasteryContent');
    if (!container) return;

    container.innerHTML = `
      <div class="mastery-stats-grid">
        <div class="mastery-stat-box"><strong>${stats.validWordsSolved || 0}</strong><span>Từ hợp lệ</span></div>
        <div class="mastery-stat-box"><strong>${stats.topicWordsSolved || 0}</strong><span>Từ đúng Topic</span></div>
        <div class="mastery-stat-box"><strong>${stats.coreWordsSolved || 0}</strong><span>Core Words</span></div>
        <div class="mastery-stat-box"><strong>${uniqueReviewed.length}</strong><span>Từ đã ôn (Recall)</span></div>
        <div class="mastery-stat-box"><strong>${stats.pronunciationPlays || 0}</strong><span>Nghe phát âm</span></div>
      </div>
      <div id="masteryRecallBox" class="mastery-quiz-card" aria-live="polite" hidden></div>
      <div class="mastery-list">
        ${journal.length ? journal.slice(0, 12).map((w, idx) => {
          const upper = String(w.word || '').trim().toUpperCase();
          const mastered = uniqueReviewed.includes(upper);
          return `
          <div class="mastery-row">
            <div>
              <strong>${window.appApi.escapeHtml(w.word || '')}</strong>
              <span class="small-muted">(${window.appApi.escapeHtml(w.wordCategory || 'VALID')})</span>
              ${mastered ? '<span class="skill-state-pill st-LEARNED">ĐÃ ÔN ✔</span>' : ''}
              · ${window.appApi.escapeHtml(w.meaningText || 'Từ vựng tiếng Anh')}
            </div>
            <div class="mastery-word-actions">
              <button class="pixel-chip-btn" data-tts-word="${window.appApi.escapeHtml(w.word || '')}" type="button"><i class="bi bi-volume-up-fill"></i> Nghe phát âm</button>
              <button class="pixel-chip-btn" data-recall-idx="${idx}" type="button"><i class="bi bi-patch-check-fill"></i> Kiểm tra nhớ từ</button>
            </div>
          </div>`;
        }).join('') : '<div class="mastery-row">Chưa có từ vựng nào trong Nhật ký trận đấu. Hãy chơi một trận Đấu Boss để tích lũy từ mới!</div>'}
      </div>`;

    container.querySelectorAll('[data-tts-word]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const w = btn.dataset.ttsWord;
        if (window.speechSynthesis && w) {
          const u = new SpeechSynthesisUtterance(w);
          u.lang = 'en-US';
          window.speechSynthesis.speak(u);
        }
        store()?.recordPronunciationPlay(w);
        showStatus(`Đã phát âm từ "${w}" (chỉ tính lượt nghe, cần Recall đúng để tăng mốc Word Mastery).`, 'success');
        renderMasteryTab();
      });
    });

    container.querySelectorAll('[data-recall-idx]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const idx = Number(btn.dataset.recallIdx || 0);
        const entry = journal[idx];
        const quizBox = document.getElementById('masteryRecallBox');
        if (!quizBox) return;

        // If BACKEND_CONNECTED and liveMastery has wordId matching this word, use server single-use challenge
        const upperWord = String(entry?.word || '').trim().toUpperCase();
        const serverItem = window.appApi.isBackendConnected?.()
          ? (liveMastery?.items || []).find((m) => String(m.wordText || '').trim().toUpperCase() === upperWord) || (liveMastery?.items || [])[idx]
          : null;

        if (serverItem?.wordId && window.appApi.createMasteryChallenge) {
          try {
            const ch = await window.appApi.createMasteryChallenge(serverItem.wordId);
            quizBox.hidden = false;
            quizBox.innerHTML = `
              <div><strong>Thử thách Recall (Server):</strong> Chọn đúng từ tiếng Anh có nghĩa: <em>"${window.appApi.escapeHtml(ch.promptMeaning || serverItem.wordText)}"</em></div>
              <div class="mastery-quiz-choices">
                ${(ch.options || []).map((opt) => `<button class="pixel-chip-btn mastery-choice-btn" data-recall-choice="${window.appApi.escapeHtml(opt)}" type="button">${window.appApi.escapeHtml(opt)}</button>`).join('')}
              </div>`;
            quizBox.querySelectorAll('[data-recall-choice]').forEach((choiceBtn) => {
              choiceBtn.addEventListener('click', async () => {
                try {
                  const res = await window.appApi.submitMasteryRecall({
                    challengeId: ch.challengeId,
                    wordId: ch.wordId,
                    selectedWord: choiceBtn.dataset.recallChoice
                  });
                  liveMastery = await window.appApi.getMasterySummary();
                  const snap = await window.appApi.getProgression();
                  store()?.hydrateFromServerSnapshot(snap, liveMastery);
                  showStatus(res.message || (res.correct ? 'Chính xác!' : 'Chưa đúng!'), res.correct ? 'success' : 'warning');
                  renderMasteryTab();
                } catch (err) {
                  showStatus(err.message, 'warning');
                }
              });
            });
            return;
          } catch (_) {}
        }

        if (!entry) return;
        const options = buildRecallQuizOptions(entry, journal);
        quizBox.hidden = false;
        quizBox.innerHTML = `
          <div><strong>Thử thách Recall:</strong> Chọn đúng từ tiếng Anh có nghĩa: <em>"${window.appApi.escapeHtml(entry.meaningText || entry.word)}"</em></div>
          <div class="mastery-quiz-choices">
            ${options.map((opt) => `<button class="pixel-chip-btn mastery-choice-btn" data-recall-choice="${window.appApi.escapeHtml(opt)}" type="button">${window.appApi.escapeHtml(opt)}</button>`).join('')}
          </div>`;
        quizBox.querySelectorAll('[data-recall-choice]').forEach((choiceBtn) => {
          choiceBtn.addEventListener('click', () => {
            const chosen = String(choiceBtn.dataset.recallChoice || '').toUpperCase();
            const target = String(entry.word || '').trim().toUpperCase();
            const isCorrect = chosen === target;
            const res = store()?.recordWordRecallAttempt(target, isCorrect);
            if (isCorrect) {
              showStatus(
                res?.isNewUnique
                  ? `Chính xác "${target}"! Đã ghi nhận thêm 1 từ duy nhất vào Word Mastery (${res.uniqueCount} từ).`
                  : `Chính xác "${target}" (từ này đã nằm trong danh sách ôn tập duy nhất).`,
                'success'
              );
            } else {
              showStatus(`Chưa đúng ("${chosen}" ≠ nghĩa trên). Hãy nghe lại phát âm và thử lại!`, 'warning');
            }
            renderMasteryTab();
          });
        });
      });
    });
  }

  function switchTab(tabKey) {
    state.activeTab = tabKey;
    document.querySelectorAll('[data-hall-tab]').forEach((btn) => {
      const isAct = btn.dataset.hallTab === tabKey;
      btn.classList.toggle('is-active', isAct);
      btn.setAttribute('aria-selected', isAct ? 'true' : 'false');
    });
    document.querySelectorAll('.hall-pane').forEach((pane) => {
      pane.classList.toggle('is-active', pane.id === `hallPane-${tabKey}`);
    });
    if (tabKey === 'heroes') { renderHeroesTab(); renderAvatars(); }
    if (tabKey === 'tree') renderSkillTreeTab();
    if (tabKey === 'spellbook') renderSpellbookTab();
    if (tabKey === 'loadout') renderLoadoutTab();
    if (tabKey === 'chapters') renderChaptersTab();
    if (tabKey === 'mastery') renderMasteryTab();
  }

  async function save() {
    const prog = store()?.loadState();
    const isConnected = window.appApi.isBackendConnected?.();
    if (prog && !store().isHeroUnlocked(state.unitCode, prog)) {
      showStatus('Hero chưa được mở khóa; không thể lưu làm đơn vị xuất chiến.', 'warning');
      return;
    }
    const payload = {
      unitCode: state.unitCode,
      avatarCode: state.avatarCode,
      selectedUnitCode: state.unitCode,
      selectedAvatarKey: toDbAvatarKey(state.avatarCode)
    };
    window.appApi.saveAccountPreferences(payload);
    store()?.selectHero(state.unitCode);
    const userId = window.appApi.getCurrentUserId();
    try {
      if (isConnected) {
        await saveServerHeroLoadout(state.unitCode, false);
        const dbUnit = state.unitCode === 'arcane_mage' ? 'warrior' : state.unitCode;
        await window.appApi.saveAccountLoadout({ userId, ...payload, unitCode: dbUnit, selectedUnitCode: dbUnit });
        showStatus('Đã lưu Hero, Loadout & Avatar lên SQL Server thành công!', 'success');
      } else {
        if (userId) {
          const dbUnit = state.unitCode === 'arcane_mage' ? 'warrior' : state.unitCode;
          await window.appApi.saveAccountLoadout({ userId, ...payload, unitCode: dbUnit, selectedUnitCode: dbUnit });
        }
        showStatus(
          state.unitCode === 'arcane_mage'
            ? 'Đã lưu Arcane Mage ở Demo Progression cục bộ & đồng bộ Avatar.'
            : 'Đã lưu thiết lập nhân vật & loadout thành công!',
          'success'
        );
      }
      window.appApi.renderNavUser();
    } catch (err) {
      showStatus(`Đã lưu cục bộ trên trình duyệt: ${err.message}`, 'warning');
    }
  }

  async function init() {
    window.appApi.renderNavUser();
    window.appApi.bindMobileNav();

    let prog = store()?.loadState();
    const prefs = window.appApi.getAccountPreferences() || {};
    state.unitCode = prog && store().isHeroUnlocked(prog.selectedHero, prog)
      ? prog.selectedHero
      : window.appApi.normalizeUnitCode(prefs.unitCode || 'warrior');
    state.avatarCode = normalizeAvatarCode(prefs.avatarCode || 'avatar1');
    state.treeHero = state.unitCode;
    state.loadoutHero = state.unitCode;
    state.lastDummyHeroId = state.unitCode;

    const userId = window.appApi.getCurrentUserId();
    const isConnected = window.appApi.isBackendConnected?.();
    try {
      if (userId) {
        const reqs = [
          window.appApi.getAccountLoadout(userId),
          window.appApi.getAccountProfile(userId)
        ];
        if (isConnected) {
          reqs.push(window.appApi.getProgression(), window.appApi.getMasterySummary());
        }
        const [loadoutRes, profileRes, progRes, masteryRes] = await Promise.allSettled(reqs);
        if (masteryRes?.status === 'fulfilled' && masteryRes.value) {
          liveMastery = masteryRes.value;
        }
        if (progRes?.status === 'fulfilled' && progRes.value && store()?.hydrateFromServerSnapshot) {
          prog = store().hydrateFromServerSnapshot(progRes.value, liveMastery);
          state.unitCode = prog.selectedHero || state.unitCode;
          state.treeHero = state.unitCode;
          state.loadoutHero = state.unitCode;
          state.lastDummyHeroId = state.unitCode;
        }
        if (loadoutRes?.status === 'fulfilled' && loadoutRes.value) {
          const norm = normalizeIncoming(loadoutRes.value);
          state.avatarCode = norm.avatarCode;
          if (!isConnected && (!prog || store().isHeroUnlocked(norm.unitCode, prog))) state.unitCode = norm.unitCode;
        }
        if (profileRes?.status === 'fulfilled' && profileRes.value) {
          liveProfile = profileRes.value;
          const auth = window.appApi.getAuth();
          if (auth) {
            auth.levelCurrent = liveProfile.levelCurrent;
            auth.xpTotal = liveProfile.xpTotal;
            auth.coins = liveProfile.coins;
            auth.streakDays = liveProfile.streakDays;
            window.appApi.saveAuth(auth);
            window.appApi.renderNavUser();
          }
        }
      }
    } catch (_) {}

    document.querySelectorAll('[data-hall-tab]').forEach((btn) => {
      btn.addEventListener('click', () => switchTab(btn.dataset.hallTab));
    });

    document.getElementById('saveLoadoutBtn')?.addEventListener('click', save);
    document.getElementById('resetLoadoutBtn')?.addEventListener('click', () => {
      state.unitCode = 'warrior';
      state.avatarCode = 'avatar1';
      store()?.selectHero('warrior');
      renderHeroesTab();
      renderAvatars();
      renderProfile();
    });
    document.getElementById('resetDemoProgBtn')?.addEventListener('click', () => {
      if (isConnected) {
        showStatus('Đang ở chế độ SQL Server: tiến trình thật được bảo toàn trên DB.', 'warning');
        return;
      }
      store()?.resetDemoProgression();
      state.unitCode = 'warrior';
      state.treeHero = 'warrior';
      state.loadoutHero = 'warrior';
      switchTab(state.activeTab);
      renderProfile();
      showStatus('Đã đặt lại Demo Progression về trạng thái khởi đầu.', 'warning');
    });
    document.getElementById('replayDummyBtn')?.addEventListener('click', () => {
      runDummySkill(state.lastDummySkillId, state.lastDummyHeroId);
    });

    switchTab('heroes');
    renderProfile();

    if (isConnected) {
      showStatus('Đã kết nối SQL Server (BACKEND_CONNECTED · JWT Authenticated).', 'success');
    } else if (!userId) {
      showStatus('Đang chạy Demo Progression cục bộ trên trình duyệt (chưa đồng bộ SQL Server).', 'warning');
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
