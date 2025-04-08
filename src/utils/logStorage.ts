import { promises as fs } from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'
import { LogLevel } from '../types/global.js'

const LOG_DIR = path.join(__dirname, '..', '..', 'logs')
let currentLogFilePath: string | null = null

async function ensureLogDirectory(): Promise<void> {
  try {
    await fs.access(LOG_DIR)
  } catch {
    await fs.mkdir(LOG_DIR, { recursive: true })
  }
}

function getLogFilename() {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  return path.join(LOG_DIR, `session-${timestamp}.json`)
}

export function initLogFile() {
  ensureLogDirectory()
  currentLogFilePath = getLogFilename()
  fs.writeFile(currentLogFilePath, '').catch(err => {
    vscode.window.showWarningMessage(`Errore inizializzazione file di log: ${err.message}`)
  })
}

export function appendLogToFile(level: keyof typeof LogLevel, message: string) {
  if (!currentLogFilePath) return
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
  }
  fs.appendFile(currentLogFilePath, JSON.stringify(entry) + '\n')
    .catch(err => {
      vscode.window.showWarningMessage(`Errore scrittura log su file: ${err.message}`)
    })
}

export function getLogDirectory(): string {
  ensureLogDirectory()
  return LOG_DIR
}

export function getCurrentLogFile(): string | null {
  return currentLogFilePath
} 