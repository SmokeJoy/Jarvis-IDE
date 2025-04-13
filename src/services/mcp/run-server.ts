/**
 * @file run-server.ts
 * @description Script di avvio per il server MCP
 *
 * Questo script avvia il server MCP con gestione degli errori e supporto per graceful shutdown.
 */

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { McpToolsServer } from './McpToolsServer';
import { WebviewMessage } from '../../shared/types/webview.types';
import { startMcpServer } from './toolsListServer';

// Configurazione del server
const app = express();
const server = new McpToolsServer();
const PORT = process.env['MCP_SERVER_PORT'] ? parseInt(process.env['MCP_SERVER_PORT']) : 3001;

console.log('=== MCP Server ===');
console.log(`Avvio del server sulla porta ${PORT}`);

try {
  // Avvia il server
  startMcpServer(PORT);

  // Gestione del graceful shutdown
  const handleShutdown = () => {
    console.log('\nChiusura del server in corso...');
    process.exit(0);
  };

  // Registra gli handler per i segnali di interruzione
  process.on('SIGINT', handleShutdown);
  process.on('SIGTERM', handleShutdown);

  console.log('Server avviato con successo. Premi Ctrl+C per terminare.');
  console.log('Apri http://localhost:' + PORT + ' nel browser per vedere la pagina informativa.');
} catch (error) {
  console.error("Errore durante l'avvio del server:", error);
  process.exit(1);
}
