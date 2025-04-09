# Esempi di Utilizzo Tool MCP

Questo documento contiene esempi di chiamate ai tool MCP implementati localmente.
È utile come riferimento per preparare prompt per modelli compatibili con function calling come Claude o DeepSeek.

## Schema dei Tool Disponibili

```json
{
  "schema_version": "1.0",
  "tools": [
    {
      "name": "memory.query",
      "description": "Recupera ricordi recenti dalla memoria contestuale",
      "parameters": {
        "type": "object",
        "properties": {
          "scope": {
            "type": "string",
            "enum": ["chat", "project", "agent", "all"],
            "description": "Ambito della memoria da interrogare"
          },
          "filter": {
            "type": "string",
            "description": "Parola o frase da cercare nel testo delle memorie"
          },
          "limit": {
            "type": "number",
            "minimum": 1,
            "maximum": 50,
            "default": 5,
            "description": "Numero massimo di risultati da restituire"
          }
        }
      }
    },
    {
      "name": "project.summary",
      "description": "Genera una panoramica del progetto corrente",
      "parameters": {
        "type": "object",
        "properties": {
          "depth": {
            "type": "number",
            "minimum": 1,
            "maximum": 5,
            "default": 2,
            "description": "Livello massimo di profondità delle directory da esplorare"
          },
          "includeFiles": {
            "type": "boolean",
            "default": true,
            "description": "Se includere l'analisi dei file chiave"
          }
        }
      }
    },
    {
      "name": "read_file",
      "description": "Legge il contenuto di un file nel workspace",
      "parameters": {
        "type": "object",
        "properties": {
          "path": {
            "type": "string",
            "description": "Percorso del file da leggere, relativo alla root del workspace"
          }
        },
        "required": ["path"]
      }
    },
    {
      "name": "search_docs",
      "description": "Cerca nel codice sorgente del progetto usando testo o regex",
      "parameters": {
        "type": "object",
        "properties": {
          "query": {
            "type": "string",
            "description": "Testo o pattern regex da cercare"
          },
          "regex": {
            "type": "boolean",
            "default": false,
            "description": "Se interpretare la query come espressione regolare"
          },
          "caseInsensitive": {
            "type": "boolean",
            "default": false,
            "description": "Se la ricerca deve ignorare maiuscole/minuscole"
          },
          "maxResults": {
            "type": "number",
            "default": 10,
            "description": "Numero massimo di risultati da restituire"
          },
          "directories": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "description": "Directory specifiche in cui cercare (opzionale)"
          }
        },
        "required": ["query"]
      }
    },
    {
      "name": "code.generate",
      "description": "Genera codice TypeScript o Python",
      "parameters": {
        "type": "object",
        "properties": {
          "language": {
            "type": "string",
            "enum": ["TypeScript", "Python"],
            "description": "Lingua del codice da generare"
          },
          "description": {
            "type": "string",
            "description": "Descrizione del codice da generare"
          },
          "contextFile": {
            "type": "string",
            "description": "Percorso del file di contesto per la generazione del codice"
          }
        },
        "required": ["language", "description"]
      }
    },
    {
      "name": "fs.write",
      "description": "Scrive o sovrascrive un file nel workspace",
      "parameters": {
        "type": "object",
        "properties": {
          "path": {
            "type": "string",
            "description": "Percorso del file da scrivere, relativo alla root del workspace"
          },
          "content": {
            "type": "string",
            "description": "Contenuto del file da scrivere"
          },
          "overwrite": {
            "type": "boolean",
            "default": false,
            "description": "Se sovrascrivere il file esistente"
          },
          "previewOnly": {
            "type": "boolean",
            "default": false,
            "description": "Se mostrare solo l'anteprima senza scrivere effettivamente"
          }
        },
        "required": ["path", "content"]
      }
    },
    {
      "name": "refactor.snippet",
      "description": "Rifattorizza codice JavaScript, Python o TypeScript",
      "parameters": {
        "type": "object",
        "properties": {
          "language": {
            "type": "string",
            "enum": ["JavaScript", "Python", "TypeScript"],
            "description": "Lingua del codice da rifattorizzare"
          },
          "code": {
            "type": "string",
            "description": "Codice da rifattorizzare"
          },
          "objective": {
            "type": "string",
            "description": "Obiettivo della rifattorizzazione"
          },
          "explanation": {
            "type": "boolean",
            "default": true,
            "description": "Se includere una spiegazione della rifattorizzazione"
          }
        },
        "required": ["language", "code", "objective"]
      }
    },
    {
      "name": "ask.docs",
      "description": "Interroga la documentazione con una domanda generica",
      "parameters": {
        "type": "object",
        "properties": {
          "question": {
            "type": "string",
            "description": "Domanda generica da porre"
          },
          "filter": {
            "type": "string",
            "description": "Filtro per cercare specificità nella risposta"
          },
          "maxSourceFiles": {
            "type": "number",
            "description": "Numero massimo di file sorgente da includere nella risposta"
          },
          "includeCode": {
            "type": "boolean",
            "description": "Se includere snippet di codice nella risposta"
          }
        },
        "required": ["question"]
      }
    },
    {
      "name": "project.lint",
      "description": "Analizza e corregge problemi di linting in un file",
      "parameters": {
        "type": "object",
        "properties": {
          "path": {
            "type": "string",
            "description": "Percorso del file da analizzare"
          },
          "language": {
            "type": "string",
            "enum": ["javascript", "typescript"],
            "description": "Linguaggio del file da analizzare"
          },
          "fix": {
            "type": "boolean",
            "default": false,
            "description": "Se correggere automaticamente i problemi trovati"
          }
        },
        "required": ["path"]
      }
    }
  ]
}
```

## Esempi di Chiamate

### 1. memory.query

Recupera le ultime 3 memorie dalla chat che contengono la parola "pattern":

```json
{
  "tool": "memory.query",
  "args": {
    "scope": "chat",
    "filter": "pattern",
    "limit": 3
  }
}
```

Recupera tutte le memorie relative al progetto:

```json
{
  "tool": "memory.query",
  "args": {
    "scope": "project"
  }
}
```

Recupera memorie di tutti gli ambiti (max 10):

```json
{
  "tool": "memory.query",
  "args": {
    "scope": "all",
    "limit": 10
  }
}
```

### 2. project.summary

Genera un riepilogo del progetto con profondità 2 (default) includendo l'analisi dei file:

```json
{
  "tool": "project.summary",
  "args": {
    "includeFiles": true
  }
}
```

Genera solo la struttura delle directory con profondità 3:

```json
{
  "tool": "project.summary",
  "args": {
    "depth": 3,
    "includeFiles": false
  }
}
```

