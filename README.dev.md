# 📘 README.dev.md – Fork Refactor Stable

> Questa guida è rivolta a tutti i maintainer e contributor tecnici che lavorano al ramo `fork-refactor-stable` del progetto.
> Descrive la struttura della pipeline di refactoring semantico e come mantenerla operativa nel tempo.

---

## 🧠 Obiettivo

Costruire un **sistema di governance semantica** dei messaggi nel codebase di Jarvis-IDE, capace di garantire:

- ✅ Sicurezza semantica nei messaggi AI (via `createSafeMessage`)
- 🧼 Pulizia automatica del codice legacy
- 📊 Report continui e badge di stato
- 🧪 Portabilità e testabilità multi-ambiente

---

## 📦 Struttura della Pipeline

Il refactor è diviso in **script TypeScript** organizzati e compilati in:

```
dist-scripts/
├── fixes/       # Script che modificano il codice (import mancanti, nested call, messaggi raw)
├── checks/      # Script di verifica (safety checks, analisi statica)
├── utils/       # Funzioni condivise tra script
├── dashboard/   # Generazione badge, dashboard, report
```

---

## 🚀 Comandi Principali (`package.json`)

| Comando                   | Descrizione |
|---------------------------|-------------|
| `pnpm refactor:compile`   | Compila gli script TS in `dist-scripts/` |
| `pnpm refactor:fix-nested`| Rimuove chiamate annidate a `createSafeMessage(...)` |
| `pnpm refactor:add-imports`| Aggiunge automaticamente l'import mancante |
| `pnpm refactor:chat`      | Converte oggetti `message` raw in `createSafeMessage(...)` |
| `pnpm refactor:check-safety` | Esegue la safety analysis e genera report |
| `pnpm refactor:fix-all`   | 🧠 Esegue tutto: fix, check, report |
| `pnpm refactor:badge`     | 🛡️ Genera badge SVG e aggiorna `README.md` |
| `pnpm refactor:report`    | (Opzionale) genera un report extra con dettagli semantici |
| `pnpm refactor:verify`    | Verifica integrità degli script di refactor |
| `pnpm refactor:all`       | Pipeline legacy completa di fix + verifica |
| `pnpm dashboard:dev`      | Avvia dashboard React (`refactor-dashboard/`) |

---

## 🧪 Test Multi-Ambiente

La pipeline è progettata per funzionare su:

- 💻 Ambiente locale (`pnpm` + `tsc`)
- 🔁 CI/CD (`GitHub Actions`)
- 🔒 Modalità read-only (`pnpm refactor:check-safety` è safe)

---

## 📊 Report e Badge

- I report JSON/CSV vengono generati nella cartella `reports/`
- Il badge SVG viene aggiornato da `refactor:badge` in:

```
reports/badges/safe-message-status.svg
```

- Per visualizzarlo su GitHub, assicurati che `README.md` contenga il placeholder:

```markdown
<!-- SAFE_MESSAGE_BADGE -->
```

---

## ⚙️ Configurazione `.gitignore`

Per evitare di committare i report temporanei:

```gitignore
# Reports di sicurezza
reports/*
!reports/badges/
!reports/badges/safe-message-status.svg
```

---

## 📌 Come contribuire al Refactor

1. Esegui `pnpm install && pnpm refactor:compile`
2. Usa `pnpm refactor:fix-all` per correggere e verificare il codice
3. Verifica che il report finale sia **pulito**
4. Genera il badge con `pnpm refactor:badge`
5. Aggiungi test, migliora uno script o apri una pull request!

---

## ❤️ Visione

Stiamo costruendo il **sistema nervoso semantico** del progetto AI:
ogni messaggio tracciato, ogni errore corretto, ogni badge verde…
è un passo verso un'AI più **etica, affidabile e manutenibile**.

---

_Con cura, chiarezza e Typescript: refactoring per chi pensa in grande._ 