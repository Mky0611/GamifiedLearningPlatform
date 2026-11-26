# LEX RAID — P4-B.3 QA REPORT (FINAL PRODUCTION RELEASE)

**Nhánh:** `feature/p4b3-rpg-combat-learning`  
**Ngày kiểm định:** 2026-11-26  
**Code SHA đã kiểm định:** `5d8ecaa`

---

## 1. BẢNG PHÂN LOẠI BẰNG CHỨNG KIỂM THỬ

| Hạng mục kiểm thử | Công cụ / Lệnh | Mức chứng nhận | Kết quả quan sát thực tế |
| :--- | :--- | :---: | :--- |
| Backend Service Unit Tests (5 suites Mockito) | `mvn.cmd -o -DargLine=-javaagent:... -Dtest=AccountProfileServiceTest,LexRaidGlobalLexiconTest,LexRaidProgressionTest,QuizProgressionTest,RpgProgressionServiceTest test` | **BACKEND UNIT PASS** | **25/25 PASS**, `0` failures, `0` errors (`AccountProfileServiceTest` 2/2, `LexRaidGlobalLexiconTest` 5/5, `LexRaidProgressionTest` 4/4, `QuizProgressionTest` 5/5, `RpgProgressionServiceTest` 9/9) |
| Full Spring Boot Context + SQL Server (`MainTests`) | `mvn.cmd -o test` | **NOT TESTED (DB Offline)** | Không chạy trên môi trường tĩnh không có SQL Server cục bộ |
| Static Asset & Alignment Verification | `python src/main/resources/tools/test_p4b_verification.py` | **STATIC PASS** | **43/43 STATIC PASS**, `0` failed |
| Case Sensitivity & Asset Index Check | `python src/main/resources/tools/check_case_sensitivity.py` | **STATIC PASS** | `130/130` Phaser URLs hợp lệ, `0` missing, `0` case mismatches |
| Solvability 100-Seed Check | `build_common_vocab.py` + `LexRaidBalance` | **UNIT PASS** | **100/100 seeds PASS**, `minCommon: 95`, `2L_GO: true`, `2L_QQ: false` |
| Chromium Computed WCAG AA Contrast Audit | `node src/main/resources/tools/audit_contrast_chromium.js` | **BROWSER PASS** | **0 contrast issues** trên 9 trang (Daylight + Moonlight + Quiz answered + Volcard flipped + Combat HUD) |
| SEO & Routing Verification | `node src/main/resources/tools/verify_seo.js` | **HTTP PASS** | `11` routes + `robots.txt` + `sitemap.xml` (`7` URLs) + `/nonexistent` `404` + JSON-LD + `og-preview.png` hợp lệ |
| Chromium Headless Full Acceptance Suite | `node "Agent & Skill/scripts/chromium_p4b2_acceptance.js"` | **BROWSER PASS** | **Total failures: 0** (Desktop + Mobile trên 9 trang, `9/9` viewports `320x568`..`1920x1080`, Phaser + Canvas fallback, full 5-wave playthrough hợp lệ, Wave 5 Chapter Boss Entrance & HUD, Victory/Review, Battle Ended/Defeat, rejection tests) |

---

## 2. CHI TIẾT KIỂM CHỨNG NỔI BẬT Ở ĐỢT RELEASE

1. **Full 5-Wave Valid Action Playthrough (`chromium_p4b2_acceptance.js`):**
   - Thực hiện chọn ô chữ trên bảng thật và nhấn `#guessCoreBtn` / `#submitWordBtn` xuyên suốt Wave 1 (`fierce`) → Wave 2 (`slime`) → Wave 3 (`totem1` ELITE) → Wave 4 (`totem2` GUARDIAN) → Wave 5 (`crabby` CHAPTER_BOSS), đạt **Victory (`Score 811`, `Sổ Tay Từ Vựng Trận Đấu`)** với `activeVfx = 0` và phát hiện + sửa triệt để lỗi `ReferenceError: damageDealt is not defined` trong `guessCoreWord()` (`minigame.js`).
   - Xác minh Wave 5 kích hoạt `#bossEntranceBanner`, `.boss-panel.is-chapter-boss` và `#bossCrownBadge`.
2. **Light/Dark Contrast (`audit_contrast_chromium.js`):**
   - Kiểm tra từng node chữ, input, placeholder, badge CEFR/Tier, đáp án Quiz đúng/sai, mặt trước/sau Flashcard và các bảng gỗ tối `pixel-panel-wood` trên Daylight & Moonlight: **0 lỗi**.
3. **Production Deployment Probe:** Xem kết quả thực tế tại `docs/P4B3_SEO_RELEASE_REPORT.md` sau bước `vercel deploy --prod`.
