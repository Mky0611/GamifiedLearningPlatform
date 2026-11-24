# HƯỚNG DẪN TRIỂN KHAI VÀ NGHIỆM THU VERCEL PREVIEW — PHASE P4-A
## LEX RAID PIXEL RPG FRONTEND PREVIEW DEPLOYMENT

**Thời điểm lập:** 24/11/2026  
**Chủ sở hữu GitHub:** `Mky0611`  
**Repository:** `https://github.com/Mky0611/GamifiedLearningPlatform.git`  
**Nhánh triển khai:** `feature/p4-vercel-preview`  
**Commit cơ sở:** `da96813`  
**Đơn vị thực hiện:** Antigravity AI Engineering Team  

---

## 1. MỤC TIÊU VÀ PHẠM VI TRIỂN KHAI

Giai đoạn **P4-A Vercel Preview** cung cấp môi trường trực tiếp trên Internet để người dùng và các bên liên quan kiểm tra giao diện, đồ họa Pixel RPG, responsive và trải nghiệm gameplay trên cả máy tính lẫn điện thoại di động:
- **Phạm vi triển khai:** Toàn bộ frontend tĩnh (HTML5, CSS3 Pixel RPG tokens, JavaScript ES6+, Phaser 3 game engine, sprite sheets và animations).
- **Vị trí source code:** `src/main/resources/FrontEnd`.
- **Ranh giới hệ thống:** Vercel **chỉ phục vụ frontend tĩnh**. Backend Java 21, Spring Boot 4.2.0 và SQL Server không chạy trên Vercel. Không mở cổng database ra Internet.

---

## 2. THÔNG TIN TRIỂN KHAI THỰC TẾ (LIVE DEPLOYMENT STATUS)

