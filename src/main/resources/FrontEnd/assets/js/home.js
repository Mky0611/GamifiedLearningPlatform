(function(){
  const artByCode = {
    LEX_RAID: '/ui/assets/ui/kibyra/icon26.png',
    QUIZ: '/ui/assets/ui/kibyra/icon37.png',
    MEMORY: '/ui/assets/ui/kibyra/icon35.png',
    SPEED_MATH: '/ui/assets/ui/kibyra/icon59.png',
    CODE_PUZZLE: '/ui/assets/ui/kibyra/icon27.png',
    VOLCARD: '/ui/assets/ui/kibyra/icon32.png'
  };

  const hrefByCode = {
    LEX_RAID: '/app/minigame',
    QUIZ: '/app/quiz',
    MEMORY: '/app/memory',
    SPEED_MATH: '/app/speed-math',
    CODE_PUZZLE: '/app/code-puzzle',
    VOLCARD: '/app/volcard'
  };

  function gameCard(game){
    const code = String(game.code || '').toUpperCase();
    const href = hrefByCode[code] || '/app/home';
    const cta = code === 'LEX_RAID' ? 'Vào battle' : 'Mở mode';
    return `
      <article class="soft-card feature-card">
        <div class="feature-card__head">
          <span class="section-kicker">${window.appApi.escapeHtml(code || 'GAME')}</span>
          <span class="feature-card__type">${window.appApi.escapeHtml(game.gameType || 'GAME')}</span>
        </div>
        <div class="feature-card__art">
          <img src="${artByCode[code] || '/ui/assets/imgs/logo.png'}" alt="${window.appApi.escapeHtml(game.name || 'game')}">
        </div>
        <div>
          <h3 style="margin:0 0 8px;font-size:1.4rem">${window.appApi.escapeHtml(game.name || 'Game')}</h3>
          <p class="muted" style="margin:0">${window.appApi.escapeHtml(game.description || 'Mode học tương tác')}</p>
        </div>
        <div class="feature-card__actions">
          <span class="small-muted">${window.appApi.escapeHtml(code)}</span>
          <a class="pixel-btn ${code === 'LEX_RAID' ? 'pixel-btn--primary' : 'pixel-btn--wood'}" href="${href}">${cta}</a>
        </div>
      </article>`;
  }

  function renderGames(games){
    const el = document.getElementById('featuredGamesGrid');
    if(!el) return;
    const defaults = [
      { code: 'QUIZ', name: 'Quiz Challenge', description: 'Trắc nghiệm nhịp nhanh với side panel rõ ràng.', gameType: 'QUIZ' },
      { code: 'MEMORY', name: 'Memory Match', description: 'Lật card và ghép cặp theo board paper tile.', gameType: 'MEMORY' },
      { code: 'SPEED_MATH', name: 'Speed Math', description: 'Giải nhanh để giữ streak và nhịp học.', gameType: 'MATH' },
      { code: 'CODE_PUZZLE', name: 'Code Puzzle', description: 'Đoán output và rèn logic lập trình.', gameType: 'PUZZLE' },
      { code: 'LEX_RAID', name: 'Lex Raid - Boss Hunt', description: 'Nối chữ để đánh boss và đoán core word.', gameType: 'VOCAB_BATTLE' },
      { code: 'VOLCARD', name: 'Volcard', description: 'Flashcard theo topic, ưu tiên EN / VI / JA.', gameType: 'VOCAB_SET' }
    ];
    const use = (games && games.length) ? games : defaults;
    el.innerHTML = use.map(gameCard).join('');
  }

  function renderLeaderboard(users){
    const el = document.getElementById('leaderboardList');
    if(!el) return;
    const list = (users && users.length) ? users : [
      { displayName: 'Lex Captain', username: 'captain', levelCurrent: 14, xpTotal: 12400 },
      { displayName: 'Rune Learner', username: 'rune', levelCurrent: 12, xpTotal: 10200 },
      { displayName: 'Miko', username: 'miko', levelCurrent: 10, xpTotal: 9100 }
    ];
    el.innerHTML = list.map((user, index)=>`
      <div class="leaderboard-item">
        <div class="leaderboard-rank">#${index + 1}</div>
        <div>
          <strong>${window.appApi.escapeHtml(user.displayName || user.username)}</strong>
          <div class="small-muted">@${window.appApi.escapeHtml(user.username || 'player')}</div>
        </div>
        <div style="text-align:right">
          <span class="level-pill">Lv ${Number(user.levelCurrent || 1)}</span>
          <div class="small-muted" style="margin-top:6px">${Number(user.xpTotal || 0).toLocaleString('vi-VN')} XP</div>
        </div>
      </div>`).join('');
  }

  function renderRecommendedStage(stage){
    const card = document.getElementById('recommendedStageCard');
    const grid = document.getElementById('stagePreviewGrid');
    if(!card || !grid) return;
    const data = stage || {
      stageId: 1,
      chapterNo: 1,
      name: 'Whispering Rain Gate',
      description: 'Cửa ải Mưa Thầm — nơi quái vật Crabby canh giữ kho báu cổ. Hãy dùng từ vựng để phá khiên chắn và giành chiến thắng!',
      boss: { name: 'Crabby (Cua Cướp Biển)' },
      boardRows: 5,
      boardCols: 5,
      timePerRoundSec: 20,
      turnLimit: 5,
      difficulty: 'NORMAL'
    };
    const href = `/app/minigame?stageId=${data.stageId || 1}`;
    card.innerHTML = `
      <div class="hero-panel__content">
        <div class="hero-stage-top">
          <div>
            <span class="section-kicker"><i class="bi bi-controller"></i> Ải Đề Xuất Hiện Tại</span>
            <div class="hero-stage-name">${window.appApi.escapeHtml(data.name)}</div>
            <p style="color:rgba(255,255,255,.82);margin:4px 0 0;font-size:0.9rem">${window.appApi.escapeHtml(data.description || 'Tiến vào trận chiến săn boss ngay')}</p>
          </div>
          <img src="/ui/assets/ui/avatars/portrait-boss-crabby.png" alt="stage boss avatar" style="width:56px;height:56px;border:2px solid #d49b29;background:#382518;object-fit:cover;image-rendering:pixelated">
        </div>
        <div class="hero-stage-grid">
          <div class="hero-stage-stat"><span>Quái Vật</span><strong>${window.appApi.escapeHtml(data.boss?.name || 'Boss')}</strong></div>
          <div class="hero-stage-stat"><span>Bàn Cờ</span><strong>${data.boardRows || 5} x ${data.boardCols || 5}</strong></div>
          <div class="hero-stage-stat"><span>Thời Gian</span><strong>${data.timePerRoundSec || 20}s / lượt</strong></div>
        </div>
        <div class="hero-actions-row">
          <a class="pixel-btn pixel-btn--primary" href="${href}"><i class="bi bi-sword"></i> Chiến Đấu Ngay</a>
          <a class="pixel-btn pixel-btn--wood" href="/app/volcard"><i class="bi bi-book"></i> Ôn Từ Vựng</a>
        </div>
      </div>`;

    grid.innerHTML = `
      <article class="soft-card stage-preview-card">
        <span class="badge-soft"><i class="bi bi-lightning-charge-fill"></i> Cơ Chế Chiến Đấu</span>
        <h3 style="margin:0">Ghép Từ → Mở Manh Mối → Hạ Gục Boss</h3>
        <p class="muted" style="margin:0">Bấm chọn các ô chữ trên bảng ma trận để ghép thành từ tiếng Anh chuẩn và tung đòn tấn công.</p>
        <div class="stage-preview-card__footer">
          <div><strong>${data.turnLimit || 5} lượt đấu</strong><div class="small-muted">Độ khó: ${window.appApi.escapeHtml(data.difficulty || 'NORMAL')}</div></div>
          <a class="pixel-btn pixel-btn--primary" href="${href}">Vào Ải</a>
        </div>
      </article>
      <article class="soft-card stage-preview-card">
        <span class="badge-soft"><i class="bi bi-compass"></i> Các Đấu Trường Khác</span>
        <h3 style="margin:0">Quiz, Memory, Speed Math, Code Puzzle</h3>
        <p class="muted" style="margin:0">Đa dạng hóa lộ trình rèn luyện tiếng Anh và tư duy logic qua các minigame tương tác hấp dẫn.</p>
        <div class="stage-preview-card__footer">
          <div><strong>6 Chế Độ</strong><div class="small-muted">Cùng ngôn ngữ Pixel RPG</div></div>
          <a class="pixel-btn pixel-btn--wood" href="/app/volcard">Khám Phá</a>
        </div>
      </article>`;
  }

  async function init(){
    window.appApi.renderNavUser();
    window.appApi.bindMobileNav();
    const auth = window.appApi.getAuth();
    if(auth){
      document.getElementById('heroGreeting').textContent = `Chào ${auth.displayName || auth.username}, hôm nay học tiếp nào`;
      if(auth.userId){
        window.appApi.getAccountProfile(auth.userId).then(profile => {
          if(profile){
            auth.levelCurrent = profile.levelCurrent;
            auth.xpTotal = profile.xpTotal;
            auth.coins = profile.coins;
            auth.streakDays = profile.streakDays;
            window.appApi.saveAuth(auth);
            window.appApi.renderNavUser();
          }
        }).catch(()=>{});
      }
    }
    try{
      const overview = await window.appApi.getHomeOverview();
      renderGames(overview?.featuredGames || []);
      renderLeaderboard(overview?.leaderboardPreview || []);
      renderRecommendedStage(overview?.recommendedStage || null);
    }catch(err){
      renderGames([]);
      renderLeaderboard([]);
      renderRecommendedStage(null);
      document.getElementById('homeStatus').innerHTML = '<div class="inline-message"><i class="bi bi-eye"></i> <strong>Vercel Preview Mode:</strong> Đang hiển thị giao diện và dữ liệu demo tĩnh (không kết nối SQL Server).</div>';
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
