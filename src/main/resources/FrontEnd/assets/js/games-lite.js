(function(){
  function initShell(){
    if(window.appApi){
      window.appApi.renderNavUser();
      window.appApi.bindMobileNav();
    }
  }

  function setText(id, value){
    const el=document.getElementById(id);
    if(el) el.textContent=String(value);
  }

  function setHtml(id, value){
    const el=document.getElementById(id);
    if(el) el.innerHTML=value;
  }

  function escapeHtml(input){
    if(window.appApi && window.appApi.escapeHtml) return window.appApi.escapeHtml(input);
    return String(input ?? '').replace(/[&<>"']/g,(ch)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch]));
  }

  function normalizeConfig(arg, fallback){
    if(typeof arg === 'string') return { ...fallback, mountId: arg };
    return { ...fallback, ...(arg || {}) };
  }

  function mountQuiz(configOrMountId, scoreId, progressId){
    const config = typeof configOrMountId === 'string'
      ? { mountId: configOrMountId, scoreId, progressId }
      : normalizeConfig(configOrMountId, { mountId: 'quizMount', scoreId: 'quizScore', progressId: 'quizProgress', streakId: 'quizStreak', noteId: 'quizNote' });

    const fallbackQuestions = [
      { question: 'What does "Polymorphism" mean in Object-Oriented Programming?', choices: ['Data hiding inside private fields', 'Multiple forms sharing a common interface', 'Single-table inheritance only', 'Manual memory deallocation'], correct: 1, explain: 'Polymorphism (Tính đa hình) cho phép cùng một phương thức hoạt động linh hoạt trên các kiểu đối tượng khác nhau.' },
      { question: 'Which process verifies "Authentication" before granting access?', choices: ['Encrypting backups offline', 'Verifying who a user is (identity check)', 'Compressing static CSS files', 'Restarting SQL Server'], correct: 1, explain: 'Authentication là xác thực danh tính người dùng trước bước Authorization (phân quyền).' },
      { question: 'What is the primary goal of "Continuous Integration" (CI)?', choices: ['Merging code frequently with automated builds & tests', 'Deploying without automated checks', 'Replacing SQL Server with JSON', 'Editing HTML manually on prod'], correct: 0, explain: 'CI giúp tích hợp mã thường xuyên kèm kiểm thử tự động để phát hiện lỗi sớm.' },
      { question: 'Which term describes an API request safe to retry without duplicate rewards?', choices: ['Race condition', 'Idempotent', 'Deadlock', 'Overflow'], correct: 1, explain: 'Idempotent (lũy đẳng) đảm bảo gọi lại nhiều lần không phát sinh phần thưởng hay giao dịch trùng lặp.' },
      { question: 'In Lex Raid, what happens when you solve the Core Word?', choices: ['Changes account password', 'Triggers critical strike to shatter the boss phase', 'Deletes your leaderboard rank', 'Turns off pixel art mode'], correct: 1, explain: 'Giải đúng Từ Khóa Cốt Lõi (Core Word) tung đòn chí mạng vào Boss.' }
    ];

    let questions = [...fallbackQuestions];
    let backendSessionId = null;
    let backendEnabled = false;
    let index = 0;
    let score = 0;
    let streak = 0;
    let locked = false;

    const mount = document.getElementById(config.mountId);
    if(!mount) return;

    function totalCount(){ return questions.length || 1; }
    function currentQuestion(){ return questions[index % totalCount()]; }

    function syncMeta(){
      setText(config.scoreId, score);
      setText(config.progressId, `${Math.min(index + 1, totalCount())} / ${totalCount()}`);
      if(config.streakId) setText(config.streakId, `${streak}`);
    }

    function setNote(value){ if(config.noteId) setText(config.noteId, value); }

    function render(){
      const item = currentQuestion();
      syncMeta();
      setNote(item.explain || item.questionText || 'Giải thích của câu hỏi hiện tại sẽ hiện ở đây.');
      const choices = item.choices || item.options || [];
      mount.innerHTML = `
        <div class="quiz-question-card">
          <div class="module-pill">${backendEnabled ? 'Lượt thi trực tuyến' : 'Bộ đề chuẩn IT'} · Câu ${index + 1}</div>
          <h3>${escapeHtml(item.question || item.questionText || 'Question')}</h3>
          <p class="small-muted">${backendEnabled ? 'Câu hỏi được tải từ máy chủ. Nếu gặp gián đoạn mạng, hệ thống vẫn lưu nhịp làm bài.' : 'Chọn đáp án đúng nhất. Sau mỗi câu, phần giải thích chi tiết sẽ hiển thị ở bảng bên cạnh.'}</p>
          <div class="choice-list">
            ${choices.map((choice, choiceIndex)=>`<button class="choice-btn" data-choice="${choiceIndex}" data-answer-id="${choice.answerId ?? ''}" type="button"><span>${choiceIndex + 1}.</span><strong>${escapeHtml(choice.answerText || choice)}</strong></button>`).join('')}
          </div>
        </div>`;
      mount.querySelectorAll('.choice-btn').forEach((button)=>{
        button.addEventListener('click', async ()=>{
          if(locked) return;
          locked = true;
          const picked = Number(button.dataset.choice);
          const buttons = Array.from(mount.querySelectorAll('.choice-btn'));
          buttons.forEach((btn)=>btn.disabled = true);

          if(backendEnabled && backendSessionId && item.questionId){
            try{
              const result = await window.appApi.submitQuizAnswer(backendSessionId, {
                questionId: item.questionId,
                selectedAnswerId: Number(button.dataset.answerId || 0) || null,
                responseTimeMs: 0
              });
              const correctIndex = choices.findIndex((choice)=>Number(choice.answerId) === Number(result.correctAnswerId));
              if(correctIndex >= 0) buttons[correctIndex]?.classList.add('is-correct');
              if(result.correct){
                score = Number(result.updatedScore || (score + Number(result.pointsEarned || 0)));
                streak += 1;
                setNote(`Đúng rồi. +${Number(result.pointsEarned || 0)} điểm.`);
              }else{
                button.classList.add('is-wrong');
                score = Number(result.updatedScore || score);
                streak = 0;
                setNote('Sai rồi. Backend đã trả về đáp án đúng cho câu này.');
              }
              syncMeta();
              if(result.sessionStatus === 'COMPLETED'){
                const auth = window.appApi.getAuth();
                if(auth && result.newLevel){
                  auth.levelCurrent = result.newLevel;
                  auth.xpTotal = result.newXpTotal;
                  auth.coins = result.newCoins;
                  window.appApi.saveAuth(auth);
                  window.appApi.renderNavUser();
                }
                const levelUpMsg = result.levelUpOccurred ? `<div style="margin:8px 0;padding:8px 12px;background:linear-gradient(90deg,#f59e0b,#fbbf24);color:#451a03;border-radius:10px;font-weight:800">⭐ LEVEL UP! Lên Level ${result.newLevel} ⭐</div>` : '';
                window.setTimeout(()=>{
                  mount.innerHTML = `<div class="quiz-question-card"><div class="module-pill">Quiz completed</div><h3>Hoàn thành quiz session</h3>${levelUpMsg}<p class="small-muted">Điểm cuối: ${score} · EXP: +${result.xpEarned || 0} XP · Gold: +${result.coinsEarned || 0} Gold.</p><div style="margin-top:14px;display:flex;gap:10px;justify-content:center"><a class="btn-soft btn-primary-soft" href="/app/quiz">Lượt mới</a><a class="btn-soft btn-secondary-soft" href="/app/account">Tài khoản</a><a class="btn-soft btn-ghost-soft" href="/app/home">Về Home</a></div></div>`;
                }, 900);
                return;
              }
            }catch(error){
              backendEnabled = false;
              const fallbackCorrect = Number(item.correct);
              buttons[fallbackCorrect]?.classList.add('is-correct');
              if(picked === fallbackCorrect){
                score += 20; streak += 1; setNote(`Đúng rồi. ${item.explain}`);
              }else{
                button.classList.add('is-wrong'); streak = 0; setNote(`Sai rồi. ${item.explain}`);
              }
              syncMeta();
            }
          }else{
            const fallbackCorrect = Number(item.correct);
            buttons[fallbackCorrect]?.classList.add('is-correct');
            if(picked === fallbackCorrect){
              score += 20;
              streak += 1;
              setNote(`Đúng rồi. ${item.explain}`);
            }else{
              button.classList.add('is-wrong');
              streak = 0;
              setNote(`Sai rồi. ${item.explain}`);
            }
            syncMeta();
          }

          window.setTimeout(()=>{
            index = (index + 1) % totalCount();
            locked = false;
            render();
          }, 900);
        });
      });
    }

    async function bootstrapBackend(){
      const userId = window.appApi?.getCurrentUserId?.();
      if(!userId) return render();
      try{
        const sets = await window.appApi.getQuizSets();
        if(!Array.isArray(sets) || !sets.length) return render();
        const session = await window.appApi.startQuizSession({ userId, questionSetId: sets[0].questionSetId });
        if(Array.isArray(session?.questions) && session.questions.length){
          backendEnabled = true;
          backendSessionId = session.gameSessionId;
          questions = session.questions.map((q)=>(
            {
              questionId: q.questionId,
              questionText: q.questionText,
              question: q.questionText,
              explain: q.difficulty ? `Difficulty: ${q.difficulty}. Điểm base: ${q.pointsBase || 0}.` : 'Câu hỏi đang lấy từ backend.',
              options: q.options || []
            }
          ));
        }
      }catch(error){
        backendEnabled = false;
      }
      render();
    }

    bootstrapBackend();
  }

  function mountMemory(configOrMountId){
    const config = typeof configOrMountId === 'string'
      ? { mountId: configOrMountId }
      : normalizeConfig(configOrMountId, { mountId: 'memoryMount', movesId: 'memoryMoves', pairsId: 'memoryPairs', noteId: 'memoryNote' });

    const words = ['RAID','CORE','CLUE','WORD','BOSS','TURN'];
    const deck = [...words, ...words]
      .map((value, idx)=>({ key: `${value}-${idx}`, value }))
      .sort(()=>Math.random() - 0.5);

    const mount = document.getElementById(config.mountId);
    if(!mount) return;

    let opened = [];
    const solved = new Set();
    let moves = 0;

    function syncMeta(){
      if(config.movesId) setText(config.movesId, moves);
      if(config.pairsId) setText(config.pairsId, `${solved.size / 2} / ${words.length}`);
      if(config.noteId) setText(config.noteId, solved.size === deck.length ? 'Hoàn thành board memory. Bạn có thể refresh để chơi deck khác.' : 'Lật 2 ô để tìm cặp giống nhau. Khi đúng, ô sẽ mờ đi như đã clear.');
    }

    function render(){
      syncMeta();
      mount.innerHTML = `<div class="memory-grid">${deck.map((card, index)=>{
        const active = opened.includes(index) || solved.has(index);
        return `<button class="memory-tile ${solved.has(index) ? 'is-done' : ''}" data-index="${index}" type="button">${active ? escapeHtml(card.value) : '?'}</button>`;
      }).join('')}</div>`;
      mount.querySelectorAll('.memory-tile').forEach((button)=>{
        button.addEventListener('click',()=>{
          const index = Number(button.dataset.index);
          if(solved.has(index) || opened.includes(index) || opened.length === 2) return;
          opened.push(index);
          render();
          if(opened.length === 2){
            moves += 1;
            const [first, second] = opened;
            const matched = deck[first].value === deck[second].value;
            if(matched){
              solved.add(first);
              solved.add(second);
              if(config.noteId) setText(config.noteId, `Matched: ${deck[first].value}. Giữ nhịp tốt đấy.`);
            }else if(config.noteId){
              setText(config.noteId, `Chưa khớp: ${deck[first].value} và ${deck[second].value}. Hãy nhớ vị trí của chúng.`);
            }
            syncMeta();
            window.setTimeout(()=>{
              opened = [];
              render();
            }, matched ? 420 : 720);
          }
        });
      });
    }

    render();
  }

  function mountMath(configOrMountId){
    const config = typeof configOrMountId === 'string'
      ? { mountId: configOrMountId }
      : normalizeConfig(configOrMountId, { mountId: 'mathMount', scoreId: 'mathScore', timerId: 'mathTimer', streakId: 'mathStreak', noteId: 'mathNote' });

    const mount = document.getElementById(config.mountId);
    if(!mount) return;

    let score = 0;
    let streak = 0;
    let left = 45;
    let a = 0;
    let b = 0;
    let operator = '+';
    let timer = null;

    function nextProblem(focusInput = false){
      a = Math.ceil(Math.random() * 20);
      b = Math.ceil(Math.random() * 20);
      operator = ['+','-','×'][Math.floor(Math.random() * 3)];
      if(operator === '-' && b > a){ [a, b] = [b, a]; }
      render(focusInput);
    }

    function answer(){
      if(operator === '+') return a + b;
      if(operator === '-') return a - b;
      return a * b;
    }

    function syncMeta(){
      if(config.scoreId) setText(config.scoreId, score);
      if(config.timerId) setText(config.timerId, `${left}s`);
      if(config.streakId) setText(config.streakId, streak);
    }

    function render(focusInput = false){
      syncMeta();
      mount.innerHTML = `
        <div class="math-panel">
          <div class="module-pill">Speed round</div>
          <div class="math-expression">${a} ${operator} ${b} = ?</div>
          <div class="math-toolbar">
            <input class="math-input" id="mathAnswer" inputmode="numeric" autocomplete="off" placeholder="Nhập đáp án">
            <button class="btn-soft btn-primary-soft" id="mathSubmit" type="button">Submit</button>
          </div>
          <div class="small-muted">Trả lời nhanh để giữ streak. Sai thì streak về 0 nhưng bạn vẫn được câu tiếp theo.</div>
        </div>`;
      const input = document.getElementById('mathAnswer');
      const submit = document.getElementById('mathSubmit');
      const onSubmit = ()=>{
        const value = Number(input.value);
        if(value === answer()){
          score += 15;
          streak += 1;
          if(config.noteId) setText(config.noteId, `Chính xác. ${a} ${operator} ${b} = ${answer()}.`);
        }else{
          streak = 0;
          if(config.noteId) setText(config.noteId, `Sai rồi. Đáp án đúng là ${answer()}.`);
        }
        syncMeta();
        nextProblem(true);
      };
      submit.addEventListener('click', onSubmit);
      input.addEventListener('keydown',(event)=>{
        if(event.key === 'Enter') onSubmit();
      });
      if(focusInput) input.focus({ preventScroll: true });
    }

    timer = window.setInterval(()=>{
      left -= 1;
      syncMeta();
      if(left <= 0){
        window.clearInterval(timer);
        if(config.noteId) setText(config.noteId, `Hết giờ. Tổng điểm hiện tại là ${score}. Refresh để chơi lại.`);
        mount.innerHTML = `
          <div class="math-panel math-panel--done">
            <div class="module-pill">Time up</div>
            <div class="math-expression">${score}</div>
            <p class="small-muted">Điểm cuối cùng. Bạn có thể refresh trang để mở lượt mới.</p>
          </div>`;
      }
    }, 1000);

    nextProblem(false);
  }

  function mountCodePuzzle(configOrMountId){
    const config = typeof configOrMountId === 'string'
      ? { mountId: configOrMountId }
      : normalizeConfig(configOrMountId, { mountId: 'codePuzzleMount', scoreId: 'codePuzzleScore', progressId: 'codePuzzleProgress', noteId: 'codePuzzleNote' });

    const mount = document.getElementById(config.mountId);
    if(!mount) return;

    const puzzles = [
      {
        title: 'Loop output',
        code: `let sum = 0;\nfor (let i = 1; i <= 3; i++) {\n  sum += i;\n}\nconsole.log(sum);`,
        options: ['3', '6', '9', 'undefined'],
        correct: 1,
        explain: '1 + 2 + 3 = 6, nên output cuối là 6.'
      },
      {
        title: 'Condition check',
        code: `const score = 72;\nif (score >= 80) {\n  console.log('A');\n} else if (score >= 60) {\n  console.log('B');\n} else {\n  console.log('C');\n}`,
        options: ['A', 'B', 'C', 'Không in gì'],
        correct: 1,
        explain: '72 không đạt 80 nhưng >= 60 nên nhánh B được chạy.'
      },
      {
        title: 'Array index',
        code: `const words = ['raid', 'core', 'boss'];\nconsole.log(words[1]);`,
        options: ['raid', 'core', 'boss', 'undefined'],
        correct: 1,
        explain: 'Mảng JS bắt đầu từ index 0, nên words[1] là core.'
      }
    ];

    let score = 0;
    let index = 0;
    let locked = false;

    function syncMeta(){
      if(config.scoreId) setText(config.scoreId, score);
      if(config.progressId) setText(config.progressId, `${Math.min(index + 1, puzzles.length)} / ${puzzles.length}`);
    }

    function render(){
      const puzzle = puzzles[index % puzzles.length];
      syncMeta();
      setText(config.noteId, puzzle.explain);
      mount.innerHTML = `
        <div class="code-puzzle-card">
          <div class="module-pill">${escapeHtml(puzzle.title)}</div>
          <pre class="code-block">${escapeHtml(puzzle.code)}</pre>
          <div class="choice-list choice-list--compact">
            ${puzzle.options.map((option, optionIndex)=>`<button class="choice-btn" data-choice="${optionIndex}" type="button"><strong>${escapeHtml(option)}</strong></button>`).join('')}
          </div>
        </div>`;
      mount.querySelectorAll('.choice-btn').forEach((button)=>{
        button.addEventListener('click',()=>{
          if(locked) return;
          locked = true;
          const picked = Number(button.dataset.choice);
          const buttons = Array.from(mount.querySelectorAll('.choice-btn'));
          buttons.forEach((btn)=>btn.disabled = true);
          buttons[puzzle.correct].classList.add('is-correct');
          if(picked === puzzle.correct){
            score += 25;
            setText(config.noteId, `Đúng. ${puzzle.explain}`);
          }else{
            button.classList.add('is-wrong');
            setText(config.noteId, `Chưa đúng. ${puzzle.explain}`);
          }
          syncMeta();
          window.setTimeout(()=>{
            index = (index + 1) % puzzles.length;
            locked = false;
            render();
          }, 900);
        });
      });
    }

    render();
  }

  window.gamesLite = { initShell, mountQuiz, mountMemory, mountMath, mountCodePuzzle };
})();
