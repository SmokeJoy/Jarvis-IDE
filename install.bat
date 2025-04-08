@echo off
echo 🔧 Avvio installazione dipendenze...
powershell -ExecutionPolicy Bypass -File install-deps.ps1

echo.
echo ✅ Installazione completata!
echo.
echo 📝 Comandi disponibili:
echo - npm run dev:webview  → per testare il pannello web
echo - npm run build        → per compilare l'estensione
echo - F5                   → per eseguire da VS Code o Cursor
echo.
pause 