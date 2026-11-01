@echo off
chcp 65001 >nul
title Setup Chùa Linh Ứng Online - TikTok Live RPC
cd /d "%~dp0"

echo =================================================================
echo   🪷 SETUP CHÙA LINH ỨNG ONLINE - TIKTOK LIVE RPC 9:16
echo =================================================================

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup.ps1"

echo.
echo Nhấn phím bất kỳ để tiếp tục...
pause >nul
