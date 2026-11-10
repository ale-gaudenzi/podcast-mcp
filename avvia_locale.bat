@echo off
chcp 65001 >nul
echo ========================================================
echo   Avvio Server Podcast MCP in Locale (Porta 3000)
echo ========================================================
echo.

cd /d "%~dp0"

if not exist "dist\server.js" (
    echo Compilazione in corso...
    call npm run build
)

echo Avvio server su http://localhost:3000 ...
echo Premi CTRL+C per arrestarlo.
echo.

node dist/server.js
pause
