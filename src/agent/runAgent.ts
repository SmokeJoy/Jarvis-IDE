#!/usr/bin/env node
import { JarvisAgent } from './JarvisAgent.js.js';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Script per eseguire l'agente Jarvis da riga di comando
 * Uso: npx tsx src/agent/runAgent.ts "Scrivi un file di test"
 */
async function main() {
  console.log('🤖 Jarvis Agent CLI - Modalità sviluppatore autonomo');
  console.log('--------------------------------------------------');
  
  try {
    // Ottieni il prompt dalla riga di comando
    const userPrompt = process.argv[2] || '';
    
    if (!userPrompt) {
      console.log('⚠️ Nessun prompt fornito. Utilizzo prompt predefinito.');
      console.log('Esempio: npx tsx src/agent/runAgent.ts "Scrivi un file di test"');
    } else {
      console.log(`📝 Prompt: "${userPrompt}"`);
    }
    
    console.log('🔄 Esecuzione in corso...');
    
    // Ottieni l'istanza dell'agente ed esegui il loop completo
    const agent = JarvisAgent.getInstance();
    const result = await agent.runFullLoop(userPrompt);
    
    console.log('\n✅ Esecuzione completata!');
    console.log('--------------------------------------------------');
    console.log(`📊 Azione: ${result.action}`);
    
    if (result.action === 'saveFile' && result.path) {
      console.log(`📄 File creato: ${result.path}`);
    } else if (result.action === 'runCommand' && result.command) {
      console.log(`⚙️ Comando eseguito: ${result.command}`);
    } else if (result.action === 'message' && result.message) {
      console.log('📢 Messaggio:');
      console.log(`${result.message}`);
    }
  } catch (error) {
    console.error('❌ Errore durante l\'esecuzione dell\'agente:', error);
    process.exit(1);
  }
}

// Esegui lo script
main().catch(error => {
  console.error('❌ Errore fatale:', error);
  process.exit(1);
}); 