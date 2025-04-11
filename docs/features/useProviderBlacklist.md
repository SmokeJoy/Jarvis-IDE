# 🚫 useProviderBlacklist Hook

## Panoramica
L'hook `useProviderBlacklist` gestisce la blacklist temporanea dei provider che hanno fallito o sono stati esclusi automaticamente dal sistema di auto-mitigation. Fornisce un'interfaccia reattiva per bloccare e sbloccare provider con TTL (Time To Live) configurabile.

## API

### Interfacce
```typescript
interface BlockedProvider {
  reason: 'predictive' | 'manual' | 'auto-mitigation';
  blockedAt: number;
  expiresAt: number;
}

type ProviderBlacklist = Record<string, BlockedProvider>;
```

### Hook
```typescript
function useProviderBlacklist(): {
  blacklist: ProviderBlacklist;
  isBlocked: (providerId: string) => boolean;
  block: (providerId: string, reason: BlockedProvider['reason'], ttl?: number) => void;
  unblock: (providerId: string) => void;
}
```

## Esempio d'Uso
```typescript
import { useProviderBlacklist } from '../hooks/useProviderBlacklist';

function ProviderSelector() {
  const { isBlocked, block, unblock } = useProviderBlacklist();

  const handleProviderFailure = (providerId: string) => {
    // Blocca il provider per 120 secondi
    block(providerId, 'auto-mitigation', 120);
  };

  return (
    <div>
      {providers.map(provider => (
        <button
          key={provider.id}
          disabled={isBlocked(provider.id)}
          onClick={() => handleProviderFailure(provider.id)}
        >
          {provider.name}
          {isBlocked(provider.id) && ' (Bloccato)'}
        </button>
      ))}
    </div>
  );
}
```

## Eventi
L'hook emette i seguenti eventi tramite l'EventBus:

### provider:blacklisted
```typescript
{
  providerId: string;
  reason: 'predictive' | 'manual' | 'auto-mitigation';
  blockedAt: number;
  expiresAt: number;
}
```

### provider:restored
```typescript
{
  providerId: string;
}
```

## Best Practices

### Gestione TTL
- Il TTL predefinito è di 120 secondi
- Aggiusta il TTL in base alla criticità del provider
- Usa TTL più lunghi per provider critici
- Usa TTL più brevi per provider non critici

### Monitoraggio
- Ascolta gli eventi `provider:blacklisted` e `provider:restored`
- Logga le blacklist per analisi post-mortem
- Monitora la frequenza dei blocchi per ogni provider

### Integrazione
- Usa `isBlocked` per filtrare i provider disponibili
- Integra con `useAutoMitigation` per blocchi automatici
- Aggiorna l'UI per mostrare lo stato di blocco

## Troubleshooting
1. **Provider non si sblocca**
   - Verifica che il TTL sia corretto
   - Controlla che l'EventBus sia configurato
   - Verifica che non ci siano errori nel cleanup

2. **Eventi non emessi**
   - Verifica la configurazione dell'EventBus
   - Controlla che i listener siano registrati
   - Verifica che non ci siano errori nell'emissione

3. **Performance**
   - Il cleanup avviene ogni secondo
   - Ottimizza se necessario riducendo la frequenza
   - Considera l'uso di `useMemo` per calcoli pesanti 