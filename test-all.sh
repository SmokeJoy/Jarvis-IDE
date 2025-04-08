#!/bin/bash

# Colori per output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 Avvio pipeline di test...${NC}"

# 1. Installazione dipendenze
echo -e "\n${GREEN}📦 Installazione dipendenze...${NC}"
pnpm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Errore nell'installazione delle dipendenze${NC}"
    exit 1
fi

# 2. Build TypeScript
echo -e "\n${GREEN}🔨 Compilazione TypeScript...${NC}"
pnpm tsc
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Errore nella compilazione TypeScript${NC}"
    exit 1
fi

# 3. Build frontend
echo -e "\n${GREEN}🏗️ Build frontend...${NC}"
pnpm build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Errore nel build frontend${NC}"
    exit 1
fi

# 4. Test unitari con coverage
echo -e "\n${GREEN}🧪 Esecuzione test unitari...${NC}"
pnpm vitest run --coverage
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Errore nei test unitari${NC}"
    exit 1
fi

# 5. Test HTTP
echo -e "\n${GREEN}🌐 Test HTTP...${NC}"
# Avvia il server in background
pnpm ts-node src/services/mcp/run-server.ts &
SERVER_PID=$!

# Attendi che il server sia pronto
sleep 2

# Esegui i test HTTP
curl -X POST http://localhost:3030/tools/call \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "context.navigate",
    "args": {
      "startId": "ctx-123",
      "targetId": "ctx-789",
      "mode": "hybrid",
      "strategy": {
        "semanticThreshold": 0.6,
        "maxExploratorySteps": 3,
        "minSemanticScore": 0.7
      }
    }
  }'

# Termina il server
kill $SERVER_PID

echo -e "\n${GREEN}✅ Pipeline completata con successo!${NC}" 