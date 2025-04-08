# Integrazione MCP con vari motori LLM

Questo documento contiene esempi di prompt per integrare il tool `code.generate` con diversi motori LLM, come Claude o DeepSeek.

## 1. Integrazione con Claude Sonnet/Opus

Claude supporta nativamente le API function calling, quindi è possibile utilizzare il seguente prompt per integrare il tool `code.generate`.

```json
{
  "model": "claude-3-sonnet-20240229",
  "messages": [
    {
      "role": "system",
      "content": "Sei un assistente di programmazione professionale. Aiuti gli utenti a scrivere codice di alta qualità, seguendo le migliori pratiche e mantenendo standard elevati."
    },
    {
      "role": "user",
      "content": "Ho bisogno di una funzione per validare gli URL in JavaScript."
    }
  ],
  "tools": [
    {
      "name": "code.generate",
      "description": "Genera snippet di codice partendo da una descrizione naturale",
      "parameters": {
        "type": "object",
        "properties": {
          "language": {
            "type": "string",
            "description": "Linguaggio di programmazione desiderato (es: TypeScript, Python, JavaScript)"
          },
          "description": {
            "type": "string",
            "description": "Descrizione naturale di ciò che il codice deve fare"
          },
          "contextFile": {
            "type": "string",
            "description": "File di contesto a cui ancorare il codice (opzionale)"
          }
        },
        "required": ["language", "description"]
      }
    }
  ],
  "tool_choice": "auto"
}
```

## 2. Integrazione con DeepSeek-Coder

DeepSeek-Coder può essere utilizzato con LM Studio o direttamente tramite l'API. Ecco un esempio di prompt per l'integrazione:

```json
{
  "model": "deepseek-coder",
  "messages": [
    {
      "role": "system",
      "content": "Sei un assistente esperto di programmazione. Disponi di uno strumento chiamato 'code.generate' che puoi utilizzare per generare codice. Quando l'utente richiede un codice specifico, utilizza questo strumento.\n\nPer utilizzare lo strumento, rispondi con il seguente formato JSON:\n\n```json\n{\"tool\": \"code.generate\", \"args\": {\"language\": \"linguaggio_richiesto\", \"description\": \"descrizione_dettagliata\"}}\n```\n\nDove:\n- linguaggio_richiesto: il linguaggio di programmazione richiesto (es. Python, JavaScript, TypeScript)\n- descrizione_dettagliata: una descrizione precisa di cosa deve fare il codice"
    },
    {
      "role": "user",
      "content": "Scrivimi un algoritmo di ordinamento quicksort in C++"
    }
  ],
  "temperature": 0.1,
  "max_tokens": 2000
}
```

## 3. Workflow di orchestrazione: LLM → Tool → LLM

Questo workflow completo mostra come gestire una conversazione che utilizza il tool `code.generate` e poi riprende con il feedback dell'LLM:

```javascript
// Pseudocodice per l'orchestrazione LLM → Tool → LLM
async function handleUserRequest(userMessage) {
  // 1. Invia il messaggio dell'utente all'LLM
  const llmResponse = await callLLM({
    messages: conversationHistory.concat([{ role: "user", content: userMessage }]),
    tools: [codeGenerateToolDefinition]
  });

  // 2. Controlla se l'LLM vuole utilizzare uno strumento
  if (llmResponse.tool_calls && llmResponse.tool_calls.length > 0) {
    const toolCall = llmResponse.tool_calls[0];
    
    // 3. Esegui la chiamata MCP
    const mcpResponse = await fetch("http://localhost:3030/tools/call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tool: toolCall.name,
        args: toolCall.arguments
      })
    });
    
    const mcpResult = await mcpResponse.json();
    
    // 4. Invia il risultato dello strumento all'LLM per l'elaborazione finale
    const finalResponse = await callLLM({
      messages: conversationHistory.concat([
        { role: "user", content: userMessage },
        { 
          role: "assistant",
          content: null,
          tool_calls: [toolCall]
        },
        {
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(mcpResult)
        }
      ])
    });
    
    return finalResponse.content;
  }
  
  // Se l'LLM non ha utilizzato strumenti, restituisci direttamente la risposta
  return llmResponse.content;
}
```

## 4. Esempio di prompt con contesto multi-file

Questo esempio mostra come fornire contesto multi-file all'LLM prima di utilizzare `code.generate`:

```javascript
// Esempio di prompt con contesto multi-file
const messages = [
  {
    role: "system", 
    content: "Sei un assistente di programmazione specializzato in refactoring e miglioramento del codice."
  },
  {
    role: "user",
    content: `Ho bisogno di aggiungere validazione agli input in questa funzione.
    
File di contesto:
\`\`\`typescript
// utils/validators.ts
export function isEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function isURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
\`\`\`

File da migliorare:
\`\`\`typescript
// components/UserForm.tsx
import React, { useState } from 'react';

export function UserForm() {
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    website: ''
  });
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // Manca la validazione
    console.log('Submitted:', userData);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
\`\`\`

Per favore, genera il codice migliorato per la funzione handleSubmit che includa validazione utilizzando le funzioni dal file validators.ts.`
  }
];
```

Puoi salvare questo documento ed utilizzarlo come riferimento per integrare `code.generate` con vari modelli linguistici. 