### 3. read_file

Leggi un file specifico:

```json
{
  "tool": "read_file",
  "args": {
    "path": "src/services/mcp/McpDispatcher.ts"
  }
}
```

### 4. search_docs

Cerca una stringa semplice:

```json
{
  "tool": "search_docs",
  "args": {
    "query": "McpDispatcher",
    "maxResults": 5
  }
}
```

Cerca usando una regex:

```json
{
  "tool": "search_docs",
  "args": {
    "query": "function\\s+\\w+Handler",
    "regex": true,
    "maxResults": 10
  }
}
```

Cerca in directory specifiche:

```json
{
  "tool": "search_docs",
  "args": {
    "query": "export",
    "directories": ["src/services/mcp/handlers"],
    "maxResults": 10
  }
}
```

### 5. code.generate

Genera codice TypeScript:

```json
{
  "tool": "code.generate",
  "args": {
    "language": "TypeScript",
    "description": "Una classe per gestire connessioni WebSocket"
  }
}
```

Genera codice Python con contesto:

```json
{
  "tool": "code.generate",
  "args": {
    "language": "Python",
    "description": "Funzione per elaborare dati JSON da una richiesta API",
    "contextFile": "src/api/utils.py"
  }
}
```

### 6. fs.write

Crea un nuovo file:

```json
{
  "tool": "fs.write",
  "args": {
    "path": "src/utils/formatter.ts",
    "content": "export function formatDate(date: Date): string {\n  return date.toISOString();\n}"
  }
}
```

Sovrascrive un file esistente:

```json
{
  "tool": "fs.write",
  "args": {
    "path": "src/utils/constants.ts",
    "content": "export const API_VERSION = '2.0';\nexport const MAX_RETRY = 3;",
    "overwrite": true
  }
}
```

Anteprima senza scrivere effettivamente:

```json
{
  "tool": "fs.write",
  "args": {
    "path": "src/components/Button.tsx",
    "content": "import React from 'react';\n\nexport const Button = ({ label, onClick }) => {\n  return <button onClick={onClick}>{label}</button>;\n};",
    "previewOnly": true
  }
}
```

### 7. refactor.snippet

Rifattorizza codice JavaScript:

```json
{
  "tool": "refactor.snippet",
  "args": {
    "language": "JavaScript",
    "code": "function calculateSum(arr) { var result = 0; for (var i = 0; i < arr.length; i++) { result = result + arr[i]; } return result; }",
    "objective": "Modernizzare con ES6, migliorare leggibilità e performance"
  }
}
```

Rifattorizza codice Python con spiegazione disattivata:

```json
{
  "tool": "refactor.snippet",
  "args": {
    "language": "Python",
    "code": "def process_data(data):\n  results = []\n  for item in data:\n    if item > 0:\n      results.append(item * 2)\n  return results",
    "objective": "Migliorare la performance utilizzando list comprehension",
    "explanation": false
  }
}
```

Rifattorizza codice TypeScript:

```json
{
  "tool": "refactor.snippet",
  "args": {
    "language": "TypeScript",
    "code": "function fetchData(url: string, callback: (data: any) => void): void {\n  fetch(url)\n    .then(response => response.json())\n    .then(data => callback(data))\n    .catch(err => console.error(err));\n}",
    "objective": "Convertire in una funzione async/await più moderna"
  }
}
```

### 8. ask.docs

Interroga la documentazione con una domanda generica:

```json
{
  "tool": "ask.docs",
  "args": {
    "question": "Come funziona McpDispatcher?"
  }
}
```

Ricerca specifica con filtro su file o directory:

```json
{
  "tool": "ask.docs",
  "args": {
    "question": "Qual è lo scopo del progetto?",
    "filter": "README"
  }
}
```

Limita il numero di file sorgente e disabilita gli snippet di codice:

```json
{
  "tool": "ask.docs",
  "args": {
    "question": "Come implementare un nuovo tool MCP?",
    "maxSourceFiles": 2,
    "includeCode": false
  }
}
```

Interrogazione specifica di un file:

```json
{
  "tool": "ask.docs",
  "args": {
    "question": "Come funziona il server MCP?",
    "filter": "file:toolsListServer.ts"
  }
}
```

## Esempi `project.lint`

### Esempio 1: Analisi di un file JavaScript/TypeScript

```json
{
  "tool": "project.lint",
  "args": {
    "path": "src/services/mcp/McpDispatcher.ts",
    "language": "typescript"
  }
}
```

Questo esempio analizza un file TypeScript per problemi di linting, specificando esplicitamente il linguaggio.

### Esempio 2: Lint con auto-rilevamento del linguaggio

```json
{
  "tool": "project.lint",
  "args": {
    "path": "src/components/Button.jsx"
  }
}
```

Questa richiesta esegue il linting di un file cercando di rilevare automaticamente il linguaggio dall'estensione.

### Esempio 3: Lint con correzioni automatiche

```json
{
  "tool": "project.lint",
  "args": {
    "path": "src/utils/helpers.js",
    "language": "javascript",
    "fix": true
  }
}
```

Questa richiesta non solo trova problemi di linting, ma tenta anche di correggerli automaticamente dove possibile.

### Esempio 4: Gestione degli errori

```json
{
  "tool": "project.lint",
  "args": {
    "path": "file-non-esistente.js",
    "language": "javascript"
  }
}
```

Questa richiesta gestisce il caso di un file non esistente, restituendo un errore descrittivo.

## Esempi `fs.format`

### Esempio 1: Formattazione TypeScript (anteprima)

```json
{
  "tool": "fs.format",
  "args": {
    "path": "src/components/Button.tsx",
    "language": "typescript",
    "write": false
  }
}
```

Questa richiesta formatta un file TypeScript e restituisce il contenuto formattato senza modificare il file originale.

### Esempio 2: Formattazione automatica con scrittura

```json
{
  "tool": "fs.format",
  "args": {
    "path": "src/utils/helpers.js",
    "write": true
  }
}
```

