# PHASE 0 — SỬA UI MOBILE VÀ PIXEL ANIMATION

Bạn là game UI engineer + Phaser 3 animation engineer + accessibility tester. Làm việc TRÊN SOURCE HIỆN CÓ, không sinh dự án mới.

## Vấn đề đã quan sát trong source
- `raid-config.js`: Phaser 960x420, hero Y ~384, boss Y 304, feet anchors mặc định không khớp alpha bboxes.
- `battle-scene.js`: `applyState()` set lại hero.x/y khi đổi state có thể triệt tiêu tiến trình tween.
- `raid-phaser-embed.js`: fallback canvas 960x360, logic tính vị trí sprite riêng, `render` async `await` trong RAF.
- `minigame.css`: `.raid-layout` thay grid mạnh tại 1320/860/720; DOM Attack trước Board; Objectives được lồng vào Board; dùng CSS pixel và rounded styles lẫn lộn.
- `minigame.js`: `renderBoard()` set inline `gridTemplateColumns = repeat(cols, minmax(56px, 76px))` đè quy tắc bố cục mobile; `playFrameMonster` return khi thiếu `bossSpriteSheet`.

## Đầu việc P0, theo đúng thứ tự
1. Đọc mã nguồn thực, xác nhận mọi tên/đường dẫn. Lập screenshot baseline desktop 1440x900, laptop 1366x768, phone 390x844, 360x800, 320x568 ở browser có server chạy; nếu không thể khởi động thì ghi 'not tested'.
2. Audit asset sprite hero/boss: kiểm tra kích thước spritesheet, frameCount, alpha bounding box trên từng frame và từng trạng thái; xác định điểm chân/ground thật từ dữ liệu pixel; dùng config per-unit/per-animation. Chuẩn hóa tọa độ world; căn shadow/feet baseline và kiểm tra hero không nhảy khi Idle > Run > Attack > Guard > Idle, Boss Idle > Hit > Attack > Death.
3. Kiểm tra `applyState()` có reset x trong tween và `spawnActors()` khi `unitCode` đổi; tạo state-machine với animation events / sequencing tránh race, restart timer, đè state. Phân biệt baseX, renderX, tweenX; tween không bị reset khi event cập nhật HP.
4. Đảm bảo cả Phaser và Canvas fallback có logical dimensions / feet model tương ứng, CSS parent không force aspect-ratio trái với logical aspect, không render hai lớp actor chồng lên nhau.
5. Refactor DOM/CSS mobile gameplay: bố trí battle compact (hero/boss HP) + Word Grid + Current Word + Clear/Attack đều trên cùng viewport khi chơi. Nút Attack nằm trong dock sát board (có thể sticky bottom), battle preview có thể sticky top trong ngưỡng chiều cao, không bị che menu/trình duyệt. Ẩn bớt metadata vào tab/drawer. Không di chuyển bằng CSS absolute theo cảm tính.
6. Sửa inline grid sizing: kích thước tile suy từ `--tile-size` và tính cols/width từ ResizeObserver/available space, không hardcode `minmax(56px,76px)` bất biến. Tap chọn chữ hoạt động trên touch; không bắt buộc drag; ngăn scroll chỉ trong active grid khi cần, không block toàn trang.
7. Giữ gameplay server, hiệu ứng, kết quả, UI API ids; nếu bỏ id thì sửa toàn bộ refs và test DOM; đảm bảo mới không tạo duplicate IDs.
8. Chạy smoke check và e2e touch, screenshot/diff. Không chuyển việc sang backend/auth khi chưa nghiệm thu phase này.

## Tiêu chí nghiệm thu không thể thương lượng
- 390x844: tile, word preview, Attack, boss HP và hoạt ảnh feedback nhìn thấy/tiếp cận được mà không cuộn qua lại.
- 320x568: có playable compact mode minh bạch; không tràn ngang và không che nút bởi address bar/safe area.
- 1366x768 & 1440x900: hero/boss đứng trên cùng ground plane, không vượt canvas.
- 44 CSS px chạm mục tiêu chính khi có đủ không gian; với board nhiều cột phải dùng giải pháp khác thay vì bóp vô hạn.
- Ít nhất 3 class hero, 3 boss và 4 trạng thái hoạt ảnh có kiểm tra thực tế.
- Desktop keyboard: focus visible, Enter/Space cho tile; mobile touch không bị click đôi.
- Tests: một lượt attack, một lượt boss attack, refill, đổi boss, chọn Core Word, popup, kết thúc battle.

## Kết quả bắt buộc
(1) Audit bảng lỗi file:line; (2) sơ đồ DOM cũ và mới; (3) diff code từng file; (4) screenshots trước/sau với viewport; (5) test pass/fail; (6) còn lỗi nào và vì sao.
