@echo off
chcp 65001 >nul
title Kéo toàn bộ tài nguyên Chùa Linh Ứng từ GitHub
cd /d "%~dp0"

echo =================================================================
echo   Đang kéo toàn bộ hình ảnh Đức Phật, 8 frame Phật tử & CSS/JS
echo =================================================================
echo.

git init
git remote remove origin >nul 2>nul
git remote add origin https://github.com/zane-tv/tiktok-live-temple-rpc.git
echo Đang tải từ GitHub (khoảng 14MB)...
git fetch origin main
git checkout -f -B main origin/main

echo.
echo =================================================================
echo   ✅ ĐÃ TẢI XONG ĐẦY ĐỦ TÀI NGUYÊN!
echo   Bây giờ bạn chỉ cần F5 (tải lại) trang web http://localhost:3000!
echo =================================================================
echo.
pause