Questa richiesta formatta un file JavaScript (rilevato dall'estensione) e scrive il file formattato su disco.

### Esempio 3: Formattazione JSON

```json
{
  "tool": "fs.format",
  "args": {
    "path": "config.json",
    "language": "json"
  }
}
```

Questa richiesta formatta un file JSON per renderlo più leggibile.

### Esempio 4: Formattazione Python con Black

```json
{
  "tool": "fs.format",
  "args": {
    "path": "scripts/analyze.py",
    "language": "python",
    "write": true
  }
}
```

Questa richiesta formatta un file Python utilizzando Black (con fallback su autopep8) e scrive il risultato su disco.

## Esempi `test.run`

### Esempio 1: Eseguire tutti i test Jest

```json
{
  "tool": "test.run",
  "args": {}
}
```

Questa richiesta esegue tutti i test Jest nel progetto utilizzando le configurazioni predefinite.

### Esempio 2: Eseguire test in un percorso specifico

```json
{
  "tool": "test.run",
  "args": {
    "path": "src/components/Button",
    "framework": "jest"
  }
}
```

Questa richiesta esegue i test Jest trovati nella directory del componente Button.

### Esempio 3: Filtrare i test per nome

```json
{
  "tool": "test.run",
  "args": {
    "framework": "jest",
    "filter": "rende correttamente"
  }
}
```

Questa richiesta esegue solo i test Jest il cui nome contiene la stringa "rende correttamente".

### Esempio 4: Eseguire test con copertura

```json
{
  "tool": "test.run",
  "args": {
    "path": "src/utils",
    "framework": "jest",
    "coverage": true
  }
}
```

Questa richiesta esegue i test Jest nella directory utils e genera un report di copertura.

### Esempio 5: Eseguire test Python con PyTest

```json
{
  "tool": "test.run",
  "args": {
    "path": "tests/",
    "framework": "pytest",
    "filter": "test_login"
  }
}
```

Questa richiesta esegue i test Python utilizzando PyTest, filtrando solo i test che contengono "test_login" nel nome.

## Esempi `project.depgraph`

### Esempio 1: Generare un grafo di dipendenza in formato JSON

```json
{
  "tool": "project.depgraph",
  "args": {
    "entryPoint": "src/services",
    "format": "json"
  }
}
```

Questa richiesta genera un grafo delle dipendenze in formato JSON a partire dalla directory `src/services`.

### Esempio 2: Analizzare le dipendenze di un file specifico

```json
{
  "tool": "project.depgraph",
  "args": {
    "entryPoint": "src/services/mcp/McpDispatcher.ts",
    "depth": 3
  }
}
```

Questa richiesta analizza le dipendenze del file `McpDispatcher.ts` fino a una profondità di 3 livelli.

### Esempio 3: Generare un grafo in formato DOT (Graphviz)

```json
{
  "tool": "project.depgraph",
  "args": {
    "entryPoint": "src",
    "format": "dot"
  }
}
```

Questa richiesta genera un grafo delle dipendenze in formato DOT, che può essere visualizzato con strumenti come Graphviz.

### Esempio 4: Visualizzare le dipendenze in formato ad albero

```json
{
  "tool": "project.depgraph",
  "args": {
    "entryPoint": "src/components",
    "format": "tree",
    "depth": 2
  }
}
```

Questa richiesta genera una rappresentazione ad albero delle dipendenze nella directory `src/components`, limitata a 2 livelli di profondità.

## Esempi `context.inject`

### Esempio 1: Aggiungere contesto di conversazione

```json
{
  "tool": "context.inject",
  "args": {
    "scope": "chat",
    "text": "Questo progetto segue il pattern architetturale MVC (Model-View-Controller) e utilizza principalmente TypeScript per il backend."
  }
}
```

Questa richiesta aggiunge alla memoria di conversazione informazioni sull'architettura del progetto, che possono essere utili per guidare le risposte del modello LLM.

### Esempio 2: Stabilire regole di progetto

```json
{
  "tool": "context.inject",
  "args": {
    "scope": "project",
    "text": "Regole di progetto: 1) Tutte le nuove classi devono essere accompagnate da test unitari. 2) Utilizzare sempre async/await invece di Promise con .then(). 3) Documentare tutte le API pubbliche con commenti JSDoc."
  }
}
```

Questa richiesta definisce regole specifiche del progetto che il modello dovrebbe rispettare durante la generazione o modifica del codice.

### Esempio 3: Configurare il comportamento dell'agente

```json
{
  "tool": "context.inject",
  "args": {
    "scope": "agent",
    "text": "Sei un assistente di sviluppo specializzato in ottimizzazione delle prestazioni. Concentrati sull'identificare colli di bottiglia nel codice e suggerire miglioramenti per la velocità di esecuzione."
  }
}
```

Questa richiesta configura l'identità e il comportamento specifico dell'agente LLM, focalizzandolo su un aspetto particolare dello sviluppo.

### Esempio 4: Combinare contesti diversi

```json
{
  "tool": "context.inject",
  "args": {
    "text": "Per questo progetto, stiamo migrando da Express.js a Fastify per il backend. Tutte le nuove implementazioni dovrebbero usare l'API di Fastify."
  }
}
```

Questa richiesta aggiunge informazioni sulla migrazione in corso, aiutando il modello a generare codice adeguato senza specificare uno scope (usa lo scope predefinito 'chat').

## Esempi `context.list`

### Esempio 1: Elencare tutti i contesti

```json
{
  "tool": "context.list",
  "args": {}
}
```

Questa richiesta elenca tutti i contesti memorizzati in tutti gli ambiti, ordinati per data di creazione (più recenti prima).

### Esempio 2: Elencare contesti in uno scope specifico

```json
{
  "tool": "context.list",
  "args": {
    "scope": "project"
  }
}
```

Questa richiesta elenca solo i contesti memorizzati nell'ambito 'project'.

### Esempio 3: Filtrare i contesti per testo

```json
{
  "tool": "context.list",
  "args": {
    "filterText": "TypeScript"
  }
}
```

Questa richiesta elenca tutti i contesti che contengono la parola "TypeScript", indipendentemente dallo scope.

### Esempio 4: Limitare il numero di risultati

```json
{
  "tool": "context.list",
  "args": {
    "scope": "chat",
    "limit": 5
  }
}
```

Questa richiesta elenca i 5 contesti più recenti nell'ambito 'chat'.

### Esempio 5: Filtrare per data

```json
{
  "tool": "context.list",
  "args": {
    "sinceTimestamp": 1672527600000
  }
}
```

Questa richiesta elenca tutti i contesti creati dopo il 1° gennaio 2023 (timestamp Unix: 1672527600000).

### Esempio 6: Filtrare contesti per tag

```json
{
  "tool": "context.list",
  "args": {
    "tags": ["architettura", "performance"]
  }
}
```

Questa richiesta elenca tutti i contesti che hanno sia il tag "architettura" sia il tag "performance", indipendentemente dallo scope.

### Esempio 7: Filtrare contesti per tag in uno scope specifico

```json
{
  "tool": "context.list",
  "args": {
    "scope": "project",
    "tags": ["best-practice"]
  }
}
```

Questa richiesta elenca solo i contesti nello scope "project" che hanno il tag "best-practice".

### Esempio 8: Combinare filtri di tag, testo e timestamp

```json
{
  "tool": "context.list",
  "args": {
    "tags": ["bug-fix", "security"],
    "filterText": "authentication",
    "sinceTimestamp": 1672527600000,
    "limit": 10
  }
}
```

Questa richiesta combina più filtri, restituendo i contesti che:
1. Hanno entrambi i tag "bug-fix" e "security"
2. Contengono la parola "authentication"
3. Sono stati creati dopo il 1° gennaio 2023
4. Limitati a un massimo di 10 risultati

## Esempi `context.clear`

### Esempio 1: Cancellare un contesto specifico per ID

```json
{
  "tool": "context.clear",
  "args": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
}
```

Questa richiesta cancella un elemento specifico identificato dal suo ID univoco, indipendentemente dallo scope in cui si trova.

### Esempio 2: Cancellare un contesto specifico per ID in uno scope definito

```json
{
  "tool": "context.clear",
  "args": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "scope": "project"
  }
}
```

Questa richiesta cancella un elemento specifico identificato dal suo ID univoco, cercandolo solo nello scope 'project'.

### Esempio 3: Cancellare tutti i contesti in uno scope specifico

```json
{
  "tool": "context.clear",
  "args": {
    "scope": "chat",
    "all": true
  }
}
```

Questa richiesta cancella tutti i contesti memorizzati nello scope 'chat'.

### Esempio 4: Cancellare tutti i contesti in tutti gli scope

```json
{
  "tool": "context.clear",
  "args": {
    "all": true
  }
}
```

Questa richiesta cancella tutti i contesti memorizzati in tutti gli scope. Da usare con cautela in quanto rimuove l'intera memoria persistente.

## Esempi `context.tag`

### Esempio 1: Aggiungere tag a un contesto esistente

```json
{
  "tool": "context.tag",
  "args": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "tags": ["architettura", "performance", "best-practice"]
  }
}
```

Questa richiesta aggiunge i tag "architettura", "performance" e "best-practice" al contesto identificato dall'ID specificato. I tag verranno normalizzati (converti in lowercase, sostituzione di spazi con trattini, rimozione di caratteri speciali) e aggiunti ai tag esistenti.

### Esempio 2: Sostituire i tag di un contesto esistente

```json
{
  "tool": "context.tag",
  "args": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "tags": ["documentazione", "tutorial"],
    "replace": true
  }
}
```

Questa richiesta sostituisce completamente i tag esistenti del contesto con i nuovi tag "documentazione" e "tutorial".

### Esempio 3: Aggiungere tag semantici per categorizzazione

```json
{
  "tool": "context.tag",
  "args": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "tags": ["bug-fix", "security", "critical"]
  }
}
```

Questa richiesta aggiunge tag che categorizzano semanticamente il contesto, utile per filtrare e recuperare informazioni correlate in futuro.

## Esempi `context.searchByTags`

### Ricerca per tag esatti
```json
{
  "tool": "context.searchByTags",
  "args": {
    "tags": ["refactoring", "typescript"]
  }
}
```

### Ricerca fuzzy con soglia personalizzata
```json
{
  "tool": "context.searchByTags",
  "args": {
    "tags": ["refact", "type"],
    "similarityThreshold": 0.6
  }
}
```

### Ricerca con limite e scope
```json
{
  "tool": "context.searchByTags",
  "args": {
    "tags": ["ai", "memory"],
    "scope": "project",
    "limit": 5
  }
}
```

## Esempi `context.export`

### Esportazione in JSON
```json
{
  "tool": "context.export",
  "args": {
    "format": "json",
    "includeMetadata": true
  }
}
```

Output di esempio:
```json
[
  {
    "id": "ctx-123",
    "scope": "project",
    "timestamp": 1672527600000,
    "tags": ["architettura", "performance"],
    "text": "Il sistema utilizza un'architettura a microservizi..."
  },
  {
    "id": "ctx-456",
    "scope": "chat",
    "timestamp": 1672527601000,
    "tags": ["documentazione"],
    "text": "La documentazione è disponibile su Confluence..."
  }
]
```

### Esportazione in CSV
```json
{
  "tool": "context.export",
  "args": {
    "format": "csv",
    "scope": "project",
    "includeMetadata": true
  }
}
```

Output di esempio:
```csv
text,id,scope,timestamp,tags
"Il sistema utilizza un'architettura a microservizi...",ctx-123,project,1672527600000,"architettura,performance"
"La documentazione è disponibile su Confluence...",ctx-456,chat,1672527601000,documentazione
```

### Esportazione in Markdown
```json
{
  "tool": "context.export",
  "args": {
    "format": "markdown",
    "tags": ["architettura", "performance"],
    "includeMetadata": true
  }
}
```

Output di esempio:
```markdown
### ID: ctx-123
- **Scope**: project
- **Timestamp**: 2023-01-01T12:00:00.000Z
- **Tags**: `architettura`, `performance`

Il sistema utilizza un'architettura a microservizi...

---

### ID: ctx-456
- **Scope**: chat
- **Timestamp**: 2023-01-01T12:00:01.000Z
- **Tags**: `documentazione`

La documentazione è disponibile su Confluence...

---
```

### Esportazione con filtri
```json
{
  "tool": "context.export",
  "args": {
    "format": "json",
    "sinceTimestamp": 1672527600000,
    "includeMetadata": false
  }
}
```

Output di esempio:
```json
[
  {
    "text": "Il sistema utilizza un'architettura a microservizi..."
  },
  {
    "text": "La documentazione è disponibile su Confluence..."
  }
]
```

## context.import

### Importazione da JSON
```json
{
  "tool": "context.import",
  "args": {
    "format": "json",
    "content": "[{\"text\":\"Nuovo contesto JSON\",\"tags\":[\"test\",\"import\"]}]"
  }
}
```

### Importazione da CSV
```json
{
  "tool": "context.import",
  "args": {
    "format": "csv",
    "content": "text,scope,tags\n\"Nuovo contesto CSV\",project,\"test,import\""
  }
}
```

### Importazione da Markdown
```json
{
  "tool": "context.import",
  "args": {
    "format": "markdown",
    "content": "### ID: ctx-789\n- **Scope**: project\n- **Timestamp**: 2023-01-01T12:00:00.000Z\n- **Tags**: `test`, `import`\n\nNuovo contesto Markdown\n---"
  }
}
```

### Importazione con rilevamento automatico
```json
{
  "tool": "context.import",
  "args": {
    "format": "auto",
    "content": "[{\"text\":\"Contesto con formato auto\",\"tags\":[\"test\"]}]"
  }
}
```

### Importazione con scope specifico
```json
{
  "tool": "context.import",
  "args": {
    "format": "json",
    "content": "[{\"text\":\"Contesto con scope specifico\"}]",
    "scope": "project"
  }
}
```

### Importazione senza merge dei tag
```json
{
  "tool": "context.import",
  "args": {
    "format": "json",
    "content": "[{\"text\":\"Contesto senza merge tag\",\"tags\":[\"test\"]}]",
    "mergeTags": false
  }
}
```

### Risposte di esempio

#### Importazione riuscita
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

#### Importazione con duplicati
```json
{
  "success": true,
  "output": {
    "format": "json",
    "imported": 2,
    "skipped": 1,
    "errors": []
  }
}
```

#### Importazione con errori
```json
{
  "success": false,
  "error": "Formato non supportato: xml"
}
```

## context.edit

### Modifica del testo
```json
{
  "tool": "context.edit",
  "args": {
    "id": "ctx-123",
    "text": "Testo aggiornato del contesto"
  }
}
```

### Modifica dei tag
```json
{
  "tool": "context.edit",
  "args": {
    "id": "ctx-123",
    "tags": ["nuovo-tag", "aggiornato"]
  }
}
```

### Modifica dello scope
```json
{
  "tool": "context.edit",
  "args": {
    "id": "ctx-123",
    "scope": "project"
  }
}
```

### Modifica multipla
```json
{
  "tool": "context.edit",
  "args": {
    "id": "ctx-123",
    "text": "Testo completamente nuovo",
    "tags": ["completamente", "nuovo"],
    "scope": "agent"
  }
}
```

### Risposte di esempio

#### Modifica riuscita
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
      "text": "Testo completamente nuovo",
      "tags": ["completamente", "nuovo"],
      "scope": "agent"
    }
  }
}
```

#### Modifica parziale
```json
{
  "success": true,
  "output": {
    "id": "ctx-123",
    "changes": {
      "text": true,
      "tags": false,
      "scope": false
    },
    "original": {
      "text": "Testo originale",
      "tags": ["vecchio"],
      "scope": "chat"
    },
    "updated": {
      "text": "Testo aggiornato",
      "tags": ["vecchio"],
      "scope": "chat"
    }
  }
}
```

#### Errore: ID non trovato
```json
{
  "success": false,
  "error": "Contesto con ID ctx-non-esistente non trovato"
}
```

#### Errore: ID mancante
```json
{
  "success": false,
  "error": "ID del contesto non fornito"
}
```

## context.link

Crea relazioni semantiche tra contesti esistenti. Supporta relazioni unidirezionali e bidirezionali, con opzionale forza della relazione e metadati.

### Esempio: Relazione unidirezionale
```json
{
  "tool": "context.link",
  "args": {
    "sourceId": "ctx-123",
    "targetId": "ctx-456",
    "relation": "supports"
  }
}
```

**Risposta di successo:**
```json
{
  "success": true,
  "output": {
    "link": {
      "id": "link-789",
      "sourceId": "ctx-123",
      "targetId": "ctx-456",
      "relation": "supports",
      "bidirectional": false,
      "strength": 0.5,
      "metadata": {
        "confidence": 1.0,
        "source": "user",
        "timestamp": "2024-03-14T12:00:00.000Z"
      }
    }
  }
}
```

### Esempio: Relazione bidirezionale
```json
{
  "tool": "context.link",
  "args": {
    "sourceId": "ctx-123",
    "targetId": "ctx-456",
    "relation": "is_similar_to",
    "bidirectional": true
  }
}
```

**Risposta di successo:**
```json
{
  "success": true,
  "output": {
    "links": [
      {
        "id": "link-789",
        "sourceId": "ctx-123",
        "targetId": "ctx-456",
        "relation": "is_similar_to",
        "bidirectional": true,
        "strength": 0.5,
        "metadata": {
          "confidence": 1.0,
          "source": "user",
          "timestamp": "2024-03-14T12:00:00.000Z"
        }
      },
      {
        "id": "link-790",
        "sourceId": "ctx-456",
        "targetId": "ctx-123",
        "relation": "is_similar_to",
        "bidirectional": true,
        "strength": 0.5,
        "metadata": {
          "confidence": 1.0,
          "source": "user",
          "timestamp": "2024-03-14T12:00:00.000Z"
        }
      }
    ]
  }
}
```

### Esempio: Relazione con forza e metadati
```json
{
  "tool": "context.link",
  "args": {
    "sourceId": "ctx-123",
    "targetId": "ctx-456",
    "relation": "explains",
    "strength": 0.8,
    "metadata": {
      "confidence": 0.9,
      "source": "ai"
    }
  }
}
```

**Risposta di successo:**
```json
{
  "success": true,
  "output": {
    "link": {
      "id": "link-789",
      "sourceId": "ctx-123",
      "targetId": "ctx-456",
      "relation": "explains",
      "bidirectional": false,
      "strength": 0.8,
      "metadata": {
        "confidence": 0.9,
        "source": "ai",
        "timestamp": "2024-03-14T12:00:00.000Z"
      }
    }
  }
}
```

### Errori comuni

#### Contesto non esistente
```json
{
  "tool": "context.link",
  "args": {
    "sourceId": "ctx-non-esistente",
    "targetId": "ctx-456",
    "relation": "supports"
  }
}
```

**Risposta di errore:**
```json
{
  "success": false,
  "error": "Contesto non trovato: ctx-non-esistente"
}
```

#### Parametri mancanti
```json
{
  "tool": "context.link",
  "args": {
    "sourceId": "ctx-123"
  }
}
```

**Risposta di errore:**
```json
{
  "success": false,
  "error": "Parametri mancanti: targetId e relation sono obbligatori"
}
```

### Note
- Le relazioni supportate sono: `supports`, `contradicts`, `explains`, `is_similar_to`, `depends_on`, `references`
- `strength` è un valore tra 0 e 1 (default: 0.5)
- `metadata.confidence` è un valore tra 0 e 1 (default: 1.0)
- `metadata.source` può essere "user" o "ai" (default: "user")
- Le relazioni bidirezionali creano automaticamente il link inverso con gli stessi metadati

## Note per l'Uso in Prompt

Quando usi questi esempi in prompt per Claude, DeepSeek o altri modelli:

1. Includi lo schema completo dei tool all'inizio del prompt
2. Fornisci istruzioni su come chiamare questi tool usando il formato `{ "tool": "name", "args": {...} }`
3. Per Claude, assicurati di specificare che le chiamate ai tool devono essere formattate come `<tool>...</tool>`

Esempio di introduzione in un prompt:

```
Hai accesso a questi tool per interagire con il progetto:
[INSERIRE SCHEMA JSON]

