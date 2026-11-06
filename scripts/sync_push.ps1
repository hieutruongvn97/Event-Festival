# =====================================================================
# HỆ THỐNG TRA CỨU LỄ HỘI VIỆT NAM - ĐỒNG BỘ MÃ NGUỒN
# SCRIPT: PUSH - LƯU VÀ ĐẨY TOÀN BỘ CODE LÊN GITHUB
# =====================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "PUSH CODE - LUU VA RA VE (EVENT-FESTIVAL)"

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

Write-Host "======================================================================" -ForegroundColor Yellow
Write-Host "      [PUSH] DONG GOI, LUU VA DAY TOAN BO CODE LEN GITHUB TRUOC KHI VE" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Yellow
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

# 1. Tu dong dong bo web asset sang thu muc Android
$androidAsset = Join-Path $rootDir "android\app\src\main\assets\www\index.html"
$webIndex = Join-Path $rootDir "index.html"
if (Test-Path $androidAsset) {
    Write-Host "[*] Dang dong bo file index.html sang thu muc Android Assets..." -ForegroundColor DarkGray
    Copy-Item -Path $webIndex -Destination $androidAsset -Force
}

# 2. Kiem tra cac file thay doi trong thu muc lam viec
$statusLines = & $git status --porcelain
$hasWorkingChanges = ($statusLines | Measure-Object).Count -gt 0

if ($hasWorkingChanges) {
    Write-Host ""
    Write-Host "Cac file da duoc thay doi hoac them moi:" -ForegroundColor Yellow
    & $git status -s
    Write-Host ""

    $customMsg = ""
    if (-not [Console]::IsInputRedirected) {
        $customMsg = Read-Host "-> Nhap noi dung cap nhat (An ENTER de lay mac dinh ngay gio)"
    }
    if ([string]::IsNullOrWhiteSpace($customMsg)) {
        $nowStr = Get-Date -Format "yyyy-MM-dd HH:mm"
        $customMsg = "Cap nhat tu dong ngay $nowStr"
    }

    Write-Host ""
    Write-Host "[1/3] Dang dong goi tat ca thay doi (git add)..." -ForegroundColor Cyan
    & $git add .

    Write-Host "[2/3] Dang tao ban ghi cap nhat (git commit)..." -ForegroundColor Cyan
    & $git commit -m $customMsg
}

# 3. Kiem tra xem co ban commit nao chua day len GitHub khong
$unpushed = & $git log origin/main..HEAD --oneline 2>$null
$unpushedCount = if ($unpushed) { ($unpushed | Measure-Object).Count } else { 0 }

if (-not $hasWorkingChanges -and $unpushedCount -eq 0) {
    Write-Host "----------------------------------------------------------------------" -ForegroundColor Green
    Write-Host "  DU AN DA SACH SE! Toan bo ma nguon da dong bo tren GitHub tu truoc." -ForegroundColor Green
    Write-Host "  Ban co the an tam tat may ra ve bat cu luc nao." -ForegroundColor Yellow
    Write-Host "----------------------------------------------------------------------" -ForegroundColor Green
    Write-Host ""
    if (-not [Console]::IsInputRedirected) {
        Write-Host "Nhan Enter de dong cua so..." -ForegroundColor DarkGray
        [void][Console]::ReadLine()
    }
    exit 0
}

# 4. Tien hanh day len GitHub
Write-Host ""
if ($unpushedCount -gt 0) {
    Write-Host "[3/3] Dang day $unpushedCount ban cap nhat len GitHub (git push origin main)..." -ForegroundColor Cyan
} else {
    Write-Host "[3/3] Dang day cac cap nhat len GitHub (git push origin main)..." -ForegroundColor Cyan
}

& $git push origin main

Write-Host ""
if ($LASTEXITCODE -eq 0) {
    Write-Host "======================================================================" -ForegroundColor Green
    Write-Host "  XUAT SAC! TOAN BO CODE DA DUOC DAY LEN GITHUB THANH CONG!" -ForegroundColor Green
    Write-Host "  Gio ban co the an tam tat may ra ve." -ForegroundColor Yellow
    Write-Host "  Khi sang may khac, chi can bam icon [PULL] la xong!" -ForegroundColor Cyan
    Write-Host "======================================================================" -ForegroundColor Green
} else {
    Write-Host "======================================================================" -ForegroundColor Red
    Write-Host "  [LOI] Day code len GitHub that bai!" -ForegroundColor Red
    Write-Host "  Vui long kiem tra lai ket noi mang hoac xem chi tiet loi ben tren." -ForegroundColor Yellow
    Write-Host "======================================================================" -ForegroundColor Red
}

Write-Host ""
if (-not [Console]::IsInputRedirected) {
    Write-Host "Nhan Enter de dong cua so..." -ForegroundColor DarkGray
    [void][Console]::ReadLine()
}
