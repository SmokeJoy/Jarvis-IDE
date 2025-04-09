# Sistema di Navigazione MCP

## Panoramica

Il sistema di navigazione MCP fornisce due modalità principali per esplorare il grafo dei contesti:

1. **Navigazione Semantica** (`semantic`): Trova il percorso ottimale tra due contesti
2. **Navigazione Esplorativa** (`exploratory`): Esplora il grafo a partire da un contesto

## Parametri di Navigazione

| Parametro | Tipo | Default | Descrizione |
|-----------|------|---------|-------------|
| `minStrength` | `number` | `0` | Strength minima per i link |
| `minConfidence` | `number` | `0` | Confidence minima per i link |
| `preferredRelations` | `string[]` | `[]` | Relazioni preferite (moltiplicatore 1.5x) |
| `requireTags` | `string[]` | `[]` | Tag richiesti nei contesti |
| `excludeTags` | `string[]` | `[]` | Tag da escludere |
| `bidirectional` | `boolean` | `false` | Considera link bidirezionali |
| `maxSteps` | `number` | `3` | Profondità massima esplorazione |

## Formati di Output

### Formato Tree
```typescript
{
  nodes: Array<{
    id: string;
    text?: string;      // Se includeContent
    tags?: string[];    // Se includeMetadata
  }>;
  edges: Array<{
    id: string;
    sourceId: string;
    targetId: string;
    relation: string;
    strength?: number;  // Se includeMetadata
    confidence?: number;// Se includeMetadata
  }>;
}
```

### Formato Graph
```typescript
{
  nodes: Array<{
    id: string;
    text?: string;      // Se includeContent
    tags?: string[];    // Se includeMetadata
  }>;
  edges: Array<{
    id: string;
    sourceId: string;
    targetId: string;
    relation: string;
    strength?: number;  // Se includeMetadata
    confidence?: number;// Se includeMetadata
  }>;
}
```

## Modalità di Navigazione

### Navigazione Semantica
- Implementa l'algoritmo di Dijkstra
- Ottimizza il percorso basandosi sul punteggio semantico
- Supporta link bidirezionali
- Filtra per strength e confidence

### Navigazione Esplorativa
- Implementa BFS con euristica semantica
- Limita la profondità con `maxSteps`
- Supporta formati `tree` e `graph`
- Gestisce cicli nel formato `graph`

## Calcolo del Punteggio Semantico

Il punteggio semantico è calcolato come:
```typescript
score = strength * confidence * relationMultiplier
```

Dove:
- `strength`: Forza del link (0-1)
- `confidence`: Confidenza del link (0-1)
- `relationMultiplier`: 1.5x per relazioni preferite, 1x altrimenti

## Esempi di Utilizzo

### Navigazione Semantica
```typescript
const result = await findSemanticPath('ctx-1', 'ctx-3', {
  preferredRelations: ['supports'],
  minStrength: 0.7,
  minConfidence: 0.8
}, true, true);
```

### Navigazione Esplorativa
```typescript
const result = await findExploratoryPath('ctx-1', {
  maxSteps: 2,
  requireTags: ['architettura'],
  excludeTags: ['deprecato']
}, true, true, 'tree');
```

## Modalità Avanzate

### Navigazione Bidirezionale
```typescript
const result = await findSemanticPath('ctx-1', 'ctx-3', {
  bidirectional: true
});
```

### Navigazione con Filtri Multipli
```typescript
const result = await findExploratoryPath('ctx-1', {
  preferredRelations: ['supports', 'explains'],
  requireTags: ['architettura', 'performance'],
  excludeTags: ['deprecato'],
  minStrength: 0.7,
  minConfidence: 0.8
});
```

## Best Practices

1. **Performance**
   - Usa `maxSteps` per limitare l'esplorazione
   - Filtra i link con `minStrength` e `minConfidence`
   - Specifica `preferredRelations` per guidare la navigazione

2. **Qualità dei Risultati**
   - Usa `requireTags` per focalizzare l'esplorazione
   - Escludi contesti irrilevanti con `excludeTags`
   - Considera `bidirectional` per grafi densi

3. **Formato Output**
   - Usa `tree` per gerarchie chiare
   - Usa `graph` per relazioni complesse
   - Abilita `includeContent` e `includeMetadata` solo se necessario

## Estensioni Future

1. **Modalità Ibrida**
   - Combinazione di `semantic` e `exploratory`
   - Threshold dinamici basati sulla profondità
   - Punteggi pesati per tipo di fonte

2. **Ottimizzazioni**
   - Caching dei risultati intermedi
   - Parallelizzazione dell'esplorazione
   - Pre-calcolo dei percorsi frequenti 