/**
 * ============================================================================
 * MÃ NGUỒN GOOGLE APPS SCRIPT ĐỒNG BỘ DỮ LIỆU: TRA CỨU LỄ HỘI VIỆT NAM (2026-2099)
 * Tác giả / Chủ sở hữu: MH-SAMA
 * ============================================================================
 * Đặc điểm an toàn:
 * 1. Xác thực Chủ sở hữu (Admin Secret Key) cho mọi thao tác Thêm / Sửa / Xóa / Gộp.
 * 2. Hỗ trợ Khách gửi đề xuất lễ hội mới vào Hàng chờ xét duyệt ([CHỜ DUYỆT]) qua action "submitPending".
 * 3. Cơ chế Gộp thông minh 2 chiều (Safe Merge) theo ID và thời gian (updatedAt):
 *    - Không bao giờ xóa trắng bảng để ghi đè.
 *    - Giữ nguyên các dòng được thêm từ thiết bị khác hoặc sửa trực tiếp trên Sheet.
 * 4. Khóa đồng thời (LockService) chống xung đột khi lưu cùng lúc.
 * 5. Tự động sao lưu trước mọi thay đổi vào trang tính "Backup_LichSu" (tối đa 100 bản).
 * ============================================================================
 */

// BƯỚC CẤU HÌNH DUY NHẤT: Đổi mã khóa bí mật của riêng bạn tại dòng dưới đây:
const DEFAULT_ADMIN_KEY = "HIEUADMIN";

// ============================================================================
// HỆ THỐNG XÁC THỰC & BẢO MẬT MẬT KHẨU (SHA-256 + SALT)
// ============================================================================
function hashPasswordWithSalt(password, salt) {
  const raw = String(salt || "") + ":" + String(password || "");
  const signature = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw, Utilities.Charset.UTF_8);
  let hash = "";
  for (let i = 0; i < signature.length; i++) {
    const byteVal = signature[i] < 0 ? signature[i] + 256 : signature[i];
    const hex = byteVal.toString(16);
    hash += hex.length === 1 ? "0" + hex : hex;
  }
  return hash;
}

function generateRandomSalt() {
  return Utilities.getUuid().replace(/-/g, "").substring(0, 16);
}


const SHEET_MAIN = "LeHoi";
const SHEET_BACKUP = "Backup_LichSu";
const SHEET_USERS = "NguoiDung";
const SHEET_PRIVATE = "SuKien_CaNhan";
const SHEET_HOUSEHOLDS = "HoGiaDinh";
const MAX_BACKUPS = 100;

// 12 lễ hội mặc định khởi tạo lần đầu nếu bảng tính hoàn toàn trống
const INITIAL_FESTIVALS = [
  { id: 1, name: "Hội Xuân & Vía Bà Đen", location: "Tây Ninh", region: "Miền Nam", lunarDay: 5, lunarMonth: 5, lunarLabel: "05/05 ÂL", duration: "Hội Xuân 30 ngày; Vía 3 ngày", highlights: "Hành hương đỉnh núi Bà Đen, dâng hương Linh Sơn Thánh Mẫu (04–06/05 ÂL) và đêm hội hoa đăng." },
  { id: 2, name: "Tết Nguyên Tiêu Chợ Lớn", location: "TP. Hồ Chí Minh", region: "Miền Nam", lunarDay: 15, lunarMonth: 1, lunarLabel: "15/01 ÂL", duration: "4 ngày", highlights: "Diễu hành nghệ thuật đường phố, lân sư rồng qua các hội quán người Hoa Quận 5 (12–15/01 ÂL)." },
  { id: 3, name: "Lễ hội Vía Bà Chúa Xứ Núi Sam", location: "An Giang", region: "Miền Nam", lunarDay: 24, lunarMonth: 4, lunarLabel: "24/04 ÂL", duration: "6 ngày", highlights: "Lễ Tắm Bà đêm 23 rạng 24/4 ÂL (kéo dài 22–27/04 ÂL), lễ hội tín ngưỡng lớn nhất miền Tây Nam Bộ." },
  { id: 4, name: "Lễ hội Nghinh Ông Cần Giờ", location: "TP. Hồ Chí Minh", region: "Miền Nam", lunarDay: 16, lunarMonth: 8, lunarLabel: "16/08 ÂL", duration: "3 ngày", highlights: "Rước kiệu Nam Hải Tướng Quân trên biển Cần Giờ (15–17/08 ÂL), cầu ngư dân bình an và mùa biển bội thu." },
  { id: 5, name: "Lễ hội Ok Om Bok – Đua Ghe Ngo", location: "Sóc Trăng & Trà Vinh", region: "Miền Nam", lunarDay: 15, lunarMonth: 10, lunarLabel: "15/10 ÂL", duration: "2 – 3 ngày", highlights: "Lễ Cúng Trăng của đồng bào Khmer Nam Bộ, đua ghe Ngo trên sông Maspéro và thả đèn nước hoa đăng." },
  { id: 6, name: "Lễ hội Chùa Bà Thiên Hậu", location: "Bình Dương", region: "Miền Nam", lunarDay: 15, lunarMonth: 1, lunarLabel: "15/01 ÂL", duration: "3 ngày", highlights: "Lễ rước kiệu Bà Thiên Hậu qua các tuyến phố Thủ Dầu Một vào chiều Rằm tháng Giêng (13–15/01 ÂL)." },
  { id: 11, name: "Lễ hội Quán Thế Âm Ngũ Hành Sơn", location: "Đà Nẵng", region: "Miền Trung", lunarDay: 19, lunarMonth: 2, lunarLabel: "19/02 ÂL", duration: "3 ngày", highlights: "Lễ rước ánh sáng, rước tôn tượng Quán Thế Âm và hội hoa đăng trên sông Cổ Cò (17–19/02 ÂL)." },
  { id: 12, name: "Lễ hội Điện Hòn Chén", location: "Thừa Thiên Huế", region: "Miền Trung", lunarDay: 3, lunarMonth: 3, lunarLabel: "03/03 ÂL", duration: "2 ngày", highlights: "Rước sắc bằng thuyền rồng trên sông Hương, tôn vinh Thiên Y A Na Thánh Mẫu." },
  { id: 7, name: "Lễ hội Chùa Hương", location: "Hà Nội", region: "Miền Bắc", lunarDay: 6, lunarMonth: 1, lunarLabel: "06/01 ÂL", duration: "80 – 90 ngày", highlights: "Khai hội Mùng 6 Tết, hành hương suối Yến - động Hương Tích kéo dài suốt 3 tháng mùa xuân." },
  { id: 8, name: "Hội Gióng Đền Sóc", location: "Hà Nội", region: "Miền Bắc", lunarDay: 6, lunarMonth: 1, lunarLabel: "06/01 ÂL", duration: "3 ngày", highlights: "Tưởng nhớ Thánh Gióng (06–08/01 ÂL), nghi lễ dâng hoa tre và rước voi truyền thống." },
  { id: 9, name: "Hội Lim (Quan họ)", location: "Bắc Ninh", region: "Miền Bắc", lunarDay: 13, lunarMonth: 1, lunarLabel: "13/01 ÂL", duration: "3 ngày", highlights: "Hát giao duyên Quan họ Bắc Ninh trên thuyền rồng và đồi Lim (12–14/01 ÂL)." },
  { id: 10, name: "Lễ hội Yên Tử", location: "Quảng Ninh", region: "Miền Bắc", lunarDay: 10, lunarMonth: 1, lunarLabel: "10/01 ÂL", duration: "~80 ngày", highlights: "Hành hương về đất Phật Trúc Lâm Yên Tử và đỉnh chùa Đồng từ 10 tháng Giêng đến hết tháng 3 ÂL." }
];

// Tạo menu tiện ích ngay trên thanh công cụ Google Sheets cho Chủ sở hữu
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("🏮 Quản lý Lễ Hội")
    .addItem("1. Khởi tạo bảng & Nạp 12 lễ hội gốc", "setupInitialSheet")
    .addItem("2. Đổi Mã khóa Chủ sở hữu (Admin Key)", "promptChangeAdminKey")
    .addItem("3. Khôi phục bản sao lưu gần nhất", "restoreLatestBackupFromMenu")
    .addToUi();
}

