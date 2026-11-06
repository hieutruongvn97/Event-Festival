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

## 📌 TRẠNG THÁI HIỆN TẠI & KẾ HOẠCH BƯỚC TIẾP THEO

- [x] Đã hoàn thiện toàn bộ mã nguồn Frontend (`index.html`, `TraCuuLeHoi_v1.8.html`).
- [x] Đã hoàn thiện backend Google Apps Script (`Code.gs`).
- [x] Đã thiết lập cấu hình môi trường chuẩn hóa (`antigravity_env_config.json`, `ANTIGRAVITY_PROJECT_DOCS.md`).
- [x] Đã cấu hình dự án Android và GitHub Actions workflow.
- [ ] Tiếp tục theo yêu cầu của bạn: kiểm tra, mở rộng tính năng mới, hoặc tinh chỉnh theo định hướng tiếp theo.
