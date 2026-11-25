# LEX RAID — P4-B.3 CHECKPOINT

**Nhánh:** `feature/p4b3-rpg-combat-learning`  
**Cập nhật:** 2026-11-25  

## Trạng thái từng Milestone (P4-B.3)
- [x] **Milestone A** (`0d94b86`): Mở rộng đấu trường (`960x360`, `.battle-stage` `727x273`), tăng scale Hero (`~1.56x`, `heroDisplayH=300`) & Boss theo độ hiếm (`1.0x..1.36x`), compact HUD, tile font `Be Vietnam Pro`.
- [x] **Milestone B** (`d917f37`): Bộ từ điển tiếng Anh offline đã kiểm chứng `en-wl/wordlist/v2` (`76,993` từ tại `english-words.txt` + `LICENSE_EN_WL.txt`), Topic `+30%` Bonus, `LexRaidBalanceConfig`, `EnglishLexiconService`, xác thực `BoardSnapshot` không tái sử dụng ô trên `LexRaidServiceImpl`, và `LexRaidGlobalLexiconTest` (`3/3 PASS`).
- [x] **Milestone C** (`22fc098`): Word Feedback Toast + TTS, Hint Toolbar (`Gợi ý nghĩa`, `Mở 1 chữ`, `Đổi bảng`), bộ sinh bàn cờ khả giải 20/20 seeds, `glp.wordJournal`, Post-Battle Review & Volcard link.
- [x] **Milestone D** (`bad2934`): Campaign vs Practice mode, timer theo Chapter (`45s -> 38s -> 32s -> 28s`) tạm dừng theo modal/chuyển đợt, hệ thống `5-Wave` + `MONSTER_TRAITS` + Phase 2 (`encounter-registry.js`), Core Word Lexical Judgment.
- [x] **Milestone E** (`bec8235`): `Fire Blade` (Burn), `Frost Seal` (Frost +4s), `Thunder Strike` (x2 Shield Break + Stun) kèm deck filter $\le 6$ nút, VFX pool `12`.
- [x] **Milestone F** (`25834b7`): Giao diện Cozy **Daylight** & **Moonlight** chuẩn WCAG AA trên 8 trang ngoài trận + no-flash `theme-system.js` + nút Sun/Moon trên Navbar + bảo toàn Combat Theme.
- [x] **Milestone G**: `docs/P4B3_BACKEND_DRAFT.md`, `23/23` Backend Mockito Unit Tests PASS, `43/43 STATIC PASS`, `chromium_p4b2_acceptance.js` `0 failures`, cập nhật toàn bộ tài liệu & bản mirror.
- [ ] **Milestone H**: Push nhánh `feature/p4b3-rpg-combat-learning`, deploy **NEW Vercel Preview** (KHÔNG dùng `--prod`) & kiểm tra live URL.
