# BÁO CÁO KIỂM TOÁN TÀI NGUYÊN HÌNH ẢNH TOÀN DIỆN — PHASE P4-B
## LEX RAID COMPREHENSIVE ASSET AUDIT & PIPELINE REPORT

**Thời điểm lập:** 25/11/2026  
**Dự án:** Gamified Learning Platform — Lex Raid  
**Tập tin công cụ:** `src/main/resources/tools/audit_assets.py`  
**Dữ liệu đi kèm:** `docs/P4B_ASSET_INVENTORY.csv`, `docs/P4B_ASSET_MANIFEST.json`, `docs/P4B_ASSET_RENAME_MAP.csv`  

---

## 1. TỔNG QUAN DỮ LIỆU KIỂM TOÁN TÀI NGUYÊN (ASSET METRICS)

- **Tổng số tài nguyên hình ảnh được quét:** **306 assets**
- **Tổng dung lượng đĩa:** **90,354,351 bytes (~86.17 MB)**
- **Số tài nguyên trùng lặp hash hoàn toàn (Duplicate Hashes):** **98 assets**
- **Số tài nguyên có vấn đề về đặt tên (Khoảng trắng, Chữ hoa):** **121 assets**
- **Phân bổ theo định dạng:**
  - PNG: 302 files
  - GIF: 4 files (`map1.gif`, `map2.gif`, `map3.gif`, `ui/fx/dust_01.png`)
- **Phân bổ theo nhóm chức năng:**
  - Bosses (Quái vật & Animations): 164 files
  - Heroes (Chiến binh, Thương thủ, Cung thủ): 16 files
  - UI Icons (Biểu tượng HUD & Vật phẩm): 41 files
  - Panels & Frames (Khung gỗ, giấy da, thanh máu): 26 files
  - Buttons (Nút bấm, tương tác): 7 files
  - Avatars (Chân dung người chơi & Hero crests): 6 files
  - Backgrounds & Maps: 4 files
  - Effects & FX (Bụi, nổ, vệt kiếm): 8 files
  - Logo & Illustrations: 22 files
  - QA Audit & Contact Sheets: 12 files

---

## 2. PHÁT HIỆN CÁC LỖI NGHIÊM TRỌNG TRÊN ASSET HIỆN CÓ

### A. Logo Thương Hiệu (`assets/imgs/logo.png`)
- **Kích thước thực tế:** $2816 \times 1536$ px (Dung lượng: 5.88 MB).
- **Phân tích kênh Alpha:** Bbox của file là toàn bộ hình ảnh $(0, 0, 2816, 1536)$, không có alpha trong suốt. Bốn góc có màu tím nhạt/lavender `(224, 222, 243)`.
- **Vùng nội dung thực:** Nằm từ $X=768 \rightarrow 2748, Y=228 \rightarrow 1470$ ($1980 \times 1242$ px). Toàn bộ dải bên trái rộng 768px là khoảng trống nền thừa.
- **Hệ quả trên UI:** Khi đặt vào thanh điều hướng (Navbar) với chiều cao 36–40px, logo bị co nhỏ xíu, hiển thị nguyên một mảng chữ nhật màu tím nhạt chọi hoàn toàn với nền gỗ sẫm của thanh điều hướng.
- **Giải pháp:** Cắt tỉa (crop) chuẩn xác vùng chứa Logo Mark và Wordmark, tách nền trong suốt (transparent alpha PNG), tối ưu hóa kích thước về chuẩn Retina ($180 \times 48$ px hoặc $240 \times 64$ px), giảm dung lượng từ 5.88 MB xuống dưới 25 KB.

### B. Bộ Avatar Người Chơi (`assets/imgs/avatar1.png`, `avatar2.png`, `avatar3.png`)
- **Kích thước thực tế:**
  - `avatar1.png`: $2816 \times 1536$ px (6.02 MB)
  - `avatar2.png`: $2048 \times 2048$ px (7.42 MB)
  - `avatar3.png`: $2816 \times 1536$ px (8.50 MB)
- **Tổng dung lượng 3 file:** **21.94 MB** (chiếm hơn 25% dung lượng toàn bộ frontend).
- **Phân tích:** Đây là các bức tranh nền minh họa lớn được gán nhầm làm ảnh đại diện tròn 48x48px trên trang Tài khoản (`account.html`).
- **Tài nguyên thay thế chuẩn:** Thư mục `assets/ui/avatars/` đã có sẵn các icon pixel art tuyệt đẹp:
  - `avatar-ts-1.png`: Knight Crest (256x256, 6 KB)
  - `avatar-ts-18.png`: Lancer Crest (256x256, 5 KB)
  - `avatar-ts-8.png`: Archer Crest (256x256, 5 KB)
