@echo off
cd /d "%~dp0"
python -m uvicorn qrda_real_api:app --host 127.0.0.1 --port 8001 --reload
