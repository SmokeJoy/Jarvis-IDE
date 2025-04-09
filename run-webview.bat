@echo off
echo 🔧 Avvio server WebView...
cd webview-ui
call npm install
call npx vite
cd ..
pause 