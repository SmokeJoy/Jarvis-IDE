const fs = require('fs');
const path = require('path');

const files = [
  // Lista dei file da aggiornare
  'playground/mitigator-preview.tsx',
  'webview-ui/src/__tests__/components/RetryPanel.test.tsx',
  // ... aggiungi tutti i file trovati dal grep
];

function updateReactImport(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.warn(`File non trovato: ${fullPath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Sostituisci l'importazione di React
  content = content.replace(
    /import React from ['"]react['"];?/,
    "import * as React from 'react';"
  );
  
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✅ Aggiornato: ${filePath}`);
}

// Aggiorna tutti i file
files.forEach(updateReactImport); 