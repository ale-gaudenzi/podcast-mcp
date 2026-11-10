@echo off
chcp 65001 >nul
echo ==================================================================
echo   Server Podcast MCP Locale + Tunnel Gratuito per Smartphone
echo ==================================================================
echo.
echo Avvio del server locale in background su porta 3000...

cd /d "%~dp0"

if not exist "dist\server.js" (
    echo Compilazione in corso...
    call npm run build
)

start "Podcast MCP Server" cmd /k "node dist/server.js"

echo.
echo Creazione tunnel HTTPS per collegare l'app Claude del telefono...
echo.
echo [ATTENZIONE] Copia l'URL che compare qui sotto e aggiungi "/mcp" alla fine.
echo             Esempio: https://xxxx.loca.lt/mcp
echo.
npx --yes localtunnel --port 3000
