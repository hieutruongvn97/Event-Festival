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

const SHEET_MAIN = "LeHoi";
const SHEET_BACKUP = "Backup_LichSu";
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
  return { ss, mainSheet, backupSheet };
}

function setupInitialSheet() {
  ensureSheetsExist();
  return "Đã khởi tạo bảng LeHoi và Backup_LichSu thành công!";
}

function readAllRecords(mainSheet) {
  const lastRow = mainSheet.getLastRow();
  if (lastRow <= 1) return [];
  const values = mainSheet.getRange(2, 1, lastRow - 1, 11).getValues();
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
      deleted: deleted
    });
  }
  return records;
}

function writeAllRecords(mainSheet, records) {
  const lastRow = mainSheet.getLastRow();
  if (lastRow > 1) {
    mainSheet.getRange(2, 1, lastRow - 1, 11).clearContent();
  }
  if (records.length === 0) return;
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
    Boolean(item.deleted)
  ]);
  mainSheet.getRange(2, 1, rows.length, 11).setValues(rows);
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
    const activeItems = allRecords.filter(r => !r.deleted);
    const deletedIds = allRecords.filter(r => r.deleted).map(r => ({ id: r.id, updatedAt: r.updatedAt }));
    return jsonResponse({
      ok: true,
      serverTime: new Date().toISOString(),
      items: activeItems,
      deletedIds: deletedIds
    });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err.message || err) });
  }
}

// API GHI & ĐỒNG BỘ DỮ LIỆU (Chỉ Chủ sở hữu có Mã khóa mới thực hiện được)
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
            deleted: false
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
          deleted: false
        });
      }

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
        byId[String(rec.id)] = rec;\n        if (!rec.deleted) {
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
            deleted: false
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
            updatedCount++;
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