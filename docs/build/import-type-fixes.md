# 📦 Import Type Fixes – Changelog

> Questo changelog è stato generato automaticamente da `generate-import-fix-changelog.ts`

Totale file modificati: **1**
Totale fix applicati: **1**

## 🔧 E:\cline-main\src\utils\validation.ts
- [riga 1] **anthropicModels** usati come valore:
  - 🔸 `// import { anthropicModels } from "../shared/api.js"
// import type { ModelInfo } from '../types/models.js'
import type { anthropicModels } from "../shared/api.js";`
  - 🔹 `// import { anthropicModels } from "../shared/api.js"
// import { ModelInfo } from '../types/models.js'
import type { anthropicModels } from "../shared/api.js";`

