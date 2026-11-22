# Lex Raid — Pixel RPG Learning Agent Pack

> Bộ agent, skills, prompt và đặc tả thiết kế chuẩn bị riêng cho source `GamifiedLearningPlatform.zip` được cung cấp ngày 22/11/2026. Đây là **bộ hướng dẫn/cấu hình**, **không phải source game đã sửa**. Không thay thế project gốc.

## Bắt đầu dễ nhất
1. Sao lưu source game và commit Git hiện tại.
2. Giải nén pack này **ngoài** source game để đọc trước.
3. Chép `GEMINI.md`, `CLAUDE.md`, `AGENTS.md`, thư mục `.gemini/` và `.claude/` vào **thư mục gốc** `GamifiedLearningPlatform/` (cùng cấp `pom.xml`). Nếu đã có file cùng tên, **so sánh và gộp**, không ghi đè mù.
4. Mở project trong Gemini CLI / Claude Code. Cung cấp `prompts/MASTER_PROMPT.md` cho agent và yêu cầu triển khai **PHASE 0** trước.
5. Có thể chạy `python scripts/audit_pixel_assets.py <đường-dẫn-source-game>` nếu đã cài Pillow (`pip install pillow`), hoặc `python scripts/check_dom_refs.py <đường-dẫn-source-game>` bằng Python chuẩn.
6. Xem `docs/UX_UI_SPEC.md`, `docs/TEST_MATRIX.md` và `docs/IT_VOCAB_TAXONOMY.md` để nghiệm thu.

### Không làm ngay
- Không chuyển HTML/CSS/JS sang React/Next.js chỉ để trông hiện đại.
- Không chuyển SQL Server sang PostgreSQL trước khi chứng minh lợi ích.
- Không tách microservices trước khi gameplay và xác thực được kiểm thử.
- Không import toàn bộ wordlist từ nguồn không có quyền sử dụng.
- Không ghi đè sprite packs gốc. Không sao chép hình ảnh, thương hiệu hay UI của Bookworm Adventures.

## Cấu trúc
- `prompts/MASTER_PROMPT.md`: prompt điều phối toàn dự án.
- `prompts/PHASE_0_PIXEL_UI.md`: prompt sửa lỗi UX/UI + animation trước tiên.
- `AGENTS.md`, `GEMINI.md`, `CLAUDE.md`: quy tắc xuyên suốt.
- `.gemini/agents/`, `.claude/agents/`: 6 chuyên gia cho mỗi nền tảng.
- `.gemini/skills/`, `.claude/skills/`: 7 skill chuyên sâu, dùng riêng lẻ hoặc kết hợp.
- `docs/`: source audit, wireframes, taxonomy từ vựng, kiến trúc, test, repo GitHub.
- `data/vocabulary_import_template.json`: ví dụ cấu trúc import (mục CEFR để null vì chưa được xác minh).
- `scripts/`: kiểm tra sprite và DOM, **chỉ đọc**, không sửa source.

## Công nghệ source đang có
Java 17, Spring Boot 3.3.5, JPA, Spring Security, SQL Server, HTML/CSS/JS module, Phaser 3, canvas fallback. Các đường dẫn và kết luận chỉ được kết luận từ zip; chưa được xác nhận qua trình duyệt thật hoặc build thành công.

## Cách chia việc
- P0: ổn định sprite feet anchor, resize/mount, gameplay mobile không cuộn.
- P1: UI design system pixel, desktop/laptop/tablet, input touch/keyboard, regression test.
- P2: content CEFR + IT taxonomy + đồng bộ learning loop/XP.
- P3: JWT, CI/CD, Docker local, thử nghiệm Vercel/container.
- P4: cân nhắc chia microservices dựa trên số liệu vận hành.

Chỉ tiếp tục pha tiếp theo khi pha hiện tại có checklist nghiệm thu và test chạy thành công. Ghi rõ những test chưa thực hiện.


## v2 — Bổ sung Google Antigravity
- Giữ nguyên cấu hình Gemini CLI và Claude Code v1, thêm `.agents/rules/`, `.agents/skills/`, `.agents/agents/` dành cho Antigravity App/CLI/IDE.
- Đọc `docs/ANTIGRAVITY_RESEARCH_DELTA.md` và `prompts/ANTIGRAVITY_P0_START.md`.
- Kiểm tra file: `python scripts/validate_antigravity_pack.py`.
- Trước khi nhập vào source thật: backup / git commit, copy **có chọn lọc**, đối chiếu nếu thư mục `.agents/` đã tồn tại.
- Chưa cài external skills và chưa thay đổi mã nguồn game; đây là cấu hình đề xuất đã được static validate.
