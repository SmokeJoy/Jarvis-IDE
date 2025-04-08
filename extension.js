const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log('Jarvis IDE è attivo!');

  let currentPanel = null;

  // Comando per aprire la WebView
  let openWebViewCommand = vscode.commands.registerCommand('jarvis-ide.openSettings', () => {
    if (currentPanel) {
      currentPanel.reveal(vscode.ViewColumn.One);
      return;
    }

    // Crea e mostra il WebView panel
    currentPanel = vscode.window.createWebviewPanel(
      'jarvisSettings',
      'Jarvis IDE Settings',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(context.extensionPath, 'webview-dist'))
        ]
      }
    );

    // Imposta il contenuto HTML
    currentPanel.webview.html = getWebviewContent(context, currentPanel.webview);

    // Gestisce i messaggi ricevuti dal WebView
    currentPanel.webview.onDidReceiveMessage(
      message => handleWebViewMessage(message, currentPanel, context),
      undefined,
      context.subscriptions
    );

    // Gestisce la chiusura del panel
    currentPanel.onDidDispose(
      () => {
        currentPanel = null;
      },
      null,
      context.subscriptions
    );

    // Carica le impostazioni all'avvio
    executeBackendCommand('settings.load')
      .then(result => {
        if (result) {
          currentPanel.webview.postMessage({
            type: 'settings.loaded',
            settings: result.settings,
            systemPrompt: result.systemPrompt
          });
        }
      })
      .catch(error => {
        vscode.window.showErrorMessage(`Errore nel caricamento delle impostazioni: ${error.message}`);
      });
  });

  context.subscriptions.push(openWebViewCommand);

  // Comando per aprire il file system_prompt.md
  let openSystemPromptCommand = vscode.commands.registerCommand('jarvis-ide.openSystemPrompt', () => {
    const configPath = getConfigPath();
    const systemPromptPath = path.join(configPath, 'system_prompt.md');
    
    // Assicurati che il file esista
    if (!fs.existsSync(systemPromptPath)) {
      const defaultContent = "# System Prompt\n\nInserisci qui le istruzioni per il modello. Questo testo verrà inviato all'inizio di ogni conversazione.";
      try {
        fs.mkdirSync(configPath, { recursive: true });
        fs.writeFileSync(systemPromptPath, defaultContent, 'utf8');
      } catch (err) {
        vscode.window.showErrorMessage(`Impossibile creare il file system_prompt.md: ${err.message}`);
        return;
      }
    }
    
    // Apri il file
    vscode.workspace.openTextDocument(systemPromptPath)
      .then(doc => vscode.window.showTextDocument(doc))
      .catch(err => vscode.window.showErrorMessage(`Impossibile aprire system_prompt.md: ${err.message}`));
  });

  context.subscriptions.push(openSystemPromptCommand);
}

/**
 * Gestisce i messaggi ricevuti dalla WebView
 * @param {Object} message - Il messaggio ricevuto
 * @param {vscode.WebviewPanel} panel - Il panel della WebView
 * @param {vscode.ExtensionContext} context - Il contesto dell'estensione
 */
function handleWebViewMessage(message, panel, context) {
  switch (message.type) {
    case 'settings.save':
      executeBackendCommand('settings.save', message.settings)
        .then(result => {
          if (result.success) {
            vscode.window.showInformationMessage('Impostazioni salvate con successo');
            panel.webview.postMessage({ type: 'settings.saved' });
          } else {
            vscode.window.showErrorMessage(`Errore nel salvataggio delle impostazioni: ${result.error || 'errore sconosciuto'}`);
          }
        })
        .catch(error => {
          vscode.window.showErrorMessage(`Errore nel salvataggio delle impostazioni: ${error.message}`);
        });
      break;

    case 'systemPrompt.save':
      executeBackendCommand('systemPrompt.save', { content: message.content })
        .then(result => {
          if (result.success) {
            vscode.window.showInformationMessage('System Prompt salvato con successo');
            panel.webview.postMessage({ type: 'systemPrompt.saved' });
          } else {
            vscode.window.showErrorMessage(`Errore nel salvataggio del System Prompt: ${result.error || 'errore sconosciuto'}`);
          }
        })
        .catch(error => {
          vscode.window.showErrorMessage(`Errore nel salvataggio del System Prompt: ${error.message}`);
        });
      break;

    case 'systemPrompt.open':
      vscode.commands.executeCommand('jarvis-ide.openSystemPrompt');
      break;

    case 'contextPrompt.save':
      executeBackendCommand('contextPrompt.save', { content: message.content })
        .then(result => {
          if (result.success) {
            vscode.window.showInformationMessage('Context Prompt salvato con successo');
            panel.webview.postMessage({ type: 'contextPrompt.saved' });
          } else {
            vscode.window.showErrorMessage(`Errore nel salvataggio del Context Prompt: ${result.error || 'errore sconosciuto'}`);
          }
        })
        .catch(error => {
          vscode.window.showErrorMessage(`Errore nel salvataggio del Context Prompt: ${error.message}`);
        });
      break;

    case 'model.add':
      executeBackendCommand('model.add', message.model)
        .then(result => {
          if (result.success) {
            vscode.window.showInformationMessage('Modello aggiunto con successo');
            // Ricarica le impostazioni per aggiornare la lista dei modelli
            return executeBackendCommand('settings.load');
          } else {
            vscode.window.showErrorMessage(`Errore nell'aggiunta del modello: ${result.error || 'errore sconosciuto'}`);
            return null;
          }
        })
        .then(result => {
          if (result) {
            panel.webview.postMessage({
              type: 'settings.loaded',
              settings: result.settings,
              systemPrompt: result.systemPrompt
            });
          }
        })
        .catch(error => {
          vscode.window.showErrorMessage(`Errore nell'aggiunta del modello: ${error.message}`);
        });
      break;
  }
}

