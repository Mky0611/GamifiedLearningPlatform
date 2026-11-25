/**
 * Shared Cozy Fantasy Theme Controller (Phase P4-B.3 Milestone F)
 * Supports 'daylight' (Sáng Ấm Cozy), 'moonlight' (Tối Thư Giãn Cozy), and route-locked
 * 'combat' mode on /app/minigame while keeping user preference in localStorage('glp.theme').
 */
(function () {
  const STORAGE_KEY = 'glp.theme';

  function isCombatRoute() {
    try {
      return window.location.pathname.includes('/minigame');
    } catch (e) {
      return false;
    }
  }

  function getSavedThemePreference() {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === 'daylight' || saved === 'moonlight') {
        return saved;
      }
    } catch (e) {}
    try {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'moonlight';
      }
    } catch (e) {}
    return 'daylight';
  }

  function applyTheme(mode, persist = false) {
    let target = mode;
    if (persist && (mode === 'daylight' || mode === 'moonlight')) {
      try {
        window.localStorage.setItem(STORAGE_KEY, mode);
      } catch (e) {}
    }
    if (isCombatRoute() && mode !== 'daylight' && mode !== 'moonlight') {
      target = 'combat';
    } else if (isCombatRoute() && !persist) {
      target = 'combat';
    }
    document.documentElement.dataset.theme = target;
    document.documentElement.dataset.preferredTheme = getSavedThemePreference();
    try {
      window.dispatchEvent(new CustomEvent('glp:themechange', {
        detail: { activeTheme: target, preferredTheme: getSavedThemePreference() }
      }));
    } catch (e) {}
    updateToggleButtons();
    return target;
  }

  function toggleTheme() {
    const currentPref = getSavedThemePreference();
    const next = currentPref === 'moonlight' ? 'daylight' : 'moonlight';
    if (isCombatRoute()) {
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch (e) {}
      document.documentElement.dataset.preferredTheme = next;
      updateToggleButtons();
      return next;
    }
    return applyTheme(next, true);
  }

  function updateToggleButtons() {
    const pref = getSavedThemePreference();
    const isMoon = pref === 'moonlight';
    const label = isMoon ? 'Moonlight' : 'Daylight';
    const title = isCombatRoute()
      ? `Chủ đề giao diện ngoài trận: ${label} (Đấu Boss luôn giữ Combat Theme)`
      : (isMoon ? 'Chuyển sang Sáng Ấm Cozy (Daylight)' : 'Chuyển sang Tối Thư Giãn (Moonlight)');
    document.querySelectorAll('#themeToggleBtn').forEach((btn) => {
      btn.setAttribute('aria-pressed', String(isMoon));
      btn.setAttribute('title', title);
      btn.innerHTML = isMoon
        ? '<i class="bi bi-moon-stars-fill" aria-hidden="true"></i><span>Moon</span>'
        : '<i class="bi bi-sun-fill" aria-hidden="true"></i><span>Sun</span>';
    });
  }

  function mountToggleButton() {
    const navLinks = document.getElementById('mainNavLinks');
    const navUserArea = document.getElementById('navUserArea');
    if (!navLinks || document.getElementById('themeToggleBtn')) {
      updateToggleButtons();
      return;
    }
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'themeToggleBtn';
    btn.className = 'theme-toggle-btn';
    btn.setAttribute('aria-label', 'Đổi chế độ Sáng / Tối');
    btn.addEventListener('click', toggleTheme);
    if (navUserArea && navUserArea.parentElement === navLinks) {
      navLinks.insertBefore(btn, navUserArea);
    } else {
      navLinks.appendChild(btn);
    }
    updateToggleButtons();
  }

  // Immediate synchronous application before paint to prevent flash
  const initial = isCombatRoute() ? 'combat' : getSavedThemePreference();
  document.documentElement.dataset.theme = initial;
  document.documentElement.dataset.preferredTheme = getSavedThemePreference();

  window.LexTheme = {
    getPreference: getSavedThemePreference,
    getActiveTheme: () => document.documentElement.dataset.theme || 'daylight',
    setTheme: (mode) => applyTheme(mode, true),
    toggle: toggleTheme,
    restoreCombatMode: () => applyTheme('combat', false)
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountToggleButton);
  } else {
    mountToggleButton();
  }
})();
