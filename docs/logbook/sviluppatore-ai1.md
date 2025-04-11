# Logbook Sviluppatore AI1

## 📅 2025-01-01
### Task Iniziati
- [x] Creazione branch `refactor/roadmap-ts-errors`
- [x] Documentazione roadmap in `docs/roadmap/2025_fix_errori.md`
- [ ] Correzione errori TS7006 in `src/core/webview/`

### Note
- Priorità assoluta: correzione errori TS7006 che bloccano la compilazione
- Da verificare: compatibilità con le dipendenze esistenti
- Da documentare: modifiche significative ai tipi

## 📝 Task in Corso
1. Correzione errori TS7006
   - File: `src/core/webview/JarvisProvider.ts`
   - File: `src/core/webview/__tests__/JarvisProvider.test.ts`
   - File: `src/core/webview/__tests__/testUtils.ts`

## 🔍 Prossimi Task
1. Fix esportazioni errate (TS2305, TS2459)
2. Implementazione dispatcher sicuro `Extract<T>`
3. Correzione tipi `never`, `unknown` 