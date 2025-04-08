# Pipeline di test MCP

Write-Host "[START] Avvio pipeline di test..."

# 1. Installazione dipendenze
Write-Host "`n[INSTALL] Installazione dipendenze..."
pnpm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Errore nell'installazione delle dipendenze"
    exit 1
}

# 2. Build TypeScript
Write-Host "`n[BUILD] Compilazione TypeScript..."
pnpm tsc
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Errore nella compilazione TypeScript"
    exit 1
}

# 3. Build frontend
Write-Host "`n[BUILD] Build frontend..."
pnpm build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Errore nel build frontend"
    exit 1
}

# 4. Test unitari con coverage
Write-Host "`n[TEST] Esecuzione test unitari..."
pnpm vitest run --coverage
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Errore nei test unitari"
    exit 1
}

# 5. Test HTTP
Write-Host "`n[HTTP] Test HTTP..."
# Avvia il server in background
$serverJob = Start-Job -ScriptBlock {
    pnpm ts-node src/services/mcp/run-server.ts
}

# Attendi che il server sia pronto
Start-Sleep -Seconds 2

# Esegui i test HTTP
$body = @{
    tool = "context.navigate"
    args = @{
        startId = "ctx-123"
        targetId = "ctx-789"
        mode = "hybrid"
        strategy = @{
            semanticThreshold = 0.6
            maxExploratorySteps = 3
            minSemanticScore = 0.7
        }
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3030/tools/call" -Method Post -Body $body -ContentType "application/json"

# Termina il server
Stop-Job -Job $serverJob
Remove-Job -Job $serverJob

Write-Host "`n[SUCCESS] Pipeline completata con successo!" 