// Tự động cập nhật cột updatedAt khi Chủ sở hữu sửa trực tiếp trên Google Sheets
function onEdit(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  if (sheet.getName() !== SHEET_MAIN) return;
  const row = e.range.getRow();
  if (row <= 1) return;

  const nowIso = new Date().toISOString();
  const idCell = sheet.getRange(row, 1);
  if (!idCell.getValue()) {
    idCell.setValue(Date.now() + row);
  }
  const dayVal = Number(sheet.getRange(row, 5).getValue() || 15);
  const monthVal = Number(sheet.getRange(row, 6).getValue() || 1);
  const labelCell = sheet.getRange(row, 7);
  if (!labelCell.getValue() && dayVal && monthVal) {
    labelCell.setValue(String(dayVal).padStart(2, "0") + "/" + String(monthVal).padStart(2, "0") + " ÂL");
  }
  const delCell = sheet.getRange(row, 11);
  if (delCell.getValue() === "") {
    delCell.setValue(false);
  }
  sheet.getRange(row, 10).setValue(nowIso);
}

function getAdminKey() {
  const savedKey = PropertiesService.getScriptProperties().getProperty("ADMIN_SECRET_KEY");
  return savedKey ? savedKey : DEFAULT_ADMIN_KEY;
}

function verifyKey(inputKey) {
  const actual = String(getAdminKey()).trim();
  const provided = String(inputKey || "").trim();
  if (!actual || !provided || actual.length !== provided.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) {
    diff |= actual.charCodeAt(i) ^ provided.charCodeAt(i);
  }
  return diff === 0;
}

function promptChangeAdminKey() {
  const ui = SpreadsheetApp.getUi();
  const res = ui.prompt(
    "Đổi Mã khóa Chủ sở hữu (Admin Key)",
    "Nhập mã khóa bí mật mới (dùng để mở khóa chỉnh sửa trên ứng dụng web):",
    ui.ButtonSet.OK_CANCEL
  );
  if (res.getSelectedButton() === ui.Button.OK) {
    const newKey = res.getResponseText().trim();
    if (newKey.length < 4) {
      ui.alert("Mã khóa phải có ít nhất 4 ký tự!");
      return;
    }
    PropertiesService.getScriptProperties().setProperty("ADMIN_SECRET_KEY", newKey);
    ui.alert("Đã lưu Mã khóa Chủ sở hữu mới thành công!");
  }
}

function ensureSheetsExist() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let mainSheet = ss.getSheetByName(SHEET_MAIN);
  if (!mainSheet) {
    mainSheet = ss.insertSheet(SHEET_MAIN);
    const headers = [
      "id", "name", "location", "region",
      "lunarDay", "lunarMonth", "lunarLabel",
      "duration", "highlights", "updatedAt", "deleted"
    ];
    mainSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    mainSheet.getRange(1, 1, 1, headers.length)
      .setFontWeight("bold")
      .setBackground("#1e3a8a")
      .setFontColor("#ffffff");
    mainSheet.setFrozenRows(1);

    const initIso = "2026-01-01T00:00:00.000Z";
    const rows = INITIAL_FESTIVALS.map(item => [
      item.id, item.name, item.location, item.region,
      item.lunarDay, item.lunarMonth, item.lunarLabel,
      item.duration, item.highlights, initIso, false
    ]);
    mainSheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  } else {
    if (mainSheet.getLastColumn() < 13) {
      mainSheet.getRange(1, 12, 1, 2).setValues([["visibility", "allowedUsers"]]);
      mainSheet.getRange(1, 12, 1, 2)
        .setFontWeight("bold")
        .setBackground("#1e3a8a")
        .setFontColor("#ffffff");
    }
  }

  let backupSheet = ss.getSheetByName(SHEET_BACKUP);
  if (!backupSheet) {
    backupSheet = ss.insertSheet(SHEET_BACKUP);
    const bHeaders = ["Thời gian sao lưu", "Thao tác", "Số lượng lễ hội", "Dữ liệu JSON (Snapshot)"];
    backupSheet.getRange(1, 1, 1, bHeaders.length).setValues([bHeaders]);
    backupSheet.getRange(1, 1, 1, bHeaders.length)
      .setFontWeight("bold")
      .setBackground("#334155")
      .setFontColor("#ffffff");
    backupSheet.setFrozenRows(1);
  }

  let usersSheet = ss.getSheetByName(SHEET_USERS);
  if (!usersSheet) {
    usersSheet = ss.insertSheet(SHEET_USERS);
    const uHeaders = [
      "id", "username", "displayName", "passwordHash",
      "salt", "role", "status", "createdAt", "lastLogin", "failedAttempts", "lockUntil", "avatar", "provider", "email"
    ];
    usersSheet.getRange(1, 1, 1, uHeaders.length).setValues([uHeaders]);
    usersSheet.getRange(1, 1, 1, uHeaders.length)
      .setFontWeight("bold")
      .setBackground("#065f46")
      .setFontColor("#ffffff");
    usersSheet.setFrozenRows(1);

    // Tạo sẵn tài khoản Admin tối cao đầu tiên cho Chủ sở hữu
    const adminSalt = generateRandomSalt();
    const adminHash = hashPasswordWithSalt("HIEUADMIN", adminSalt);
    const initAdminRow = [
      "u_admin", "admin", "Chủ sở hữu (MH-SAMA)",
      adminHash, adminSalt, "superadmin", "active",
      new Date().toISOString(), new Date().toISOString(),
      0, 0, "", "local", "truongminhhieu58@gmail.com"
    ];
    usersSheet.getRange(2, 1, 1, initAdminRow.length).setValues([initAdminRow]);
  } else {
    // Tự động kiểm tra và nâng cấp các cột kiểm soát đăng nhập và Google nếu chưa có
    if (usersSheet.getLastColumn() < 11) {
      usersSheet.getRange(1, 10, 1, 2).setValues([["failedAttempts", "lockUntil"]]);
      usersSheet.getRange(1, 10, 1, 2)
        .setFontWeight("bold")
        .setBackground("#065f46")
        .setFontColor("#ffffff");
    }
    if (usersSheet.getLastColumn() < 14) {
      usersSheet.getRange(1, 12, 1, 3).setValues([["avatar", "provider", "email"]]);
      usersSheet.getRange(1, 12, 1, 3)
        .setFontWeight("bold")
        .setBackground("#065f46")
        .setFontColor("#ffffff");
    }
  }

  let privateSheet = ss.getSheetByName(SHEET_PRIVATE);
  if (!privateSheet) {
    privateSheet = ss.insertSheet(SHEET_PRIVATE);
    const pHeaders = [
      "id", "ownerId", "ownerUsername", "ownerEmail",
      "name", "location", "region",
      "lunarDay", "lunarMonth", "lunarLabel", "calendarType",
      "duration", "highlights", "updatedAt", "deleted"
    ];
    privateSheet.getRange(1, 1, 1, pHeaders.length).setValues([pHeaders]);
    privateSheet.getRange(1, 1, 1, pHeaders.length)
      .setFontWeight("bold")
      .setBackground("#831843")
      .setFontColor("#ffffff");
    privateSheet.setFrozenRows(1);
  } else {
    if (privateSheet.getLastColumn() < 17) {
      privateSheet.getRange(1, 16, 1, 2).setValues([["visibility", "allowedUsers"]]);
      privateSheet.getRange(1, 16, 1, 2)
        .setFontWeight("bold")
        .setBackground("#831843")
        .setFontColor("#ffffff");
    }
  }

  let householdsSheet = ss.getSheetByName(SHEET_HOUSEHOLDS);
  if (!householdsSheet) {
    householdsSheet = ss.insertSheet(SHEET_HOUSEHOLDS);
    const hHeaders = ["id", "name", "members", "description", "updatedAt"];
    householdsSheet.getRange(1, 1, 1, hHeaders.length).setValues([hHeaders]);
    householdsSheet.getRange(1, 1, 1, hHeaders.length)
      .setFontWeight("bold")
      .setBackground("#7c2d12")
      .setFontColor("#ffffff");
    householdsSheet.setFrozenRows(1);
  }

  return { ss, mainSheet, backupSheet, usersSheet, privateSheet, householdsSheet };
}

function setupInitialSheet() {
  ensureSheetsExist();
  return "Đã khởi tạo bảng LeHoi và Backup_LichSu thành công!";
}