/**
 * Esegue un comando nel backend Python
 * @param {string} command - Il comando da eseguire
 * @param {Object} args - Gli argomenti per il comando (opzionale)
 * @returns {Promise<Object>} - Il risultato del comando
 */
function executeBackendCommand(command, args = null) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, 'chatdev.py');
    let cmdArgs = `--command ${command}`;
    
    if (args) {
      cmdArgs += ` --args '${JSON.stringify(args)}'`;
    }
    
    exec(`python "${scriptPath}" ${cmdArgs}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Errore nell'esecuzione del comando: ${error.message}`);
        console.error(`stderr: ${stderr}`);
        reject(error);
        return;
      }
      
      if (stderr) {
        console.warn(`stderr: ${stderr}`);
      }
      
      try {
        const result = JSON.parse(stdout.trim());
        resolve(result);
      } catch (e) {
        console.error(`Errore nel parsing dell'output: ${e.message}`);
        console.error(`Output: ${stdout}`);
        reject(new Error('Impossibile analizzare la risposta del backend'));
      }
    });
  });
}

/**
 * Restituisce il contenuto HTML per la WebView
 * @param {vscode.ExtensionContext} context - Il contesto dell'estensione
 * @param {vscode.Webview} webview - L'istanza della WebView
 * @returns {string} - Il contenuto HTML
 */
function getWebviewContent(context, webview) {
  // Percorso al file HTML principale nella cartella webview-dist
  const htmlPath = path.join(context.extensionPath, 'webview-dist', 'index.html');
  
  if (fs.existsSync(htmlPath)) {
    // Legge il file HTML
    let htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // Sostituisce i percorsi dei file statici con URI della WebView
    htmlContent = htmlContent.replace(
      /(href|src)="([^"]*)"/g,
      (match, attr, file) => {
        // Ignora URL esterni e anchor tag vuoti
        if (file.startsWith('http') || file === '#' || file.startsWith('data:')) {
          return match;
        }
        
        // Converti i percorsi relativi in URI della WebView
        const newUri = webview.asWebviewUri(
          vscode.Uri.file(path.join(context.extensionPath, 'webview-dist', file))
        );
        
        return `${attr}="${newUri}"`;
      }
    );
    
    return htmlContent;
  } else {
    // Fallback se il file HTML non è disponibile
    return `
      <!DOCTYPE html>
      <html lang="it">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Jarvis IDE</title>
        <style>
          body {
            margin: 0;
            padding: 20px;
            font-family: var(--vscode-font-family);
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
          }
          .error {
            color: var(--vscode-errorForeground);
            text-align: center;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <h1>Jarvis IDE</h1>
        <div class="error">
          <p>Errore: WebView non disponibile</p>
          <p>Assicurati che il pacchetto WebView sia installato correttamente.</p>
        </div>
      </body>
      </html>
    `;
  }
}

/**
 * Restituisce il percorso della directory di configurazione
 * @returns {string} - Il percorso della directory
 */
function getConfigPath() {
  // Usa la directory di configurazione dell'estensione
  const configPath = path.join(__dirname, 'config');
  
  // Crea la directory se non esiste
  if (!fs.existsSync(configPath)) {
    fs.mkdirSync(configPath, { recursive: true });
  }
  
  return configPath;
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
}; 