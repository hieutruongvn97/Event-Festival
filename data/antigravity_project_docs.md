# 🏮 HỒ SƠ KIẾN TRÚC, CẤU HÌNH & MÔI TRƯỜNG DỰ ÁN (PROJECT HANDOFF DOCS)
> **Dành cho:** Môi trường IDE AI (Antigravity / Cursor / Windsurf / VS Code) & Nhà phát triển  
> **Tên dự án:** Hệ thống Tra Cứu Lễ Hội Địa Phương Việt Nam (2026–2099)  
> **Tác giả / Chủ sở hữu:** **MH-SAMA**  
> **File thực thi chính:** `TraCuuLeHoi_THU.html` (Single-File Web Application)  
> **Backend & Cơ sở dữ liệu:** Google Sheets + Google Apps Script (`Code.gs`)

---

## 1. TỔNG QUAN KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE)

Dự án được thiết kế theo kiến trúc **Serverless Single-File Web Application (SPA gói gọn trong 1 file HTML duy nhất)** kết hợp với **Google Sheets làm Cloud Database** thông qua **Google Apps Script Web App API**:

1. **Frontend (`TraCuuLeHoi_THU.html`):**
   - Toàn bộ HTML5, CSS3 (Dark Mode UI) và Vanilla JavaScript (ES6+) nằm gọn trong **1 file duy nhất** (`TraCuuLeHoi_THU.html`), không phụ thuộc thư viện ngoài (Zero external dependencies), có thể chạy trực tiếp qua giao thức `file://` trên máy tính hoặc host tĩnh (GitHub Pages, Vercel, Netlify, Google Drive).
   - Tích hợp bộ máy tính toán **Lịch Âm - Dương Việt Nam (2026–2099)** theo thuật toán thiên văn Hồ Ngọc Đức (múi giờ `UTC+7`), có bộ đệm (`yearLunarCache` & `yearLunarDetailCache`) giúp quy đổi tức thì.
2. **Cloud Backend (`Code.gs` trên Google Apps Script):**
   - Đóng vai trò RESTful API thông qua `doGet(e)` và `doPost(e)`.
   - Sử dụng `ContentService.createTextOutput(...).setMimeType(ContentService.MimeType.JSON)` để trả về JSON chuẩn.
   - Giao tiếp từ trình duyệt dùng **Simple Request (`Content-Type: text/plain;charset=utf-8`)** kết hợp cơ chế dự phòng `mode: "no-cors"` nhằm vượt qua rào cản CORS Preflight (`OPTIONS`) của Google Apps Script khi mở từ `file://`.
3. **Cơ chế Đồng bộ 2 chiều an toàn (`Safe Merge`) & Chống mất dữ liệu:**
   - Không bao giờ xóa trắng bảng để ghi đè.
   - Đối chiếu từng bản ghi theo `id` hoặc dấu vân tay `fingerprint` (`name|location|lunarDay|lunarMonth`) và mốc thời gian `updatedAt` (ISO 8601).
   - Sử dụng `LockService.getScriptLock()` trên Apps Script để chống xung đột khi nhiều người truy cập cùng lúc.
   - Tự động chụp bản sao lưu (`Snapshot JSON`) vào trang tính `Backup_LichSu` trước mọi thao tác thay đổi (giữ tối đa 100 bản sao lưu gần nhất).

---

## 2. THÔNG SỐ MÔI TRƯỜNG & CẤU HÌNH HIỆN TẠI (ENVIRONMENT & CONFIG)

Khi nâng cấp hoặc chỉnh sửa file `TraCuuLeHoi_THU.html`, **BẮT BUỘC GIỮ NGUYÊN** các hằng số cấu hình đã kết nối sau đây (nằm ở đầu thẻ `<script>`):

