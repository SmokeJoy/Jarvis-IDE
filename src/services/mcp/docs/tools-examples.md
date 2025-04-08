# Esempi di Utilizzo MCP

## Navigazione Semantica

### Percorso Ottimale tra Due Contesti
```json
{
  "tool": "context.navigate",
  "args": {
    "startId": "ctx-123",
    "targetId": "ctx-789",
    "mode": "semantic",
    "strategy": {
      "preferredRelations": ["supports", "explains"],
      "minStrength": 0.7,
      "minConfidence": 0.8
    }
  }
}
```

### Navigazione con Filtri Avanzati
```json
{
  "tool": "context.navigate",
  "args": {
    "startId": "ctx-123",
    "targetId": "ctx-789",
    "mode": "semantic",
    "strategy": {
      "preferredRelations": ["supports", "explains"],
      "requireTags": ["architettura", "MCP"],
      "excludeTags": ["deprecated"],
      "minStrength": 0.75,
      "minConfidence": 0.85,
      "bidirectional": true
    },
    "includeContent": true,
    "includeMetadata": true
  }
}
```

## Navigazione Esplorativa

### Esplorazione Base
```json
{
  "tool": "context.navigate",
  "args": {
    "startId": "ctx-001",
    "mode": "exploratory",
    "strategy": {
      "maxSteps": 3
    }
  }
}
```

### Esplorazione con Visualizzazione ad Albero
```json
{
  "tool": "context.navigate",
  "args": {
    "startId": "ctx-001",
    "mode": "exploratory",
    "format": "tree",
    "strategy": {
      "maxSteps": 3,
      "preferredRelations": ["extends", "refines"],
      "minStrength": 0.6
    }
  }
}
```

### Esplorazione con Filtri Multipli
```json
{
  "tool": "context.navigate",
  "args": {
    "startId": "ctx-001",
    "mode": "exploratory",
    "strategy": {
      "maxSteps": 2,
      "preferredRelations": ["supports", "explains"],
      "requireTags": ["architettura", "performance"],
      "excludeTags": ["deprecato"],
      "minStrength": 0.7,
      "minConfidence": 0.8
    }
  }
}
```

## Gestione Contesti

### Creazione Contesto
```json
{
  "tool": "context.create",
  "args": {
    "text": "Nuovo contesto di esempio",
    "tags": ["architettura", "MCP"]
  }
}
```

### Collegamento Contesti
```json
{
  "tool": "context.link",
  "args": {
    "sourceId": "ctx-123",
    "targetId": "ctx-456",
    "relation": "supports",
    "strength": 0.8,
    "metadata": {
      "confidence": 0.9,
      "source": "user"
    }
  }
}
```

## Visualizzazione

### Grafo Completo
```json
{
  "tool": "context.navigate",
  "args": {
    "startId": "ctx-001",
    "mode": "exploratory",
    "format": "graph",
    "strategy": {
      "maxSteps": 2
    },
    "includeContent": true,
    "includeMetadata": true
  }
}
```

### Albero Gerarchico
```json
{
  "tool": "context.navigate",
  "args": {
    "startId": "ctx-001",
    "mode": "exploratory",
    "format": "tree",
    "strategy": {
      "maxSteps": 2,
      "preferredRelations": ["extends"]
    }
  }
}
```

## Navigazione Ibrida

### Navigazione con Fallback Automatico
```json
{
  "tool": "context.navigate",
  "args": {
    "startId": "ctx-123",
    "targetId": "ctx-789",
    "mode": "hybrid",
    "strategy": {
      "semanticThreshold": 0.5,
      "maxExploratorySteps": 3,
      "minSemanticScore": 0.6,
      "preferredRelations": ["supports", "explains"],
      "requireTags": ["architettura"],
      "excludeTags": ["deprecato"]
    }
  }
}
```

### Navigazione con Filtri Avanzati
```json
{
  "tool": "context.navigate",
  "args": {
    "startId": "ctx-123",
    "targetId": "ctx-789",
    "mode": "hybrid",
    "strategy": {
      "semanticThreshold": 0.7,
      "maxExploratorySteps": 2,
      "minSemanticScore": 0.8,
      "preferredRelations": ["supports", "explains"],
      "requireTags": ["architettura", "performance"],
      "excludeTags": ["deprecato"],
      "minStrength": 0.7,
      "minConfidence": 0.8,
      "bidirectional": true
    },
    "includeContent": true,
    "includeMetadata": true
  }
}
```

### Navigazione con Priorità Fonti
```json
{
  "tool": "context.navigate",
  "args": {
    "startId": "ctx-123",
    "targetId": "ctx-789",
    "mode": "hybrid",
    "strategy": {
      "semanticThreshold": 0.6,
      "maxExploratorySteps": 3,
      "minSemanticScore": 0.7,
      "preferredRelations": ["supports"],
      "requireTags": ["architettura"],
      "metadata": {
        "source": "user"  // Priorità a fonti umane
      }
    }
  }
}
``` 