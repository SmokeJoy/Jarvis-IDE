# 🧠 Debugger v2.0.0 – Rilascio ufficiale

## Feature incluse
- Decision Graph interattivo (con export)
- Timeline filtrabile con snapshot e replay
- Predictive Fallback + badge in tempo reale
- Sparkline trend (success rate provider)

## Componenti principali
- `DecisionGraphView.tsx`
- `PredictiveWarningPanel.tsx`
- `SparklineChart.tsx`
- `usePredictiveWarnings.ts`, `useProviderSeries.ts`

## Commit
```
release(debugger): debugger v2.0.0 with predictive sparkline
```

## Note
- Animazioni Framer Motion
- Stato provider visualizzato nel grafo
- Logging su EventBus tracciato per replay e prediction 