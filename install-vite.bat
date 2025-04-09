@echo off
echo 🔧 Installazione Vite nella cartella webview-ui...
cd webview-ui
call npm install -D vite @vitejs/plugin-react
cd ..
echo ✅ Installazione completata!
echo.
echo 📝 Ora puoi eseguire:
echo npm run dev:webview
pause 