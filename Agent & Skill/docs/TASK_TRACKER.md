# TASK TRACKER — LEX RAID PIXEL RPG

**Trạng thái cập nhật:** 2026-11-26  
**Chủ sở hữu GitHub:** `Mky0611`  
**Repository:** `https://github.com/Mky0611/GamifiedLearningPlatform.git`  
**Nhánh phát hành:** `feature/p4b3-rpg-combat-learning`

---

## 1. BẢNG TIẾN ĐỘ TỔNG THỂ CÁC GIAI ĐOẠN (PHÂN LOẠI BẰNG CHỨNG CHUẨN)

| Giai đoạn | Nội dung trọng tâm | Mức chứng nhận | Chi tiết & Ghi chú |
| :---: | :--- | :---: | :--- |
| **SEC** | Security Post-Audit & Credential Sanitization | **STATIC PASS** | Không lộ secret/token hay QA hook ra public domain. |
| **P0/P1** | Java 21 / Spring Boot 4.2.0 / Pixel UI Foundation | **CODE COMPLETE / BROWSER PASS (FE)** | Giao diện FE & responsiveness đã nghiệm thu trên Chromium thật; Backend live SQL `NOT TESTED`. |
| **P2** | Vocabulary Engine, CEFR A1–C2, IT Taxonomy | **UNIT PASS / STATIC REVIEW** | DB seed audit; giữ nguyên dịch vụ & dữ liệu. |
| **P3** | RPG Progression, XP, Coins, Level, Idempotency | **UNIT PASS** | Java 21 Mockito tests pass (`26/26`). |
| **P4-A** | Vercel Static Deployment & Preview Mode Fallbacks | **HTTP PASS** | `vercel.json` routing clean, `/api/**` trả về 404 kích hoạt Preview fallback. |
| **P4-B / B.2** | Visual Redesign, 9-Slice UI, Animation FSM & World Env | **STATIC PASS (43/43) & BROWSER PASS** | Curated runtime assets, FSM pooled VFX, Canvas 2D fallback, 9/9 viewports PASS. |
| **P4-B.3** | Final Polish, Post-Release Correction, 5-Wave QA, SEO & Production Release | **BACKEND UNIT PASS (26/26), STATIC PASS (43/43), SCOPED CONTRAST (0), SEO PASS, BROWSER PASS (0)** | Hoàn tất tới `870faac`, deploy **Vercel Production** & verify live. |
| **P5** | Docker, CI/CD & SQL Server Migration Apply | `TODO (DRAFT ONLY)` | Bản nháp DDL/API tại `docs/P4B3_BACKEND_DRAFT.md`. |

---

## 2. CHI TIẾT MILESTONES P4-B.3 RELEASE

| Milestone | Nội dung | Bằng chứng / Commit | Kết quả |
| :---: | :--- | :--- | :---: |
| **A–B** | Common vocab `2,789` words + 2-letter whitelist, 100-seed solvability, continuous Core Word loop | `9787501` | **DONE** |
| **C–D** | Spell VFX + floating DMG, Boss Entrance Wave 5 & Chapter Boss HUD, per-run random encounter | `fae6a84` | **DONE** |
| **E** | `LexRaidServiceImpl` path check, server-owned `BoardSnapshot`, closed session lock (`25/25` Mockito PASS) | `a50a1ae` | **DONE** |
| **F** | Unified semantic tokens Light/Dark, 0 WCAG AA contrast issues across all 9 pages & states | `b91546e` | **DONE** |
| **G** | Technical SEO (`robots.txt`, `sitemap.xml`, `og-preview.png`, canonical/JSON-LD/`noindex`, 404 routing) | `8af521a` | **DONE** |
| **H** | Fix `guessCoreWord()` `ReferenceError`, 5-Wave real playthrough + Defeat + `25/25` + `43/43` + `0` failures | `5d8ecaa` | **DONE** |
| **I** | Build info, docs sync, `git push`, `vercel deploy --prod` & live Production verification | `dpl_HsUgDxCtZ6TkdBKsadrYqRD8PR2m` | **DONE** |
