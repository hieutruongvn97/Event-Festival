@echo off
chcp 65001 >nul
title TẠO ICON RA MÀN HÌNH CHÍNH (DESKTOP)
color 0A

echo ======================================================================
echo   🏮 ĐANG TẠO ICON ĐỒNG BỘ GIT RA MÀN HÌNH DESKTOP CỦA MÁY NÀY... 🏮
echo ======================================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "$desktop = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop); $projectDir = '%~dp0'.TrimEnd('\'); $WshShell = New-Object -ComObject WScript.Shell; $s1 = $WshShell.CreateShortcut((Join-Path $desktop '[PULL] Bat Dau Lam Viec.lnk')); $s1.TargetPath = Join-Path $projectDir '1_PULL_TRUOC_KHI_LAM.bat'; $s1.WorkingDirectory = $projectDir; $s1.Description = 'Keo code moi nhat tu GitHub ve may truoc khi lam viec'; $s1.IconLocation = ($env:SystemRoot + '\System32\shell32.dll, 46'); $s1.Save(); $s2 = $WshShell.CreateShortcut((Join-Path $desktop '[PUSH] Luu va Ra Ve.lnk')); $s2.TargetPath = Join-Path $projectDir '2_PUSH_TRUOC_KHI_VE.bat'; $s2.WorkingDirectory = $projectDir; $s2.Description = 'Dong goi, commit va day code len GitHub truoc khi tat may'; $s2.IconLocation = ($env:SystemRoot + '\System32\shell32.dll, 238'); $s2.Save(); Write-Output 'Da tao thanh cong 2 icon ra Desktop!'"

echo.
echo ======================================================================
echo   ✅ ĐÃ TẠO XONG 2 ICON TRÊN MÀN HÌNH CHÍNH (DESKTOP):
echo      1. [PULL] Bat Dau Lam Viec
echo      2. [PUSH] Luu va Ra Ve
echo ======================================================================
echo.
pause
