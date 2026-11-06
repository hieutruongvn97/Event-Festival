# 📝 NHẬT KÝ PHÁT TRIỂN DỰ ÁN (DEV_LOG.md)
> **Dự án:** Tra Cứu Lễ Hội Địa Phương Việt Nam (2026–2099)  
> **Tác giả:** MH-SAMA  
> **Kiến trúc:** Single-File Web App (HTML5 + CSS3 + Vanilla JS) + Google Sheets & Apps Script Backend + Android WebView

---

## 📅 LỊCH SỬ PHÁT TRIỂN & CÁC CỘT MỐC ĐÃ HOÀN THÀNH

### [Phiên bản 1.0.0 - 1.5.0] Khởi tạo nền tảng & Thuật toán Lịch Âm - Dương
- **Thuật toán Thiên văn Hồ Ngọc Đức:**
  - Tích hợp công thức tính mốc Sóc và Tiết khí múi giờ `UTC+7` cho khoảng thời gian từ năm 2026 đến 2099.
  - Tối ưu bộ đệm (`yearLunarCache`, `yearLunarDetailCache`) giúp tính toán quy đổi tức thì, không giật lag.
  - Xử lý thông minh tháng thiếu Âm lịch (nếu ngày 30 ÂL rơi vào tháng thiếu thì tự động lùi về ngày 29 ÂL).
  - Bổ sung hỗ trợ các ngày lễ Dương lịch cố định (hậu tố `DL`, ví dụ: `30/04 DL`, `02/09 DL`).
- **Giao diện người dùng (Dark Mode UI):**
  - Xây dựng giao diện Dark Mode hiện đại, bảng màu trực quan cho các vùng miền (Miền Bắc, Miền Trung, Miền Nam).
  - Tích hợp đếm ngược ngày hội: `🎉 Diễn ra hôm nay`, `⏳ Còn X ngày`, `Đã qua X ngày`.
  - Bộ lọc thông minh theo Miền, theo Tháng (T1 - T12), và tìm kiếm Tiếng Việt không dấu (`removeVietnameseTones`).

---

### [Phiên bản 2.0.0 - 2.5.0] Tích hợp Cloud Database Google Sheets & Đồng bộ An toàn
- **Backend Google Apps Script (`Code.gs`):**
  - Xây dựng Web App REST API (`doGet`, `doPost`) giao tiếp chuẩn JSON.
  - Giải quyết bài toán CORS và Preflight `OPTIONS` khi mở file qua giao thức `file://` bằng cách sử dụng Simple Request (`Content-Type: text/plain;charset=utf-8`).
  - Phân quyền bảo mật qua mã khóa Chủ sở hữu `DEFAULT_LOCAL_ADMIN_KEY = "HIEUADMIN"`.
- **Cơ chế Safe Merge & Chống xung đột dữ liệu:**
  - Không ghi đè mù quáng hay xóa trắng bảng tính.
  - So khớp từng bản ghi theo `id` hoặc `fingerprint` (`name|location|lunarDay|lunarMonth`) cùng tem thời gian `updatedAt` (ISO 8601).
  - Áp dụng `LockService.getScriptLock()` trên Google Apps Script để tránh ghi đè đồng thời.
  - Cơ chế tự động sao lưu Snapshot vào trang tính `Backup_LichSu` trước mọi thao tác sửa đổi (lưu 100 bản sao lưu gần nhất).

---

### [Phiên bản 3.0.0 - 3.2.0] Phân quyền 2 Chế độ, Hàng chờ Duyệt & Tích hợp Lịch
- **Phân quyền Khách vs. Chủ sở hữu:**
  - Chế độ Khách (`body.guest-mode`): Ẩn toàn bộ nút sửa đổi dữ liệu chính thức, chỉ hiển thị nút `📝 Đề xuất lễ hội mới`.
  - Chế độ Chủ sở hữu: Mở khóa bằng mã khóa bí mật, quản lý hàng chờ duyệt và toàn quyền CRUD.
- **Quy trình Đề xuất & Hàng chờ xét duyệt (`Pending Queue`):**
  - Khách gửi đề xuất $\rightarrow$ gắn cờ `[CHỜ DUYỆT]` vào `lunarLabel` và lưu vào hàng chờ duyệt, không hiển thị trên danh sách công khai.
  - Chủ sở hữu duyệt: Có tùy chọn Duyệt chính thức, Sửa & Duyệt, Từ chối / Xóa hoặc Duyệt tất cả.
  - Cơ chế đồng bộ cục bộ an toàn bằng `safeGetStorage()`, `safeSetStorage()` chống lỗi khi chạy trong iframe hoặc chế độ ẩn danh.
