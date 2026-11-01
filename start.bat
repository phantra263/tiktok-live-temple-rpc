@echo off
chcp 65001 >nul
title Chùa Linh Ứng Online - Server TikTok Live RPC
cd /d "%~dp0"

echo =================================================================
echo   🪷 KHỞI ĐỘNG SERVER CHÙA LINH ỨNG ONLINE (PORT 3000)
echo =================================================================
echo.

:: 1. Kiểm tra tài nguyên hình ảnh / assets từ Git
if not exist "%~dp0public\assets\amitabha_stage.png" (
    echo [1/2] Chưa có tài nguyên hình ảnh/âm thanh, đang kéo từ GitHub...
    git init >nul 2>nul
    git remote add origin https://github.com/zane-tv/tiktok-live-temple-rpc.git >nul 2>nul
    git fetch origin main
    git checkout -f -B main origin/main
    echo Đã kéo tài nguyên thành công!
    echo.
)

:: 2. Kiểm tra node_modules
if not exist "%~dp0node_modules\" (
    echo [2/2] Chưa có node_modules, đang cài đặt thư viện (express, ws, tiktok-live-connector)...
    where bun >nul 2>nul
    if %ERRORLEVEL% equ 0 (
        bun install
    ) else (
        npm install
    )
    echo.
)

echo =================================================================
echo   ✅ SERVER SẴN SÀNG! CÁC ĐỊA CHỈ TRUY CẬP:
echo   - Màn hình Live 9:16 : http://localhost:3000
echo   - Nguồn OBS Studio   : http://localhost:3000/?obs=1 (1080x1920)
echo   - Quản trị RPC/Admin : http://localhost:3000/admin
echo =================================================================
echo.

where bun >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [Bun.js] Đang chạy: bun start...
    bun start
) else (
    echo [Node.js] Đang chạy: node server.js...
    node server.js
)

pause
