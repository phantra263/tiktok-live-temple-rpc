# ==============================================================================
# Hướng dẫn & Tự động Clone + Setup: Chùa Linh Ứng Online (TikTok Live RPC)
# Repository: https://github.com/zane-tv/tiktok-live-temple-rpc.git
# ==============================================================================

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  🪷 SETUP CHÙA LINH ỨNG ONLINE - TIKTOK LIVE RPC 9:16          " -ForegroundColor Yellow
Write-Host "=================================================================" -ForegroundColor Cyan

$WorkspaceDir = $PSScriptRoot
Set-Location $WorkspaceDir

# ------------------------------------------------------------------------------
# Bước 1: Clone / Kéo mã nguồn từ GitHub
# ------------------------------------------------------------------------------
$RepoUrl = "https://github.com/zane-tv/tiktok-live-temple-rpc.git"
Write-Host "`n[1/4] Kiểm tra và kéo mã nguồn từ GitHub: $RepoUrl ..." -ForegroundColor Green

if (-not (Test-Path "$WorkspaceDir\public\assets\amitabha_stage.png")) {
    Write-Host "Đang kéo toàn bộ mã nguồn & tài nguyên (hình ảnh Phật A Di Đà, 8 frame đảnh lễ, âm thanh)..." -ForegroundColor Cyan
    if (-not (Test-Path "$WorkspaceDir\.git")) {
        git init
        git remote add origin $RepoUrl
    }
    git fetch origin main
    git checkout -f -B main origin/main
} else {
    Write-Host "Mã nguồn và tài nguyên đã có đầy đủ tại $WorkspaceDir." -ForegroundColor Green
}

# ------------------------------------------------------------------------------
# Bước 2: Cài đặt Node / Bun dependencies
# ------------------------------------------------------------------------------
Write-Host "`n[2/4] Cài đặt dependencies (Express, WebSocket, TikTokLiveConnector)..." -ForegroundColor Green

$hasBun = Get-Command bun -ErrorAction SilentlyContinue
$hasNpm = Get-Command npm -ErrorAction SilentlyContinue

if ($hasBun) {
    Write-Host "Phát hiện Bun.js! Đang chạy: bun install..." -ForegroundColor Cyan
    bun install
} elseif ($hasNpm) {
    Write-Host "Phát hiện Node.js/npm! Đang chạy: npm install..." -ForegroundColor Cyan
    npm install
} else {
    Write-Host "[CẢNH BÁO] Không tìm thấy bun hoặc npm trong PATH!" -ForegroundColor Red
    Write-Host "Vui lòng cài đặt Bun (https://bun.sh) hoặc Node.js (https://nodejs.org)." -ForegroundColor Yellow
}

# ------------------------------------------------------------------------------
# Bước 3: Thiết lập Python venv & ZeroTTS (Giọng đọc AI tiếng Việt)
# ------------------------------------------------------------------------------
Write-Host "`n[3/4] Thiết lập môi trường Python cho ZeroTTS (Giọng đọc AI tiếng Việt)..." -ForegroundColor Green

$hasUv = Get-Command uv -ErrorAction SilentlyContinue
$hasPython = Get-Command python -ErrorAction SilentlyContinue

if (-not (Test-Path "$WorkspaceDir\.venv")) {
    if ($hasUv) {
        Write-Host "Dùng 'uv' tạo môi trường ảo .venv..." -ForegroundColor Cyan
        uv venv .venv
        uv pip install zerotts pillow
    } elseif ($hasPython) {
        Write-Host "Dùng 'python' tạo môi trường ảo .venv..." -ForegroundColor Cyan
        python -m venv .venv
        & "$WorkspaceDir\.venv\Scripts\pip.exe" install --upgrade pip
        & "$WorkspaceDir\.venv\Scripts\pip.exe" install zerotts pillow
    } else {
        Write-Host "[LƯU Ý] Không tìm thấy Python 3.10+ hoặc uv." -ForegroundColor Yellow
        Write-Host "Hệ thống vẫn chạy được các tính năng Live, Mõ, Chuông, Xăm, nhưng giọng đọc AI ZeroTTS sẽ tạm tắt." -ForegroundColor Yellow
    }
} else {
    Write-Host "Môi trường ảo .venv đã sẵn sàng." -ForegroundColor Green
}

# ------------------------------------------------------------------------------
# Bước 4: Tự động tương thích Windows cho server.js
# ------------------------------------------------------------------------------
Write-Host "`n[4/4] Kiểm tra tương thích Windows đường dẫn Python..." -ForegroundColor Green
if (Test-Path "$WorkspaceDir\server.js") {
    $serverContent = Get-Content -Raw "$WorkspaceDir\server.js"
    if ($serverContent -match "resolvePythonBin\(\)\s*\{" -and -not ($serverContent -match "Scripts")) {
        Write-Host "Đang vá đường dẫn Python venv trên Windows (.venv\Scripts\python.exe)..." -ForegroundColor Cyan
        $replacement = @"
  resolvePythonBin() {
    const venvWin = path.join(__dirname, '.venv', 'Scripts', 'python.exe');
    if (fs.existsSync(venvWin)) return venvWin;
    const venvPy = path.join(__dirname, '.venv', 'bin', 'python');
    if (fs.existsSync(venvPy)) return venvPy;
    return process.platform === 'win32' ? 'python' : 'python3';
  }
"@
        $serverContent = $serverContent -replace "resolvePythonBin\(\)\s*\{[\s\S]*?return 'python3';\s*\}", $replacement
        Set-Content -Path "$WorkspaceDir\server.js" -Value $serverContent -Encoding UTF8
        Write-Host "Đã cập nhật server.js tương thích mượt mà trên Windows!" -ForegroundColor Green
    }
}

# Dọn dẹp file nháp nếu có
if (Test-Path "$WorkspaceDir\test.txt") {
    Remove-Item -Force "$WorkspaceDir\test.txt" -ErrorAction SilentlyContinue
}

Write-Host "`n=================================================================" -ForegroundColor Cyan
Write-Host "  ✅ HOÀN TẤT SETUP! CÁC ĐỊA CHỈ TRUY CẬP:                     " -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  - Khởi động server : bun start (hoặc node server.js)" -ForegroundColor White
Write-Host "  - Chánh Điện 9:16  : http://localhost:3000" -ForegroundColor White
Write-Host "  - Nguồn OBS 9:16   : http://localhost:3000/?obs=1 (Đặt 1080x1920)" -ForegroundColor White
Write-Host "  - Quản trị RPC     : http://localhost:3000/admin" -ForegroundColor White
Write-Host "=================================================================`n" -ForegroundColor Cyan
