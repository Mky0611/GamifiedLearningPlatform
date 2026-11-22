(function(){
  const unitCatalog = [
    {code:'warrior', name:'Warrior', role:'Cận chiến chủ lực', note:'Sát thương ổn định, animation đầy đủ nhất cho Boss Hunt.'},
    {code:'lancer', name:'Lancer', role:'Phòng tuyến / phản đòn', note:'Giữ nhịp giao tranh, hợp với state Guard và counter.'},
    {code:'archer', name:'Archer', role:'Tầm xa / áp lực mục tiêu', note:'Dùng shoot animation để tạo cảm giác đánh boss từ xa.'}
  ];

  const avatars = [
    {code:'avatar1', dbKey:'avatar-a', name:'Knight Crest', url:'/ui/assets/imgs/avatar1.png'},
    {code:'avatar2', dbKey:'avatar-b', name:'Lancer Crest', url:'/ui/assets/imgs/avatar2.png'},
    {code:'avatar3', dbKey:'avatar-c', name:'Archer Crest', url:'/ui/assets/imgs/avatar3.png'}
  ];

  const state = { unitCode:'warrior', avatarCode:'avatar1' };

  function normalizeAvatarCode(input){
    const value = String(input || '').trim().toLowerCase();
    if(value === 'avatar-a' || value === 'avatar1') return 'avatar1';
    if(value === 'avatar-b' || value === 'avatar2') return 'avatar2';
    if(value === 'avatar-c' || value === 'avatar3') return 'avatar3';
    return 'avatar1';
  }

  function toDbAvatarKey(input){
    const code = normalizeAvatarCode(input);
    if(code === 'avatar1') return 'avatar-a';
    if(code === 'avatar2') return 'avatar-b';
    if(code === 'avatar3') return 'avatar-c';
    return 'avatar-a';
  }

  function normalizeIncoming(payload = {}){
    return {
      unitCode: window.appApi.normalizeUnitCode(payload.selectedUnitCode || payload.unitCode || state.unitCode),
      avatarCode: normalizeAvatarCode(payload.selectedAvatarKey || payload.avatarCode || payload.avatarKey || state.avatarCode)
    };
  }

  function getPrefs(){
    return normalizeIncoming(window.appApi.getAccountPreferences() || { unitCode:'warrior', avatarCode:'avatar1' });
  }

  function selectedAvatar(){
    return avatars.find(v => v.code === state.avatarCode) || avatars[0];
  }

  function selectedUnit(){
    return unitCatalog.find(v => v.code === state.unitCode) || unitCatalog[0];
  }

  function renderProfile(){
    const auth = window.appApi.getAuth() || {};
    document.getElementById('accountDisplayName').textContent = auth.displayName || auth.username || 'Knight Learner';
    document.getElementById('accountMeta').textContent = `Lv ${Number(auth.levelCurrent || 1)} · ${Number(auth.xpTotal || 0).toLocaleString('vi-VN')} XP`;
    document.getElementById('accountProfileAvatar').src = selectedAvatar().url;
    document.getElementById('accountSummary').textContent = `Đang dùng ${selectedUnit().name} · ${selectedAvatar().name}.`;
  }

  function renderUnits(){
    const html = unitCatalog.map(unit => `
      <button class="option-card ${unit.code===state.unitCode?'is-selected':''}" data-unit="${unit.code}" type="button">
        <span class="option-card__badge"><i class="bi bi-check2"></i></span>
        <div class="unit-stage"><div class="pixel-unit pixel-unit--${unit.code} is-idle"></div></div>
        <div><strong style="display:block;font-size:1.15rem">${unit.name}</strong><div class="small-muted" style="margin:6px 0 8px">${unit.role}</div><div class="muted">${unit.note}</div></div>
      </button>`).join('');
    const grid = document.getElementById('unitGrid');
    grid.innerHTML = html;
    grid.querySelectorAll('[data-unit]').forEach(el => el.addEventListener('click', () => {
      state.unitCode = el.dataset.unit;
      renderUnits();
      renderProfile();
    }));
  }

  function renderAvatars(){
    const html = avatars.map(avatar => `
      <button class="option-card avatar-option ${avatar.code===state.avatarCode?'is-selected':''}" data-avatar="${avatar.code}" type="button">
        <span class="option-card__badge"><i class="bi bi-check2"></i></span>
        <div class="avatar-option__frame"><img src="${avatar.url}" alt="${avatar.name}"></div>
        <div><strong style="display:block;font-size:1.08rem">${avatar.name}</strong><div class="muted">Khóa lưu BE: <code>${avatar.dbKey}</code></div></div>
      </button>`).join('');
    const grid = document.getElementById('avatarGrid');
    grid.innerHTML = html;
    grid.querySelectorAll('[data-avatar]').forEach(el => el.addEventListener('click', () => {
      state.avatarCode = el.dataset.avatar;
      renderAvatars();
      renderProfile();
    }));
  }

  async function save(){
    const payload = {
      unitCode: state.unitCode,
      avatarCode: state.avatarCode,
      selectedUnitCode: state.unitCode,
      selectedAvatarKey: toDbAvatarKey(state.avatarCode)
    };

    window.appApi.saveAccountPreferences(payload);

    const userId = window.appApi.getCurrentUserId();

    try{
      if(userId){
        await window.appApi.saveAccountLoadout({
          userId,
          unitCode: state.unitCode,
          avatarCode: state.avatarCode,
          selectedUnitCode: state.unitCode,
          selectedAvatarKey: toDbAvatarKey(state.avatarCode)
        });
      }

      document.getElementById('accountStatus').innerHTML = '<div class="inline-message" data-tone="success">Đã lưu loadout. Boss Hunt sẽ dùng unit/avatar này ngay từ turn 1.</div>';
      window.appApi.renderNavUser();
    }catch(err){
      document.getElementById('accountStatus').innerHTML = `<div class="inline-message">FE đã lưu local nhưng BE chưa nhận save: ${window.appApi.escapeHtml(err.message)}</div>`;
    }
  }

  async function init(){
    window.appApi.renderNavUser();
    window.appApi.bindMobileNav();

    Object.assign(state, getPrefs());

    const userId = window.appApi.getCurrentUserId();
    try{
      if(userId){
        Object.assign(state, normalizeIncoming(await window.appApi.getAccountLoadout(userId)));
      }
    }catch(e){}

    renderUnits();
    renderAvatars();
    renderProfile();

    document.getElementById('saveLoadoutBtn').addEventListener('click', save);
    document.getElementById('resetLoadoutBtn').addEventListener('click', () => {
      state.unitCode = 'warrior';
      state.avatarCode = 'avatar1';
      renderUnits();
      renderAvatars();
      renderProfile();
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();