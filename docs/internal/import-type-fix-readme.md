# 🧼 Import Type Fix – Codemod

## Obiettivo
Convertire tutti gli `import type` usati come **valori** (es. `myFn()`, `new MyClass()`) in `import` standard.

## Codemod usato
- 📄 `scripts/codemods/fix-import-type-ast.ts`  
- 🔍 Analizza ogni file TypeScript (`.ts`, `.tsx`)
- ✔️ Identifica `type-only imports` usati nel runtime
- 🔁 Converte `import type { X }` → `import { X }`

## Report
- 📄 `docs/build/import-type-fixes.json`: report machine-readable
- 📝 `docs/build/import-type-fixes.md`: changelog leggibile

## Statistiche
- ✅ File modificati: **365**
- ✅ Fix totali: **748**
- ✅ Data: `2024-03-21`

## Come usare il codemod

1. Esegui il fix:
```bash
pnpm run fix:imports:ast
```

2. Genera il changelog:
```bash
pnpm run changelog:imports
```

## Note tecniche
- Il codemod usa l'AST di TypeScript per analizzare accuratamente l'uso degli import
- Vengono considerati solo gli import usati come valori nel runtime
- Il report JSON può essere usato per analisi future o integrazione con altri tool 