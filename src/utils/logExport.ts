import * as vscode from 'vscode'
import * as fs from 'fs'
// import * as path from 'path' // Rimuovi importazione non utilizzata
import { getCurrentLogFile, getLogDirectory } from './logStorage.js' // Aggiungi estensione .js

export async function exportCurrentLog(): Promise<void> {
  const currentFile = getCurrentLogFile()
  if (!currentFile || !fs.existsSync(currentFile)) {
    vscode.window.showWarningMessage("Nessun file di log corrente trovato.")
    return
  }

  const uri = await vscode.window.showSaveDialog({
    title: "Esporta log corrente",
    defaultUri: vscode.Uri.file("ai-developer-log.json"),
    filters: {
      "JSON files": ["json"],
      "Text files": ["txt"],
      "All files": ["*"],
    },
  })

  if (!uri) return

  try {
    const data = fs.readFileSync(currentFile)
    fs.writeFileSync(uri.fsPath, data)
    vscode.window.showInformationMessage(`Log esportato in: ${uri.fsPath}`)
  } catch (err: any) {
    vscode.window.showErrorMessage(`Errore durante l'esportazione del log: ${err.message}`)
  }
}

export async function openLogDirectory(): Promise<void> {
  const logDir = getLogDirectory()
  if (!fs.existsSync(logDir)) {
    vscode.window.showWarningMessage("La cartella dei log non esiste.")
    return
  }

  const uri = vscode.Uri.file(logDir)
  await vscode.commands.executeCommand('vscode.openFolder', uri, { forceNewWindow: false })
} 