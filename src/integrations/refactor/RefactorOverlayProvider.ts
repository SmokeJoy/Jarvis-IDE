/**
 * @file RefactorOverlayProvider.ts
 * @description Provider per l'overlay di visualizzazione del refactoring in VSCode
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { getNonce } from '../../core/webview/getNonce';
import { getUri } from '../../core/webview/getUri';

/**
 * Classe che gestisce l'overlay di visualizzazione del refactoring
 */
export class RefactorOverlayProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'jarvis.refactorOverlay';
  private _view?: vscode.WebviewView;
  private _extensionUri: vscode.Uri;
  private _context: vscode.ExtensionContext;
  
  // Decorazioni per file che necessitano di refactoring
  private _fileDecorations: vscode.TextEditorDecorationType;
  
  // Dati del refactoring
  private _refactorData: {
    totalFiles: number;
    refactoredFiles: number;
    pendingFiles: number;
    criticalFiles: { path: string; anyCount: number; jsImports: number }[];
  } = {
    totalFiles: 0,
    refactoredFiles: 0,
    pendingFiles: 0,
    criticalFiles: []
  };
  
  // Timer per aggiornamenti periodici
  private _refreshTimer?: NodeJS.Timeout;

  constructor(context: vscode.ExtensionContext) {
    this._extensionUri = context.extensionUri;
    this._context = context;
    
    // Crea la decorazione per file con 'any'
    this._fileDecorations = vscode.window.createTextEditorDecorationType({
      backgroundColor: new vscode.ThemeColor('editorWarning.foreground'),
      opacity: '0.3',
      isWholeLine: true,
      overviewRulerColor: new vscode.ThemeColor('editorWarning.foreground'),
      overviewRulerLane: vscode.OverviewRulerLane.Right
    });
    
    // Registra il comando per aprire la dashboard HTML
    context.subscriptions.push(
      vscode.commands.registerCommand('jarvis.openRefactorDashboard', () => {
        this._openDashboardHtml();
      })
    );
    
    // Registra il comando per aggiornare manualmente i dati
    context.subscriptions.push(
      vscode.commands.registerCommand('jarvis.refreshRefactorData', () => {
        this._refreshRefactorData();
      })
    );
    
    // Registra il comando per visualizzare i file critici
    context.subscriptions.push(
      vscode.commands.registerCommand('jarvis.showCriticalFiles', () => {
        this._showCriticalFiles();
      })
    );
    
    // Aggiorna i dati iniziali
    this._refreshRefactorData();
    
    // Imposta un timer per aggiornamenti periodici (ogni 5 minuti)
    this._refreshTimer = setInterval(() => {
      this._refreshRefactorData();
    }, 5 * 60 * 1000);
    
    // Assicurati che il timer venga cancellato quando l'estensione viene disattivata
    context.subscriptions.push({
      dispose: () => {
        if (this._refreshTimer) {
          clearInterval(this._refreshTimer);
        }
        this._fileDecorations.dispose();
      }
    });
    
    // Ascolta gli eventi di cambio editor per aggiornare le decorazioni
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (editor) {
        this._updateDecorations(editor);
      }
    }, null, context.subscriptions);
  }

  /**
   * Risolve la vista WebView.
   * @param webviewView Vista WebView da risolvere
   * @param _context Contesto WebView
   * @param _token Token di cancellazione
   */
  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void | Thenable<void> {
    this._view = webviewView;

    // Configura la webview
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    // Imposta l'HTML iniziale
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Gestisce i messaggi dalla webview
    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case 'refresh':
          await this._refreshRefactorData();
          break;
        case 'showDashboard':
          this._openDashboardHtml();
          break;
        case 'showCriticalFiles':
          this._showCriticalFiles();
          break;
        case 'openFile':
          this._openFile(message.filePath);
          break;
        case 'generateTrend':
          this._generateTrend();
          break;
        case 'runAudit':
          this._runAudit();
          break;
      }
    });

    // Aggiorna i dati iniziali
    this._refreshRefactorData();
  }

  /**
   * Apre un file nel editor
   * @param filePath Percorso del file da aprire
   */
  private async _openFile(filePath: string): Promise<void> {
    if (!filePath) {
      return;
    }
    
    // Controlla se il percorso è assoluto, altrimenti lo combina con il percorso di base
    const fullPath = path.isAbsolute(filePath)
      ? filePath
      : path.join(vscode.workspace.rootPath || '', filePath);
      
    try {
      const document = await vscode.workspace.openTextDocument(fullPath);
      await vscode.window.showTextDocument(document);
    } catch (error) {
      vscode.window.showErrorMessage(`Impossibile aprire il file: ${filePath}`);
    }
  }

  /**
   * Genera il trend dei dati di refactoring
   */
  private async _generateTrend(): Promise<void> {
    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Generazione trend refactoring...",
        cancellable: false
      },
      async (progress) => {
        try {
          progress.report({ increment: 10, message: "Esecuzione script in corso..." });
          await this._executeCommand('pnpm dashboard:trend');
          progress.report({ increment: 90, message: "Trend aggiornato" });
          
          vscode.window.showInformationMessage('Trend refactoring aggiornato con successo!');
          
          // Aggiorna i dati dopo aver generato il trend
          await this._refreshRefactorData();
        } catch (error) {
          vscode.window.showErrorMessage(`Errore nella generazione del trend: ${error}`);
        }
      }
    );
  }

  /**
   * Esegue un audit completo del codice
   */
  private async _runAudit(): Promise<void> {
    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Esecuzione audit del codice...",
        cancellable: false
      },
      async (progress) => {
        try {
          progress.report({ increment: 10, message: "Analisi 'any' types..." });
          await this._executeCommand('pnpm refactor:report');
          
          progress.report({ increment: 40, message: "Ricerca import .js..." });
          await this._executeCommand('pnpm refactor:js-imports');
          
          progress.report({ increment: 70, message: "Generazione mappa refactoring..." });
          await this._executeCommand('pnpm refactor:map');
          
          progress.report({ increment: 90, message: "Aggiornamento trend..." });
          await this._executeCommand('pnpm dashboard:trend');
          
          vscode.window.showInformationMessage('Audit del codice completato con successo!');
          
          // Aggiorna i dati dopo l'audit
          await this._refreshRefactorData();
        } catch (error) {
          vscode.window.showErrorMessage(`Errore nell'esecuzione dell'audit: ${error}`);
        }
      }
    );
  }

  /**
   * Aggiorna i dati del refactoring leggendo il file refactor-map.yaml
   */
  private async _refreshRefactorData(): Promise<void> {
    try {
      // Esegui lo script jarvis-dashboard per aggiornare i dati
      const result = await this._executeCommand('pnpm dashboard --json');
      
      if (result) {
        try {
          const data = JSON.parse(result);
          this._refactorData = {
            totalFiles: data.total,
            refactoredFiles: data.completed,
            pendingFiles: data.pending,
            criticalFiles: data.criticalFiles || []
          };
          
          // Aggiorna la vista se disponibile
          if (this._view) {
            this._view.webview.postMessage({ 
              command: 'updateData', 
              data: this._refactorData 
            });
          }
          
          // Aggiorna le decorazioni nell'editor attivo
          if (vscode.window.activeTextEditor) {
            this._updateDecorations(vscode.window.activeTextEditor);
          }
        } catch (e) {
          console.error('Errore nel parsing dei dati JSON:', e);
        }
      }
    } catch (error) {
      console.error('Errore nell\'aggiornamento dei dati di refactoring:', error);
      vscode.window.showErrorMessage('Errore nell\'aggiornamento dei dati di refactoring');
    }
  }

  /**
   * Esegue un comando di sistema e restituisce l'output
   * @param command Comando da eseguire
   * @returns Promise con l'output del comando
   */
  private async _executeCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const { exec } = require('child_process');
      exec(command, { cwd: vscode.workspace.rootPath }, (error: Error | null, stdout: string, stderr: string) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(stdout);
      });
    });
  }

  /**
   * Apre la dashboard HTML in un browser esterno
   */
  private _openDashboardHtml(): void {
    const dashboardPath = path.join(vscode.workspace.rootPath || '', 'out', 'refactor-dashboard.html');
    
    // Verifica se il file esiste
    if (fs.existsSync(dashboardPath)) {
      vscode.env.openExternal(vscode.Uri.file(dashboardPath));
    } else {
      // Genera la dashboard e poi aprila
      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Generazione dashboard HTML in corso...",
          cancellable: false
        },
        async (progress) => {
          try {
            progress.report({ increment: 10, message: "Esecuzione script in corso..." });
            await this._executeCommand('pnpm dashboard:html');
            progress.report({ increment: 90, message: "Apertura dashboard..." });
            
            // Verifica nuovamente se il file esiste e aprilo
            if (fs.existsSync(dashboardPath)) {
              vscode.env.openExternal(vscode.Uri.file(dashboardPath));
            } else {
              vscode.window.showErrorMessage('Dashboard HTML non trovata dopo la generazione');
            }
          } catch (error) {
            vscode.window.showErrorMessage(`Errore nella generazione della dashboard: ${error}`);
          }
        }
      );
    }
  }

  /**
   * Mostra i file critici che necessitano di refactoring
   */
  private _showCriticalFiles(): void {
    // Se non ci sono file critici, mostra un messaggio
    if (!this._refactorData.criticalFiles || this._refactorData.criticalFiles.length === 0) {
      vscode.window.showInformationMessage('Non ci sono file critici da refactorizzare');
      return;
    }
    
    // Crea una lista di file critici con il loro conteggio di 'any'
    const items = this._refactorData.criticalFiles.map(file => ({
      label: path.basename(file.path),
      description: `${file.anyCount} any, ${file.jsImports} .js imports`,
      detail: file.path,
      file
    }));
    
    // Mostra il quick pick
    vscode.window.showQuickPick(items, {
      placeHolder: 'Seleziona un file critico da aprire',
      canPickMany: false
    }).then(selection => {
      if (selection) {
        // Apri il file selezionato
        const filePath = path.isAbsolute(selection.file.path) 
          ? selection.file.path 
          : path.join(vscode.workspace.rootPath || '', selection.file.path);
        
        vscode.workspace.openTextDocument(filePath).then(doc => {
          vscode.window.showTextDocument(doc);
        });
      }
    });
  }

  /**
   * Aggiorna le decorazioni nell'editor per evidenziare i 'any' types
   * @param editor Editor di testo attivo
   */
  private _updateDecorations(editor: vscode.TextEditor): void {
    // Ottieni il percorso del file corrente
    const filePath = editor.document.uri.fsPath;
    
    // Cerca i file critici per vedere se il file corrente è tra questi
    const criticalFile = this._refactorData.criticalFiles.find(f => 
      path.resolve(f.path) === path.resolve(filePath)
    );
    
    if (!criticalFile) {
      // Se il file non è critico, rimuovi le decorazioni
      editor.setDecorations(this._fileDecorations, []);
      return;
    }
    
    // Cerca le occorrenze di ": any" e "as any" nel documento
    const text = editor.document.getText();
    const anyRegex = /: any|as any/g;
    const decorations: vscode.DecorationOptions[] = [];
    
    let match;
    while ((match = anyRegex.exec(text))) {
      const startPos = editor.document.positionAt(match.index);
      const endPos = editor.document.positionAt(match.index + match[0].length);
      
      // Crea la decorazione per questa linea
      const decoration: vscode.DecorationOptions = {
        range: new vscode.Range(startPos.line, 0, startPos.line, 9999),
        hoverMessage: 'Type "any" trovato. Considera di refactorizzare con un tipo più specifico.'
      };
      
      decorations.push(decoration);
    }
    
    // Imposta le decorazioni nell'editor
    editor.setDecorations(this._fileDecorations, decorations);
  }

  /**
   * Genera l'HTML per la webview
   * @param webview Webview per cui generare l'HTML
   * @returns HTML per la webview
   */
  private _getHtmlForWebview(webview: vscode.Webview): string {
    // Crea gli URI per le risorse
    const scriptUri = getUri(webview, this._extensionUri, ["media", "refactor-overlay.js"]);
    const styleUri = getUri(webview, this._extensionUri, ["media", "refactor-overlay.css"]);
    const codiconsUri = getUri(webview, this._extensionUri, ["node_modules", "@vscode/codicons", "dist", "codicon.css"]);
    
    // Genera un nonce per la sicurezza
    const nonce = getNonce();

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
        <link href="${styleUri}" rel="stylesheet">
        <link href="${codiconsUri}" rel="stylesheet">
        <title>Refactor Overlay</title>
    </head>
    <body>
        <div class="container">
            <header>
                <h1>Jarvis Refactor</h1>
                <div class="actions">
                    <button id="refreshBtn" class="icon-button" title="Aggiorna dati">
                        <i class="codicon codicon-refresh"></i>
                    </button>
                    <button id="dashboardBtn" class="icon-button" title="Apri Dashboard">
                        <i class="codicon codicon-graph"></i>
                    </button>
                </div>
            </header>
            
            <section class="progress-section">
                <div class="progress-bar-container">
                    <div id="progressBar" class="progress-bar" style="width: 0%"></div>
                </div>
                <div class="progress-stats">
                    <span id="progressText">0%</span>
                    <span id="statsText">0/0 file</span>
                </div>
            </section>
            
            <section class="critical-files">
                <h2>File prioritari</h2>
                <div id="criticalList" class="file-list">
                    <div class="loading">Caricamento...</div>
                </div>
                <button id="showAllBtn" class="text-button">
                    Mostra tutti i file critici
                </button>
            </section>
            
            <section class="quick-actions">
                <h2>Azioni rapide</h2>
                <div class="action-buttons">
                    <button id="generateTrendBtn" class="action-button">
                        <i class="codicon codicon-graph-line"></i>
                        Aggiorna trend
                    </button>
                    <button id="runAuditBtn" class="action-button">
                        <i class="codicon codicon-verified"></i>
                        Esegui audit
                    </button>
                </div>
            </section>
        </div>
        
        <script nonce="${nonce}">
            const vscode = acquireVsCodeApi();
            
            // Stato dell'interfaccia
            let data = {
                totalFiles: 0,
                refactoredFiles: 0,
                pendingFiles: 0,
                criticalFiles: []
            };
            
            // Inizializza gli elementi dell'interfaccia
            const progressBar = document.getElementById('progressBar');
            const progressText = document.getElementById('progressText');
            const statsText = document.getElementById('statsText');
            const criticalList = document.getElementById('criticalList');
            const refreshBtn = document.getElementById('refreshBtn');
            const dashboardBtn = document.getElementById('dashboardBtn');
            const showAllBtn = document.getElementById('showAllBtn');
            const generateTrendBtn = document.getElementById('generateTrendBtn');
            const runAuditBtn = document.getElementById('runAuditBtn');
            
            // Gestione eventi dei pulsanti
            refreshBtn.addEventListener('click', () => {
                vscode.postMessage({ command: 'refresh' });
            });
            
            dashboardBtn.addEventListener('click', () => {
                vscode.postMessage({ command: 'showDashboard' });
            });
            
            showAllBtn.addEventListener('click', () => {
                vscode.postMessage({ command: 'showCriticalFiles' });
            });
            
            generateTrendBtn.addEventListener('click', async () => {
                vscode.postMessage({ command: 'generateTrend' });
            });
            
            runAuditBtn.addEventListener('click', async () => {
                vscode.postMessage({ command: 'runAudit' });
            });
            
            // Funzione per aggiornare l'interfaccia con nuovi dati
            function updateUI(newData) {
                data = newData;
                
                // Aggiorna la barra di progresso
                const percentage = data.totalFiles > 0 
                    ? Math.round((data.refactoredFiles / data.totalFiles) * 100) 
                    : 0;
                    
                progressBar.style.width = \`\${percentage}%\`;
                progressText.textContent = \`\${percentage}%\`;
                statsText.textContent = \`\${data.refactoredFiles}/\${data.totalFiles} file\`;
                
                // Aggiorna la lista dei file critici
                criticalList.innerHTML = '';
                
                if (data.criticalFiles && data.criticalFiles.length > 0) {
                    // Mostra solo i primi 5 file critici
                    const filesToShow = data.criticalFiles.slice(0, 5);
                    
                    filesToShow.forEach(file => {
                        const fileDiv = document.createElement('div');
                        fileDiv.className = 'file-item';
                        fileDiv.innerHTML = \`
                            <span class="file-name">\${file.path.split('/').pop()}</span>
                            <span class="file-stats">
                                <span class="any-count">\${file.anyCount} any</span>
                                <span class="js-count">\${file.jsImports} .js</span>
                            </span>
                        \`;
                        
                        // Aggiungi un event listener per aprire il file
                        fileDiv.addEventListener('click', () => {
                            vscode.postMessage({ 
                                command: 'openFile', 
                                filePath: file.path 
                            });
                        });
                        
                        criticalList.appendChild(fileDiv);
                    });
                    
                    // Mostra quanti altri file ci sono
                    if (data.criticalFiles.length > 5) {
                        const moreDiv = document.createElement('div');
                        moreDiv.className = 'more-files';
                        moreDiv.textContent = \`+ \${data.criticalFiles.length - 5} altri file\`;
                        criticalList.appendChild(moreDiv);
                    }
                } else {
                    criticalList.innerHTML = '<div class="empty-list">Nessun file critico trovato</div>';
                }
            }
            
            // Ascolta i messaggi dall'estensione
            window.addEventListener('message', event => {
                const message = event.data;
                
                switch (message.command) {
                    case 'updateData':
                        updateUI(message.data);
                        break;
                }
            });
            
            // Richiedi un aggiornamento dei dati all'avvio
            vscode.postMessage({ command: 'refresh' });
        </script>
    </body>
    </html>`;
  }
} 