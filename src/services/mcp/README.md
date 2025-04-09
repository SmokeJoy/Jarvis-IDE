# Model Control Protocol (MCP)

![Test](https://github.com/<ORG>/<REPO>/actions/workflows/ci.yml/badge.svg)
![Coverage](https://codecov.io/gh/<ORG>/<REPO>/branch/main/graph/badge.svg)

Questo modulo implementa un'architettura *Model Control Protocol* (MCP) per consentire ai modelli di linguaggio di interagire con l'ambiente dell'applicazione in modo strutturato.

## Panoramica

L'architettura MCP consente ai modelli AI di:

1. **Scoprire i tool disponibili** tramite un sistema di registrazione e discovery
2. **Invocare i tool** per eseguire azioni nell'ambiente
3. **Ricevere risultati strutturati** che possono essere facilmente interpretati

## Tool Disponibili

Sono stati implementati i seguenti strumenti MCP:

| Tool | Descrizione | Parametri principali |
|------|-------------|----------------------|
| `memory.query` | Recupera memorie contestuali | `scope`, `filter`, `limit` |
| `project.summary` | Genera panoramica del progetto | `depth`, `includeFiles` |
| `read_file` | Legge un file del workspace | `path` |
| `search_docs` | Cerca nel codice sorgente | `query`, `regex` |
| `code.generate` | Genera snippet di codice | `language`, `description` |
| `fs.write` | Scrive file nel filesystem | `path`, `content`, `overwrite` |
| `refactor.snippet` | Rifattorizza codice | `language`, `code`, `objective` |
| `ask.docs` | Interroga documentazione | `question`, `filter`, `maxSourceFiles` |
| `project.lint` | Analizza la qualità del codice | `path`, `language`, `fix` |
| `fs.format` | Formatta file secondo gli standard | `path`, `language`, `write` |
| `test.run` | Esegue i test del progetto | `path`, `framework`, `filter`, `coverage` |
| `project.depgraph` | Genera una mappa delle dipendenze | `entryPoint`, `depth`, `format` |
| `context.inject` | Aggiunge contesto personalizzato | `scope`, `text` |
| `context.list` | Elenca contesti memorizzati | `scope`, `limit`, `filterText`, `tags` |
| `context.clear` | Cancella contesti memorizzati | `scope`, `id`, `all` |
| `context.tag` | Aggiunge tag semantici ai contesti | `id`, `tags`, `replace` |
| `context.searchByTags` | Ricerca semantica per tag | `tags`, `scope`, `limit`, `similarityThreshold` |
| `context.export` | Esporta contesti in vari formati | `format`, `scope`, `tags`, `sinceTimestamp`, `includeMetadata` |
| `context.import` | Importa contesti da file JSON, CSV o Markdown | `format`, `content`, `scope`, `mergeTags` |
| `context.edit` | Modifica un contesto esistente | `id`, `text`, `tags`, `scope` | `success`, `output` |
| `context.link` | Crea relazioni semantiche tra contesti | `sourceId`, `targetId`, `relation`, `bidirectional`, `strength`, `metadata` | `success`, `output` |
| `context.linksOf` | Recupera relazioni di un contesto | `id`, `direction`, `relation`, `minStrength`, `minConfidence` | `success`, `output` |
| `context.graph` | Genera un grafo di contesti collegati | `rootId`, `depth`, `direction`, `relation`, `minStrength`, `minConfidence`, `includeRoot`, `includeIsolated` |
| `context.unlink` | Rimuove relazioni semantiche tra contesti | `sourceId`, `targetId`, `relation`, `bidirectional` | `removed` |
| `context.graph.export` | Esporta il grafo dei contesti in vari formati interoperabili | `rootId`, `format`, `depth`, `direction`, `relation`, `minStrength`, `minConfidence`, `includeRoot`, `includeIsolated`, `includeNodeText`, `includeNodeTags`, `includeEdgeMetadata` |
| `context.navigate` | Naviga il grafo dei contesti in modo intelligente usando euristiche o guida AI | `startId`, `targetId`, `mode`, `strategy`, `includeContent`, `includeMetadata`, `format` |

Per una descrizione dettagliata dei parametri e esempi di utilizzo, consultare il file [`tools-examples.md`](./tools-examples.md).

## Componenti Principali

### McpDispatcher

Il `McpDispatcher` è il componente centrale che gestisce le richieste di tool call e le dirige verso gli handler appropriati.

```typescript
const dispatcher = new McpDispatcher(responseCallback);
dispatcher.handleToolCall({
  tool: "memory.query",
  args: { scope: "chat", limit: 5 },
  requestId: "request-123"
});
```

### Handler

Ogni tool è implementato come un handler che elabora gli argomenti in input e restituisce un risultato strutturato.

Gli handler sono moduli indipendenti nella directory `handlers/`, come:
- `memoryQueryHandler.ts`
- `projectSummaryHandler.ts`
- `readFileHandler.ts`
- `searchDocsHandler.ts`
- `codeGenerateHandler.ts`
- `fsWriteHandler.ts`
- `refactorSnippetHandler.ts`
- `askDocsHandler.ts`
- `projectLintHandler.ts`
- `fsFormatHandler.ts`
- `testRunHandler.ts`
- `projectDepGraphHandler.ts`
- `contextInjectHandler.ts`
- `contextListHandler.ts`
- `contextClearHandler.ts`
- `contextTagHandler.ts`
- `contextSearchByTagsHandler.ts`
- `contextExportHandler.ts`
- `contextImportHandler.ts`
- `contextEditHandler.ts`

### context.import

Importa contesti da file JSON, CSV o Markdown nella memoria del modello.

**Parametri:**
- `format` (opzionale): Formato di importazione ("auto", "json", "csv", "markdown")
- `content` (obbligatorio): Contenuto del file da importare
- `scope` (opzionale): Ambito in cui importare i contesti ("chat", "project", "agent")
- `mergeTags` (opzionale): Se unire i tag esistenti con quelli importati (default: true)

**Esempio:**
```json
{
  "tool": "context.import",
  "args": {
    "format": "json",
    "content": "[{\"text\":\"Nuovo contesto\",\"tags\":[\"test\"]}]",
    "scope": "project"
  }
}
```

**Risposta:**
```json
{
  "success": true,
  "output": {
    "format": "json",
    "imported": 1,
    "skipped": 0,
    "errors": []
  }
}
```

### context.edit

Modifica un contesto esistente tramite ID, aggiornando testo, tag o scope.

**Parametri:**
- `id` (obbligatorio): ID del contesto da modificare
- `text` (opzionale): Nuovo contenuto testuale
- `tags` (opzionale): Nuova lista di tag da sovrascrivere
- `scope` (opzionale): Nuovo scope del contesto ("chat", "project", "agent")

**Esempio:**
```json
{
  "tool": "context.edit",
  "args": {
    "id": "ctx-123",
    "text": "Testo modificato",
    "tags": ["aggiornato", "modificato"],
    "scope": "project"
  }
}
```

**Risposta:**
```json
{
  "success": true,
  "output": {
    "id": "ctx-123",
    "changes": {
      "text": true,
      "tags": true,
      "scope": true
    },
    "original": {
      "text": "Testo originale",
      "tags": ["vecchio"],
      "scope": "chat"
    },
    "updated": {
      "text": "Testo modificato",
      "tags": ["aggiornato", "modificato"],
      "scope": "project"
    }
  }
}
```

### context.graph
Genera un grafo di contesti collegati a partire da un contesto radice. Il grafo include i contesti collegati e le relazioni tra di essi.

Parametri:
- `rootId` (obbligatorio): ID del contesto radice da cui iniziare l'esplorazione
- `depth` (opzionale, default: 1): Profondità massima di esplorazione del grafo
- `direction` (opzionale, default: "both"): Direzione delle relazioni da esplorare ("incoming", "outgoing", "both")
- `relation` (opzionale): Filtra per tipo di relazione specifico
- `minStrength` (opzionale): Forza minima della relazione (0-1)
- `minConfidence` (opzionale): Confidenza minima della relazione (0-1)
- `includeRoot` (opzionale, default: true): Includi il contesto radice nel grafo
- `includeIsolated` (opzionale, default: false): Includi contesti isolati nel grafo

Output:
```typescript
{
  nodes: ContextItem[];  // Contesti nel grafo
  links: ContextLink[];  // Relazioni tra i contesti
}
```

Esempio:
```json
{
  "tool": "context.graph",
  "args": {
    "rootId": "ctx-123",
    "depth": 2,
    "direction": "both",
    "relation": "supports",
    "minStrength": 0.7,
    "minConfidence": 0.8
  }
}
```

### context.unlink
Rimuove relazioni semantiche tra contesti. Può rimuovere una relazione specifica o tutte le relazioni tra due contesti.

Parametri:
- `sourceId` (obbligatorio): ID del contesto sorgente
- `targetId` (obbligatorio): ID del contesto target
- `relation` (opzionale): Tipo di relazione da rimuovere (se omesso, rimuove tutte le relazioni tra i contesti)
- `bidirectional` (opzionale, default: false): Se rimuovere anche la relazione inversa

Output:
```typescript
{
  removed: number;  // Numero di relazioni rimosse
}
```

Esempio:
```json
{
  "tool": "context.unlink",
  "args": {
    "sourceId": "ctx-123",
    "targetId": "ctx-456",
    "relation": "supports",
    "bidirectional": true
  }
}
```

### context.graph.export

Esporta il grafo dei contesti in vari formati interoperabili.

**Parametri:**
- `rootId` (string, obbligatorio): ID del contesto radice da cui iniziare l'esplorazione
- `format` (string, opzionale): Formato di esportazione ("dot", "mermaid", "graphml", "json-ld", default: "dot")
- `depth` (number, opzionale): Profondità massima di esplorazione (default: 1)
- `direction` (string, opzionale): Direzione delle relazioni da esplorare ("incoming", "outgoing", "both", default: "both")
- `relation` (string, opzionale): Filtro per tipo di relazione
- `minStrength` (number, opzionale): Forza minima della relazione (0-1)
- `minConfidence` (number, opzionale): Confidenza minima nella relazione (0-1)
- `includeRoot` (boolean, opzionale): Includi il contesto radice nel grafo (default: true)
- `includeIsolated` (boolean, opzionale): Includi contesti isolati (default: false)
- `includeNodeText` (boolean, opzionale): Includi il testo dei contesti (default: false)
- `includeNodeTags` (boolean, opzionale): Includi i tag dei contesti (default: false)
- `includeEdgeMetadata` (boolean, opzionale): Includi metadati delle relazioni (default: false)

**Output:**
```json
{
  "success": true,
  "output": "stringa nel formato specificato"
}
```

**Errori:**
- `Contesto con ID ${rootId} non trovato`
- `Formato non supportato: ${format}`

**Esempio:**
```json
{
  "tool": "context.graph.export",
  "args": {
    "rootId": "ctx-123",
    "format": "dot",
    "depth": 2,
    "direction": "both",
    "includeNodeText": true,
    "includeNodeTags": true,
    "includeEdgeMetadata": true
  }
}
```

### context.navigate

Naviga il grafo dei contesti in modo intelligente usando euristiche o guida AI.

**Parametri:**
- `startId` (string, obbligatorio): ID del contesto di partenza
- `targetId` (string, opzionale): ID del contesto di destinazione (richiesto per modalità shortest)
- `mode` (string, opzionale): Modalità di navigazione ("shortest", "semantic", "weighted", "exploratory", default: "shortest")
- `strategy` (object, opzionale): Configurazione della strategia di navigazione
  - `preferredRelations` (string[]): Relazioni da preferire
  - `minStrength` (number): Forza minima delle relazioni (0-1)
  - `minConfidence` (number): Confidenza minima delle relazioni (0-1)
  - `maxSteps` (number): Numero massimo di passi
  - `requireTags` (string[]): Tag richiesti nei contesti
  - `excludeTags` (string[]): Tag da escludere nei contesti
- `includeContent` (boolean, opzionale): Includi il contenuto dei contesti (default: true)
- `includeMetadata` (boolean, opzionale): Includi i metadati delle relazioni (default: true)
- `format` (string, opzionale): Formato del risultato ("path", "tree", "graph", default: "path")

**Output:**
```json
{
  "success": true,
  "path": {
    "nodes": [
      {
        "id": "string",
        "text": "string?",
        "tags": "string[]?"
      }
    ],
    "edges": [
      {
        "sourceId": "string",
        "targetId": "string",
        "relation": "string",
        "strength": "number?",
        "confidence": "number?"
      }
    ]
  }
}
```

**Errori:**
- `Contesto di partenza con ID ${startId} non trovato`
- `Contesto di destinazione con ID ${targetId} non trovato`
- `La modalità 'shortest' richiede un targetId`
- `Nessun percorso trovato tra i contesti specificati`
- `Modalità ${mode} non ancora implementata`

**Esempio:**
```json
{
  "tool": "context.navigate",
  "args": {
    "startId": "ctx-123",
    "targetId": "ctx-789",
    "mode": "shortest",
    "strategy": {
      "preferredRelations": ["supports", "explains"],
      "minStrength": 0.5,
      "minConfidence": 0.7,
      "maxSteps": 5
    },
    "includeContent": true,
    "includeMetadata": true
  }
}
```

## Modalità di Navigazione

| Modalità         | Descrizione                                                                 |
|------------------|-----------------------------------------------------------------------------|
| `shortest`       | Percorso più breve tra due contesti (ignora pesi)                          |
| `weighted`       | Percorso ottimale basato su forza/confidenza e relazioni preferite         |
| `semantic`       | Percorso semanticamente rilevante (con tag, relazioni, metadati)           |
| `exploratory`    | Navigazione euristica da un nodo, senza target                             |
| `hybrid`         | Combina semantic e exploratory con fallback automatico                     |

### Modalità Ibrida (hybrid)

La modalità ibrida combina i vantaggi della navigazione semantica ed esplorativa:

1. **Fase Semantica**
   - Cerca un percorso ottimale tra i contesti
   - Calcola il punteggio semantico medio
   - Se il punteggio ≥ `minSemanticScore`, usa questo percorso

2. **Fase Esplorativa** (fallback)
   - Se il punteggio semantico è basso o il percorso non esiste
   - Esplora il grafo fino a `maxExploratorySteps`
   - Filtra i percorsi per `semanticThreshold`

3. **Pesatura Fonti**
   - Bonus +20% per fonti umane (`source: 'user'`)
   - Malus -20% per fonti automatiche (`source: 'tool'`)
   - Neutro per fonti non specificate

#### Parametri Specifici

| Parametro            | Tipo     | Default | Descrizione                                                                 |
|----------------------|----------|---------|-----------------------------------------------------------------------------|
| `semanticThreshold`  | `number` | -       | Soglia per filtrare i percorsi esplorativi                                  |
| `maxExploratorySteps`| `number` | 3       | Passi massimi in modalità exploratory                                       |
| `minSemanticScore`   | `number` | 0.6     | Punteggio minimo per accettare un percorso semantico                        |

## Server MCP

Incluso in questo modulo c'è un server Express che espone gli endpoint MCP:

- `GET /tools/list` - Restituisce lo schema JSON dei tool disponibili
- `POST /tools/call` - Esegue una chiamata a un tool

### Avvio del Server

```bash
# Avvio con porta predefinita (3030)
npx ts-node src/services/mcp/run-server.ts

# Avvio con porta personalizzata
npx ts-node src/services/mcp/run-server.ts 8080
```

### Esempio di Chiamata al Server

```javascript
// Chiamata a memory.query
fetch('http://localhost:3030/tools/call', {
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
```

## Uso nei Prompt LLM

Gli strumenti MCP possono essere utilizzati nei prompt per modelli come Claude o DeepSeek. Vedere [`tools-examples.md`](./tools-examples.md) per esempi dettagliati.

## Testing

Per testare gli strumenti MCP in modo interattivo, è possibile utilizzare lo script di test:

```typescript
// In VS Code, eseguire il comando:
> Jarvis: Test MCP Dispatcher
```

Questo comando apre un'interfaccia utente interattiva per selezionare il tool da testare e specificare i parametri.

## Estensione del Sistema MCP

Per aggiungere un nuovo tool MCP:

1. Creare un nuovo handler nella directory `handlers/`
2. Aggiungere il tool a `McpDispatcher.ts`
3. Aggiornare `tools.schema.json` con la definizione del nuovo tool
4. Aggiungere esempi a `tools-examples.md`
5. Aggiornare i test se necessario

## Struttura delle Directory

```
src/services/mcp/
├── McpDispatcher.ts       # Dispatcher principale
├── README.md              # Questa documentazione
├── handlers/              # Implementation degli handler
│   ├── memoryQueryHandler.ts
│   ├── projectSummaryHandler.ts
│   ├── readFileHandler.ts
│   └── searchDocsHandler.ts
├── run-server.ts          # Script di avvio del server
├── test-script.ts         # Tool di test interattivo
├── tools-examples.md      # Esempi di utilizzo
├── tools.schema.json      # Schema JSON dei tool
└── toolsListServer.ts     # Server Express MCP
``` 