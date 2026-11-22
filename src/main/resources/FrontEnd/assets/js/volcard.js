(function(){
  const state={topics:[],sets:[],cards:[],topicId:null,setId:null,index:0,flipped:false,total:0};

  function status(text){const el=document.getElementById('volcardStatus'); if(el) el.textContent=text}
  function currentSet(){return state.sets.find((s)=>s.vocabularySetId===state.setId)||null}

  function renderTopics(){
    const el=document.getElementById('topicList');
    el.innerHTML=state.topics.map((t)=>`<button class="topic-item ${t.topicId===state.topicId?'is-active':''}" data-id="${t.topicId}">${window.appApi.escapeHtml(t.name||t.code||'Topic')}</button>`).join('');
    el.querySelectorAll('.topic-item').forEach((b)=>b.onclick=()=>loadSets(Number(b.dataset.id)));
  }

  function renderSets(){
    const el=document.getElementById('setList');
    el.innerHTML=state.sets.map((s)=>`<button class="set-item ${s.vocabularySetId===state.setId?'is-active':''}" data-id="${s.vocabularySetId}"><strong>${window.appApi.escapeHtml(s.title||'Set')}</strong><div class="small-muted">${Number(s.totalWords||0)} words · ${window.appApi.escapeHtml((s.languageCode||'en').toUpperCase())}</div>${s.description?`<div class="small-muted">${window.appApi.escapeHtml(s.description)}</div>`:''}</button>`).join('');
    el.querySelectorAll('.set-item').forEach((b)=>b.onclick=()=>loadCards(Number(b.dataset.id)));
  }

  function renderCard(){
    const card=state.cards[state.index];
    const set=currentSet();
    if(!card){
      document.getElementById('flashWord').textContent='No card';
      document.getElementById('flashMeaning').textContent='Set này chưa có dữ liệu.';
      document.getElementById('flashMeaningEn').textContent='English meaning';
      document.getElementById('flashMeaningVi').textContent='Vietnamese meaning';
      document.getElementById('flashSet').textContent=set?.title||'Vocabulary set';
      document.getElementById('flashIndex').textContent='0/0';
      document.getElementById('flashCard').classList.remove('is-flipped');
      status('Chưa có card trong set này.');
      return;
    }
    document.getElementById('flashWord').textContent=card.wordText||card.word||'word';
    document.getElementById('flashMeaning').textContent=card.meaningVi||card.meaningEn||'Nghĩa';
    document.getElementById('flashMeaningEn').textContent=card.meaningEn||'English meaning';
    document.getElementById('flashMeaningVi').textContent=card.meaningVi||'Vietnamese meaning';
    document.getElementById('flashSet').textContent=[set?.title||'Vocabulary set', (set?.languageCode||'en').toUpperCase()].join(' · ');
    document.getElementById('flashIndex').textContent=`${state.index+1}/${state.cards.length}`;
    document.getElementById('flashCard').classList.toggle('is-flipped',state.flipped);
    status(`Đang ôn ${state.cards.length} card${state.total && state.total>state.cards.length?` / tổng ${state.total}`:''}. Click card hoặc nút để lật.`);
  }

  async function loadTopics(){
    try{state.topics=await window.appApi.getVolcardTopics()}catch(e){state.topics=[{topicId:1,name:'Common English'},{topicId:2,name:'Business'},{topicId:3,name:'Technology'}]; status('API topic chưa sẵn, đang dùng dữ liệu fallback.');}
    if(!state.topics.length){state.topics=[{topicId:1,name:'Common English'}]}
    state.topicId=state.topics[0].topicId;
    renderTopics();
    await loadSets(state.topicId);
  }

  async function loadSets(topicId){
    state.topicId=topicId;
    renderTopics();
    try{state.sets=await window.appApi.getVolcardSets(topicId)}catch(e){state.sets=[{vocabularySetId:topicId*100+1,title:'Starter Pack',totalWords:5,languageCode:'en',description:'Fallback set'},{vocabularySetId:topicId*100+2,title:'Core Pack',totalWords:5,languageCode:'en',description:'Fallback set'}]}
    state.setId=state.sets[0]?.vocabularySetId||null;
    renderSets();
    if(state.setId) await loadCards(state.setId); else {state.cards=[]; renderCard();}
  }

  async function loadCards(setId){
    state.setId=setId;
    state.index=0;
    state.flipped=false;
    state.total=0;
    renderSets();
    try{
      const page=await window.appApi.getVolcardCards(setId,0,50);
      state.cards=Array.isArray(page?.cards)?page.cards:(Array.isArray(page)?page:[]);
      state.total=Number(page?.total||state.cards.length||0);
    }catch(e){
      state.cards=[{wordText:'learn',meaningEn:'to gain knowledge',meaningVi:'học'},{wordText:'boss',meaningEn:'enemy leader',meaningVi:'trùm'},{wordText:'clue',meaningEn:'a hint',meaningVi:'gợi ý'},{wordText:'raid',meaningEn:'battle attack',meaningVi:'đột kích'},{wordText:'core',meaningEn:'central key word',meaningVi:'cốt lõi'}];
      state.total=state.cards.length;
    }
    renderCard();
  }

  function flipOrNext(){if(!state.cards.length) return; if(!state.flipped){state.flipped=true}else{state.flipped=false; state.index=(state.index+1)%state.cards.length} renderCard()}

  document.addEventListener('DOMContentLoaded',()=>{
    window.appApi.renderNavUser();
    window.appApi.bindMobileNav();
    document.getElementById('flipBtn').onclick=()=>{state.flipped=!state.flipped; renderCard()};
    document.getElementById('nextBtn').onclick=()=>{if(!state.cards.length) return; state.flipped=false; state.index=(state.index+1)%state.cards.length; renderCard()};
    document.getElementById('flashCard').onclick=flipOrNext;
    loadTopics();
  });
})();
