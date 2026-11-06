# =====================================================================
# TAO SHORTCUT DONG BO RA MAN HINH DESKTOP
# =====================================================================
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "TAO SHORTCUT DESKTOP (EVENT-FESTIVAL)"

$desktop = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)
$projectDir = Split-Path -Parent $PSScriptRoot
$WshShell = New-Object -ComObject WScript.Shell

# 1. Shortcut PULL
$s1 = $WshShell.CreateShortcut((Join-Path $desktop "[PULL] Bat Dau Lam Viec.lnk"))
$s1.TargetPath = Join-Path $projectDir "1_PULL_TRUOC_KHI_LAM.bat"
$s1.WorkingDirectory = $projectDir
$s1.Description = "Keo code moi nhat tu GitHub ve may truoc khi lam viec"
$s1.IconLocation = "$env:SystemRoot\System32\shell32.dll, 46"
$s1.Save()

# 2. Shortcut PUSH
$s2 = $WshShell.CreateShortcut((Join-Path $desktop "[PUSH] Luu va Ra Ve.lnk"))
$s2.TargetPath = Join-Path $projectDir "2_PUSH_TRUOC_KHI_VE.bat"
$s2.WorkingDirectory = $projectDir
$s2.Description = "Dong goi, commit va day code len GitHub truoc khi tat may"
$s2.IconLocation = "$env:SystemRoot\System32\shell32.dll, 238"
$s2.Save()

Write-Host "======================================================================" -ForegroundColor Green
Write-Host "  DA TAO THANH CONG 2 ICON TREN MAN HINH CHINH (DESKTOP):" -ForegroundColor Green
Write-Host "     1. [PULL] Bat Dau Lam Viec" -ForegroundColor Yellow
Write-Host "     2. [PUSH] Luu va Ra Ve" -ForegroundColor Yellow
Write-Host "======================================================================" -ForegroundColor Green
Write-Host ""
if (-not [Console]::IsInputRedirected) {
    Write-Host "Nhan Enter de dong cua so..." -ForegroundColor DarkGray
    [void][Console]::ReadLine()
}
