(function(){
  const state = {
    topics: [],
    sets: [],
    cards: [],
    topicId: null,
    setId: null,
    index: 0,
    flipped: false,
    total: 0,
    cefrFilter: 'ALL',
    searchQuery: '',
    searchDebounceTimer: null
  };

  function status(text){
    const el = document.getElementById('volcardStatus');
    if(el) el.textContent = text;
  }

  function currentSet(){
    return state.sets.find((s) => s.vocabularySetId === state.setId) || null;
  }

  function renderTopics(){
    const el = document.getElementById('topicList');
    if(!el) return;
    el.innerHTML = state.topics.map((t) =>
      `<button class="topic-item ${t.topicId === state.topicId ? 'is-active' : ''}" data-id="${t.topicId}">${window.appApi.escapeHtml(t.name || t.code || 'Topic')}</button>`
    ).join('');
    el.querySelectorAll('.topic-item').forEach((b) => b.onclick = () => loadSets(Number(b.dataset.id)));
  }

  function renderSets(){
    const el = document.getElementById('setList');
    if(!el) return;
    el.innerHTML = state.sets.map((s) =>
      `<button class="set-item ${s.vocabularySetId === state.setId ? 'is-active' : ''}" data-id="${s.vocabularySetId}">
        <strong>${window.appApi.escapeHtml(s.title || 'Set')}</strong>
        <div class="small-muted">${Number(s.totalWords || 0)} words · ${window.appApi.escapeHtml((s.languageCode || 'en').toUpperCase())} · ${window.appApi.escapeHtml(s.difficulty || 'Foundation')}</div>
        ${s.description ? `<div class="small-muted">${window.appApi.escapeHtml(s.description)}</div>` : ''}
      </button>`
    ).join('');
    el.querySelectorAll('.set-item').forEach((b) => b.onclick = () => loadCards(Number(b.dataset.id)));
  }

  function fitFlashWord(){
    const elWord = document.getElementById('flashWord');
    if(!elWord) return;
    elWord.style.fontSize = '';
    const maxW = elWord.parentElement ? elWord.parentElement.clientWidth - 2 : elWord.clientWidth;
    if(maxW <= 0) return;
    let computed = parseFloat(window.getComputedStyle(elWord).fontSize) || 28;
    while(elWord.scrollWidth > maxW + 1 && computed > 15){
      computed -= 1;
      elWord.style.fontSize = `${computed}px`;
    }
  }

  function renderCard(){
    const card = state.cards[state.index];
    const set = currentSet();

    const elWord = document.getElementById('flashWord');
    const elMeaning = document.getElementById('flashMeaning');
    const elMeaningEn = document.getElementById('flashMeaningEn');
    const elMeaningVi = document.getElementById('flashMeaningVi');
    const elSet = document.getElementById('flashSet');
    const elIndex = document.getElementById('flashIndex');
    const elCard = document.getElementById('flashCard');
    const elPos = document.getElementById('flashPos');
    const elPosBack = document.getElementById('flashPosBack');
    const elCefr = document.getElementById('flashCefr');
    const elTier = document.getElementById('flashTier');
    const elDomain = document.getElementById('flashDomain');

    if(!card){
      if(elWord) elWord.textContent = 'No card';
      if(elMeaning) elMeaning.textContent = 'Không tìm thấy từ phù hợp với bộ lọc.';
      if(elMeaningEn) elMeaningEn.textContent = 'Try choosing another CEFR level or clearing search.';
      if(elMeaningVi) elMeaningVi.textContent = 'Vui lòng chọn bộ từ khác hoặc thay đổi bộ lọc.';
      if(elSet) elSet.textContent = set?.title || 'Vocabulary set';
      if(elIndex) elIndex.textContent = '0/0';
      if(elPos) elPos.textContent = 'word';
      if(elPosBack) elPosBack.textContent = 'word';
      if(elCefr) elCefr.textContent = 'CEFR: --';
      if(elTier) elTier.textContent = set?.difficulty || 'Foundation';
      if(elDomain) elDomain.textContent = 'General';
      if(elCard) elCard.classList.remove('is-flipped');
      status('Không có từ nào trong bộ lọc này.');
      return;
    }

    const wordText = card.wordText || card.word || 'word';
    const cefrText = card.levelCefr ? `CEFR: ${card.levelCefr}` : 'CEFR: Unverified';
    const posText = card.partOfSpeech || 'noun';
    const tierText = card.itTier || set?.difficulty || 'Foundation';
    const domainText = card.itDomain || set?.topicName || 'General';

    if(elWord) elWord.textContent = wordText;
    if(elMeaning) elMeaning.textContent = card.meaningVi || 'Chưa có bản dịch';
    if(elMeaningEn) elMeaningEn.textContent = card.meaningEn || 'Definition is being reviewed';
    if(elMeaningVi) elMeaningVi.textContent = card.meaningVi || 'Tiếng Việt';
    if(elPos) elPos.textContent = posText;
    if(elPosBack) elPosBack.textContent = posText;
    if(elCefr) elCefr.textContent = cefrText;
    if(elTier) elTier.textContent = tierText;
    if(elDomain) elDomain.textContent = domainText;
    if(elSet) elSet.textContent = [set?.title || 'Vocabulary set', (set?.languageCode || 'en').toUpperCase()].join(' · ');
    if(elIndex) elIndex.textContent = `${state.index + 1}/${state.cards.length}`;

    if(elCard) elCard.classList.toggle('is-flipped', state.flipped);
    requestAnimationFrame(fitFlashWord);
    status(`Đang ôn ${state.cards.length} từ${state.total && state.total > state.cards.length ? ` / tổng ${state.total}` : ''}. Click thẻ hoặc nút để lật.`);
  }

  function speakCurrentWord(){
    const card = state.cards[state.index];
    if(!card) return;
    const wordText = card.wordText || card.word;
    if(!wordText) return;

    if('speechSynthesis' in window){
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(wordText);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } else {
      status('Trình duyệt không hỗ trợ Web Speech Synthesis API.');
    }
  }

  async function loadTopics(){
    try {
      state.topics = await window.appApi.getVolcardTopics();
    } catch(e) {
      state.topics = [
        {topicId: 1, name: 'General English'},
        {topicId: 2, name: 'Business'},
        {topicId: 4, name: 'Tech & IT'}
      ];
      status('API topic chưa sẵn, đang dùng dữ liệu offline.');
    }
    if(!state.topics.length){
      state.topics = [{topicId: 1, name: 'General English'}];
    }
    state.topicId = state.topics[0].topicId;
    renderTopics();
    await loadSets(state.topicId);
  }

  async function loadSets(topicId){
    state.topicId = topicId;
    renderTopics();
    try {
      state.sets = await window.appApi.getVolcardSets(topicId);
    } catch(e) {
      state.sets = [
        {vocabularySetId: topicId * 100 + 1, title: 'Starter Vocabulary Pack', totalWords: 10, languageCode: 'en', difficulty: 'Foundation', description: 'Essential starter words'},
        {vocabularySetId: topicId * 100 + 2, title: 'Practitioner IT Pack', totalWords: 15, languageCode: 'en', difficulty: 'Practitioner', description: 'Real-world technical terms'}
      ];
    }
    state.setId = state.sets[0]?.vocabularySetId || null;
    renderSets();
    if(state.setId) {
      await loadCards(state.setId);
    } else {
      state.cards = [];
      renderCard();
    }
  }

  async function loadCards(setId){
    state.setId = setId;
    state.index = 0;
    state.flipped = false;
    state.total = 0;
    renderSets();
    status('Đang tải flashcard...');

    try {
      const page = await window.appApi.getVolcardCards(setId, 0, 100, state.cefrFilter, state.searchQuery);
      state.cards = Array.isArray(page?.cards) ? page.cards : (Array.isArray(page) ? page : []);
      state.total = Number(page?.total || state.cards.length || 0);
    } catch(e) {
      // Offline fallback with rich CEFR & IT properties
      const fallbackPool = [
        {wordText: 'polymorphism', partOfSpeech: 'noun', meaningEn: 'the ability of different classes to respond to the same interface', meaningVi: 'tính đa hình trong lập trình hướng đối tượng', levelCefr: 'C1', itDomain: 'IT_OOP', itTier: 'Specialist', boardEligible: false},
        {wordText: 'continuous integration', partOfSpeech: 'noun', meaningEn: 'the practice of frequently merging developer code changes into a shared repository with automated builds', meaningVi: 'tích hợp liên tục trong quy trình phát triển phần mềm', levelCefr: 'B2', itDomain: 'IT_DEVOPS', itTier: 'Advanced', boardEligible: false},
        {wordText: 'authentication', partOfSpeech: 'noun', meaningEn: 'the process of verifying the identity of a user or system', meaningVi: 'xác thực danh tính người dùng', levelCefr: 'B2', itDomain: 'IT_SECURITY', itTier: 'Practitioner', boardEligible: false},
        {wordText: 'infrastructure', partOfSpeech: 'noun', meaningEn: 'the foundational hardware, network, and cloud resources supporting applications', meaningVi: 'hạ tầng kỹ thuật và máy chủ', levelCefr: 'B2', itDomain: 'IT_CLOUD', itTier: 'Practitioner', boardEligible: false},
        {wordText: 'compile', partOfSpeech: 'verb', meaningEn: 'to convert source code into machine-executable instructions', meaningVi: 'biên dịch mã nguồn', levelCefr: 'B1', itDomain: 'IT_RUNTIMES', itTier: 'Foundation', boardEligible: true},
        {wordText: 'variable', partOfSpeech: 'noun', meaningEn: 'a named storage location in memory holding data', meaningVi: 'biến số lưu trữ', levelCefr: 'B1', itDomain: 'IT_PROG_FUND', itTier: 'Foundation', boardEligible: true},
        {wordText: 'firewall', partOfSpeech: 'noun', meaningEn: 'a network security system monitoring incoming and outgoing traffic', meaningVi: 'tường lửa bảo mật', levelCefr: 'B2', itDomain: 'IT_NETWORKS', itTier: 'Practitioner', boardEligible: true},
        {wordText: 'endpoint', partOfSpeech: 'noun', meaningEn: 'a specific URL where an API receives requests and serves resources', meaningVi: 'điểm cuối API', levelCefr: 'B1', itDomain: 'IT_BACKEND_API', itTier: 'Practitioner', boardEligible: true}
      ];

      // Filter offline fallback if requested
      state.cards = fallbackPool.filter((item) => {
        if(state.cefrFilter && state.cefrFilter !== 'ALL') {
          if(state.cefrFilter === 'UNKNOWN') {
            if(item.levelCefr) return false;
          } else if(item.levelCefr !== state.cefrFilter) {
            return false;
          }
        }
        if(state.searchQuery) {
          const q = state.searchQuery.toLowerCase();
          return item.wordText.toLowerCase().includes(q) || item.meaningVi.toLowerCase().includes(q);
        }
        return true;
      });
      state.total = state.cards.length;
    }

    renderCard();
  }

  function flipOrNext(){
    if(!state.cards.length) return;
    if(!state.flipped){
      state.flipped = true;
    } else {
      state.flipped = false;
      state.index = (state.index + 1) % state.cards.length;
    }
    renderCard();
  }

  function prevCard(){
    if(!state.cards.length) return;
    state.flipped = false;
    state.index = (state.index - 1 + state.cards.length) % state.cards.length;
    renderCard();
  }

  function nextCard(){
    if(!state.cards.length) return;
    state.flipped = false;
    state.index = (state.index + 1) % state.cards.length;
    renderCard();
  }

  function bindCefrPills(){
    const container = document.getElementById('cefrPills');
    if(!container) return;
    container.querySelectorAll('.cefr-pill').forEach((btn) => {
      btn.onclick = () => {
        container.querySelectorAll('.cefr-pill').forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        state.cefrFilter = btn.dataset.level || 'ALL';
        if(state.setId) loadCards(state.setId);
      };
    });
  }

  function bindSearchInput(){
    const input = document.getElementById('volcardSearch');
    if(!input) return;
    input.oninput = (e) => {
      clearTimeout(state.searchDebounceTimer);
      state.searchDebounceTimer = setTimeout(() => {
        state.searchQuery = (e.target.value || '').trim();
        if(state.setId) loadCards(state.setId);
      }, 300);
    };
  }

  document.addEventListener('DOMContentLoaded', () => {
    window.appApi.renderNavUser();
    window.appApi.bindMobileNav();

    bindCefrPills();
    bindSearchInput();

    const flipBtn = document.getElementById('flipBtn');
    if(flipBtn) flipBtn.onclick = () => { state.flipped = !state.flipped; renderCard(); };

    const nextBtn = document.getElementById('nextBtn');
    if(nextBtn) nextBtn.onclick = nextCard;

    const prevBtn = document.getElementById('prevBtn');
    if(prevBtn) prevBtn.onclick = prevCard;

    const ttsBtn = document.getElementById('ttsBtn');
    if(ttsBtn) ttsBtn.onclick = (e) => { e.stopPropagation(); speakCurrentWord(); };

    const flashCard = document.getElementById('flashCard');
    if(flashCard) flashCard.onclick = flipOrNext;

    window.addEventListener('resize', fitFlashWord);

    loadTopics();
  });
})();
