@echo off
title QRDA Launcher
echo Launching QRDA Project (Backend + Frontend)...
start "" "%~dp0run_backend.bat"
start "" "%~dp0run_frontend.bat"
