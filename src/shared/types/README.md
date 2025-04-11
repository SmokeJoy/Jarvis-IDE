# Struttura dei Tipi per Modelli LLM

Questo documento descrive la struttura gerarchica dei tipi utilizzati per rappresentare i modelli di linguaggio (LLM) in Cline.

## Panoramica

Il sistema utilizza una gerarchia di tipi TypeScript per rappresentare i vari modelli LLM supportati da diversi provider. Questa struttura è progettata per:

1. Fornire un insieme comune di proprietà per tutti i modelli
2. Consentire estensibilità per caratteristiche specifiche del provider
3. Mantenere la compatibilità con le API esterne
4. Semplificare la validazione e la manipolazione dei modelli

## Tipi Base

### `ModelInfoBase`

Il tipo base con le proprietà essenziali presenti in tutti i modelli:

```typescript
interface ModelInfoBase {
  id: string;           // Identificatore univoco del modello
  name: string;         // Nome leggibile del modello
  provider: string;     // Provider del modello (es. 'openai', 'anthropic')
  contextLength: number; // Lunghezza massima del contesto in token
}
```

### `ModelInfoStandard`

Estende `ModelInfoBase` con proprietà opzionali comuni:

```typescript
interface ModelInfoStandard extends ModelInfoBase {
  maxTokens?: number;      // Numero massimo di token nell'output
  contextWindow?: number;  // Finestra di contesto alternativa (compatibilità)
  isThirdParty?: boolean;  // Indica se è un modello di terze parti
  description?: string;    // Descrizione del modello
  temperature?: number;    // Temperatura predefinita
  capabilities?: ModelCapabilities; // Capacità del modello
}
```

### `ModelInfo`

Il tipo completo che include tutte le proprietà standard e i dettagli di pricing:

```typescript
interface ModelInfo extends ModelInfoStandard {
  pricing?: {
    prompt?: number;      // Costo per 1000 token in input
    completion?: number;  // Costo per 1000 token in output
  };
}
```

## Tipi Specifici per Provider

### `OpenAiCompatibleModelInfo`

Per modelli compatibili con l'API OpenAI:

```typescript
interface OpenAiCompatibleModelInfo extends ModelInfoStandard {
  maxCompletionTokens?: number; // Token massimi per completamento
}
```

### `AnthropicModelInfo`

Per modelli Anthropic:

```typescript
interface AnthropicModelInfo extends ModelInfoStandard {
  provider: 'anthropic';
  version?: string;          // Versione del modello
  supportsJsonMode?: boolean; // Supporto per modalità JSON
}
```

### `OpenRouterModelInfo`

Per modelli OpenRouter:

```typescript
interface OpenRouterModelInfo extends ModelInfoStandard {
  provider: 'openrouter';
  created?: number;           // Timestamp di creazione
  performanceScore?: number;  // Punteggio di performance
  originalProvider?: string;  // Provider originale
}
```

### `AzureOpenAIModelInfo`

Per modelli Azure OpenAI:

```typescript
interface AzureOpenAIModelInfo extends ModelInfoStandard {
  provider: 'azureopenai';
  deploymentId: string;   // ID di deployment Azure
  apiVersion?: string;    // Versione API
}
```

## Utilizzo

### Importazione

```typescript
import { 
  ModelInfo,
  AnthropicModelInfo,
  OpenAiCompatibleModelInfo 
} from '../shared/types/api.types';
```

### Validazione

Per verificare i modelli, utilizza le funzioni di validazione dal modulo `modelValidator`:

```typescript
import { 
  isModelInfo, 
  isAnthropicModelInfo, 
  validateModelInfoArray 
} from '../shared/validators/modelValidator';

// Verifica se un oggetto è un modello valido
if (isModelInfo(modelObj)) {
  // Usa il modello...
}

// Filtra un array di modelli
const validModels = validateModelInfoArray(modelsArray, 'providerName');
```

## Compatibilità

I tipi legacy sono ancora disponibili per compatibilità con il codice esistente. Il sistema mantiene la compatibilità con le versioni precedenti del codice.

## Best Practices

1. Usa sempre il tipo più specifico possibile per il provider in uso
2. Valida i modelli prima dell'utilizzo con le funzioni del modulo `modelValidator`
3. Per aggiungere nuovi provider, estendi i tipi esistenti seguendo il pattern gerarchico
4. Mantieni la conformità con le strutture API ufficiali dei provider 