- **Giải pháp:** Cập nhật đường dẫn trong `account.js` sang các asset pixel art chuẩn, giữ nguyên tương thích DB key `avatar-a`, `avatar-b`, `avatar-c`. Tiết kiệm ngay 22 MB tải trang.

### C. Lỗi Đặt Tên Chứa Khoảng Trắng và Chữ Hoa
- 121 file sprite trong `assets/monsters/treasure/` có tên dạng `Attack 1 01.png`, `Idle Sword 01.png`, `Hit 01.png`.
- Tên chứa khoảng trắng dễ gây lỗi khi deploy trên server Linux hoặc khi xử lý đường dẫn URL mã hóa `%20`.
- **Giải pháp:** Tạo cơ chế mapping an toàn hoặc giữ alias tương thích trong `raid-config.js`.

---

## 3. BẢNG MAPPING ĐỒNG NHẤT DANH TÍNH (HERO & BOSS IDENTITY MAPPING)

### A. Danh tính 3 Hero
| Hero Key | Tên hiển thị | Frame Size | Visible Height | Baseline Foot Y | Đường dẫn Idle Sprite | Avatar Icon |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `warrior` | Hiệp sĩ (Warrior) | 192x192 | ~62px | Y=137 | `/ui/assets/units/warrior/idle.png` | `/ui/assets/ui/avatars/avatar-ts-1.png` |
| `lancer` | Thương thủ (Lancer) | 192x192 | ~65px | Y=178 | `/ui/assets/units/lancer/normalized/idle.png` | `/ui/assets/ui/avatars/avatar-ts-18.png` |
| `archer` | Cung thủ (Archer) | 192x192 | ~60px | Y=136 | `/ui/assets/units/archer/idle.png` | `/ui/assets/ui/avatars/avatar-ts-8.png` |

### B. Danh tính 9 Boss
| Boss Code / Key | Tên lore hiển thị | Sprite Arena thực tế | Kích thước frame | Tỉ lệ scale đề xuất | Chân dung HUD Portrait |
| :--- | :--- | :--- | :---: | :---: | :--- |
| `crabby` | Crabby (Cua Cướp Biển) | Cua hai càng cầm kiếm | 32x32 | 2.8 | `monsters/treasure/crabby/idle/Idle 01.png` |
| `captain` | Captain Clown Nose | Thuyền trưởng mũi đỏ | 40x40 | 2.5 | `monsters/treasure/captain/idle/Idle Sword 01.png` |
| `fierce` | Fierce Tooth | Quái vật răng nhọn | 30x30 | 3.2 | `monsters/treasure/fierce/idle/Idle 01.png` |
| `pink` | Pink Star | Sao biển hồng gai góc | 30x30 | 3.2 | `monsters/treasure/pink/idle/Idle 01.png` |
| `totem1` | Totem Guardian I | Đầu tượng cổ Totem 1 | 32x32 | 2.8 | `monsters/treasure/totem1/idle/1.png` |
| `totem2` | Totem Guardian II | Đầu tượng cổ Totem 2 | 32x32 | 2.8 | `monsters/treasure/totem2/idle/1.png` |
| `totem3` | Totem Guardian III | Đầu tượng cổ Totem 3 | 32x32 | 2.8 | `monsters/treasure/totem3/idle/1.png` |
| `seashell` | Seashell Golem | Sò gai đại dương | 32x32 | 2.8 | `monsters/treasure/seashell/idle/1.png` |
| `cannon` | Iron Cannon | Đại bác cướp biển | 32x32 | 3.0 | `monsters/treasure/cannon/idle/1.png` |

> [!NOTE]
> Khắc phục dứt điểm sự không đồng nhất: Khi boss trên sân đấu là `Crabby`, Boss HUD sẽ hiển thị đúng tên `Cua Cướp Biển (Crabby)` và chân dung thực của Crabby thay vì ảnh đại diện hiệp sĩ tí hon.

---

## 4. TỔNG KẾT VÀ BƯỚC THỰC HIỆN TIẾP THEO

1. **Khởi tạo bộ assets tối ưu:**
   - Cắt tỉa `logo.png` thành `logo-clean.png` (trong suốt, sắc nét).
   - Tạo các chân dung Boss 48x48px từ frame 1 của từng quái vật.
2. **Cập nhật ánh xạ mã nguồn:** Thay thế triệt để các tham chiếu đến các file 6MB–8MB trong HTML/JS/CSS.
3. **Bảo tồn tương thích:** Không xóa các file gốc đang tồn tại để tránh rủi ro sinh lỗi 404 cho bất kỳ liên kết tĩnh cũ nào.
