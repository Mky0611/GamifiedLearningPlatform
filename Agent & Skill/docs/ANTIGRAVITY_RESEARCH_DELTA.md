# Phần bổ sung sau nghiên cứu Kho Skill Agent Antigravity (22/11/2026)

## Những thứ mới so với Agent Pack v1
- `.agents/rules/`: 5 quy tắc Antigravity với `trigger` hợp lệ (2 `always_on`, 3 `model_decision`), giảm độ dài prompt global.
- `.agents/agents/`: 4 agent chuyên đọc/audit cho UX, Phaser, pixel styling, Spring/SQL Server; cấu hình tool theo tên Antigravity gốc, sandbox.
- `.agents/skills/`: 6 SKILL.md theo đúng cấu trúc phẳng một cấp: pixel design review, mobile viewport, Phaser 3 sprite, browser regression, SQL Server review, security review.
- `prompts/ANTIGRAVITY_P0_START.md`: prompt khởi động riêng Antigravity.
- `scripts/validate_antigravity_pack.py`: validate static cấu trúc frontmatter và tên tool/skill trước khi copy.

## Repo cân nhắc (KHÔNG tự tải / KHÔNG auto-install)
1. `obra/superpowers`: SOP TDD/plan/review; chỉ chọn một SOP framework để tránh xung đột.
2. `nextlevelbuilder/ui-ux-pro-max-skill`: UI research/UX checks; lọc bỏ UI mặc định kiểu dashboard, vẫn là pixel RPG.
3. `anthropics/skills` `frontend-design`: điều chỉnh ngôn ngữ thị giác pixel, không chuyển sang React.
4. `with-pebbly/aseprite-ai-artist`: dùng sau nếu có Aseprite; trước khi sửa asset phải backup và kiểm tra quyền truy cập MCP.
5. `microsoft/playwright`: màn hình mobile, touch, screenshot regression; đặc biệt hữu ích cho P0.
6. `Jeffallan/claude-skills` `spring-boot-engineer`: áp dụng khi backend P1, kiểm chứng tương thích Java 17/Spring Boot 3.3.5.
7. `googleapis/mcp-toolbox`: hỗ trợ SQL Server nhưng chỉ dùng credential SELECT và dev DB sau P0.

## Không sử dụng sai ngữ cảnh
- Bỏ qua `supabase-postgres-best-practices` (dự án dùng Microsoft SQL Server), `godot-*` (dự án dùng Phaser 3), `vercel-react-best-practices` (source không phải React), mẫu Java 21/Spring Boot 4 mà tự nâng phiên bản.
- Không khẳng định mọi cấu hình v1 `.gemini/` tự chạy trong Antigravity App: `.agents/` mới là đường dẫn project-scoped mặc định theo docs hiện tại.
- Không copy hàng nghìn skills từ mega-hubs; không chạy `npx`, `curl|bash` hoặc MCP server chỉ vì repo được trích dẫn.
- Không bắt buộc symlink thư mục skills global. Làm ở project scope `.agents/skills/` đơn giản và dễ audit hơn, đặc biệt trên Windows.
- Số sao, kích thước kho và các câu lệnh cài trong tài liệu nghiên cứu có thể thay đổi. Đọc README repo hiện tại trước mọi thao tác.

## Các trang tài liệu gốc được đối chiếu
- https://antigravity.google/docs/customization-discovery/
- https://antigravity.google/docs/rules/
- https://antigravity.google/docs/subagents/
- https://antigravity.google/docs/skills/
- https://github.com/obra/superpowers
- https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- https://github.com/with-pebbly/aseprite-ai-artist
- https://snyk.io/blog/toxicskills-malicious-ai-agent-skills-clawhub/
- https://github.com/bytebase/dbhub/issues/349 (SQL Server read-only issue reported and fixed in mid-2026; verify installed version and STILL use database-level least privilege)

## Phạm vi hoàn thành
Đây là FILE CẤU HÌNH & HƯỚNG DẪN. Không có thay đổi source `GamifiedLearningPlatform.zip`, backend, UI, asset hoặc database. Không có browser runtime test trong lần cập nhật Agent Pack.
