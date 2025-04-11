#!/bin/bash

echo "🚀 Inizio correzione errori TypeScript"

# Fix per estensioni .js.js errate
echo "🔧 Correzione delle estensioni .js.js errate..."
grep -rl --exclude-dir=node_modules '.js.js' ./src ./webview-ui ./shared | xargs sed -i 's/\.js\.js/\.js/g'

# Crea lista di file con import type errati
echo "🔍 Identificazione degli import type utilizzati come valori..."
grep -r "import type" --include="*.ts" ./src ./webview-ui | grep -v "interface\|type\|enum" > /tmp/type-imports.txt

# Crea lista di file con import namespace problematici
echo "🔍 Identificazione degli import namespace problematici..."
grep -r "import \* as " --include="*.ts" ./src ./webview-ui | grep "express\|mocha\|chai" > /tmp/namespace-imports.txt

# Crea lista di accessi process.env con dot notation
echo "🔍 Identificazione degli accessi process.env con dot notation..."
grep -r "process.env\." --include="*.ts" ./src ./webview-ui > /tmp/process-env-dots.txt

# Trova parametri con tipi any impliciti
echo "🔍 Identificazione dei parametri con tipi any impliciti..."
grep -r "= *(" --include="*.ts" ./src ./webview-ui | grep -v ":\|interface\|type\|enum" > /tmp/implicit-any.txt

# Trova import di vscode come tipo ma usato come valore
echo "🔍 Identificazione degli import di vscode come tipo..."
grep -r "import type.*vscode" --include="*.ts" ./src ./webview-ui > /tmp/vscode-type-imports.txt

echo "✅ Scansione completata. File da analizzare:"
echo "📋 Problemi di import type: /tmp/type-imports.txt"
echo "📋 Problemi di import namespace: /tmp/namespace-imports.txt"
echo "📋 Problemi di process.env: /tmp/process-env-dots.txt"
echo "📋 Problemi di tipi any impliciti: /tmp/implicit-any.txt"
echo "📋 Problemi di import vscode: /tmp/vscode-type-imports.txt" 