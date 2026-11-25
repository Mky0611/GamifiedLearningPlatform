# LEX RAID — P4-B.3 QA REPORT

**Nhánh:** `feature/p4b3-rpg-combat-learning`  
**Ngày kiểm định:** 2026-11-25  

---

## 1. BẢNG PHÂN LOẠI BẰNG CHỨNG KIỂM THỬ

| Hạng mục kiểm thử | Công cụ / Lệnh | Mức chứng nhận | Kết quả quan sát thực tế |
| :--- | :--- | :---: | :--- |
| Backend Service Unit Tests (5 test suites Mockito) | `mvn.cmd -o -Dtest=AccountProfileServiceTest,LexRaidGlobalLexiconTest,LexRaidProgressionTest,QuizProgressionTest,RpgProgressionServiceTest test` | **BACKEND UNIT PASS** | **23/23 PASS**, `0` failures, `0` errors (`LexRaidGlobalLexiconTest` 3/3 + `LexRaidProgressionTest` 4/4 + `AccountProfileServiceTest` 2/2 + `QuizProgressionTest` 5/5 + `RpgProgressionServiceTest` 9/9) |
| Full Spring Boot Context + SQL Server (`MainTests`) | `mvn.cmd -o test` | **NOT TESTED (DB Offline)** | `MainTests.contextLoads` lỗi kết nối SQL Server (`Login failed for user 'sa'`) do không bật SQL Server cục bộ |
| Static Asset & Alignment Verification | `python src/main/resources/tools/test_p4b_verification.py` | **STATIC PASS** | **43/43 STATIC PASS**, Hero/Boss foot alignment sai số $\le 0.0125\text{px}$ |
| Case Sensitivity & Asset Index Check | `python src/main/resources/tools/check_case_sensitivity.py` | **STATIC PASS** | `472` files indexed, `130` Phaser URLs, `0` missing, `0` case mismatches |
| Solvability 20-Seed Check | `LexRaidBalance.generateSolvableBoard` (`node -e`) | **UNIT PASS** | **20/20 seeds** tạo được Core Word + $\ge 8$ từ tiếng Anh hợp lệ |
| Chromium Headless Full Acceptance Suite | `node "Agent & Skill/scripts/chromium_p4b2_acceptance.js"` | **BROWSER PASS** | **Total failures: 0** (`9` pages × desktop/mobile + `9/9` battle viewports + P4-B.2 + P4-B.3 + Canvas 2D fallback) |
| Live Vercel Preview Probe | Xem bước Milestone H | *Chạy ở Milestone H* | Sẽ cập nhật sau khi `vercel deploy` Preview URL |

---

## 2. CHI TIẾT KẾT QUẢ BROWSER QA (`chromium_p4b2_acceptance.js`)

1. **Arena & Sprite Scale (Milestone A):**
   - Arena desktop `1366x768`: `.battle-stage` đạt `727 x 273px`, Phaser canvas `960x360`, `groundY = 302`.
   - `heroDisplayH = 300px` (`warrior`, scale `1.56`), `bossDisplayH = 114px` (Fierce Normal, scale `3.8`, nhân hệ số Rarity `1.0x..1.36x`).
   - Toàn bộ **9/9 battle viewports (`320x568` `558/568` → `1920x1080` `769/1080`)**: `fit=true`, `tap=true`, `clear=true`, `attack=true`, `skills=6`.
2. **Global English Lexicon & Learning Loop (Milestones B–C):**
   - Bắn từ ngoài topic (`FIRE` — Global Lexicon `en-wl/wordlist/v2` `76,993` từ): gây `24 DMG`, `+2 MP`, hiện `#wordFeedbackToast` (`GLOBAL LEXICON`), nút `#wordTtsBtn`, thông báo trung thực `"Từ tiếng Anh hợp lệ (chưa có thẻ nghĩa đầy đủ trong DB)"` (không bịa nghĩa/CEFR), Mana giới hạn tối đa `6`.
   - Hint Toolbar: `#hintMeaningBtn` giữ nguyên chiều dài & chữ cái đầu qua `#clueText` kể cả khi bấm tiếp `#hintRevealBtn` (`charges: 3 -> 2`, `revealed: 2`).
   - `#finishReviewPanel` hiển thị Sổ Tay Từ Vựng trận đấu & link `/app/volcard`.
3. **Difficulty Progression, 5-Wave & Spells (Milestones D–E):**
   - `Practice Mode`: Timer `∞`, `freeHints = 99`.
   - `Campaign Mode`: Chapter 1 (`45s`, `3` gợi ý) → Chapter 2 (`38s`, `2` gợi ý, `traitsUnlocked: true`), lộ trình 5 đợt (`NORMAL -> NORMAL -> ELITE -> GUARDIAN -> CHAPTER_BOSS`), chuyển sang Đợt 2 (`waveIndex = 2`) sạch sẽ.
   - Chuyển deck sang `Phép (3)`: tung `Fire Blade` + `Frost Seal` kích hoạt badge `Thiêu đốt (2)` và `Băng giá (2)`, VFX pool `12` quay về `activeVfxCount = 0`, `fsmState = IDLE`.
4. **Cozy Daylight & Moonlight Themes (Milestone F):**
   - `/app/home` mặc định `daylight` → toggle `#themeToggleBtn` → `moonlight` → chuyển sang `/app/volcard` giữ `moonlight` (`overflow=false`) → vào `/app/minigame` giữ `combat` (`localStorage['glp.theme'] === 'moonlight'`) → thoát sang `/app/quiz` khôi phục `moonlight`.
5. **Hiệu năng & Bộ nhớ (`browser_qa_report.json`):**
   - `avgFrameMs = 16.67ms`, `p95FrameMs = 16.7ms`, `maxFrameMs = 16.8ms`, `longTaskCount = 0`.
   - `JSHeapUsedSize`: `16,433,012` bytes trước combat → `21,954,756` bytes sau combat chuỗi đòn VFX; `0` lỗi console/page, `0` HTTP 404 tĩnh.
