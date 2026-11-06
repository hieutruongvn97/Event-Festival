@echo off
chcp 65001 >nul
title ⬇️ PULL CODE - BẮT ĐẦU LÀM VIỆC (EVENT-FESTIVAL)
color 0B

echo ======================================================================
echo       🏮 HỆ THỐNG TRA CỨU LỄ HỘI VIỆT NAM - ĐỒNG BỘ MÃ NGUỒN 🏮
echo                    [ ⬇️ PULL - KÉO CODE MỚI NHẤT VỀ MÁY ]
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

echo [1/3] Đang kiểm tra kết nối với GitHub...
"%GIT_CMD%" fetch origin

if %errorlevel% neq 0 (
    color 0C
    echo.
    echo [LỖI] Không thể kết nối tới GitHub. Vui lòng kiểm tra lại mạng Internet!
    echo.
    pause
    exit /b 1
)

echo [2/3] Đang kéo toàn bộ cập nhật mới nhất từ GitHub về máy...
"%GIT_CMD%" pull origin main

if %errorlevel% equ 0 (
    color 0A
    echo.
    echo ======================================================================
    echo   ✅ HOÀN TẤT THÀNH CÔNG! MÃ NGUỒN ĐÃ ĐƯỢC CẬP NHẬT MỚI NHẤT.
    echo   👉 Bây giờ bạn có thể an tâm bắt đầu làm việc!
    echo ======================================================================
) else (
    color 0E
    echo.
    echo [CẢNH BÁO] Quá trình Pull gặp sự cố (có thể do có file bị sửa đổi cục bộ).
    echo Hãy kiểm tra lại thông báo bên trên.
)

echo.
pause
