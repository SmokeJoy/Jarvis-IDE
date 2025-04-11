import * as child_process from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { Logger } from './logger.js';

/**
 * Compila un progetto .NET
 * @param projectPath Percorso opzionale del progetto da compilare (default: directory corrente)
 * @returns Promise con l'output della compilazione
 */
export async function compileDotnetProject(projectPath?: string): Promise<string> {
  try {
    const targetPath = projectPath || process.cwd();
    Logger.info(`Compilazione del progetto .NET in: ${targetPath}`);
    
    // Verifica se la directory contiene un file .csproj o .sln
    const files = fs.readdirSync(targetPath);
    const csprojFiles = files.filter(f => f.endsWith('.csproj'));
    const slnFiles = files.filter(f => f.endsWith('.sln'));
    
    let buildTarget: string | undefined;
    
    if (slnFiles.length > 0) {
      const slnFile = slnFiles[0];
      if (slnFile) {
        buildTarget = path.join(targetPath, slnFile);
        Logger.info(`Utilizzando file soluzione: ${slnFile}`);
      }
    } else if (csprojFiles.length > 0) {
      const csprojFile = csprojFiles[0];
      if (csprojFile) {
        buildTarget = path.join(targetPath, csprojFile);
        Logger.info(`Utilizzando file progetto: ${csprojFile}`);
      }
    }
    
    // Comando di compilazione
    const buildCommand = 'dotnet';
    const buildArgs = buildTarget ? ['build', buildTarget] : ['build'];
    
    Logger.info(`Esecuzione comando: ${buildCommand} ${buildArgs.join(' ')}`);
    
    // Esegui il comando di compilazione
    return new Promise((resolve, reject) => {
      const process = child_process.spawn(buildCommand, buildArgs, {
        cwd: targetPath,
        shell: true
      });
      
      let output = '';
      let errorOutput = '';
      
      process.stdout.on('data', (data) => {
        const chunk = data.toString();
        output += chunk;
        Logger.info(`[dotnet build] ${chunk.trim()}`);
      });
      
      process.stderr.on('data', (data) => {
        const chunk = data.toString();
        errorOutput += chunk;
        Logger.error(`[dotnet build] ${chunk.trim()}`);
      });
      
      process.on('close', (code) => {
        if (code !== 0) {
          Logger.error(`Errore di compilazione. Codice: ${code}`);
          reject(new Error(`Compilazione fallita con codice ${code}. Errore: ${errorOutput}`));
        } else {
          Logger.info('Compilazione completata con successo.');
          resolve(output);
        }
      });
      
      process.on('error', (error) => {
        Logger.error(`Errore nell'avvio del processo di compilazione: ${error}`);
        reject(error);
      });
    });
  } catch (error) {
    Logger.error(`Errore durante la compilazione del progetto: ${error}`);
    throw error;
  }
} 