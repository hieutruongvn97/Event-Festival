# =====================================================================
# HỆ THỐNG TRA CỨU LỄ HỘI VIỆT NAM - ĐỒNG BỘ MÃ NGUỒN
# SCRIPT: PULL - KÉO CODE MỚI NHẤT TỪ GITHUB VỀ MÁY
# =====================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "PULL CODE - BAT DAU LAM VIEC (EVENT-FESTIVAL)"

function Find-GitCommand {
    if (Get-Command git -ErrorAction SilentlyContinue) {
        return "git"
    }
    $ghApps = Get-Item "$env:LOCALAPPDATA\GitHubDesktop\app-*\resources\app\git\cmd\git.exe" -ErrorAction SilentlyContinue
    if ($ghApps) {
        return ($ghApps | Select-Object -Last 1).FullName
    }
    if (Test-Path "C:\Program Files\Git\cmd\git.exe") {
        return "C:\Program Files\Git\cmd\git.exe"
    }
    if (Test-Path "$env:LOCALAPPDATA\Programs\Git\cmd\git.exe") {
        return "$env:LOCALAPPDATA\Programs\Git\cmd\git.exe"
    }
    return $null
}

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "      [PULL] KEO CODE MOI NHAT TU GITHUB VE MAY NAY TRUOC KHI LAM" -ForegroundColor Yellow
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

$rootDir = Split-Path -Parent $PSScriptRoot
Set-Location $rootDir

$git = Find-GitCommand
if (-not $git) {
    Write-Host "[LOI] Khong tim thay phan mem Git hoac GitHub Desktop tren may tinh nay!" -ForegroundColor Red
    Write-Host "Vui long cai dat Git hoac GitHub Desktop de tiep tuc." -ForegroundColor Red
    Write-Host ""
    if (-not [Console]::IsInputRedirected) {
        Write-Host "Nhan Enter de thoat..." -ForegroundColor DarkGray
        [void][Console]::ReadLine()
    }
    exit 1
}

Write-Host "[1/2] Dang kiem tra ket noi voi GitHub (git fetch origin)..." -ForegroundColor Cyan
& $git fetch origin
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[LOI] Khong the ket noi toi GitHub. Vui long kiem tra lai mang Internet!" -ForegroundColor Red
    Write-Host ""
    if (-not [Console]::IsInputRedirected) {
        Write-Host "Nhan Enter de thoat..." -ForegroundColor DarkGray
        [void][Console]::ReadLine()
    }
    exit 1
}

Write-Host "[2/2] Dang keo cap nhat moi nhat tu GitHub ve may (git pull origin main)..." -ForegroundColor Cyan
& $git pull origin main

Write-Host ""
if ($LASTEXITCODE -eq 0) {
    Write-Host "======================================================================" -ForegroundColor Green
    Write-Host "  THANH CONG! MA NGUON DA DUOC CAP NHAT MOI NHAT TU GITHUB." -ForegroundColor Green
    Write-Host "  Ban co the an tam bat dau lam viec!" -ForegroundColor Yellow
    Write-Host "======================================================================" -ForegroundColor Green
} else {
    Write-Host "======================================================================" -ForegroundColor Yellow
    Write-Host "  CANH BAO: Qua trinh Pull gap su co (co the do file bi sua doi cuc bo)." -ForegroundColor Yellow
    Write-Host "  Hay kiem tra thong bao o tren." -ForegroundColor Yellow
    Write-Host "======================================================================" -ForegroundColor Yellow
}

Write-Host ""
if (-not [Console]::IsInputRedirected) {
    Write-Host "Nhan Enter de dong cua so..." -ForegroundColor DarkGray
    [void][Console]::ReadLine()
}
