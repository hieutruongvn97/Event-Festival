# 🏮 Tra Cứu Lễ Hội Địa Phương Việt Nam (2026–2099)

Ứng dụng Tra cứu & Đối chiếu Lịch Âm - Dương các ngày Lễ hội truyền thống và sự kiện tiêu biểu tại 63 tỉnh thành Việt Nam từ năm 2026 đến năm 2099.

- **Tác giả / Biên soạn:** MH-SAMA
- **Kiến trúc:** Single-File Web App (HTML5 + CSS3 Dark Mode + Vanilla JS ES6+) kết hợp Cloud Database Google Sheets & Google Apps Script (`Code.gs`).
- **Mã khóa Chủ sở hữu (Admin Key):** `HIEUADMIN`

---

## 🚀 Tính năng nổi bật

1. **Thuật toán Lịch Âm Hồ Ngọc Đức (UTC+7):** Quy đổi chính xác tuyệt đối từ năm 2026 đến 2099, tự động xử lý tháng thiếu (ngày 30 lùi về 29) và các sự kiện Dương lịch cố định (`DL`).
2. **Đồng bộ 2 chiều (Safe Merge):** Kết nối Google Sheets qua Apps Script API, không lo mất dữ liệu, tự động sao lưu lịch sử (`Backup_LichSu`).
3. **Phân quyền 2 chế độ:**
   - **Chế độ Khách:** Tra cứu, tìm kiếm không dấu, xem chi tiết, đề xuất lễ hội mới vào hàng chờ duyệt.
   - **Chế độ Chủ sở hữu:** Mở khóa bằng mã `HIEUADMIN` để thêm, sửa, xóa, duyệt đề xuất từ khách.
4. **Tích hợp Google Calendar:** Thêm sự kiện từng năm hoặc xuất trọn gói `.ics` nhiều năm (5, 10, 20 năm hoặc đến 2099).

---

## 📂 Cấu trúc thư mục

- `index.html` / `TraCuuLeHoi_v1.8.html`: File ứng dụng web hoàn chỉnh, mở trực tiếp trên trình duyệt hoặc host tĩnh.
- `Code.gs`: Mã nguồn Google Apps Script triển khai backend Web App kết nối Google Sheets.
- `antigravity_env_config.json`: File cấu hình môi trường chuẩn hóa cho Antigravity IDE.
- `ANTIGRAVITY_PROJECT_DOCS.md`: Tài liệu kiến trúc và hướng dẫn vận hành chuyên sâu.
- `android/`: Dự án đóng gói Android APK (WebView Native App).
- `.github/workflows/`: Quy trình tự động build file APK khi đẩy code lên GitHub.
