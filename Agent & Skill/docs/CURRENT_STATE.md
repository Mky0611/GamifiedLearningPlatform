# CURRENT PROJECT STATE — LEX RAID PIXEL RPG

**Thời điểm cập nhật:** 2026-11-25  
**Chủ sở hữu GitHub:** `Mky0611`  
**Repository:** `https://github.com/Mky0611/GamifiedLearningPlatform.git`  
**Nhánh phát triển:** `feature/p4b3-rpg-combat-learning` (branched from `2491615`)  
**Trạng thái hiện tại:** **PHASE P4-B.3 MILESTONES A–G VERIFIED (`23/23` BACKEND UNIT PASS & `0` CHROMIUM FAILURES) — READY FOR VERCEL PREVIEW DEPLOY**

---

## 1. TỔNG QUAN HỆ THỐNG (GIỮ NGUYÊN KHÔNG PHÁ VỠ)
- **Backend:** Java 21 LTS, Spring Boot 4.2.0, Spring Data JPA, Spring Security; giữ nguyên bảng/cột SQL Server `script_GPL_v2.sql` (chỉ mở rộng `LexRaidServiceImpl`, `EnglishLexiconService`, `LexRaidBalanceConfig`, `BoardSnapshotRepository` tương thích nullable `word_submit_events.vocabulary_word_id`).
- **Database:** Microsoft SQL Server (`script_GPL_v2.sql` — không thay đổi schema; các mở rộng 5-Wave/Spell DDL tương lai chỉ nằm ở `docs/P4B3_BACKEND_DRAFT.md`).
- **Frontend:** Vanilla HTML5, CSS3 Asset-Driven Fantasy Pixel Design System + Cozy Daylight/Moonlight Theme (`theme.css` / `theme-system.js`), ES6+ JS, Phaser 3.90.0 + Canvas 2D Fallback + Shared Animated `WorldEnvironment`.

---

## 2. TỔNG HỢP THÀNH TỰU ĐÃ XÁC MINH Ở P4-B.3 (`BACKEND UNIT PASS` + `STATIC PASS` + `BROWSER PASS`)
1. **Đấu trường mở rộng & Nhân vật/Boss lớn rõ (`BROWSER PASS`):**
   - Canvas `960x360`, `.battle-stage` desktop `727x273px`, Hero scale `~1.56x` (`heroDisplayH: 300px`), Boss scale tăng theo độ hiếm (`NORMAL: 1.0x`, `ELITE: 1.14x`, `GUARDIAN: 1.24x`, `CHAPTER_BOSS: 1.36x`), tile bàn cờ `Be Vietnam Pro` nét cao, fit toàn bộ **9/9 viewports (`320x568`..`1920x1080`)**.
2. **Global English Lexicon (`76,993` từ `en-wl/wordlist/v2`) & Topic Bonus `+30%` (`BACKEND UNIT PASS` + `BROWSER PASS`):**
   - Mọi từ tiếng Anh 3–12 ký tự hợp lệ đều tấn công được (`BaseDamage = len*5 + combo*2`, `Mana = clamp(floor(len/2), 1, 6)`), từ Chủ đề cộng `+30%` DMG và `+1 MP` (trần 6 MP), không tạo dữ liệu giả cho `UserWordMastery`.
3. **Learning Loop & Hỗ trợ học từ (`BROWSER PASS` + `UNIT PASS` 20/20 seeds):**
   - Toast phản hồi kèm TTS phát âm (`speechSynthesis`), nút `Gợi ý nghĩa` (không làm lộ đáp án), `Mở 1 chữ`, `Đổi bảng` khả giải, `glp.wordJournal` và Sổ Tay Từ Vựng cuối trận (`/app/volcard`).
4. **Độ khó theo Chapter, 5-Wave Encounters & Spells (`BROWSER PASS`):**
   - Campaign (`Ch1 45s -> Ch2 38s -> Ch3 32s -> Ch4+ 28s`) và Practice Mode (`∞`, không áp lực), `5` đợt quái theo độ hiếm & cơ chế riêng (`encounter-registry.js`), bổ sung `Fire Blade` (Burn), `Frost Seal` (Frost +4s), `Thunder Strike` (2x Shield Break + Stun) với bộ lọc deck $\le 6$ kỹ năng.
5. **Cozy Daylight & Moonlight Themes trên 8 trang + Biome Combat Theme (`BROWSER PASS`):**
   - Nút Sun/Moon đồng bộ lưu `glp.theme`, tự khôi phục khi rời trận đấu Boss, tương phản đọc chuẩn WCAG AA.
6. **Untested Boundaries (`NOT TESTED`):**
   - Tương tác Spring Boot + Microsoft SQL Server trực tiếp (`MainTests.contextLoads` lỗi kết nối DB cục bộ vì SQL Server chưa chạy — `NOT TESTED`).