function readAllHouseholds(householdsSheet) {
  const lastRow = householdsSheet.getLastRow();
  if (lastRow <= 1) return [];
  const lastCol = Math.max(householdsSheet.getLastColumn(), 5);
  const values = householdsSheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  const list = [];
  for (let i = 0; i < values.length; i++) {
    const r = values[i];
    const name = String(r[1] || "").trim();
    if (!name) continue;
    const rawMembers = String(r[2] || "").trim();
    list.push({
      id: String(r[0] || ("hh_" + (i + 1))),
      name: name,
      members: rawMembers ? rawMembers.split(",").map(s => s.trim().toLowerCase()).filter(Boolean) : [],
      description: String(r[3] || "").trim(),
      updatedAt: String(r[4] || new Date().toISOString())
    });
  }
  return list;
}

function writeAllHouseholds(householdsSheet, list) {
  const lastRow = householdsSheet.getLastRow();
  const lastCol = Math.max(householdsSheet.getLastColumn(), 5);
  if (lastRow > 1) {
    householdsSheet.getRange(2, 1, lastRow - 1, lastCol).clearContent();
  }
  if (!list || list.length === 0) return;
  const rows = list.map(h => [
    h.id,
    h.name,
    Array.isArray(h.members) ? h.members.join(",") : (h.members || ""),
    h.description || "",
    h.updatedAt || new Date().toISOString()
  ]);
  householdsSheet.getRange(2, 1, rows.length, 5).setValues(rows);
}

function readAllPrivateRecords(privateSheet) {
  const lastRow = privateSheet.getLastRow();
  if (lastRow <= 1) return [];
  const lastCol = Math.max(privateSheet.getLastColumn(), 17);
  const values = privateSheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  const records = [];
  for (let i = 0; i < values.length; i++) {
    const r = values[i];
    const name = String(r[4] || "").trim();
    if (!name) continue;
    const rawAllowed = String(r[16] || "").trim();
    records.push({
      id: String(r[0] || ""),
      ownerId: String(r[1] || ""),
      ownerUsername: String(r[2] || "").toLowerCase(),
      ownerEmail: String(r[3] || "").toLowerCase(),
      name: name,
      location: String(r[5] || "Gia đình"),
      region: String(r[6] || "Gia đình"),
      lunarDay: Number(r[7]) || 15,
      lunarMonth: Number(r[8]) || 1,
      lunarLabel: String(r[9] || ""),
      calendarType: String(r[10] || "lunar"),
      duration: String(r[11] || "1 ngày"),
      highlights: String(r[12] || ""),
      updatedAt: String(r[13] || new Date().toISOString()),
      deleted: Boolean(r[14]),
      isPrivate: true,
      visibility: String(r[15] || "only_me").trim() || "only_me",
      allowedUsers: rawAllowed ? rawAllowed.split(",").map(s => s.trim().toLowerCase()).filter(Boolean) : []
    });
  }
  return records;
}

function writeAllPrivateRecords(privateSheet, records) {
  const lastRow = privateSheet.getLastRow();
  const lastCol = Math.max(privateSheet.getLastColumn(), 17);
  if (lastRow > 1) {
    privateSheet.getRange(2, 1, lastRow - 1, lastCol).clearContent();
  }
  if (!records || records.length === 0) return;
  const rows = records.map(item => [
    item.id,
    item.ownerId || "",
    (item.ownerUsername || "").toLowerCase(),
    (item.ownerEmail || "").toLowerCase(),
    item.name || "",
    item.location || "Gia đình",
    item.region || "Gia đình",
    Number(item.lunarDay) || 15,
    Number(item.lunarMonth) || 1,
    item.lunarLabel || "",
    item.calendarType || "lunar",
    item.duration || "1 ngày",
    item.highlights || "",
    item.updatedAt || new Date().toISOString(),
    Boolean(item.deleted),
    item.visibility || (item.isPrivate ? "only_me" : "public"),
    Array.isArray(item.allowedUsers) ? item.allowedUsers.join(",") : (item.allowedUsers || "")
  ]);
  privateSheet.getRange(2, 1, rows.length, 17).setValues(rows);
}

function readAllRecords(mainSheet) {
  const lastRow = mainSheet.getLastRow();
  if (lastRow <= 1) return [];
  const lastCol = Math.max(mainSheet.getLastColumn(), 13);
  const values = mainSheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  const records = [];
  for (let i = 0; i < values.length; i++) {
    const r = values[i];
    const name = String(r[1] || "").trim();
    const location = String(r[2] || "").trim();
    if (!name && !location) continue;
    const lunarDay = Number(r[4]) || 15;
    const lunarMonth = Number(r[5]) || 1;
    const id = r[0] !== "" && r[0] !== null ? r[0] : (Date.now() + i);
    const lunarLabel = String(r[6] || "").trim() || (String(lunarDay).padStart(2, "0") + "/" + String(lunarMonth).padStart(2, "0") + " ÂL");
    const updatedAt = r[9] ? String(r[9]) : "2026-01-01T00:00:00.000Z";
    const deleted = r[10] === true || String(r[10]).toUpperCase() === "TRUE";
    const visibility = String(r[11] || "public").trim() || "public";
    const rawAllowed = String(r[12] || "").trim();
    const allowedUsers = rawAllowed ? rawAllowed.split(",").map(s => s.trim().toLowerCase()).filter(Boolean) : [];
    records.push({
      id: Number.isFinite(Number(id)) ? Number(id) : String(id),
      name: name,
      location: location,
      region: String(r[3] || "Miền Nam").trim(),
      lunarDay: lunarDay,
      lunarMonth: lunarMonth,
      lunarLabel: lunarLabel,
      duration: String(r[7] || "1 – 3 ngày").trim(),
      highlights: String(r[8] || "").trim(),
      updatedAt: updatedAt,
      deleted: deleted,
      visibility: visibility,
      allowedUsers: allowedUsers
    });
  }
  return records;
}

function readAllUsers(usersSheet) {
  const lastRow = usersSheet.getLastRow();
  if (lastRow <= 1) return [];
  const lastCol = Math.max(usersSheet.getLastColumn(), 14);
  const values = usersSheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  const users = [];
  for (let i = 0; i < values.length; i++) {
    const r = values[i];
    if (!r[1]) continue; // Không có username
    const rawUsername = String(r[1]).trim().toLowerCase();
    let rawRole = String(r[5] || "member").trim().toLowerCase();
    // Tài khoản gốc admin hoặc email chủ sở hữu luôn giữ quyền tối cao superadmin
    if (rawUsername === "admin" && (rawRole === "admin" || !rawRole)) {
      rawRole = "superadmin";
    }
    users.push({
      id: String(r[0] || ("u_" + i)),
      username: rawUsername,
      displayName: String(r[2] || r[1]).trim(),
      passwordHash: String(r[3] || ""),
      salt: String(r[4] || ""),
      role: rawRole,
      status: String(r[6] || "active").trim().toLowerCase(),
      createdAt: String(r[7] || new Date().toISOString()),
      lastLogin: String(r[8] || ""),
      failedAttempts: Number(r[9]) || 0,
      lockUntil: Number(r[10]) || 0,
      avatar: String(r[11] || ""),
      provider: String(r[12] || "local"),
      email: String(r[13] || rawUsername)
    });
  }
  return users;
}

function writeAllUsers(usersSheet, users) {
  const lastRow = usersSheet.getLastRow();
  const lastCol = Math.max(usersSheet.getLastColumn(), 14);
  if (lastRow > 1) {
    usersSheet.getRange(2, 1, lastRow - 1, lastCol).clearContent();
  }
  if (users.length === 0) return;
  const rows = users.map(u => [
    u.id,
    u.username.toLowerCase(),
    u.displayName,
    u.passwordHash,
    u.salt,
    u.role || "member",
    u.status || "active",
    u.createdAt || new Date().toISOString(),
    u.lastLogin || "",
    Number(u.failedAttempts) || 0,
    Number(u.lockUntil) || 0,
    u.avatar || "",
    u.provider || "local",
    u.email || u.username
  ]);
  usersSheet.getRange(2, 1, rows.length, 14).setValues(rows);
}

function writeAllRecords(mainSheet, records) {
  const lastRow = mainSheet.getLastRow();
  const lastCol = Math.max(mainSheet.getLastColumn(), 13);
  if (lastRow > 1) {
    mainSheet.getRange(2, 1, lastRow - 1, lastCol).clearContent();
  }
  if (!records || records.length === 0) return;
  const rows = records.map(item => [
    item.id,
    item.name,
    item.location,
    item.region || "Miền Nam",
    Number(item.lunarDay) || 15,
    Number(item.lunarMonth) || 1,
    item.lunarLabel || (String(item.lunarDay || 15).padStart(2, "0") + "/" + String(item.lunarMonth || 1).padStart(2, "0") + " ÂL"),
    item.duration || "1 – 3 ngày",
    item.highlights || "",
    item.updatedAt || new Date().toISOString(),
    Boolean(item.deleted),
    item.visibility || "public",
    Array.isArray(item.allowedUsers) ? item.allowedUsers.join(",") : (item.allowedUsers || "")
  ]);
  mainSheet.getRange(2, 1, rows.length, 13).setValues(rows);
}

