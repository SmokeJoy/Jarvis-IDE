# 🛡️ Predictive Auto-Mitigation

## Obiettivo
Attivare fallback automatici quando il sistema rileva segnali predittivi critici.

## Trigger
- Qualsiasi `WarningEntry` con `level === 'critical'`

## Azioni
- Emit `strategy:adaptive:change` con `safe-mode`
- Logging su EventBus (`type: auto-fallback`)
- Timeline badge `🛡️ AutoFallback`
- Toast/Overlay Notification

## UI
- Mostrare evento in timeline con badge
- Mostrare avviso a schermo (non bloccante)

## Stato Provider
- Forzare `excluded = true` per provider compromesso
- Documentare nel pannello grafico

## Tecnologie
- Hook: `useAutoMitigation()`
- Eventi: `provider:auto-fallback`
- Debounce 10s per evitare spam fallback

## Componenti
- `AutoMitigationProvider`: Gestione stato globale
- `AutoMitigationToast`: Notifica non bloccante
- `TimelineBadge`: Badge per eventi auto-mitigation

## Logging
- Evento: `auto-mitigation:triggered`
- Payload: `{ provider, reason, timestamp }`
- Flag: `__autoMitigated = true`

## Test Cases
1. Trigger su warning critico
2. Debounce funzionante
3. UI feedback immediato
4. Timeline integration
5. Provider exclusion 