- **Tích hợp Google Calendar Nâng cao:**
  - Thêm sự kiện từng năm vào Google Calendar qua link trực tiếp.
  - Hộp thoại Xuất file lịch `.ics` nhiều năm (5, 10, 20 năm hoặc đến 2099) kèm chuông báo nhắc hẹn (`VALARM`).
- **Đóng gói xuất file cho Khách:**
  - Tính năng `📤 Xuất file cho Khách` (`TraCuuLeHoi_THU_KhachXem.html`) tự động nhúng cấu hình URL và token Khách để chia sẻ dễ dàng.

---

### [Phiên bản Mobile & CI/CD] Đóng gói Android Native App & GitHub Actions
- **Dự án Android (`android/`):**
  - Sử dụng WebView tối ưu hóa cao (`MainActivity.java`), hỗ trợ lưu trữ cục bộ (DOM Storage, Database) và bắt sự kiện nút Back vật lý.
  - Điều hướng thông minh: Mở các liên kết nội bộ `file:///android_asset/www/index.html` trong app và mở các liên kết ngoài (Google Calendar, Web App) bằng trình duyệt mặc định.
- **Tự động hóa CI/CD (.github/workflows/build-apk.yml):**
  - Thiết lập GitHub Actions tự động build file APK Debug mỗi khi push code lên nhánh `main` hoặc `master`.
  - Đồng bộ mã nguồn web sang thư mục `android/app/src/main/assets/www/index.html`.

---

### [Phiên bản 3.3.0] Nâng Cấp Giao Diện Toàn Diện (Đêm Hội Hoa Đăng, Thẻ Bài & Yêu Thích)
- **Thiết kế Visual "Đêm Hội Hoa Đăng":**
  - Cặp lồng đèn Hội An chuyển động đung đưa nhịp nhàng 2 bên góc Header (`CSS keyframes sway`).
  - Tiêu đề mạ vàng ánh kim lấp lánh (`Gold foil text shimmer`) và huy hiệu tác giả `MH-SAMA` sang trọng.
  - Tự động hiển thị Lịch Vạn Niên Hôm Nay (Thứ, Ngày/Tháng/Năm Dương lịch song hành cùng Ngày/Tháng/Năm Can Chi Âm lịch chuẩn xác).
  - Huy hiệu `🎉 Diễn ra hôm nay` với hiệu ứng phát sáng nhịp tim (`Pulse Glow`) rực rỡ.
- **Chế độ xem Kép (Dual View):**
  - **Dạng Thẻ Bài (Card Grid View):** Tối ưu hoàn hảo cho màn hình cảm ứng điện thoại, bố cục trực quan, hiển thị song song mốc Âm & Dương lịch, tích hợp drawer xem đối chiếu các năm 2026–2099 ngay trong thẻ.
  - **Dạng Bảng (Table View):** Giữ nguyên bảng tra cứu chi tiết 5 cột dành cho màn hình máy tính lớn.
  - Nút chuyển đổi nhanh `[🎴 Dạng Thẻ] ↔ [📋 Dạng Bảng]` lưu trạng thái vào `localStorage`.
- **Tính năng Lễ Hội Gia Đình Yêu Thích (❤️ Favorites):**
  - Biểu tượng thả tim ❤️ trên từng thẻ bài và hàng bảng dữ liệu.
  - Tab lọc nhanh `❤️ Yêu thích` kèm bộ đếm số lượng, giúp các thành viên trong gia đình đánh dấu các ngày hội định đi.
- **Đồng bộ Android Assets:**
  - Đồng bộ ngay mã nguồn mới nhất sang `android/app/src/main/assets/www/index.html`.

---

### [Phiên bản 3.4.0] Triển Khai Bước 2: Hệ Thống Tài Khoản Gia Đình & Phân Quyền Admin (Google Sheets)
- **Cơ sở dữ liệu người dùng (`NguoiDung` trên Google Sheets):**
  - Tự động khởi tạo trang tính `NguoiDung` gồm 9 cột: `id, username, displayName, passwordHash, salt, role, status, createdAt, lastLogin`.
  - Khởi tạo sẵn tài khoản Admin mặc định (`admin` / `HIEUADMIN`).
- **Bảo mật SHA-256 + Salt:**
  - Mật khẩu người dùng được băm qua hàm `Utilities.computeDigest` của Apps Script với chuỗi muối ngẫu nhiên (Salt 16 ký tự).
  - Không lưu mật khẩu dạng thô, chống dò quét rainbow table an toàn tuyệt đối.
- **Tính năng Đăng Ký & Đăng Nhập trên Web:**
  - Nút `👤 Đăng Nhập / Đăng Ký` tại thanh điều khiển.
  - Modal 2 tab: Đăng nhập & Đăng ký thành viên mới (viết liền không dấu, tên hiển thị, mật khẩu xác nhận).
  - Khôi phục phiên làm việc (Session) tự động qua LocalStorage token.
  - Tự động điền tên thành viên vào ô người đề xuất khi gửi lễ hội mới.