| Hằng số / Biến cấu hình | Giá trị hiện tại | Ý nghĩa & Vai trò |
| :--- | :--- | :--- |
| **`AUTHOR_CREDIT`** | `MH-SAMA` | Hiển thị tại `.author-badge` (đầu trang) và `.app-footer` (cuối trang). |
| **`START_YEAR`** | `2026` | Năm Dương lịch bắt đầu tra cứu & quy đổi. |
| **`END_YEAR`** | `2099` | Năm Dương lịch kết thúc tra cứu & quy đổi. |
| **`TIME_ZONE`** | `7` | Múi giờ chuẩn Việt Nam (`UTC+7`). |
| **`DEFAULT_LOCAL_ADMIN_KEY`** | `"HIEUADMIN"` | Mã khóa Chủ sở hữu (Admin Secret Key) mặc định để mở khóa quyền Thêm/Sửa/Xóa/Duyệt. |
| **`DEFAULT_SCRIPT_URL`** | `"https://script.google.com/macros/s/AKfycbyMt6wB6XjTpKS6F05HsNvmg90HHwtqFXE4Sfi9rTgF7Euy_MANLUH_0tuvavJystw2Hw/exec"` | Đường dẫn Web App URL của Google Apps Script đã triển khai và kết nối với Google Sheets của Admin. |
| **`CORE_REGIONS`** | `["Miền Nam", "Miền Trung", "Miền Bắc"]` | 3 vùng miền gốc mặc định (người dùng có thể tạo thêm miền tùy chỉnh như *Cá Nhân*, *Cả Nước*, *Tây Nguyên*...). |
| **`PENDING_PREFIX`** | `"[CHỜ DUYỆT] "` | Tiền tố gắn vào `lunarLabel` để đánh dấu lễ hội do Khách đề xuất đang nằm trong Hàng chờ xét duyệt. |

### Cấu hình Triển khai Google Apps Script (Deployment Settings)
- **Execute as (Thực thi dưới dạng):** `Me` (Chủ sở hữu tài khoản Google tạo Sheet).
- **Who has access (Ai có quyền truy cập):** `Anyone` (Bất kỳ ai) — *Bắt buộc chọn "Anyone" để tài khoản Khách hoặc trình duyệt ẩn danh không bị chặn lỗi CORS.*

---

## 3. CẤU TRÚC CƠ SỞ DỮ LIỆU GOOGLE SHEETS & LOCALSTORAGE

### 3.1. Cấu trúc 2 Trang tính (Tabs) trên Google Sheets
1. **Trang tính chính `LeHoi` (11 cột từ A đến K):**
   - `Cột A (id)`: Mã định danh duy nhất (Number/Timestamp hoặc String).
   - `Cột B (name)`: Tên lễ hội hoặc sự kiện.
   - `Cột C (location)`: Tỉnh / Thành phố diễn ra.
   - `Cột D (region)`: Vùng miền (`Miền Nam`, `Miền Trung`, `Miền Bắc`, hoặc vùng miền tự tạo).
   - `Cột E (lunarDay)`: Ngày chính hội (`1–30` nếu Âm lịch; `1–31` nếu Dương lịch).
   - `Cột F (lunarMonth)`: Tháng chính hội (`1–12`).
   - `Cột G (lunarLabel)`: Nhãn hiển thị mốc lịch:
     - Lễ hội Âm lịch đã duyệt: `"15/01 ÂL"`
     - Sự kiện Dương lịch cố định đã duyệt: `"30/04 DL"`
     - Lễ hội đang chờ Admin duyệt: `"[CHỜ DUYỆT] 15/08 ÂL"` hoặc `"[CHỜ DUYỆT] 02/09 DL"`
   - `Cột H (duration)`: Thời gian kéo dài (VD: `"3 ngày"`).
   - `Cột I (highlights)`: Ghi chú / Đặc trưng văn hóa (kèm tên người đề xuất nếu do Khách gửi).
   - `Cột J (updatedAt)`: Thời gian cập nhật chuẩn ISO 8601 (`YYYY-MM-DDTHH:mm:ss.sssZ`).
   - `Cột K (deleted)`: Cờ xóa mềm (`TRUE` / `FALSE`).

2. **Trang tính sao lưu `Backup_LichSu` (4 cột từ A đến D):**
   - `Cột A`: Thời gian sao lưu (ISO 8601).
   - `Cột B`: Tên thao tác (`UPSERT`, `DELETE`, `SYNC_MERGE`, `GUEST_PROPOSE`).
   - `Cột C`: Số lượng lễ hội đang hoạt động.
   - `Cột D`: Toàn bộ dữ liệu JSON Snapshot trước khi thay đổi.

