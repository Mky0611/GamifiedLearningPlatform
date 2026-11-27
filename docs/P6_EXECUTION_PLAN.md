# LEX RAID — P6 EXECUTION PLAN
## FULL-STACK RPG INTEGRATION & PERSISTENT LEARNING

**Nhánh:** `feature/p4b3-rpg-combat-learning` (Baseline verified HEAD: `7016bec` / code SHA `5906f12`)  
**Ngày khởi tạo:** 2026-11-27  
**Chủ sở hữu:** `Mky0611`

---

## 1. MỤC TIÊU & PHẠM VI P6

Chuyển toàn bộ hệ thống RPG P5.1 từ chế độ trình duyệt cục bộ (`glp.p5.demoProgression.v1`) sang nghiệp vụ server-authoritative trên **Java 21 LTS + Spring Boot 4.2.0 + JPA/Hibernate + SQL Server 2022**, bảo toàn kiến trúc hiện có và **không** làm hỏng Vercel `demo-static` frontend trong quá trình tích hợp.

---

## 2. AGENT / SKILL & QUY TẮC ÁP DỤNG

- `sqlserver-backend-reviewer` + `safe-sqlserver-changes`: Audit schema thật qua `INFORMATION_SCHEMA` / `sys.*`, không sửa đổi phá hoại DB khi chưa duyệt, dùng `@Lock(LockModeType.PESSIMISTIC_WRITE)` (`WITH (UPDLOCK, ROWLOCK)`), bảo vệ idempotency XP/Coin/SP.
- `learning-combat-loop`: Đồng bộ công thức chiến đấu, giới hạn skill 0 MP mỗi lượt tránh spam không học từ, quy tắc Hero/Skill Unlock & Word Mastery Recall thật.
- `qa-release-guardian`, `mobile-battle-tester`, `visual-regression-browser`: Kiểm thử regression Java Mockito, static checks, SQL Server integration (khi có credential DB), và Chromium E2E.

---

## 3. LỘ TRÌNH MILESTONE (P6-A ĐẾN P6-J)

| Milestone | Phạm vi chính | Trạng thái đầu kỳ | Điều kiện hoàn tất |
| :--- | :--- | :---: | :--- |
| **P6-A** | Database & Backend Baseline (`java`, `mvn`, `MSSQL$SQL2022`, TCP `1433`, `MainTests`) | `DONE (BLOCKED AUTH)` | Xác định rõ nguyên nhân `ErrorCode 18456` (`sa` thiếu env `SPRING_DATASOURCE_PASSWORD`; SQL service chạy + port 1433 mở). |
| **P6-B** | Database Schema Audit (`INFORMATION_SCHEMA` / `sys.*`) & Migration T-SQL Plan | `DONE (AUDIT + SCRIPT)` | Audit `55` base tables, `20` stages thực, phát hiện `CK_user_loadouts_unit` & `CK_word_submit_events_word_type`; lập migration an toàn + rollback. |
| **P6-C** | Persistent Hero, Skill Tree (`27` skills Lv1–3), Loadout (`4+1`) & Milestone Dedup | `IN_PROGRESS (CODE+UNIT)` | Implement Registry parity, Entities/Repos/Service/Controller `/api/v1/progression/**` + Mockito unit tests. |
| **P6-D** | Server-Authoritative Combat & Skill Execution (`/sessions/{id}/cast-skill`) + Zero-MP Turn Policy | `IN_PROGRESS (CODE+UNIT)` | Backend xác thực Mana, CD, Class, Loadout, Action Idempotency, Multi-hit ticks, Core Word HP integrity. |
| **P6-E** | Server Campaign / 5-Wave Encounter / Stage Lock API | `DESIGNED / API+SERVICE` | Phân biệt Practice vs Campaign, chặn Stage khóa qua API theo `stage_id` thật trong DB. |
| **P6-F** | Persistent Word Mastery & Server-Verified Recall (`/api/v1/mastery/**`) | `IN_PROGRESS (CODE+UNIT)` | Backend chấm đáp án Recall từ `vocabulary_words`, tách TTS khỏi Mastery, phục vụ Volcard/Hall/Unlock. |
| **P6-G** | Transaction & Reward Integrity (XP/Coins/SP/Milestones) | `IN_PROGRESS (UNIT)` | Tách `stage_first_clear_*`, `hero_unlock_*`, `skill_unlock_*`, khóa bi quan, chống `MASTERED` downgrade & duplicate reward. |
| **P6-H** | Frontend API Adapter (`DEMO_STATIC` vs `BACKEND_CONNECTED`) | `PLANNED (AFTER DB APPROVAL)` | Nối `api.js`, `account.js`, `minigame.js` khi backend host & DB migration được phê duyệt (giữ Vercel `demo-static` an toàn). |
| **P6-I** | Real Full-Stack QA (`MainTests` + SQL Server thật + Chromium Full-Stack E2E) | `BLOCKED (DB CREDENTIAL + AUTH)` | Cần `SPRING_DATASOURCE_PASSWORD`, phê duyệt chạy DDL migration & phê duyệt Auth Principal. |
| **P6-J** | Git & Production Verification (`gamified-learning-platform-sandy.vercel.app`) | `READY / PROTECTED` | Giữ Production `demo-static` ổn định cho tới khi Backend/Auth/SQL Server được nghiệm thu toàn phần. |
