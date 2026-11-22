(function(){
  const STORAGE_KEY='glp.auth';
  const PREFS_KEY='glp.account.prefs';

  async function request(path,options={}){
    const hasBody = options.body !== undefined;
    const headers = { ...(options.headers||{}) };
    if(hasBody && !headers['Content-Type']) headers['Content-Type']='application/json';
    const config={method:options.method||'GET',headers,credentials:'same-origin'};
    if(hasBody){config.body=typeof options.body==='string'?options.body:JSON.stringify(options.body)}
    const res=await fetch(path,config);
    const text=await res.text();
    let payload=null;
    try{payload=text?JSON.parse(text):null}catch(e){payload=null}
    if(!res.ok || (payload && payload.success===false)){throw new Error(payload?.message||`Request failed with status ${res.status}`)}
    return payload?.data??payload;
  }

  function getAuth(){const raw=localStorage.getItem(STORAGE_KEY); if(!raw) return null; try{return JSON.parse(raw)}catch(e){localStorage.removeItem(STORAGE_KEY);return null}}
  function saveAuth(auth){localStorage.setItem(STORAGE_KEY,JSON.stringify({...auth,savedAt:new Date().toISOString()}))}
  function clearAuth(){localStorage.removeItem(STORAGE_KEY)}
  function escapeHtml(input){const map={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};return String(input??'').replace(/[&<>"']/g,ch=>map[ch])}
  function getUserInitials(auth){const s=(auth?.displayName||auth?.username||'Learner').trim().split(/\s+/); return s.slice(0,2).map(v=>v.charAt(0).toUpperCase()).join('')}
  function getCurrentUserId(){const value=Number(getAuth()?.userId); return Number.isFinite(value) && value>0 ? value : null}

  function normalizeUnitCode(value){
    const v=String(value||'').trim().toLowerCase();
    if(['warrior','lancer','archer'].includes(v)) return v;
    return 'warrior';
  }
  function normalizeAvatarCode(value){
    const v=String(value||'').trim().toLowerCase();
    const map={
      'avatar1':'avatar1','avatar2':'avatar2','avatar3':'avatar3',
      'avatar-a':'avatar1','avatar-b':'avatar2','avatar-c':'avatar3',
      'avatar-ts-1':'avatar1','avatar-ts-8':'avatar2','avatar-ts-18':'avatar3'
    };
    return map[v] || 'avatar1';
  }
  function toDbAvatarKey(value){
    const v = normalizeAvatarCode(value);
    const map = { avatar1:'avatar-a', avatar2:'avatar-b', avatar3:'avatar-c' };
    return map[v] || 'avatar-a';
  }
  function getAccountPreferences(){
    const raw = localStorage.getItem(PREFS_KEY);
    if(!raw) return null;
    try{
      const parsed = JSON.parse(raw);
      return {
        ...parsed,
        unitCode: normalizeUnitCode(parsed.selectedUnitCode || parsed.unitCode),
        avatarCode: normalizeAvatarCode(parsed.selectedAvatarKey || parsed.avatarCode || parsed.avatarKey)
      };
    }catch(e){localStorage.removeItem(PREFS_KEY); return null;}
  }
  function saveAccountPreferences(pref){
    const normalizedAvatar = normalizeAvatarCode(pref?.selectedAvatarKey || pref?.avatarCode || pref?.avatarKey);
    const normalized={
      unitCode: normalizeUnitCode(pref?.selectedUnitCode || pref?.unitCode),
      avatarCode: normalizedAvatar,
      selectedUnitCode: normalizeUnitCode(pref?.selectedUnitCode || pref?.unitCode),
      selectedAvatarKey: normalizedAvatar,
      selectedAvatarDbKey: toDbAvatarKey(normalizedAvatar),
      savedAt:new Date().toISOString()
    };
    localStorage.setItem(PREFS_KEY, JSON.stringify(normalized));
  }

  function getAvatarMap(){
    return {
      'avatar1':'/ui/assets/imgs/avatar1.png',
      'avatar2':'/ui/assets/imgs/avatar2.png',
      'avatar3':'/ui/assets/imgs/avatar3.png'
    };
  }
  function getAvatarUrl(code){ return getAvatarMap()[normalizeAvatarCode(code)] || '/ui/assets/imgs/avatar1.png'; }

  function renderNavUser(){
    const el=document.getElementById('navUserArea');
    if(!el) return;
    const auth=getAuth();
    const prefs = getAccountPreferences() || {};
    if(!auth){
      el.innerHTML='<a class="nav-auth-pill" href="/app/auth"><i class="bi bi-box-arrow-in-right"></i><span>Đăng nhập</span></a>';
      return;
    }
    const name=escapeHtml(auth.displayName||auth.username||'Learner');
    const level=Number(auth.levelCurrent||1);
    const xp=Number(auth.xpTotal||0).toLocaleString('vi-VN');
    const avatar = getAvatarUrl(prefs.avatarCode);
    el.innerHTML=`<div class="nav-user-cluster"><a class="nav-user-chip" href="/app/account"><div class="nav-user-chip__avatar nav-user-chip__avatar--image"><img src="${avatar}" alt="avatar"></div><div class="nav-user-chip__meta"><strong>${name}</strong><span>Lv ${level} · ${xp} XP</span></div></a><button class="nav-pill-button" id="logoutBtn" type="button"><i class="bi bi-door-open"></i><span>Đăng xuất</span></button></div>`;
    document.getElementById('logoutBtn')?.addEventListener('click',()=>{clearAuth();location.href='/app/auth'});
  }

  function bindMobileNav(){const t=document.getElementById('mobileNavToggle'); const l=document.getElementById('mainNavLinks'); if(!t||!l||t.dataset.bound) return; t.dataset.bound='true'; t.addEventListener('click',()=>l.classList.toggle('is-open'))}

  function initFancyCursor(){
    if(window.matchMedia('(pointer: coarse)').matches) return;
    const body=document.body;
    if(!body || body.dataset.cursorReady==='true') return;
    body.dataset.cursorReady='true';
    const cursor=document.createElement('div');
    cursor.className='fancy-cursor is-move is-hidden';
    body.appendChild(cursor);
    let state='move';
    let raf=0;
    let x=-1000,y=-1000;
    function applyPos(){ cursor.style.transform=`translate(${x}px,${y}px)`; raf=0; }
    function setState(next){ if(next===state) return; state=next; cursor.className=`fancy-cursor is-${next}`; }
    function resolve(target){
      if(!target) return 'move';
      if(target.closest('[data-cursor="forbidden"], [disabled], .is-disabled, [aria-disabled="true"]')) return 'forbidden';
      if(target.closest('.board-tile.is-selected, .btn-soft:active, [data-cursor="action"]')) return 'action';
      if(target.closest('a[href], button:not([disabled]), .btn-soft, .board-tile, input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [role="button"], [data-cursor="pointer"]')) return 'pointer';
      return 'move';
    }
    function moveHandler(e){
      x=e.clientX-8; y=e.clientY-6;
      if(!raf) raf=requestAnimationFrame(applyPos);
      setState(resolve(e.target));
      cursor.classList.remove('is-hidden');
      body.classList.add('cursor-enhanced');
    }
    document.addEventListener('pointermove', moveHandler, {passive:true});
    document.addEventListener('pointerdown', e=>setState('action'));
    document.addEventListener('pointerup', e=>setState(resolve(e.target)));
    document.addEventListener('mouseover', e=>setState(resolve(e.target)));
    document.addEventListener('mouseleave', ()=>cursor.classList.add('is-hidden'));
    window.addEventListener('blur', ()=>cursor.classList.add('is-hidden'));
  }
  document.addEventListener('DOMContentLoaded', initFancyCursor);

  window.appApi={request,getAuth,saveAuth,clearAuth,escapeHtml,getUserInitials,getCurrentUserId,renderNavUser,bindMobileNav,getAccountPreferences,saveAccountPreferences,getAvatarUrl,normalizeUnitCode,normalizeAvatarCode,toDbAvatarKey,
    login:(body)=>request('/api/v1/auth/login',{method:'POST',body}), register:(body)=>request('/api/v1/auth/register',{method:'POST',body}),
    getHomeOverview:()=>request('/api/v1/home/overview'), getGames:()=>request('/api/v1/games'),
    getStages:()=>request('/api/v1/lex-raid/stages'), getRecommendedStage:()=>request('/api/v1/lex-raid/stages/recommended'), getStageDetail:(id)=>request(`/api/v1/lex-raid/stages/${id}`), getStageRuntime:(id)=>request(`/api/v1/lex-raid/stages/${id}/runtime`), startRaidSession:(body)=>request('/api/v1/lex-raid/sessions/start',{method:'POST',body}), getRaidSession:(id)=>request(`/api/v1/lex-raid/sessions/${id}`), syncRaidSession:(id,body)=>request(`/api/v1/lex-raid/sessions/${id}/sync`,{method:'POST',body}), finishRaidSession:(id,body)=>request(`/api/v1/lex-raid/sessions/${id}/finish`,{method:'POST',body}), submitRaidWord:(id,body)=>request(`/api/v1/lex-raid/sessions/${id}/submit-word`,{method:'POST',body}), guessCoreWord:(id,body)=>request(`/api/v1/lex-raid/sessions/${id}/guess-core-word`,{method:'POST',body}),
    getQuizSets:()=>request('/api/v1/quiz/sets'), getQuizSet:(id)=>request(`/api/v1/quiz/sets/${id}`), startQuizSession:(body)=>request('/api/v1/quiz/sessions/start',{method:'POST',body}), submitQuizAnswer:(id,body)=>request(`/api/v1/quiz/sessions/${id}/submit`,{method:'POST',body}),
    getVolcardTopics:()=>request('/api/v1/volcard/topics'), getVolcardSets:(topicId)=>request(`/api/v1/volcard/topics/${topicId}/sets`), getVolcardCards:(setId,offset=0,limit=50)=>request(`/api/v1/volcard/sets/${setId}/cards?offset=${offset}&limit=${limit}`),
    getAccountCatalog:()=>request('/api/v1/account/options'), getAccountLoadout:(userId)=>request(`/api/v1/account/loadout?userId=${userId}`), saveAccountLoadout:(body)=>request('/api/v1/account/loadout',{method:'PUT',body})
  };
})();
