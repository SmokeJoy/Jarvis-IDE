# install-deps.ps1
Write-Host "🔧 Installazione dipendenze principali..."
npm install

Write-Host "🔧 Installazione dipendenze per la UI webview..."
cd webview-ui
npm install -D vite @vitejs/plugin-react @types/react @types/react-dom
npm install react react-dom react-markdown react-syntax-highlighter

Write-Host "🔧 Torno alla root..."
cd ..

Write-Host "🔧 Installazione tipi VS Code e configurazioni TypeScript..."
npm install -D @types/vscode @types/vscode-webview @types/node typescript

Write-Host "✅ Completato! Ora puoi usare:"
Write-Host "- npm run dev:webview  → per testare il pannello web"
Write-Host "- npm run build        → per compilare l'estensione"
Write-Host "- F5                   → per eseguire da VS Code o Cursor" 