- **Tài khoản Vercel:** `mky0611` (Team: `mky0624`)
- **Tên dự án:** `gamified-learning-platform`
- **Mã triển khai (Deployment ID):** `dpl_C3Vqob2As8xs3CAX71DWcyjrRBk2`
- **Deployment URL:** [https://gamified-learning-platform-82avq2pma-mky0624.vercel.app](https://gamified-learning-platform-82avq2pma-mky0624.vercel.app)
- **Production Alias URL:** [https://gamified-learning-platform-sandy.vercel.app](https://gamified-learning-platform-sandy.vercel.app)
- **Trạng thái:** `READY` (Hoạt động ổn định trên toàn cầu qua Vercel Edge Network).

---

## 3. CẤU HÌNH ĐIỀU HƯỚNG VÀ TÀI NGUYÊN (ROUTING & REWRITES)

Tập tin cấu hình [src/main/resources/FrontEnd/vercel.json](file:///d:/Program%20Files/HFR/PE_Test/GamifiedLearningPlatform/src/main/resources/FrontEnd/vercel.json) và [vercel.json](file:///d:/Program%20Files/HFR/PE_Test/GamifiedLearningPlatform/vercel.json) tại root được thiết lập chuẩn xác theo bảng điều hướng:

| Tuyến đường (Route) | Đích phục vụ (Destination) | Mô tả tính năng |
| :--- | :--- | :--- |
| `/`, `/app`, `/app/`, `/app/home` | `/src/pages/home.html` | Trang chủ: Hero grid, leaderboard, featured modes |
| `/app/minigame` | `/src/pages/minigame.html` | Boss Hunt: Đấu trường Phaser 3, word board, boss battle |
| `/app/quiz` | `/src/pages/quiz.html` | Quiz Challenge: Trắc nghiệm từ vựng & kiến thức |
| `/app/volcard` | `/src/pages/volcard.html` | Volcard: Flashcard học từ theo chuẩn CEFR & IT |
| `/app/account` | `/src/pages/account.html` | Tài khoản: Thông số hồ sơ RPG, tùy chọn loadout |
| `/app/memory` | `/src/pages/memory.html` | Memory Match: Lật thẻ tìm cặp từ |
| `/app/speed-math` | `/src/pages/speed-math.html` | Speed Math: Giải nhanh giữ nhịp học |
| `/app/code-puzzle` | `/src/pages/code-puzzle.html` | Code Puzzle: Rèn luyện tư duy lập trình |
| `/app/auth` | `/src/pages/auth.html` | Giao diện đăng nhập / đăng ký |
| `/ui/assets/(.*)` | `/assets/$1` | Ánh xạ toàn bộ CSS, JS, hình ảnh, spritesheets |
| `/ui/src/(.*)` | `/src/$1` | Ánh xạ các component giao diện |

> [!IMPORTANT]
> **Không sử dụng catch-all rewrite về `home.html`:** Các endpoint `/api/**` khi không có backend trả về mã HTTP 404 sạch sẽ thay vì trả về HTML của trang chủ. Điều này giúp các hàm gọi API trong `api.js` bắt được lỗi mạng qua `try/catch` và kích hoạt chế độ **Preview Fallback** mượt mà, không gây crash `JSON.parse`.
> Đã kiểm chứng: `GET https://gamified-learning-platform-sandy.vercel.app/api/lex-raid/test` trả về đúng HTTP 404.

---

## 4. KẾT QUẢ KIỂM THỬ TRỰC TIẾP TRÊN VERCEL (LIVE PROBE VERIFICATION)

Script kiểm thử tự động [src/main/resources/tools/probe_deployment.py](file:///d:/Program%20Files/HFR/PE_Test/GamifiedLearningPlatform/src/main/resources/tools/probe_deployment.py) đã probe toàn bộ 16 routes và assets trực tiếp trên Production URL:

| Endpoint | HTTP Status | Content-Type | Dung lượng | Kết quả |
| :--- | :---: | :--- | :---: | :---: |
| `/` | **200 OK** | `text/html; charset=utf-8` | 4,937 bytes | **PASS** |
| `/app` | **200 OK** | `text/html; charset=utf-8` | 4,937 bytes | **PASS** |
| `/app/home` | **200 OK** | `text/html; charset=utf-8` | 4,937 bytes | **PASS** |
| `/app/auth` | **200 OK** | `text/html; charset=utf-8` | 6,082 bytes | **PASS** |
| `/app/minigame` | **200 OK** | `text/html; charset=utf-8` | 14,613 bytes | **PASS** |
| `/app/quiz` | **200 OK** | `text/html; charset=utf-8` | 5,334 bytes | **PASS** |
| `/app/volcard` | **200 OK** | `text/html; charset=utf-8` | 6,771 bytes | **PASS** |
| `/app/account` | **200 OK** | `text/html; charset=utf-8` | 5,613 bytes | **PASS** |
| `/app/memory` | **200 OK** | `text/html; charset=utf-8` | 5,090 bytes | **PASS** |
| `/app/speed-math` | **200 OK** | `text/html; charset=utf-8` | 5,186 bytes | **PASS** |
| `/app/code-puzzle` | **200 OK** | `text/html; charset=utf-8` | 5,202 bytes | **PASS** |
| `/ui/assets/css/base.css` | **200 OK** | `text/css; charset=utf-8` | 13,404 bytes | **PASS** |
| `/ui/assets/js/minigame.js` | **200 OK** | `application/javascript; charset=utf-8` | 50,709 bytes | **PASS** |
| `/ui/assets/vendor/phaser.min.js` | **200 OK** | `application/javascript; charset=utf-8` | 1,196,122 bytes | **PASS** |
| `/ui/assets/imgs/logo.png` | **200 OK** | `image/png` | 5,889,986 bytes | **PASS** |
| `/ui/assets/units/warrior/idle.png` | **200 OK** | `image/png` | 9,948 bytes | **PASS** |

**Tổng kết probe:** 16/16 endpoints đạt chuẩn HTTP 200 OK (0 lỗi, 0 cảnh báo). Tải lại trực tiếp (direct refresh) không bị 404.

---

## 5. CHẾ ĐỘ XEM TRƯỚC (PREVIEW FALLBACK MODE)

Khi chạy trên Vercel không có backend Spring Boot và SQL Server, website tự động vận hành ở **Preview Mode** với dữ liệu demo độc lập, an toàn:

1. **Boss Hunt (Lex Raid):**
   - Khởi tạo stage demo `Whispering Rain Gate` đối đầu boss `Raincap Warden` (Shadow element).
   - Core word: `LEARN` với bảng chữ cái $5 \times 5$ cân bằng nguyên âm (~42%).
   - Hoạt ảnh tấn công, phòng thủ, hiệu ứng combo hoạt động đầy đủ trên Phaser 3.
   - Khi kết thúc trận đấu: Modal hiển thị cờ chiến thắng/kết thúc, số sao, điểm số và nhãn `Chế độ xem trước (Trận đấu xem trước, không tích lũy phần thưởng)`. Không lưu điểm ảo vào DB.
2. **Volcard:**
   - Bộ thẻ demo đa dạng chuẩn học thuật: `compile` (B1, IT_RUNTIMES), `variable` (B1, IT_PROG_FUND), `firewall` (B2, IT_NETWORKS), `endpoint` (B1, IT_BACKEND_API), `polymorphism` (C1, IT_OOP).
   - Hỗ trợ lọc theo CEFR pills (ALL, B1, B2, C1, UNKNOWN) và ô tìm kiếm thời gian thực.
   - Nút phát âm Web Speech API TTS kèm lưu ý giọng đọc máy.
3. **Quiz Challenge:**
   - Bộ 5 câu hỏi trắc nghiệm kiến thức cốt lõi của Lex Raid.
   - Phản hồi đúng/sai tức thì kèm giải thích chi tiết ở side panel.
4. **Tài khoản (Account Profile):**
   - Hiển thị giao diện hồ sơ người chơi với thanh EXP chuẩn toán học ($50/200$ XP, 25.0%).
   - Lưới chọn Hero (Warrior, Lancer, Archer) và Avatar (Knight, Lancer, Archer Crest) lưu cục bộ trên trình duyệt qua `localStorage`.
   - Hiển thị rõ banner `Chế độ xem trước: Dữ liệu chưa đồng bộ với SQL Server`.
5. **Bảo mật & An toàn dữ liệu:**
   - Không lưu tài khoản/mật khẩu giả mạo.
   - Không chứa bất kỳ secret hay credential nào trong mã nguồn frontend.

---

## 6. KẾT QUẢ KIỂM THỬ TRƯỚC KHI DEPLOY (PRE-DEPLOY QA)

1. **Kiểm tra cú pháp JS & DOM IDs (`smoke_check.py`):**
   - JS syntax errors: **0**
   - Missing DOM IDs: **0**
   - Missing asset paths: **0**
2. **Kiểm tra phân biệt hoa thường trên Linux (`check_case_sensitivity.py`):**
   - Tổng số file trên đĩa: **348**
   - Đường dẫn động Phaser frames: **129**
   - Missing assets: **0**
   - Case mismatches: **0** (100% tài nguyên khớp chữ hoa/thường chuẩn xác cho môi trường Linux của Vercel).
3. **Kiểm tra mã nguồn nhạy cảm (`git_security_scanner.py`):**
   - Working tree: **0 secrets** (Sạch hoàn toàn).

---

## 7. CÁC TÍNH NĂNG KIỂM TRA ĐƯỢC VS CẦN BACKEND THẬT

| Nhóm tính năng | Kiểm tra được trên Vercel Preview | Cần Backend Spring Boot + SQL Server |
| :--- | :---: | :---: |
| **Giao diện Pixel RPG (Desktop & Mobile)** | **CÓ** (Hoạt động 100%) | Không cần |
| **Animation Hero & Boss (Phaser 3)** | **CÓ** (Hoạt động 100%) | Không cần |
| **Ghép chữ, Đấu từ vựng Lex Raid (Stage Demo)** | **CÓ** (Hoạt động 100%) | Không cần |
| **Thẻ học Volcard (Bộ thẻ demo + Lọc CEFR + TTS)** | **CÓ** (Hoạt động 100%) | Không cần |
| **Trắc nghiệm Quiz Challenge (Bộ đề demo 5 câu)** | **CÓ** (Hoạt động 100%) | Không cần |
| **Loadout Hero & Avatar Selector (Lưu localStorage)** | **CÓ** (Hoạt động 100%) | Không cần |
| **Đăng ký / Đăng nhập tài khoản thật** | Không (Chỉ xem form UI) | **CẦN** (Spring Security + JWT) |
| **Lưu vĩnh viễn tiến trình XP, Level, Coins vào DB** | Không (Không ghi ảo) | **CẦN** (SQL Server + Pessimistic Lock) |
| **Cộng điểm & Lưu sao kỷ lục Stage** | Không (Không ghi ảo) | **CẦN** (SQL Server) |
| **Nhập liệu toàn bộ 2.098 từ vựng seed** | Không | **CẦN** (SQL Server + Spring Data) |

---

## 8. CÁC VẤN ĐỀ ĐÃ GHI NHẬN TỪ PHASE P3 (KNOWN ISSUES)
- **Điểm kết liễu Boss:** Event kết liễu Boss cần hoàn thiện việc ghi nhận trước khi finalize session.
- **SQL Server Concurrency:** Kiểm thử khóa bi quan transaction thực tế trên SQL Server cần instance DB hoạt động ngoài sandbox.
- **Vercel Preview Scope:** Bản deploy này là bản xem trước giao diện và trải nghiệm gameplay độc lập (Frontend Preview), không thay thế việc kiểm thử tích hợp backend Spring Boot.
