@echo off
title QRDA Backend Server
set "PATH=C:\Users\ABC\AppData\Local\Programs\Python\Python312;C:\Users\ABC\AppData\Local\Programs\Python\Python312\Scripts;C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0backend"
echo Starting QRDA Backend API...
python main.py
pause
