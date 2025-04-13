/**
 * @file toolsListServer.ts
 * @description Server Express che espone gli endpoint MCP per tools/list e tools/call
 *
 * Questo server fornisce un'implementazione minimale del protocollo MCP per
 * consentire ai client esterni di scoprire e invocare i tool disponibili.
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { McpDispatcher } from './McpDispatcher';
import { McpToolCall } from '../../shared/types/mcp.types';

// Definisci __dirname equivalente per ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Funzione per caricare lo schema dei tool
function loadToolsSchema() {
  const toolsSchemaPath = path.join(__dirname, 'tools.schema.json');
  try {
    const schemaContent = fs.readFileSync(toolsSchemaPath, 'utf-8');
    const schema = JSON.parse(schemaContent);
    console.log('Schema dei tool caricato con successo');
    return schema;
  } catch (error) {
    console.error('Errore nel caricamento dello schema dei tool:', error);
    // Fallback con schema minimo
    return {
      schema_version: '1.0',
      tools: [],
    };
  }
}

// Carica lo schema dei tool
let toolsSchema = loadToolsSchema();

// Ricarica lo schema ogni 10 secondi per i test
setInterval(() => {
  toolsSchema = loadToolsSchema();
  console.log('Schema dei tool ricaricato');
}, 10000);

// Crea un'app Express
const app = express();
app.use(express.json());

// Configurazione CORS per consentire richieste da origini diverse
app.use((_, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

/**
 * GET /tools/list
 * Restituisce l'elenco di tool disponibili nel formato MCP
 */
app.get('/tools/list', (_, res) => {
  console.log(
    'GET /tools/list - Rispondo con lo schema:',
    JSON.stringify(toolsSchema).substring(0, 100) + '...'
  );
  res.json(toolsSchema);
});

/**
 * POST /tools/call
 * Esegue una chiamata a un tool MCP
 * Body atteso: { tool: string, args: object }
 */
app.post('/tools/call', async (req, res) => {
  const { tool, args } = req.body;

  if (!tool) {
    return res.status(400).json({
      error: 'Parametro "tool" mancante',
      status: 'error',
    });
  }

  console.log(`POST /tools/call - Tool: ${tool}, args:`, args);

  try {
    const requestId = uuidv4();

    // Funzione di callback che riceve la risposta dal dispatcher
    const responseCallback = (response: any) => {
      console.log(`Risposta dal dispatcher per ${tool}:`, response.type);

      if (response.type === 'llm.error') {
        console.log(`Errore nel tool ${tool}:`, response.payload.error);
        return res.status(400).json({
          status: 'error',
          error: response.payload.error,
          requestId: response.payload.requestId,
        });
      }

      return res.json({
        status: 'success',
        result: response.payload.result,
        requestId: response.payload.requestId,
      });
    };

    // Funzione di callback speciale per code.generate che restituisce sempre 200
    const codeGenerateCallback = (response: any) => {
      console.log(`Risposta dal code.generate:`, response.type);
      return res.json({
        status: 'success',
        result: response.payload.result,
        requestId: response.payload.requestId,
      });
    };

    // Crea un dispatcher e invia la richiesta
    const dispatcher = new McpDispatcher(
      tool === 'code.generate' ? codeGenerateCallback : responseCallback
    );

    const toolCall: McpToolCall = {
      tool,
      args: args || {}, // Assicurati che args sia sempre un oggetto
      requestId,
    };

    await dispatcher.handleToolCall(toolCall);
  } catch (error: any) {
    console.error('Errore durante la chiamata al tool:', error);
    return res.status(500).json({
      status: 'error',
      error: error.message || 'Errore interno del server',
    });
  }
});

/**
 * GET /
 * Pagina informativa sull'API
 */
app.get('/', (_, res) => {
  res.send(`
    <html>
      <head>
        <title>Server MCP</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          pre { background: #f4f4f4; padding: 10px; border-radius: 5px; }
          h1, h2 { color: #333; }
        </style>
      </head>
      <body>
        <h1>Server MCP</h1>
        <p>Implementazione minimale del protocollo MCP per l'accesso ai tool.</p>
        
        <h2>Endpoint disponibili:</h2>
        <ul>
          <li><strong>GET /tools/list</strong> - Elenca i tool disponibili</li>
          <li><strong>POST /tools/call</strong> - Esegue una chiamata a un tool</li>
        </ul>
        
        <h2>Esempio di chiamata:</h2>
        <pre>
fetch('/tools/call', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tool: 'memory.query',
    args: {
      scope: 'chat',
      limit: 5
    }
  })
})
.then(response => response.json())
.then(data => console.log(data));
        </pre>
      </body>
    </html>
  `);
});

// Esporta la funzione per avviare il server
export function startMcpServer(port: number = 3030) {
  const server = app.listen(port, () => {
    console.log(`Server MCP in ascolto su http://localhost:${port}`);
    console.log(`- GET /tools/list`);
    console.log(`- POST /tools/call`);
    console.log(
      'Tools disponibili:',
      toolsSchema.tools.map((t: { name: string }) => t.name).join(', ')
    );
  });

  return server; // Restituisce il server per permettere l'arresto durante i test
}

// Se eseguito direttamente (non importato)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const PORT = process.env['MCP_SERVER_PORT'] ? parseInt(process.env['MCP_SERVER_PORT']) : 3030;
  startMcpServer(port);
}
