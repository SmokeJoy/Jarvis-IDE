# 🚀 Mitigator AI v1.0.0 – Standalone Release

## Feature incluse
- Visualizzazione Timeline + Istanti Decisionali
- Mitigazione automatica predittiva
- Sistema di Replay / Simulazione eventi
- Blocco provider con TTL
- DecisionGraph interattivo + Tooltip live
- Componente esportabile: `MitigatorOverlay`

## Moduli
- `useAutoMitigation`, `useProviderBlacklist`
- `PredictiveWarningPanel`, `TimelineEntry`, `DecisionGraphView`

## Export
```ts
// index.ts
export { MitigatorOverlay } from '@visix/mitigator';
```

## Preview
```bash
pnpm dev --entry playground/mitigator-preview.tsx
```

## Commit
```bash
git commit -m "release(mitigator): standalone release v1.0.0"
``` 