function saveBackupSnapshot(backupSheet, actionName, currentRecords) {
  const activeCount = currentRecords.filter(r => !r.deleted).length;
  backupSheet.appendRow([
    new Date().toISOString(),
    actionName,
    activeCount,
    JSON.stringify(currentRecords)
  ]);
  const totalRows = backupSheet.getLastRow();
  if (totalRows > MAX_BACKUPS + 1) {
    backupSheet.deleteRows(2, totalRows - (MAX_BACKUPS + 1));
  }
}

function makeFingerprint(item) {
  return [
    String(item.name || "").trim().toLowerCase(),
    String(item.location || "").trim().toLowerCase(),
    Number(item.lunarDay) || 0,
    Number(item.lunarMonth) || 0
  ].join("|");
}

function parseTimeMs(isoStr) {
  const t = Date.parse(isoStr || "");
  return Number.isFinite(t) ? t : 0;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// API ĐỌC DỮ LIỆU (Ai có link đều tra cứu được danh sách mới nhất)
function doGet(e) {
  try {
    const { mainSheet } = ensureSheetsExist();
    const allRecords = readAllRecords(mainSheet);
    const paramUser = (e && e.parameter && (e.parameter.user || e.parameter.username) || "").trim().toLowerCase();
    const paramEmail = (e && e.parameter && e.parameter.email || "").trim().toLowerCase();
    const paramKey = (e && e.parameter && (e.parameter.key || e.parameter.adminKey) || "").trim();
    const isOwner = verifyKey(paramKey);

    const activeItems = allRecords.filter(r => {
      if (r.deleted) return false;
      const vis = r.visibility || "public";
      if (vis === "public") return true;
      if (isOwner) return true;
      if (!paramUser && !paramEmail) return false;
      if (vis === "members") return true;
      if (vis === "selected") {
        const allowed = Array.isArray(r.allowedUsers) ? r.allowedUsers : [];
        return allowed.includes(paramUser) || allowed.includes(paramEmail);
      }
      return false;
    });

    const deletedIds = allRecords.filter(r => r.deleted).map(r => ({ id: r.id, updatedAt: r.updatedAt }));
    const { householdsSheet } = ensureSheetsExist();
    const householdsList = readAllHouseholds(householdsSheet);
    return jsonResponse({
      ok: true,
      serverTime: new Date().toISOString(),
      items: activeItems,
      deletedIds: deletedIds,
      households: householdsList
    });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err.message || err) });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (lockErr) {
    return jsonResponse({ ok: false, error: "Hệ thống đang bận xử lý đồng bộ khác, vui lòng thử lại sau vài giây." });
  }

  try {
    const payload = JSON.parse(e.postData.contents || "{}");
    const action = payload.action || "";
    const adminKey = payload.adminKey || "";

    // ========================================================================
    // A. HỆ THỐNG XÁC THỰC NGƯỜI DÙNG (ĐĂNG KÝ, ĐĂNG NHẬP, QUẢN LÝ TÀI KHOẢN)
    // ========================================================================
    
    // 1. Đăng ký tài khoản mới (Dành cho thành viên tự đăng ký)
    if (action === "register") {
      const { usersSheet } = ensureSheetsExist();
      const users = readAllUsers(usersSheet);
      const rawUser = String(payload.username || "").trim().toLowerCase();
      const rawName = String(payload.displayName || rawUser).trim();
      const rawPass = String(payload.password || "");

      if (!rawUser || rawUser.length < 3 || rawUser.length > 30) {
        return jsonResponse({ ok: false, error: "Tên đăng nhập phải từ 3 đến 30 ký tự (viết liền không dấu)." });
      }
      if (!/^[a-zA-Z0-9_.-]+$/.test(rawUser)) {
        return jsonResponse({ ok: false, error: "Tên đăng nhập chỉ chứa chữ cái, số và dấu gạch dưới (_)." });
      }
      if (!rawPass || rawPass.length < 4) {
        return jsonResponse({ ok: false, error: "Mật khẩu phải có ít nhất 4 ký tự." });
      }

      const exists = users.find(u => u.username === rawUser);
      if (exists) {
        return jsonResponse({ ok: false, error: "Tên đăng nhập này đã được sử dụng! Vui lòng chọn tên khác." });
      }

      const salt = generateRandomSalt();
      const passwordHash = hashPasswordWithSalt(rawPass, salt);
      const nowIso = new Date().toISOString();
      const newUser = {
        id: "u_" + Date.now(),
        username: rawUser,
        displayName: rawName || rawUser,
        passwordHash: passwordHash,
        salt: salt,
        role: "member",
        status: "active",
        createdAt: nowIso,
        lastLogin: nowIso,
        failedAttempts: 0,
        lockUntil: 0
      };

      users.push(newUser);
      writeAllUsers(usersSheet, users);

      return jsonResponse({
        ok: true,
        message: "Đăng ký tài khoản thành công!",
        user: {
          id: newUser.id,
          username: newUser.username,
          displayName: newUser.displayName,
          role: newUser.role,
          status: newUser.status
        },
        token: "tk_" + newUser.id + "_" + Utilities.getUuid()
      });
    }    // 2. Đăng nhập tài khoản (Giới hạn sai tối đa 5 lần, khóa 60 giây)
    if (action === "login") {
      const { usersSheet } = ensureSheetsExist();
      const users = readAllUsers(usersSheet);
      const rawUser = String(payload.username || "").trim().toLowerCase();
      const rawPass = String(payload.password || "");
      const nowMs = Date.now();

      if (!rawUser || !rawPass) {
        return jsonResponse({ ok: false, error: "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!" });
      }

      // Tìm tài khoản người dùng
      let target = users.find(u => u.username === rawUser);

      // Nếu là tài khoản admin nhưng chưa có trong danh sách sheet
      if (rawUser === "admin" && !target) {
        const adminSalt = generateRandomSalt();
        const adminHash = hashPasswordWithSalt("HIEUADMIN", adminSalt);
        target = {
          id: "u_admin",
          username: "admin",
          displayName: "Chủ sở hữu (MH-SAMA)",
          passwordHash: adminHash,
          salt: adminSalt,
          role: "superadmin",
          status: "active",
          createdAt: new Date().toISOString(),
          lastLogin: "",
          failedAttempts: 0,
          lockUntil: 0
        };
        users.push(target);
      }

      if (!target) {
        return jsonResponse({ ok: false, error: "Tên đăng nhập hoặc mật khẩu không chính xác!" });
      }

      // Kiểm tra tài khoản bị quản trị viên khóa vĩnh viễn
      if (target.status === "locked") {
        return jsonResponse({ ok: false, error: "Tài khoản của bạn đang bị khóa bởi Quản trị viên. Vui lòng liên hệ Admin!" });
      }

      // Kiểm tra thời gian tạm khóa 60 giây do nhập sai quá 5 lần
      if (target.lockUntil && target.lockUntil > nowMs) {
        const remainingSec = Math.ceil((target.lockUntil - nowMs) / 1000);
        return jsonResponse({
          ok: false,
          locked: true,
          retryAfter: remainingSec,
          error: "Tài khoản tạm thời bị khóa do nhập sai mật khẩu 5 lần. Vui lòng thử lại sau " + remainingSec + " giây."
        });
      }

      // Nếu đã hết hạn khóa 60 giây, reset số lần sai
      if (target.lockUntil && nowMs >= target.lockUntil) {
        target.lockUntil = 0;
        target.failedAttempts = 0;
      }

      // Xác thực mật khẩu
      let isValidPass = false;
      if (target.username === "admin") {
        const computedHash = target.salt ? hashPasswordWithSalt(rawPass, target.salt) : "";
        isValidPass = (computedHash === target.passwordHash) || (rawPass === getAdminKey()) || verifyKey(rawPass);
      } else {
        const computedHash = hashPasswordWithSalt(rawPass, target.salt);
        isValidPass = (computedHash === target.passwordHash);
      }

      if (!isValidPass) {
        target.failedAttempts = (Number(target.failedAttempts) || 0) + 1;
        if (target.failedAttempts >= 5) {
          target.lockUntil = nowMs + 60000; // Khóa 60 giây
          target.failedAttempts = 0;
          writeAllUsers(usersSheet, users);
          return jsonResponse({
            ok: false,
            locked: true,
            retryAfter: 60,
            error: "Bạn đã nhập sai mật khẩu 5 lần liên tiếp! Tài khoản bị tạm khóa trong 60 giây."
          });
        }
        const attemptsLeft = 5 - target.failedAttempts;
        writeAllUsers(usersSheet, users);
        return jsonResponse({
          ok: false,
          attemptsLeft: attemptsLeft,
          error: "Mật khẩu không chính xác! Bạn còn " + attemptsLeft + " lần thử trước khi bị khóa 60 giây."
        });
      }

      // Đăng nhập thành công -> Reset số lần sai và thời gian khóa
      target.failedAttempts = 0;
      target.lockUntil = 0;
      target.lastLogin = new Date().toISOString();
      writeAllUsers(usersSheet, users);

      const isPrivileged = (target.role === "superadmin" || target.role === "moderator" || target.role === "admin");
      return jsonResponse({
        ok: true,
        message: target.role === "superadmin" ? "Đăng nhập Chủ sở hữu thành công!" : "Đăng nhập thành công!",
        user: {
          id: target.id,
          username: target.username,
          displayName: target.displayName,
          role: target.role,
          status: target.status
        },
        adminKey: isPrivileged ? getAdminKey() : "",
        token: "tk_" + target.id + "_" + Utilities.getUuid()
      });
    }

    // Lấy danh sách thành viên cho bộ chọn chỉ định người xem
    if (action === "getMembersForPicker") {
      const { usersSheet } = ensureSheetsExist();
      const users = readAllUsers(usersSheet);
      const safeMembers = users.filter(u => u.status !== "locked").map(u => ({
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        role: u.role,
        avatar: u.avatar || "",
        email: u.email || u.username
      }));
      const { householdsSheet } = ensureSheetsExist();
      const householdsList = readAllHouseholds(householdsSheet);
      return jsonResponse({
        ok: true,
        members: safeMembers,
        households: householdsList
      });
    }

    // 3. Lấy danh sách thành viên (Chỉ Super Admin và Kiểm duyệt viên mới có quyền)
    if (action === "getUsersList") {
      if (!verifyKey(adminKey)) {
        return jsonResponse({ ok: false, error: "Từ chối truy cập! Chỉ Quản trị viên mới có quyền xem danh sách thành viên." });
      }
      const { usersSheet } = ensureSheetsExist();
      const users = readAllUsers(usersSheet);
      const nowMs = Date.now();
      const safeUsers = users.map(u => ({
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        role: u.role,
        status: u.status,
        createdAt: u.createdAt,
        lastLogin: u.lastLogin,
        failedAttempts: u.failedAttempts || 0,
        isLockedUntil: (u.lockUntil && u.lockUntil > nowMs) ? Math.ceil((u.lockUntil - nowMs) / 1000) : 0,
        avatar: u.avatar || "",
        provider: u.provider || "local",
        email: u.email || u.username
      }));
      return jsonResponse({
        ok: true,
        users: safeUsers
      });
    }

    // 4. Cập nhật trạng thái thành viên (Khóa/Mở khóa hoặc Phân quyền)
    if (action === "updateUserStatus") {
      if (!verifyKey(adminKey)) {
        return jsonResponse({ ok: false, error: "Từ chối truy cập! Chỉ Quản trị viên mới có quyền cập nhật thành viên." });
      }
      const { usersSheet } = ensureSheetsExist();
      const users = readAllUsers(usersSheet);
      const targetUserId = String(payload.userId || "");
      const newStatus = payload.status; // 'active' hoặc 'locked'
      const newRole = payload.role;     // 'moderator' hoặc 'member'
      const callerRole = String(payload.callerRole || "").toLowerCase();

      const user = users.find(u => u.id === targetUserId);
      if (!user) {
        return jsonResponse({ ok: false, error: "Không tìm thấy người dùng này." });
      }

      // BẢO VỆ TUYỆT ĐỐI: Tài khoản Chủ sở hữu tối cao không thể bị khóa hoặc hạ quyền
      if (user.username === "admin" || user.role === "superadmin") {
        if (newStatus === "locked" || (newRole && newRole !== "superadmin")) {
          return jsonResponse({ ok: false, error: "Không thể khóa hoặc thay đổi quyền của Chủ sở hữu tối cao!" });
        }
      }

      // Kiểm tra quyền của người gọi thao tác:
      if (callerRole === "moderator") {
        // Kiểm duyệt viên KHÔNG được quyền phân vai trò
        if (newRole) {
          return jsonResponse({ ok: false, error: "Kiểm duyệt viên không có quyền thay đổi vai trò tài khoản!" });
        }
        // Kiểm duyệt viên không được can thiệp vào tài khoản kiểm duyệt khác hoặc superadmin
        if (user.role === "superadmin" || user.role === "moderator") {
          return jsonResponse({ ok: false, error: "Bạn không có quyền can thiệp vào tài khoản quản trị cấp cao!" });
        }
      }

      // Xử lý Khóa / Mở khóa
      if (newStatus) {
        user.status = newStatus;
        if (newStatus === "active") {
          user.failedAttempts = 0;
          user.lockUntil = 0;
        }
      }

      // Xử lý Phân quyền (Chỉ Super Admin mới đổi được vai trò)
      if (newRole && (newRole === "moderator" || newRole === "member")) {
        user.role = newRole;
      }

      writeAllUsers(usersSheet, users);
      return jsonResponse({
        ok: true,
        message: "Đã cập nhật tài khoản thành công!",
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          role: user.role,
          status: user.status
        }
      });
    }

    // 5. Đổi mật khẩu cá nhân
    if (action === "changePassword") {
      const { usersSheet } = ensureSheetsExist();
      const users = readAllUsers(usersSheet);
      const targetUserId = String(payload.userId || "");
      const oldPass = String(payload.oldPassword || "");
      const newPass = String(payload.newPassword || "");

      if (!newPass || newPass.length < 4) {
        return jsonResponse({ ok: false, error: "Mật khẩu mới phải có ít nhất 4 ký tự." });
      }

      const user = users.find(u => u.id === targetUserId);
      if (!user) {
        return jsonResponse({ ok: false, error: "Không tìm thấy tài khoản người dùng." });
      }

      // Xác thực mật khẩu cũ
      let isOldValid = false;
      if (user.username === "admin") {
        const computedOld = user.salt ? hashPasswordWithSalt(oldPass, user.salt) : "";
        isOldValid = (computedOld === user.passwordHash) || (oldPass === getAdminKey()) || verifyKey(oldPass);
      } else {
        const computedOld = hashPasswordWithSalt(oldPass, user.salt);
        isOldValid = (computedOld === user.passwordHash);
      }

      if (!isOldValid) {
        return jsonResponse({ ok: false, error: "Mật khẩu cũ không chính xác!" });
      }

      user.salt = generateRandomSalt();
      user.passwordHash = hashPasswordWithSalt(newPass, user.salt);
      user.failedAttempts = 0;
      user.lockUntil = 0;
      writeAllUsers(usersSheet, users);

      return jsonResponse({
        ok: true,
        message: "Đã đổi mật khẩu thành công!"
      });
    }

    // 6. Đăng ký & Đăng nhập bằng Google Account (1-Click Google Sign-In / Fast Gmail)
    if (action === "googleAuth") {
      const { usersSheet } = ensureSheetsExist();
      const users = readAllUsers(usersSheet);
      const rawEmail = String(payload.email || "").trim().toLowerCase();
      const rawName = String(payload.displayName || payload.name || rawEmail.split("@")[0]).trim();
      const rawAvatar = String(payload.avatar || payload.picture || "").trim();
      const googleId = String(payload.googleId || payload.sub || "").trim();

      if (!rawEmail || !rawEmail.includes("@")) {
        return jsonResponse({ ok: false, error: "Địa chỉ Email Google không hợp lệ!" });
      }

      // Tìm tài khoản theo email hoặc username trùng email
      let target = users.find(u => u.username === rawEmail || (u.email && u.email.toLowerCase() === rawEmail) || (googleId && u.googleId === googleId));

      const nowIso = new Date().toISOString();
      const isOwnerEmail = (rawEmail === "truongminhhieu58@gmail.com" || rawEmail.startsWith("truongminhhieu58@"));

      if (!target) {
        // Tự động tạo tài khoản mới liên kết Google
        const newId = "u_g_" + Date.now();
        const autoAvatar = rawAvatar || ("https://ui-avatars.com/api/?background=4285F4&color=fff&bold=true&name=" + encodeURIComponent(rawName || "Google User"));
        target = {
          id: newId,
          username: rawEmail,
          displayName: rawName || rawEmail.split("@")[0],
          passwordHash: "GOOGLE_OAUTH_ACCOUNT",
          salt: "google",
          role: isOwnerEmail ? "superadmin" : "member",
          status: "active",
          createdAt: nowIso,
          lastLogin: nowIso,
          failedAttempts: 0,
          lockUntil: 0,
          avatar: autoAvatar,
          provider: "google",
          email: rawEmail
        };
        users.push(target);
      } else {
        // Tài khoản đã có -> Kiểm tra trạng thái khóa
        if (target.status === "locked") {
          return jsonResponse({ ok: false, error: "Tài khoản Google này đang bị khóa bởi Quản trị viên!" });
        }
        // Cập nhật thông tin mới nhất từ Google
        if (rawName && (!target.displayName || target.displayName === target.username)) {
          target.displayName = rawName;
        }
        if (rawAvatar) {
          target.avatar = rawAvatar;
        }
        if (isOwnerEmail && target.role !== "superadmin") {
          target.role = "superadmin";
        }
        target.provider = "google";
        target.lastLogin = nowIso;
        target.failedAttempts = 0;
        target.lockUntil = 0;
      }

      writeAllUsers(usersSheet, users);

      const isPrivileged = (target.role === "superadmin" || target.role === "moderator" || target.role === "admin");
      return jsonResponse({
        ok: true,
        message: target.role === "superadmin" ? "Đăng nhập Google với quyền Chủ sở hữu tối cao thành công!" : "Đăng nhập bằng tài khoản Google thành công!",
        user: {
          id: target.id,
          username: target.username,
          displayName: target.displayName,
          role: target.role,
          status: target.status,
          avatar: target.avatar,
          provider: "google",
          email: rawEmail
        },
        adminKey: isPrivileged ? getAdminKey() : "",
        token: "tk_g_" + target.id + "_" + Utilities.getUuid()
      });
    }





    // Cho phép Khách gửi đề xuất lễ hội mới vào Hàng chờ xét duyệt ([CHỜ DUYỆT])
    if (action === "submitPending") {
      const { mainSheet, backupSheet } = ensureSheetsExist();
      const currentRecords = readAllRecords(mainSheet);
      const incoming = payload.item;
      if (!incoming || !incoming.name || !incoming.location) {
        return jsonResponse({ ok: false, error: "Dữ liệu lễ hội đề xuất không hợp lệ." });
      }
      saveBackupSnapshot(backupSheet, "GUEST_PROPOSE: " + incoming.name, currentRecords);
      const nowIso = new Date().toISOString();
      const rawLabel = String(incoming.lunarLabel || "15/01 ÂL").replace(/^\[CHỜ DUYỆT\]\s*/i, "").trim();
      const pendingLabel = "[CHỜ DUYỆT] " + rawLabel;
      currentRecords.push({
        id: incoming.id || Date.now(),
        name: String(incoming.name).trim(),
        location: String(incoming.location).trim(),
        region: incoming.region || "Miền Nam",
        lunarDay: Number(incoming.lunarDay) || 15,
        lunarMonth: Number(incoming.lunarMonth) || 1,
        lunarLabel: pendingLabel,
        duration: incoming.duration || "1 – 3 ngày",
        highlights: incoming.highlights || "",
        updatedAt: nowIso,
        deleted: false
      });
      writeAllRecords(mainSheet, currentRecords);
      return jsonResponse({
        ok: true,
        serverTime: nowIso,
        items: currentRecords.filter(r => !r.deleted),
        deletedIds: currentRecords.filter(r => r.deleted).map(r => ({ id: r.id, updatedAt: r.updatedAt }))
      });
    }

    // 7. Lấy danh sách sự kiện riêng tư của tài khoản đang đăng nhập
    if (action === "getMyPrivateEvents") {
      const { privateSheet } = ensureSheetsExist();
      const allPrivate = readAllPrivateRecords(privateSheet);
      const userId = String(payload.userId || "").trim();
      const username = String(payload.username || "").trim().toLowerCase();
      const email = String(payload.email || "").trim().toLowerCase();

      if (!userId && !username && !email) {
        return jsonResponse({ ok: false, error: "Thiếu thông tin nhận diện tài khoản." });
      }

      const userEvents = allPrivate.filter(r => {
        if (r.deleted) return false;
        const isOwner = (userId && r.ownerId === userId) ||
                        (username && r.ownerUsername === username) ||
                        (email && r.ownerEmail === email);
        if (isOwner) return true;
        if (r.visibility === "members" && (userId || username || email)) return true;
        if (r.visibility === "selected") {
          const allowed = Array.isArray(r.allowedUsers) ? r.allowedUsers : [];
          if (allowed.some(a => a === username || a === email || a === userId)) return true;
        }
        return false;
      });

      return jsonResponse({
        ok: true,
        items: userEvents,
        serverTime: new Date().toISOString()
      });
    }

    // 8. Lưu / Cập nhật sự kiện riêng tư (Đám giỗ, kỷ niệm gia đình)
    if (action === "savePrivateEvent") {
      const { privateSheet } = ensureSheetsExist();
      const allPrivate = readAllPrivateRecords(privateSheet);
      const userId = String(payload.userId || "").trim();
      const username = String(payload.username || "").trim().toLowerCase();
      const email = String(payload.email || "").trim().toLowerCase();
      const item = payload.item;

      if (!item || !item.name) {
        return jsonResponse({ ok: false, error: "Dữ liệu sự kiện riêng không hợp lệ." });
      }
      if (!userId && !username && !email) {
        return jsonResponse({ ok: false, error: "Vui lòng đăng nhập để lưu sự kiện riêng tư!" });
      }

      const nowIso = new Date().toISOString();
      const targetId = String(item.id || ("priv_" + Date.now()));
      const existingIdx = allPrivate.findIndex(r => String(r.id) === targetId);

      const normalizedItem = {
        id: targetId,
        ownerId: userId || (existingIdx >= 0 ? allPrivate[existingIdx].ownerId : ""),
        ownerUsername: username || (existingIdx >= 0 ? allPrivate[existingIdx].ownerUsername : ""),
        ownerEmail: email || (existingIdx >= 0 ? allPrivate[existingIdx].ownerEmail : ""),
        name: String(item.name).trim(),
        location: String(item.location || "Gia đình").trim(),
        region: String(item.region || "Gia đình").trim(),
        lunarDay: Number(item.lunarDay) || 15,
        lunarMonth: Number(item.lunarMonth) || 1,
        lunarLabel: String(item.lunarLabel || "").trim(),
        calendarType: String(item.calendarType || "lunar"),
        duration: String(item.duration || "1 ngày").trim(),
        highlights: String(item.highlights || "").trim(),
        updatedAt: nowIso,
        deleted: false,
        isPrivate: true,
        visibility: String(item.visibility || "only_me").trim(),
        allowedUsers: Array.isArray(item.allowedUsers) ? item.allowedUsers : (item.allowedUsers ? String(item.allowedUsers).split(",").map(s => s.trim().toLowerCase()).filter(Boolean) : [])
      };

      if (existingIdx >= 0) {
        const existing = allPrivate[existingIdx];
        const isOwner = (userId && existing.ownerId === userId) ||
                        (username && existing.ownerUsername === username) ||
                        (email && existing.ownerEmail === email);
        if (!isOwner) {
          return jsonResponse({ ok: false, error: "Bạn không có quyền chỉnh sửa sự kiện riêng tư của người khác!" });
        }
        allPrivate[existingIdx] = normalizedItem;
      } else {
        allPrivate.push(normalizedItem);
      }

      writeAllPrivateRecords(privateSheet, allPrivate);
      return jsonResponse({
        ok: true,
        item: normalizedItem,
        serverTime: nowIso
      });
    }

    // 9. Xóa sự kiện riêng tư của người dùng
    if (action === "deletePrivateEvent") {
      const { privateSheet } = ensureSheetsExist();
      const allPrivate = readAllPrivateRecords(privateSheet);
      const userId = String(payload.userId || "").trim();
      const username = String(payload.username || "").trim().toLowerCase();
      const email = String(payload.email || "").trim().toLowerCase();
      const targetId = String(payload.id || "").trim();

      const existingIdx = allPrivate.findIndex(r => String(r.id) === targetId);
      if (existingIdx < 0) {
        return jsonResponse({ ok: true, message: "Không tìm thấy hoặc đã xóa." });
      }

      const existing = allPrivate[existingIdx];
      const isOwner = (userId && existing.ownerId === userId) ||
                      (username && existing.ownerUsername === username) ||
                      (email && existing.ownerEmail === email);
      if (!isOwner) {
        return jsonResponse({ ok: false, error: "Bạn không có quyền xóa sự kiện riêng tư của người khác!" });
      }

      existing.deleted = true;
      existing.updatedAt = new Date().toISOString();
      writeAllPrivateRecords(privateSheet, allPrivate);
      return jsonResponse({
        ok: true,
        id: targetId,
        serverTime: new Date().toISOString()
      });
    }

    // 10. Đồng bộ gộp 2 chiều sự kiện riêng tư của người dùng
    if (action === "syncPrivateEvents") {
      const { privateSheet } = ensureSheetsExist();
      const allPrivate = readAllPrivateRecords(privateSheet);
      const userId = String(payload.userId || "").trim();
      const username = String(payload.username || "").trim().toLowerCase();
      const email = String(payload.email || "").trim().toLowerCase();
      const incomingList = Array.isArray(payload.items) ? payload.items : [];

      if (!userId && !username && !email) {
        return jsonResponse({ ok: false, error: "Vui lòng đăng nhập để đồng bộ sự kiện riêng tư!" });
      }

      incomingList.forEach(inc => {
        if (!inc || !inc.name) return;
        const incId = String(inc.id || ("priv_" + Date.now()));
        const existingIdx = allPrivate.findIndex(r => String(r.id) === incId);
        if (existingIdx >= 0) {
          const existing = allPrivate[existingIdx];
          const isOwner = (userId && existing.ownerId === userId) ||
                          (username && existing.ownerUsername === username) ||
                          (email && existing.ownerEmail === email);
          if (isOwner) {
            const incTime = new Date(inc.updatedAt || 0).getTime();
            const exTime = new Date(existing.updatedAt || 0).getTime();
            if (incTime > exTime) {
              allPrivate[existingIdx] = {
                ...existing,
                ...inc,
                ownerId: userId || existing.ownerId,
                ownerUsername: username || existing.ownerUsername,
                ownerEmail: email || existing.ownerEmail,
                deleted: Boolean(inc.deleted)
              };
            }
          }
        } else {
          allPrivate.push({
            id: incId,
            ownerId: userId,
            ownerUsername: username,
            ownerEmail: email,
            name: String(inc.name).trim(),
            location: String(inc.location || "Gia đình").trim(),
            region: String(inc.region || "Gia đình").trim(),
            lunarDay: Number(inc.lunarDay) || 15,
            lunarMonth: Number(inc.lunarMonth) || 1,
            lunarLabel: String(inc.lunarLabel || "").trim(),
            calendarType: String(inc.calendarType || "lunar"),
            duration: String(inc.duration || "1 ngày").trim(),
            highlights: String(inc.highlights || "").trim(),
            updatedAt: inc.updatedAt || new Date().toISOString(),
            deleted: Boolean(inc.deleted),
            isPrivate: true
          });
        }
      });

      writeAllPrivateRecords(privateSheet, allPrivate);

      const userEvents = allPrivate.filter(r => {
        if (r.deleted) return false;
        const isOwner = (userId && r.ownerId === userId) ||
                        (username && r.ownerUsername === username) ||
                        (email && r.ownerEmail === email);
        if (isOwner) return true;
        if (r.visibility === "members" && (userId || username || email)) return true;
        if (r.visibility === "selected") {
          const allowed = Array.isArray(r.allowedUsers) ? r.allowedUsers : [];
          if (allowed.some(a => a === username || a === email || a === userId)) return true;
        }
        return false;
      });

      return jsonResponse({
        ok: true,
        items: userEvents,
        serverTime: new Date().toISOString()
      });
    }

    if (!verifyKey(adminKey)) {
      return jsonResponse({
        ok: false,
        authError: true,
        error: "Mã khóa Chủ sở hữu không chính xác! Từ chối quyền chỉnh sửa."
      });
    }

    const { mainSheet, backupSheet } = ensureSheetsExist();
    const currentRecords = readAllRecords(mainSheet);

    if (action === "verifyAuth") {
      return jsonResponse({
        ok: true,
        message: "Xác thực Chủ sở hữu thành công!",
        serverTime: new Date().toISOString()
      });
    }

    // 1. Thêm hoặc cập nhật 1 lễ hội đơn lẻ (Không đụng chạm các dòng khác)
    if (action === "upsert") {
      const incoming = payload.item;
      if (!incoming || !incoming.name || !incoming.location) {
        return jsonResponse({ ok: false, error: "Dữ liệu lễ hội không hợp lệ." });
      }
      saveBackupSnapshot(backupSheet, "UPSERT: " + incoming.name, currentRecords);

      const nowIso = incoming.updatedAt || new Date().toISOString();
      const targetId = String(incoming.id);
      const targetFp = makeFingerprint(incoming);
      let found = false;

      for (let i = 0; i < currentRecords.length; i++) {
        if (String(currentRecords[i].id) === targetId || (!currentRecords[i].deleted && makeFingerprint(currentRecords[i]) === targetFp)) {
          currentRecords[i] = {
            id: currentRecords[i].id,
            name: String(incoming.name).trim(),
            location: String(incoming.location).trim(),
            region: incoming.region || "Miền Nam",
            lunarDay: Number(incoming.lunarDay) || 15,
            lunarMonth: Number(incoming.lunarMonth) || 1,
            lunarLabel: incoming.lunarLabel || (String(incoming.lunarDay).padStart(2, "0") + "/" + String(incoming.lunarMonth).padStart(2, "0") + " ÂL"),
            duration: incoming.duration || "1 – 3 ngày",
            highlights: incoming.highlights || "",
            updatedAt: nowIso,
            deleted: false,
            visibility: incoming.visibility || currentRecords[i].visibility || "public",
            allowedUsers: Array.isArray(incoming.allowedUsers)
              ? incoming.allowedUsers
              : (typeof incoming.allowedUsers === "string" && incoming.allowedUsers
                  ? incoming.allowedUsers.split(",").map(s => s.trim().toLowerCase()).filter(Boolean)
                  : (currentRecords[i].allowedUsers || []))
          };
          found = true;
          break;
        }
      }

      if (!found) {
        currentRecords.push({
          id: incoming.id || Date.now(),
          name: String(incoming.name).trim(),
          location: String(incoming.location).trim(),
          region: incoming.region || "Miền Nam",
          lunarDay: Number(incoming.lunarDay) || 15,
          lunarMonth: Number(incoming.lunarMonth) || 1,
          lunarLabel: incoming.lunarLabel || (String(incoming.lunarDay).padStart(2, "0") + "/" + String(incoming.lunarMonth).padStart(2, "0") + " ÂL"),
          duration: incoming.duration || "1 – 3 ngày",
          highlights: incoming.highlights || "",
          updatedAt: nowIso,
          deleted: false,
          visibility: incoming.visibility || "public",
          allowedUsers: Array.isArray(incoming.allowedUsers)
            ? incoming.allowedUsers
            : (typeof incoming.allowedUsers === "string" && incoming.allowedUsers
                ? incoming.allowedUsers.split(",").map(s => s.trim().toLowerCase()).filter(Boolean)
                : [])
        });
      }

      // Nếu sự kiện cũng tồn tại trong sheet SuKien_CaNhan thì đồng bộ cập nhật luôn
      try {
        const { privateSheet } = ensureSheetsExist();
        const allPrivate = readAllPrivateRecords(privateSheet);
        const privIdx = allPrivate.findIndex(r => String(r.id) === targetId);
        if (privIdx >= 0) {
          allPrivate[privIdx].name = String(incoming.name).trim();
          allPrivate[privIdx].location = String(incoming.location || "Gia đình").trim();
          allPrivate[privIdx].region = String(incoming.region || "Gia đình").trim();
          allPrivate[privIdx].visibility = incoming.visibility || allPrivate[privIdx].visibility || "only_me";
          allPrivate[privIdx].allowedUsers = Array.isArray(incoming.allowedUsers)
            ? incoming.allowedUsers
            : (typeof incoming.allowedUsers === "string" && incoming.allowedUsers
                ? incoming.allowedUsers.split(",").map(s => s.trim().toLowerCase()).filter(Boolean)
                : (allPrivate[privIdx].allowedUsers || []));
          allPrivate[privIdx].updatedAt = nowIso;
          writeAllPrivateRecords(privateSheet, allPrivate);
        }
      } catch (errPriv) {}

      writeAllRecords(mainSheet, currentRecords);
      return jsonResponse({
        ok: true,
        serverTime: new Date().toISOString(),
        items: currentRecords.filter(r => !r.deleted),
        deletedIds: currentRecords.filter(r => r.deleted).map(r => ({ id: r.id, updatedAt: r.updatedAt }))
      });
    }

    // 2. Xóa mềm 1 lễ hội (Có lưu vào Backup_LichSu trước khi xóa)
    if (action === "delete") {
      const targetId = String(payload.id);
      saveBackupSnapshot(backupSheet, "DELETE ID: " + targetId, currentRecords);
      const nowIso = new Date().toISOString();
      for (let i = 0; i < currentRecords.length; i++) {
        if (String(currentRecords[i].id) === targetId) {
          currentRecords[i].deleted = true;
          currentRecords[i].updatedAt = nowIso;
        }
      }
      writeAllRecords(mainSheet, currentRecords);
      return jsonResponse({
        ok: true,
        serverTime: nowIso,
        items: currentRecords.filter(r => !r.deleted),
        deletedIds: currentRecords.filter(r => r.deleted).map(r => ({ id: r.id, updatedAt: r.updatedAt }))
      });
    }

    // 3. Đồng bộ Gộp 2 Chiều (Safe Merge: Không làm mất dữ liệu trên Sheet lẫn trên máy)
    if (action === "syncMerge") {
      const incomingList = Array.isArray(payload.items) ? payload.items : [];
      saveBackupSnapshot(backupSheet, "SYNC_MERGE (" + incomingList.length + " mục từ trình duyệt)", currentRecords);

      const byId = {};
      const byFp = {};
      currentRecords.forEach(rec => {
        byId[String(rec.id)] = rec;
        if (!rec.deleted) {
          byFp[makeFingerprint(rec)] = rec;
        }
      });

      let addedCount = 0;
      let updatedCount = 0;

      incomingList.forEach(inc => {
        if (!inc || !inc.name || !inc.location) return;
        const incId = String(inc.id);
        const incFp = makeFingerprint(inc);
        const incTime = parseTimeMs(inc.updatedAt);
        const existing = byId[incId] || byFp[incFp];

        if (!existing) {
          const newRec = {
            id: inc.id || Date.now(),
            name: String(inc.name).trim(),
            location: String(inc.location).trim(),
            region: inc.region || "Miền Nam",
            lunarDay: Number(inc.lunarDay) || 15,
            lunarMonth: Number(inc.lunarMonth) || 1,
            lunarLabel: inc.lunarLabel || (String(inc.lunarDay).padStart(2, "0") + "/" + String(inc.lunarMonth).padStart(2, "0") + " ÂL"),
            duration: inc.duration || "1 – 3 ngày",
            highlights: inc.highlights || "",
            updatedAt: inc.updatedAt || new Date().toISOString(),
            deleted: false,
            visibility: inc.visibility || "public",
            allowedUsers: Array.isArray(inc.allowedUsers)
              ? inc.allowedUsers
              : (typeof inc.allowedUsers === "string" && inc.allowedUsers
                  ? inc.allowedUsers.split(",").map(s => s.trim().toLowerCase()).filter(Boolean)
                  : [])
          };
          currentRecords.push(newRec);
          byId[String(newRec.id)] = newRec;
          byFp[incFp] = newRec;
          addedCount++;
        } else {
          const sheetTime = parseTimeMs(existing.updatedAt);
          if (existing.deleted && sheetTime >= incTime) {
            return;
          }
          if (incTime > sheetTime) {
            existing.name = String(inc.name).trim();
            existing.location = String(inc.location).trim();
            existing.region = inc.region || existing.region || "Miền Nam";
            existing.lunarDay = Number(inc.lunarDay) || existing.lunarDay || 15;
            existing.lunarMonth = Number(inc.lunarMonth) || existing.lunarMonth || 1;
            existing.lunarLabel = inc.lunarLabel || (String(existing.lunarDay).padStart(2, "0") + "/" + String(existing.lunarMonth).padStart(2, "0") + " ÂL");
            existing.duration = inc.duration || existing.duration || "1 – 3 ngày";
            existing.highlights = inc.highlights !== undefined ? inc.highlights : existing.highlights;
            existing.updatedAt = inc.updatedAt || new Date().toISOString();
            existing.deleted = false;
            existing.visibility = inc.visibility || existing.visibility || "public";
            if (inc.allowedUsers !== undefined) {
              existing.allowedUsers = Array.isArray(inc.allowedUsers)
                ? inc.allowedUsers
                : (typeof inc.allowedUsers === "string" && inc.allowedUsers
                    ? inc.allowedUsers.split(",").map(s => s.trim().toLowerCase()).filter(Boolean)
                    : []);
            }
            updatedCount++;
          } else {
            // Nếu sheetTime >= incTime nhưng trên sheet đang là 'public' mà inc mang phân quyền từ client, cập nhật phân quyền
            if ((!existing.visibility || existing.visibility === "public") && (inc.visibility && inc.visibility !== "public")) {
              existing.visibility = inc.visibility;
              existing.allowedUsers = Array.isArray(inc.allowedUsers)
                ? inc.allowedUsers
                : (typeof inc.allowedUsers === "string" && inc.allowedUsers
                    ? inc.allowedUsers.split(",").map(s => s.trim().toLowerCase()).filter(Boolean)
                    : []);
              existing.updatedAt = new Date().toISOString();
              updatedCount++;
            }
          }
        }
      });

      writeAllRecords(mainSheet, currentRecords);
      return jsonResponse({
        ok: true,
        addedCount: addedCount,
        updatedCount: updatedCount,
        serverTime: new Date().toISOString(),
        items: currentRecords.filter(r => !r.deleted),
        deletedIds: currentRecords.filter(r => r.deleted).map(r => ({ id: r.id, updatedAt: r.updatedAt }))
      });
    }

    // 4. Khôi phục từ bản sao lưu gần nhất trong trang tính Backup_LichSu
    if (action === "restoreBackup") {
      const bLastRow = backupSheet.getLastRow();
      if (bLastRow <= 1) {
        return jsonResponse({ ok: false, error: "Chưa có bản sao lưu nào trong sheet Backup_LichSu." });
      }
      const snapshotJson = backupSheet.getRange(bLastRow, 4).getValue();
      const restoredRecords = JSON.parse(snapshotJson || "[]");
      if (!Array.isArray(restoredRecords) || restoredRecords.length === 0) {
        return jsonResponse({ ok: false, error: "Bản sao lưu gần nhất trống hoặc không hợp lệ." });
      }
      backupSheet.deleteRow(bLastRow);
      writeAllRecords(mainSheet, restoredRecords);
      return jsonResponse({
        ok: true,
        serverTime: new Date().toISOString(),
        items: restoredRecords.filter(r => !r.deleted),
        deletedIds: restoredRecords.filter(r => r.deleted).map(r => ({ id: r.id, updatedAt: r.updatedAt }))
      });
    }

    return jsonResponse({ ok: false, error: "Hành động không được hỗ trợ: " + action });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

function restoreLatestBackupFromMenu() {
  const ui = SpreadsheetApp.getUi();
  const { mainSheet, backupSheet } = ensureSheetsExist();
  const bLastRow = backupSheet.getLastRow();
  if (bLastRow <= 1) {
    ui.alert("Chưa có bản sao lưu nào trong trang tính Backup_LichSu!");
    return;
  }
  const snapshotJson = backupSheet.getRange(bLastRow, 4).getValue();
  const restoredRecords = JSON.parse(snapshotJson || "[]");
  backupSheet.deleteRow(bLastRow);
  writeAllRecords(mainSheet, restoredRecords);
  ui.alert("Đã khôi phục thành công bản sao lưu gần nhất!");
}