Per utilizzare un tool, genera un JSON nel seguente formato:
{
  "tool": "nome.del.tool",
  "args": {
    // argomenti specifici per il tool
  }
}

Esempio di utilizzo:
{
  "tool": "memory.query",
  "args": {
    "scope": "chat",
    "limit": 5
  }
}
```

## context.linksOf

Recupera tutte le relazioni di un contesto specifico, con opzioni di filtro per direzione, tipo di relazione, forza e confidenza.

### Esempio: Recupera tutte le relazioni
```json
{
  "tool": "context.linksOf",
  "args": {
    "id": "ctx-123"
  }
}
```

**Risposta di successo:**
```json
{
  "success": true,
  "output": {
    "incoming": [
      {
        "id": "link-456",
        "sourceId": "ctx-789",
        "targetId": "ctx-123",
        "relation": "supports",
        "bidirectional": false,
        "strength": 0.7,
        "metadata": {
          "confidence": 0.9,
          "source": "user",
          "timestamp": "2024-03-14T12:00:00.000Z"
        }
      }
    ],
    "outgoing": [
      {
        "id": "link-789",
        "sourceId": "ctx-123",
        "targetId": "ctx-456",
        "relation": "explains",
        "bidirectional": true,
        "strength": 0.8,
        "metadata": {
          "confidence": 0.95,
          "source": "ai",
          "timestamp": "2024-03-14T12:30:00.000Z"
        }
      }
    ]
  }
}
```

### Esempio: Filtra per direzione
```json
{
  "tool": "context.linksOf",
  "args": {
    "id": "ctx-123",
    "direction": "outgoing"
  }
}
```

**Risposta di successo:**
```json
{
  "success": true,
  "output": {
    "incoming": [],
    "outgoing": [
      {
        "id": "link-789",
        "sourceId": "ctx-123",
        "targetId": "ctx-456",
        "relation": "explains",
        "bidirectional": true,
        "strength": 0.8,
        "metadata": {
          "confidence": 0.95,
          "source": "ai",
          "timestamp": "2024-03-14T12:30:00.000Z"
        }
      }
    ]
  }
}
```

### Esempio: Filtra per tipo di relazione
```json
{
  "tool": "context.linksOf",
  "args": {
    "id": "ctx-123",
    "relation": "supports"
  }
}
```

**Risposta di successo:**
```json
{
  "success": true,
  "output": {
    "incoming": [
      {
        "id": "link-456",
        "sourceId": "ctx-789",
        "targetId": "ctx-123",
        "relation": "supports",
        "bidirectional": false,
        "strength": 0.7,
        "metadata": {
          "confidence": 0.9,
          "source": "user",
          "timestamp": "2024-03-14T12:00:00.000Z"
        }
      }
    ],
    "outgoing": []
  }
}
```

### Esempio: Filtra per forza e confidenza
```json
{
  "tool": "context.linksOf",
  "args": {
    "id": "ctx-123",
    "minStrength": 0.7,
    "minConfidence": 0.9
  }
}
```

**Risposta di successo:**
```json
{
  "success": true,
  "output": {
    "incoming": [
      {
        "id": "link-456",
        "sourceId": "ctx-789",
        "targetId": "ctx-123",
        "relation": "supports",
        "bidirectional": false,
        "strength": 0.7,
        "metadata": {
          "confidence": 0.9,
          "source": "user",
          "timestamp": "2024-03-14T12:00:00.000Z"
        }
      }
    ],
    "outgoing": [
      {
        "id": "link-789",
        "sourceId": "ctx-123",
        "targetId": "ctx-456",
        "relation": "explains",
        "bidirectional": true,
        "strength": 0.8,
        "metadata": {
          "confidence": 0.95,
          "source": "ai",
          "timestamp": "2024-03-14T12:30:00.000Z"
        }
      }
    ]
  }
}
```

### Errori comuni

#### Contesto non esistente
```json
{
  "tool": "context.linksOf",
  "args": {
    "id": "ctx-non-esistente"
  }
}
```

**Risposta di errore:**
```json
{
  "success": false,
  "error": "Contesto con ID ctx-non-esistente non trovato"
}
```

#### ID mancante
```json
{
  "tool": "context.linksOf",
  "args": {}
}
```

**Risposta di errore:**
```json
{
  "success": false,
  "error": "Parametro id è obbligatorio"
}
```

### Note
- `direction` può essere "incoming", "outgoing" o "both" (default)
- `relation` supporta: "supports", "contradicts", "explains", "is_similar_to", "depends_on", "references"
- `minStrength` e `minConfidence` sono valori tra 0 e 1
- Le relazioni bidirezionali appaiono sia in incoming che outgoing 

## context.graph

### Grafo base
```json
{
  "tool": "context.graph",
  "args": {
    "rootId": "ctx-123"
  }
}
```

Risposta di successo:
```json
{
  "success": true,
  "output": {
    "nodes": [
      {
        "id": "ctx-123",
        "text": "Testo del contesto radice",
        "tags": ["tag1", "tag2"],
        "scope": "project"
      },
      {
        "id": "ctx-456",
        "text": "Testo del contesto collegato",
        "tags": ["tag3"],
        "scope": "project"
      }
    ],
    "links": [
      {
        "id": "link-789",
        "sourceId": "ctx-123",
        "targetId": "ctx-456",
        "relation": "supports",
        "bidirectional": false,
        "strength": 0.8,
        "metadata": {
          "confidence": 0.9,
          "source": "user",
          "timestamp": "2024-03-20T12:00:00Z"
        }
      }
    ]
  }
}
```

### Grafo con profondità
```json
{
  "tool": "context.graph",
  "args": {
    "rootId": "ctx-123",
    "depth": 2
  }
}
```

### Grafo con direzione
```json
{
  "tool": "context.graph",
  "args": {
    "rootId": "ctx-123",
    "direction": "outgoing"
  }
}
```

### Grafo con filtro relazione
```json
{
  "tool": "context.graph",
  "args": {
    "rootId": "ctx-123",
    "relation": "supports"
  }
}
```

### Grafo con filtri avanzati
```json
{
  "tool": "context.graph",
  "args": {
    "rootId": "ctx-123",
    "minStrength": 0.7,
    "minConfidence": 0.8
  }
}
```

### Grafo completo
```json
{
  "tool": "context.graph",
  "args": {
    "rootId": "ctx-123",
    "depth": 2,
    "direction": "both",
    "relation": "supports",
    "minStrength": 0.7,
    "minConfidence": 0.8,
    "includeRoot": true,
    "includeIsolated": false
  }
}
```

### Contesto non trovato
```json
{
  "tool": "context.graph",
  "args": {
    "rootId": "ctx-non-esistente"
  }
}
```

Risposta di errore:
```json
{
  "success": false,
  "error": "Contesto con ID ctx-non-esistente non trovato"
}
``` 

## context.unlink

### Rimuovi relazione specifica
```json
{
  "tool": "context.unlink",
  "args": {
    "sourceId": "ctx-123",
    "targetId": "ctx-456",
    "relation": "supports"
  }
}
```

Risposta di successo:
```json
{
  "success": true,
  "output": {
    "removed": 1
  }
}
```

### Rimuovi tutte le relazioni
```json
{
  "tool": "context.unlink",
  "args": {
    "sourceId": "ctx-123",
    "targetId": "ctx-456"
  }
}
```

### Rimuovi relazione bidirezionale
```json
{
  "tool": "context.unlink",
  "args": {
    "sourceId": "ctx-123",
    "targetId": "ctx-456",
    "bidirectional": true
  }
}
```

### Nessuna relazione trovata
```json
{
  "tool": "context.unlink",
  "args": {
    "sourceId": "ctx-123",
    "targetId": "ctx-456",
    "relation": "non-esistente"
  }
}
```

Risposta di successo (nessuna relazione rimossa):
```json
{
  "success": true,
  "output": {
    "removed": 0
  }
}
``` 

## context.graph.export

Esporta il grafo dei contesti in vari formati interoperabili.

### Esporta in formato DOT
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

Risposta di successo:
```json
{
  "success": true,
  "output": "digraph G {\n  node [shape=box, style=filled, fillcolor=lightblue];\n  edge [fontsize=10];\n\n  \"ctx-123\" [label=\"ctx-123\\nTesto del contesto...\\nTags: tag1, tag2\"];\n  \"ctx-456\" [label=\"ctx-456\\nTesto correlato...\\nTags: tag3\"];\n  \"ctx-789\" [label=\"ctx-789\\nAltro testo...\\nTags: tag4\"];\n\n  \"ctx-123\" -> \"ctx-456\" [label=\"supports\\nstrength: 0.75\\nconf: 0.90\"];\n  \"ctx-456\" -> \"ctx-789\" [label=\"explains\\nstrength: 0.60\\nconf: 0.85\"];\n}\n"
}
```

### Esporta in formato Mermaid
```json
{
  "tool": "context.graph.export",
  "args": {
    "rootId": "ctx-123",
    "format": "mermaid",
    "depth": 1,
    "direction": "outgoing",
    "relation": "supports",
    "minStrength": 0.5,
    "includeNodeText": true
  }
}
```

Risposta di successo:
```json
{
  "success": true,
  "output": "graph TD\n  ctx-123[\"ctx-123\\nTesto del contesto...\"]\n  ctx-456[\"ctx-456\\nTesto correlato...\"]\n  ctx-789[\"ctx-789\\nAltro testo...\"]\n\n  ctx-123 -->|\"supports\\nstrength: 0.75\\nconf: 0.90\"| ctx-456\n  ctx-456 -->|\"explains\\nstrength: 0.60\\nconf: 0.85\"| ctx-789\n"
}
```

### Esporta in formato GraphML
```json
{
  "tool": "context.graph.export",
  "args": {
    "rootId": "ctx-123",
    "format": "graphml",
    "depth": 3,
    "direction": "incoming",
    "minConfidence": 0.7,
    "includeNodeTags": true,
    "includeEdgeMetadata": true
  }
}
```

Risposta di successo:
```json
{
  "success": true,
  "output": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<graphml xmlns=\"http://graphml.graphdrawing.org/xmlns\">\n  <key id=\"text\" for=\"node\" attr.name=\"text\" attr.type=\"string\"/>\n  <key id=\"tags\" for=\"node\" attr.name=\"tags\" attr.type=\"string\"/>\n  <key id=\"relation\" for=\"edge\" attr.name=\"relation\" attr.type=\"string\"/>\n  <key id=\"strength\" for=\"edge\" attr.name=\"strength\" attr.type=\"double\"/>\n  <key id=\"confidence\" for=\"edge\" attr.name=\"confidence\" attr.type=\"double\"/>\n  <graph id=\"G\" edgedefault=\"directed\">\n    <node id=\"ctx-123\">\n      <data key=\"tags\">tag1,tag2</data>\n    </node>\n    <node id=\"ctx-456\">\n      <data key=\"tags\">tag3</data>\n    </node>\n    <edge source=\"ctx-456\" target=\"ctx-123\">\n      <data key=\"relation\">supports</data>\n      <data key=\"strength\">0.75</data>\n      <data key=\"confidence\">0.90</data>\n    </edge>\n  </graph>\n</graphml>\n"
}
```

### Esporta in formato JSON-LD
```json
{
  "tool": "context.graph.export",
  "args": {
    "rootId": "ctx-123",
    "format": "json-ld",
    "depth": 2,
    "direction": "both",
    "includeRoot": false,
    "includeIsolated": true,
    "includeNodeText": true,
    "includeNodeTags": true,
    "includeEdgeMetadata": true
  }
}
```

Risposta di successo:
```json
{
  "success": true,
  "output": "{\n  \"@context\": {\n    \"@vocab\": \"http://example.org/\",\n    \"text\": \"http://schema.org/text\",\n    \"tags\": \"http://schema.org/keywords\",\n    \"relation\": \"http://schema.org/relation\",\n    \"strength\": \"http://schema.org/weight\",\n    \"confidence\": \"http://schema.org/confidence\"\n  },\n  \"@graph\": [\n    {\n      \"@id\": \"ctx-456\",\n      \"@type\": \"Context\",\n      \"text\": \"Testo correlato...\",\n      \"tags\": [\"tag3\"]\n    },\n    {\n      \"@id\": \"ctx-789\",\n      \"@type\": \"Context\",\n      \"text\": \"Altro testo...\",\n      \"tags\": [\"tag4\"]\n    },\n    {\n      \"@id\": \"link-1\",\n      \"@type\": \"Relation\",\n      \"relation\": \"supports\",\n      \"source\": \"ctx-123\",\n      \"target\": \"ctx-456\",\n      \"strength\": 0.75,\n      \"confidence\": 0.90\n    }\n  ]\n}"
}
```

### Errori

#### Contesto non trovato
```json
{
  "tool": "context.graph.export",
  "args": {
    "rootId": "ctx-non-esistente",
    "format": "dot"
  }
}
```

Risposta di errore:
```json
{
  "success": false,
  "error": "Contesto con ID ctx-non-esistente non trovato"
}
```

#### Formato non supportato
```json
{
  "tool": "context.graph.export",
  "args": {
    "rootId": "ctx-123",
    "format": "formato-non-supportato"
  }
}
```

Risposta di errore:
```json
{
  "success": false,
  "error": "Formato non supportato: formato-non-supportato"
}
``` 

## context.navigate

Naviga il grafo dei contesti in modo intelligente usando euristiche o guida AI.

### Naviga tra contesti (modalità shortest)
```json
{
  "tool": "context.navigate",
  "args": {
    "startId": "ctx-123",
    "targetId": "ctx-789",
    "mode": "shortest",
    "includeContent": true,
    "includeMetadata": true
  }
}
```

Risposta di successo:
```json
{
  "success": true,
  "path": {
    "nodes": [
      {
        "id": "ctx-123",
        "text": "Testo del contesto di partenza",
        "tags": ["tag1", "tag2"]
      },
      {
        "id": "ctx-456",
        "text": "Testo del contesto intermedio",
        "tags": ["tag3"]
      },
      {
        "id": "ctx-789",
        "text": "Testo del contesto di destinazione",
        "tags": ["tag4"]
      }
    ],
    "edges": [
      {
        "sourceId": "ctx-123",
        "targetId": "ctx-456",
        "relation": "supports",
        "strength": 0.75,
        "confidence": 0.90
      },
      {
        "sourceId": "ctx-456",
        "targetId": "ctx-789",
        "relation": "explains",
        "strength": 0.60,
        "confidence": 0.85
      }
    ]
  }
}
```

### Naviga tra contesti con strategia
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

Risposta di successo:
```json
{
  "success": true,
  "path": {
    "nodes": [
      {
        "id": "ctx-123",
        "text": "Testo del contesto di partenza",
        "tags": ["tag1", "tag2"]
      },
      {
        "id": "ctx-456",
        "text": "Testo del contesto intermedio",
        "tags": ["tag3"]
      },
      {
        "id": "ctx-789",
        "text": "Testo del contesto di destinazione",
        "tags": ["tag4"]
      }
    ],
    "edges": [
      {
        "sourceId": "ctx-123",
        "targetId": "ctx-456",
        "relation": "supports",
        "strength": 0.75,
        "confidence": 0.90
      },
      {
        "sourceId": "ctx-456",
        "targetId": "ctx-789",
        "relation": "explains",
        "strength": 0.60,
        "confidence": 0.85
      }
    ]
  }
}
```

### Errori

#### Contesto non trovato
```json
{
  "tool": "context.navigate",
  "args": {
    "startId": "ctx-non-esistente",
    "targetId": "ctx-789",
    "mode": "shortest"
  }
}
```

Risposta di errore:
```json
{
  "success": false,
  "error": "Contesto di partenza con ID ctx-non-esistente non trovato"
}
```

#### Target mancante
```json
{
  "tool": "context.navigate",
  "args": {
    "startId": "ctx-123",
    "mode": "shortest"
  }
}
```

Risposta di errore:
```json
{
  "success": false,
  "error": "La modalità 'shortest' richiede un targetId"
}
```

### context.navigate (semantic)

#### Navigazione semantica tra contesti esistenti
```json
{
  "tool": "context.navigate",
  "args": {
    "startId": "ctx-123",
    "targetId": "ctx-789",
    "mode": "semantic",
    "includeContent": true,
    "includeMetadata": true
  }
}
```

**Risposta di successo:**
```json
{
  "success": true,
  "path": {
    "nodes": [
      {
        "id": "ctx-123",
        "text": "Contesto di partenza",
        "tags": ["inizio", "architettura"]
      },
      {
        "id": "ctx-456",
        "text": "Contesto intermedio",
        "tags": ["medio", "performance"]
      },
      {
        "id": "ctx-789",
        "text": "Contesto di destinazione",
        "tags": ["fine", "architettura"]
      }
    ],
    "edges": [
      {
        "sourceId": "ctx-123",
        "targetId": "ctx-456",
        "relation": "supports",
        "strength": 0.8,
        "confidence": 0.9
      },
      {
        "sourceId": "ctx-456",
        "targetId": "ctx-789",
        "relation": "explains",
        "strength": 0.7,
        "confidence": 0.8
      }
    ]
  }
}
```

#### Navigazione semantica con tag richiesti
```json
{
  "tool": "context.navigate",
  "args": {
    "startId": "ctx-123",
    "targetId": "ctx-789",
    "mode": "semantic",
    "strategy": {
      "requireTags": ["architettura", "performance"],
      "excludeTags": ["deprecato"],
      "preferredRelations": ["supports", "explains"],
      "minStrength": 0.5,
      "minConfidence": 0.7
    }
  }
}
```

**Risposta di successo:**
```json
{
  "success": true,
  "path": {
    "nodes": [
      {
        "id": "ctx-123",
        "text": "Contesto di partenza",
        "tags": ["architettura", "performance"]
      },
      {
        "id": "ctx-456",
        "text": "Contesto intermedio",
        "tags": ["architettura", "performance"]
      },
      {
        "id": "ctx-789",
        "text": "Contesto di destinazione",
        "tags": ["architettura", "performance"]
      }
    ],
    "edges": [
      {
        "sourceId": "ctx-123",
        "targetId": "ctx-456",
        "relation": "supports",
        "strength": 0.8,
        "confidence": 0.9
      },
      {
        "sourceId": "ctx-456",
        "targetId": "ctx-789",
        "relation": "explains",
        "strength": 0.7,
        "confidence": 0.8
      }
    ]
  }
}
```

#### Navigazione semantica con contesto non connesso
```json
{
  "tool": "context.navigate",
  "args": {
    "startId": "ctx-123",
    "targetId": "ctx-999",
    "mode": "semantic"
  }
}
```

**Risposta di errore:**
```json
{
  "success": false,
  "error": "Nessun percorso semantico trovato tra i contesti specificati"
}
```

#### Navigazione semantica con contesto inesistente
```json
{
  "tool": "context.navigate",
  "args": {
    "startId": "ctx-999",
    "targetId": "ctx-123",
    "mode": "semantic"
  }
}
```

**Risposta di errore:**
```json
{
  "success": false,
  "error": "Contesto di partenza con ID ctx-999 non trovato"
}
```

#### Navigazione semantica con parametri non validi
```json
{
  "tool": "context.navigate",
  "args": {
    "startId": "ctx-123",
    "mode": "semantic"
  }
}
```

**Risposta di errore:**
```json
{
  "success": false,
  "error": "La modalità 'semantic' richiede un targetId"
}
``` 