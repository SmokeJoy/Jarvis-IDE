# 🔗 Tipi Condivisi

Questa cartella raccoglie tutte le definizioni di tipi centrali:
- Provider
- Eventi fallback
- Modelli
- Messaggi webview
- Impostazioni
- Metriche
- Telemetria
- Sistema multi-agente
- Utilità per i test

## Struttura

- `index.ts`: Punto di ingresso principale per tutti i tipi condivisi
- `provider.types.ts`: Tipi relativi ai provider LLM
- `api.types.ts`: Tipi per le API
- `fallback.types.ts`: Tipi per il sistema di fallback
- `webview.types.ts`: Tipi per la comunicazione con la webview
- `settings.types.ts`: Tipi per le impostazioni
- `metrics.types.ts`: Tipi per le metriche
- `telemetry.types.ts`: Tipi per la telemetria
- `mas.types.ts`: Tipi per il sistema multi-agente
- `test-utils.types.ts`: Tipi per i test

## Regole

✅ Ogni nuovo tipo deve essere esportato da `index.ts`
✅ Evitare duplicazioni di definizioni di tipi
✅ Mantenere la documentazione aggiornata
✅ Usare TypeScript strict mode
✅ Se un tipo viene usato da più di 2 moduli → centralizzarlo in questa cartella 