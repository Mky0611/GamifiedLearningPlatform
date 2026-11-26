# CURRENT PROJECT STATE — LEX RAID PIXEL RPG

**Thời điểm cập nhật:** 2026-11-26  
**Chủ sở hữu GitHub:** `Mky0611`  
**Repository:** `https://github.com/Mky0611/GamifiedLearningPlatform.git`  
**Nhánh phát hành:** `feature/p4b3-rpg-combat-learning` (verified code SHA `870faac`)  
**Trạng thái hiện tại:** **PHASE P4-B.3 POST-RELEASE VERIFIED (`26/26` BACKEND UNIT PASS, `0` SCOPED CONTRAST ISSUES, `0` CHROMIUM FAILURES) — READY FOR PRODUCTION RELEASE**

---

## 1. TỔNG QUAN HỆ THỐNG (GIỮ NGUYÊN KHÔNG PHÁ VỠ)
- **Backend:** Java 21 LTS, Spring Boot 4.2.0, Spring Data JPA, Spring Security; giữ nguyên bảng/cột SQL Server `script_GPL_v2.sql` (cùng sửa lỗi server-side board path, khóa session đã kết thúc, lưu WordSubmitEvent/CoreWordGuessEvent trước finalize trên `LexRaidServiceImpl`).
- **Database:** Microsoft SQL Server (`script_GPL_v2.sql` — không thay đổi schema; các mở rộng tương lai nằm tại `docs/P4B3_BACKEND_DRAFT.md`).
- **Frontend:** Vanilla HTML5, CSS3 Fantasy Pixel RPG Design System + Semantic Cozy Daylight/Moonlight Theme (`theme.css` / `theme-system.js`), ES6+ JS, Phaser 3.90.0 + Canvas 2D Fallback + Shared Animated `WorldEnvironment`.

---

## 2. TỔNG HỢP THÀNH TỰU P4-B.3 ĐÃ KIỂM ĐỊNH
1. **Từ vựng thông dụng & Learning Loop (`UNIT PASS` 100/100 seeds + `BROWSER PASS`):**
   - `common-words.txt` (`2,789` từ thông dụng + `24` từ 2 chữ cái `GO`/`DO`/`BE`...) kết hợp `english-words.txt` (`77,017` từ) giúp 100/100 seed bảng chữ đều dễ ghép từ; tự động nạp Core Word mới + gợi ý mới + bảng mới khả giải khi giải đúng Core Word; `glp.wordJournal` lưu lại từ sai/dùng gợi ý vào Sổ Tay Từ Vựng.
2. **Chiến đấu 5-Wave, Boss Entrance, Boss HUD & Spells (`BROWSER PASS`):**
   - Hiệu ứng riêng theo phép (`fire_blade`, `frost_seal`, `thunder_strike`, `blade_storm`, `lexical_judgment`), floating DMG, boss aura, encounter ngẫu nhiên mỗi lượt (`?qa=1` deterministic), Wave 5 Dramatic Boss Entrance (`#bossEntranceBanner`) & Boss HUD (`.boss-panel.is-chapter-boss`, `#bossCrownBadge`), xác nhận chơi đủ 5 Wave bằng hành động hợp lệ đạt Victory (`Total failures: 0`).
3. **Cozy Daylight / Moonlight Contrast & SEO (`BROWSER PASS` & `HTTP PASS`):**
   - Semantic tokens (`theme.css`) sửa triệt để chữ chìm trên cả 9 trang (`audit_contrast_chromium.js`: `0` issues trên Daylight & Moonlight); SEO kỹ thuật chuẩn hóa cho `https://gamified-learning-platform-sandy.vercel.app`.
4. **Untested Boundaries (`NOT TESTED`):**
   - Tương tác Spring Boot + Microsoft SQL Server trực tiếp (`MainTests` cần SQL Server bật cục bộ).
