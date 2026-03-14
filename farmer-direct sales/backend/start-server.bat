@echo off
REM Helper script to start the backend (Windows)
cd /d "%~dp0"
echo Checking Node and npm versions...
node -v
npm -v

echo Installing dependencies (if needed)...
npm install

echo Starting backend (nodemon)...
npm run dev

pause
