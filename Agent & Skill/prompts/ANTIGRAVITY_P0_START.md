# PROMPT: ANTIGRAVITY LEX RAID P0 (COPY & PASTE)

Bạn đang làm trên SOURCE HIỆN TẠI của Lex Raid, không tạo dự án mới. Hãy đọc `AGENTS.md`, `docs/SOURCE_AUDIT.md`, `prompts/PHASE_0_PIXEL_UI.md` và các Rules/Skills trong `.agents/`.

**Nhiệm vụ:** Chỉ triển khai P0: lỗi nhân vật/sprite bị lệch chân, animation nhảy khỏi giao diện, battle layout desktop/mobile, bảng chữ và Attack phải cùng viewport trên điện thoại. KHÔNG tự thay framework, database, logic reward hoặc architecture.

1. Từ code hiện tại, tìm root cause cho sprite feet anchor, `applyState` đang overwrite tween, Phaser vs fallback logical canvas dimensions; ghi file:line rõ ràng.
2. Reproduce UI ở 320x568, 360x800, 390x844, 430x932 và laptop 1366x768. Nếu không khởi chạy được, ghi rõ lý do, không báo UI test passed.
3. Lập bảng lỗi severity P0/P1, nguồn gốc, ảnh hưởng, các file sửa nhỏ nhất. Tách game canvas khỏi CSS layout của dashboard; giữ pixel-perfect rendering.
4. Áp dụng từng patch có thể rollback, không chỉnh nhiều hệ thống cùng lúc. Kiểm tra smoke scripts, Playwright/browser nếu môi trường cho phép.
5. Báo cáo từng bước: diff, test pass/fail, screenshot trước/sau, thay đổi gameplay/API, rủi ro còn lại.
6. Mọi repository/skill mới chỉ được đề xuất; KHÔNG tự cài hoặc chạy installer. MCP database mặc định không kết nối cho P0.

**Kết quả đầu tiên cần giao:** Root-cause evidence + layout wireframe mobile + diff đầu tiên cho lỗi cao nhất. Trả lời bằng tiếng Việt.