### 3.2. Danh sách Khóa lưu trữ cục bộ (`localStorage` Keys)
Tất cả thao tác đọc/ghi `localStorage` đều đi qua hàm bọc an toàn `safeGetStorage()`, `safeSetStorage()`, `safeRemoveStorage()`:
- `vn_festivals_2026_2099`: Mảng JSON chứa toàn bộ danh sách lễ hội (cả `approved` và `pending`).
- `vn_festivals_pending_queue`: Hàng chờ lưu riêng các đề xuất từ Khách chưa được duyệt (đảm bảo đồng bộ tức thì giữa các tab và không bị mất khi tải lại trang).
- `vn_festivals_resolved_pending_ids`: Danh sách ID các đề xuất đã được Admin Duyệt hoặc Từ chối (ngăn việc phục hồi nhầm đề xuất cũ).
- `vn_festivals_custom_regions`: Mảng JSON lưu các vùng miền do người dùng tự tạo thêm.
- `vn_festivals_cloud_config`: Cấu hình kết nối `{ scriptUrl, autoSync, lastSync }`.
- `vn_festivals_owner_key`: Lưu mã khóa Admin nếu người dùng tích chọn *"Ghi nhớ trạng thái Chủ sở hữu"*.
- `vn_festivals_last_verified_key`: Lưu mã khóa đã xác thực gần nhất để hỗ trợ cơ chế gửi đề xuất tương thích ngược.
- `vn_festivals_undo_snapshot`: Bản chụp hoàn tác (`↩️ Hoàn tác`) trên trình duyệt.

---

## 4. DANH MỤC TÍNH NĂNG ĐÃ TRIỂN KHAI (IMPLEMENTED FEATURES)

1. **Phân quyền 2 Chế độ (Chủ sở hữu vs. Khách):**
   - **Chế độ Khách (`body.guest-mode`):** Tự động ẩn toàn bộ các nút quản trị có class `.owner-only` (`+ Thêm lễ hội mới`, `+ Thêm miền`, `🗺️ Quản lý Vùng miền`, `✏️ Sửa`, `🗑 Xóa`, `⚙️ Cấu hình`, `📖 Hướng dẫn`, `📂 Khôi phục`, `🔄 Mặc định`). Chỉ hiện nút **`📝 Đề xuất lễ hội mới`** (`.guest-only`).
   - **Chế độ Chủ sở hữu (`🔓 Chủ sở hữu`):** Mở khóa bằng mã `HIEUADMIN`, hiển thị đầy đủ công cụ quản trị và nút **`⏳ Hàng chờ duyệt`**.
2. **Luồng Đề xuất Lễ hội của Khách & Hàng chờ Xét duyệt của Admin:**
   - Khách nhập lễ hội mới $\rightarrow$ Gắn tiền tố `[CHỜ DUYỆT] ` vào `lunarLabel` và `status: "pending"` $\rightarrow$ Đẩy thẳng lên Google Sheets & lưu vào `vn_festivals_pending_queue`.
   - Lễ hội đang chờ duyệt **ẩn hoàn toàn khỏi bảng tra cứu công khai** và không tính vào số đếm trên tab vùng miền.
   - Admin mở **`⏳ Hàng chờ duyệt`** có thể: **`✅ Duyệt đăng chính thức`**, **`✏️ Sửa & Duyệt`**, **`❌ Từ chối / Xóa`**, hoặc **`✅ Duyệt đăng tất cả`**.
3. **Bộ lọc & Tìm kiếm Thông minh:**
   - Lọc theo **Vùng miền** (kèm huy hiệu đếm số lượng lễ hội từng miền, hỗ trợ tạo/xóa miền tùy chỉnh).
   - Lọc theo **Tháng Dương lịch** (`Tất cả tháng`, `Tháng 01` $\rightarrow$ `Tháng 12`) và **Năm Dương lịch** (`2026` $\rightarrow$ `2099`).
   - **Tìm kiếm tiếng Việt không dấu** (`removeVietnameseTones`) theo tên lễ hội, tỉnh thành, vùng miền, mốc lịch, đặc trưng.
   - **3 chế độ sắp xếp:** Theo Vùng miền, Theo Ngày Dương lịch (T1 $\rightarrow$ T12), và Sắp diễn ra gần nhất.
