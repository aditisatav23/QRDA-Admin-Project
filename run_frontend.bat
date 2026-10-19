@echo off
title QRDA Frontend Dev Server
set "PATH=C:\Users\ABC\AppData\Local\Programs\Python\Python312;C:\Users\ABC\AppData\Local\Programs\Python\Python312\Scripts;C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0frontend"
echo Starting QRDA Frontend Dev Server...
npm run dev
pause
