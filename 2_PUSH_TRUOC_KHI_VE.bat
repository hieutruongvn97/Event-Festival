@echo off
chcp 65001 >nul
title ⬆️ PUSH CODE - LƯU & RA VỀ (EVENT-FESTIVAL)
color 0E

echo ======================================================================
echo       🏮 HỆ THỐNG TRA CỨU LỄ HỘI VIỆT NAM - ĐỒNG BỘ MÃ NGUỒN 🏮
echo                    [ ⬆️ PUSH - ĐẨY CODE LÊN GITHUB ]
echo ======================================================================
echo.

cd /d "%~dp0"

:: 1. Tìm kiếm đường dẫn Git
set "GIT_CMD="
where git >nul 2>nul
if %errorlevel% equ 0 (
    set "GIT_CMD=git"
) else (
    for /d %%D in ("%LOCALAPPDATA%\GitHubDesktop\app-*") do (
        if exist "%%D\resources\app\git\cmd\git.exe" set "GIT_CMD=%%D\resources\app\git\cmd\git.exe"
    )
    if not defined GIT_CMD if exist "C:\Program Files\Git\cmd\git.exe" set "GIT_CMD=C:\Program Files\Git\cmd\git.exe"
    if not defined GIT_CMD if exist "%LOCALAPPDATA%\Programs\Git\cmd\git.exe" set "GIT_CMD=%LOCALAPPDATA%\Programs\Git\cmd\git.exe"
)

if not defined GIT_CMD (
    color 0C
    echo [LỖI] Không tìm thấy phần mềm Git hoặc GitHub Desktop trên máy tính này!
    echo Vui lòng cài đặt Git hoặc GitHub Desktop để sử dụng tính năng này.
    echo.
    pause
    exit /b 1
)

:: 2. Đồng bộ tự động web asset sang dự án Android
if exist "android\app\src\main\assets\www\index.html" (
    echo [*] Đang đồng bộ file index.html sang thư mục Android Assets...
    copy /y "index.html" "android\app\src\main\assets\www\index.html" >nul
)

:: 3. Kiểm tra xem có file nào thay đổi không
echo [*] Đang kiểm tra các file thay đổi...
"%GIT_CMD%" status --porcelain > "%TEMP%\git_changes.tmp"

for %%A in ("%TEMP%\git_changes.tmp") do if %%~zA==0 (
    color 0A
    echo.
    echo ----------------------------------------------------------------------
    echo   ✨ DỰ ÁN ĐÃ SẠCH SẼ! Không có file nào mới hoặc bị sửa đổi.
    echo   👉 Tất cả code của bạn đã được lưu an toàn trên GitHub từ trước.
    echo ----------------------------------------------------------------------
    del "%TEMP%\git_changes.tmp" >nul 2>nul
    echo.
    pause
    exit /b 0
)
del "%TEMP%\git_changes.tmp" >nul 2>nul

echo.
echo Các file đã được thay đổi hoặc thêm mới:
"%GIT_CMD%" status -s
echo.

:: 4. Nhập ghi chú commit
set "COMMIT_MSG="
set /p COMMIT_MSG="👉 Nhập nội dung cập nhật (Ấn ENTER để lấy mặc định ngày giờ): "

if not defined COMMIT_MSG (
    for /f "tokens=1-3 delims=/ " %%a in ('date /t') do set "MY_DATE=%%c-%%b-%%a"
    for /f "tokens=1-2 delims=: " %%a in ('time /t') do set "MY_TIME=%%a:%%b"
    set "COMMIT_MSG=Cap nhat tu dong ngay %DATE% %TIME%"
)

echo.
echo [1/3] Đang đóng gói tất cả thay đổi (git add)...
"%GIT_CMD%" add .

echo [2/3] Đang tạo bản ghi commit...
"%GIT_CMD%" commit -m "%COMMIT_MSG%"

echo [3/3] Đang đẩy lên GitHub (git push)...
"%GIT_CMD%" push origin main

if %errorlevel% equ 0 (
    color 0A
    echo.
    echo ======================================================================
    echo   🎉 XUẤT SẮC! TOÀN BỘ CODE ĐÃ ĐƯỢC ĐẨY LÊN GITHUB THÀNH CÔNG!
    echo   👉 Giờ bạn có thể an tâm tắt máy ra về.
    echo   👉 Khi sang máy khác, chỉ cần bấm file [PULL TRƯỚC KHI LÀM] là xong!
    echo ======================================================================
) else (
    color 0C
    echo.
    echo [LỖI] Đẩy code lên GitHub thất bại! Vui lòng kiểm tra lại mạng hoặc xung đột.
)

echo.
pause