4. **Thuật toán Lịch & Tích hợp Google Calendar (1 Năm & Nhiều Năm):**
   - Hỗ trợ cả **Lễ hội Âm lịch truyền thống** (tự động lùi ngày 30 ÂL về 29 ÂL nếu năm đó là tháng thiếu) và **Sự kiện Dương lịch cố định hàng năm (`DL`)**.
   - Hiển thị nhãn đếm ngược trực quan: `🎉 Diễn ra hôm nay`, `⏳ Còn X ngày`, `Đã qua X ngày`.
   - **Lưu 1 năm vào Google Calendar:** Nút `📅 Thêm vào Google Calendar (YYYY)` hoặc bấm trực tiếp vào từng ô năm trong bảng đối chiếu 2026–2099.
   - **Lưu nhiều năm vào Google Calendar (`#multiYearCalModal`):**
     - Xuất file lịch chuẩn **`.ics` nhiều năm** (5 năm, 10 năm, 20 năm, 30 năm, hoặc trọn bộ tới 2099) tích hợp sẵn chuông báo (`VALARM`) và mở thẳng trang Import của Google Calendar.
     - Hỗ trợ tạo sự kiện lặp hàng năm (`RRULE:FREQ=YEARLY`) cho sự kiện Dương lịch cố định hoặc mở nhanh 5 tab liên tiếp.
5. **Xuất file HTML cho Khách (`📤 Xuất file cho Khách`):**
   - Đóng gói ra file `TraCuuLeHoi_THU_KhachXem.html` đã nhúng sẵn `DEFAULT_SCRIPT_URL`, `DEFAULT_CUSTOM_REGIONS` và `DEFAULT_GUEST_TOKEN` (mã hóa Base64) để Khách mở trên bất kỳ máy nào cũng tự động đồng bộ lịch và gửi đề xuất chờ duyệt được ngay.

---

## 5. QUY TẮC BẮT BUỘC KHI DÙNG AI (ANTIGRAVITY) ĐỂ NÂNG CẤP VỀ SAU

Khi yêu cầu Antigravity hoặc bất kỳ AI Agent nào chỉnh sửa file `TraCuuLeHoi_THU.html`, hãy nhắc AI tuân thủ **5 quy tắc bất di bất dịch** sau để không làm hỏng ứng dụng:

1. **KHÔNG dùng `alert()`, `confirm()`, `prompt()` gốc của trình duyệt:**
   - Luôn sử dụng hệ thống `showToast(message, type)` (`"info"`, `"success"`, `"warn"`, `"error"`) và `openConfirmModal(title, message, onConfirm)` đã xây dựng sẵn trong ứng dụng.
2. **LUÔN bọc `localStorage` trong `try/catch`:**
   - Chỉ gọi qua `safeGetStorage(key)`, `safeSetStorage(key, val)`, `safeRemoveStorage(key)` để không bị crash khi người dùng mở trong iframe hoặc chế độ ẩn danh chặn cookie.
3. **BẢO TOÀN cơ chế Tương thích ngược với Google Sheets 11 cột:**
   - Không tự ý thay đổi thứ tự 11 cột của trang tính `LeHoi` (`id, name, location, region, lunarDay, lunarMonth, lunarLabel, duration, highlights, updatedAt, deleted`).
   - Nếu cần thêm thuộc tính trạng thái mới (như `[CHỜ DUYỆT]` hoặc loại lịch `DL`/`ÂL`), hãy mã hóa thông minh vào `lunarLabel` hoặc `highlights` như thiết kế hiện tại để không phá vỡ cấu trúc bảng tính đang chạy.
4. **GIỮ NGUYÊN phân quyền `.owner-only` và `.guest-only`:**
   - Mọi nút chỉnh sửa dữ liệu chính thức phải có class `owner-only` và gọi qua hàm `requireOwnerAuth(() => { ... }, "Mô tả thao tác")`.
5. **KIỂM TRA tính toàn vẹn trước khi xuất bản:**
   - Đảm bảo không có lỗi cú pháp JS, mọi hàm gắn trong `onclick="..."` đều tồn tại ở phạm vi toàn cục (`window`), và giữ nguyên tác giả `MH-SAMA` cùng `DEFAULT_SCRIPT_URL`.
