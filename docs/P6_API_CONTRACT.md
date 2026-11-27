# LEX RAID — P6 REST API CONTRACT & OWNERSHIP BOUNDARY

**Ngày phát hành đặc tả:** 2026-11-27  
**Nhánh:** `feature/p4b3-rpg-combat-learning`

---

## 1. HỢP ĐỒNG PROGRESSION (`/api/v1/progression`) — P6-C / P6-G

| Endpoint | Method | Request | Response (`ApiResponse<T>`) | Quy tắc xác thực Server |
| :--- | :---: | :--- | :--- | :--- |
| `/api/v1/progression?userId={id}` | `GET` | `userId` (`Long`) | `ProgressionSnapshotDto` | Bắt buộc user tồn tại; khởi tạo starter (`warrior`, `archer`, `lancer`) idempotent nếu chưa có |
| `/api/v1/progression/heroes?userId={id}` | `GET` | `userId` (`Long`) | `List<HeroStatus>` | Trả `unlocked`, `unlockRule`, `baseHp`, `baseMp`, `maxMp` từ `RpgCatalogRegistry` |
| `/api/v1/progression/skills?userId={id}&heroCode={h}` | `GET` | `userId`, optional `heroCode` | `List<SkillTreeNode>` | Trả `level (0..3)`, `state`, `canLearn`, `canUpgrade`, `reason` |
| `/api/v1/progression/skills/learn` | `POST` | `{ userId, heroCode, skillCode }` | `ProgressionSnapshotDto` | Khóa ví `PESSIMISTIC_WRITE`, check sở hữu Hero, class, prerequisite, stage/learning, `SP >= 1`; SP **không** bypass Stage |
| `/api/v1/progression/skills/upgrade` | `POST` | `{ userId, heroCode, skillCode }` | `ProgressionSnapshotDto` | Nâng `Lv 1->2->3`, kiểm tra `upgradeRequirements` + SP; fail -> không trừ SP |
| `/api/v1/progression/loadout` | `PUT` | `{ userId, heroCode, activeSkillCodes, ultimateSkillCode }` | `ProgressionSnapshotDto` | Kiểm tra sở hữu Hero, mọi skill đã học (`>= 1`), class khớp, tối đa `4 Active + 1 Ultimate` |

---

## 2. HỢP ĐỒNG SERVER-AUTHORITATIVE COMBAT (`/api/v1/lex-raid`) — P6-D / P6-E

| Endpoint | Method | Thay đổi P6 | Bảo mật & Chống gian lận |
| :--- | :---: | :--- | :--- |
| `/api/v1/lex-raid/sessions/start` | `POST` | Nhận thêm `playMode` (`CAMPAIGN` \| `PRACTICE`), `heroCode` | Campaign kiểm tra Stage trước đã `clearCount >= 1`; kiểm tra `hero_ownership` với `arcane_mage` |
| `/api/v1/lex-raid/sessions/{id}/submit-word` | `POST` | Nhận thêm `userId`, reset counter chiêu 0 MP & giảm Cooldown `1` lượt | Chặn cross-user (`SecurityException` -> `403`); giải Core Word dùng `computeCoreWordDamage`, **không** auto-win nếu Boss còn HP |
| `/api/v1/lex-raid/sessions/{id}/cast-skill` | `POST` | `{ userId, skillCode, actionId }` -> trả `hitDamages[]`, `waveIndex`, `totalWaves`, `playerHp`, `skillCooldowns`, `statusApplied` | Idempotent theo `(raid_session_id, action_id)`; kiểm tra sở hữu Hero/Skill/Loadout/Mana/CD; tối đa `1` lần cast chiêu `0 MP` mỗi lượt trước khi ghép từ tiếp theo; multi-tick & multi-wave quyết định hoàn toàn trên Server |

---

## 3. HỢP ĐỒNG WORD MASTERY (`/api/v1/mastery`) — P6-F

| Endpoint | Method | Chức năng | Chống farm / Chống lộ đáp án |
| :--- | :---: | :--- | :--- |
| `/api/v1/mastery?userId={id}` | `GET` | Tổng hợp `UserWordMastery` | Tách biệt `timesAnsweredCorrect`, `timesReviewed`, `timesFound`, `masteryState` |
| `/api/v1/mastery/recall-challenge?userId={id}&wordId={w}` | `POST` | Sinh câu hỏi nghĩa + 3 lựa chọn | **Không** gửi cờ `isCorrect` hoặc đáp án ẩn về client |
| `/api/v1/mastery/recall` | `POST` | `{ userId, wordId, selectedWord }` | Server tự so khớp `VocabularyWord.wordText`; TTS **không** tác động DB; dedupe `newUniqueReview`; không hạ cấp `MASTERED` |

---

## 4. BLOCKER BẢO MẬT & KIỂM SOÁT CHỦ SỞ HỮU (CẦN DUYỆT TRƯỚC KHI PUBLIC)

1. `AccountServiceImpl.resolveUserForLoadoutSave()` đã gỡ fallback `.findAll().stream().findFirst()` — từ chối mọi request thiếu/sai `userId`.
2. Toàn bộ thao tác `LexRaidServiceImpl` kiểm tra `userId` khớp chủ sở hữu session (`403 Forbidden`).
3. **Blocker kiến trúc Auth cần người dùng phê duyệt:** `SecurityConfig.java` hiện vẫn mở `.permitAll()` trên `/api/v1/account/**`, `/api/v1/lex-raid/**`, `/api/v1/quiz/**` và `AuthServiceImpl` chưa cấp JWT / HttpSession Principal (`jwtEnabled = false`). Trước khi public Backend ra Internet, bắt buộc bổ sung JWT Filter / Session Principal để lấy `userId` từ `SecurityContextHolder` thay vì tin `request.userId`.