- **Bảng Quản Trị Thành Viên (Admin User Management):**
  - Admin có giao diện danh sách thành viên: Xem trạng thái, lần đăng nhập cuối.
  - Thao tác 1 chạm: Khóa / Mở khóa tài khoản, Cấp quyền Quản trị viên (Admin) / Hạ thành viên.
  - Cho phép người dùng tự đổi mật khẩu cá nhân.

---

### [Phiên bản 3.5.0] Phân Cấp Quyền 3 Tầng, Giới Hạn 5 Lần Sai Khóa 60s, Icon Mắt & Xóa Ghi Chú Admin
- **Hệ thống phân quyền gia đình 3 cấp (RBAC - Role-Based Access Control):**
  - **👑 Chủ sở hữu (Super Admin):** Tài khoản `admin` của MH-SAMA là cao nhất. Toàn quyền tối cao, duyệt/sửa/xóa lễ hội, khóa/mở khóa mọi thành viên, phân quyền hoặc hạ quyền Kiểm duyệt viên. Tài khoản `superadmin` được bảo vệ cố định bất khả xâm phạm (không thể bị khóa hoặc hạ quyền).
  - **🛡️ Kiểm duyệt viên (Moderator):** Cấp phó quản trị dưới quyền Chủ sở hữu. Có quyền duyệt các đề xuất lễ hội mới (`[CHỜ DUYỆT]`), thêm/sửa/xóa ngày hội, xem danh sách thành viên và khóa/mở khóa thành viên vi phạm. Không thể can thiệp tài khoản Super Admin hoặc tự phân quyền.
  - **🌱 Thành viên (Member):** Tài khoản người thân trong gia đình tự đăng ký. Tra cứu lễ hội, lưu danh sách yêu thích cá nhân (`❤️`), gửi đề xuất lễ hội quê hương vào hàng chờ và tự đổi mật khẩu.
- **Bảo vệ chống dò quét mật khẩu (Brute-Force Rate Limiting):**
  - Giới hạn nhập sai tối đa 5 lần liên tiếp.
  - Sau 5 lần nhập sai, tài khoản tự động bị khóa trong đúng 60 giây.
  - Đồng hồ đếm ngược trực tiếp trên giao diện (`⏳ Vui lòng đợi (59s)...`), vô hiệu hóa nút đăng nhập và hiển thị thông báo cảnh báo thời gian chờ thực tế.
  - Lưu trạng thái vào `sessionStorage` để chống bypass qua F5/reload trình duyệt.
  - Server tự động kiểm soát 2 cột `failedAttempts` và `lockUntil` trên sheet `NguoiDung`.
- **Nút Con mắt (👁️) kiểm tra mật khẩu:**
  - Tích hợp nút icon con mắt SVG tương tác mượt mà trong tất cả các ô nhập mật khẩu: Đăng nhập, Đăng ký (mật khẩu & xác nhận), Đổi mật khẩu cá nhân (cũ, mới, xác nhận) và Xác thực mã khóa offline.
  - 1 chạm chuyển đổi nhanh giữa dạng dấu chấm ẩn (`password`) và ký tự rõ ràng (`text`).
- **Bảo mật tuyệt đối – Xóa sạch các gợi ý dữ liệu Admin:**
  - Xóa bỏ toàn bộ các ghi chú công khai về tài khoản/mật khẩu quản trị mặc định trên giao diện web, modal đăng nhập, placeholder và thông báo toast.
- **Đồng bộ Android Assets:**
  - Cập nhật 100% mã nguồn sang `android/app/src/main/assets/www/index.html`.

---

## 📌 TRẠNG THÁI HIỆN TẠI & KẾ HOẠCH BƯỚC TIẾP THEO

- [x] Đã hoàn thành Bước 1: Giao diện Đêm Hội Hoa Đăng, Thẻ bài di động, Lịch Vạn Niên & Yêu thích (v3.3.0).
- [x] Đã hoàn thành Bước 2: Hệ thống Tài khoản gia đình & Phân quyền Admin cơ bản (v3.4.0).
- [x] Đã hoàn thành Nâng cấp v3.5.0: Phân quyền 3 cấp (Super Admin, Moderator, Member), Khóa 60s khi sai 5 lần, Icon mắt xem mật khẩu & Bảo mật xóa sạch gợi ý Admin.
- [ ] Chủ sở hữu copy mã `Code.gs` mới nhất dán vào Google Apps Script và Deploy Phiên bản Mới (New Version) để cập nhật bảng `NguoiDung` (11 cột).
- [ ] Trải nghiệm thực tế phân quyền và tính năng đếm ngược 60s.
