# Script di pulizia forzata per repository Git
# Da eseguire come amministratore

Write-Host "🔍 Inizio pulizia repository..." -ForegroundColor Cyan

# Rimuovi file di lock
if (Test-Path .git\index.lock) {
    Remove-Item -Force .git\index.lock
    Write-Host "🗑️ Rimosso .git/index.lock" -ForegroundColor Green
}

# Rimuovi directory problematiche
$problematicDirs = @(
    ".changeset",
    "examples",
    "docs/tools",
    "build"
)

foreach ($dir in $problematicDirs) {
    if (Test-Path $dir) {
        Remove-Item -Force -Recurse -Path $dir -ErrorAction SilentlyContinue
        Write-Host "🗑️ Rimosso $dir" -ForegroundColor Green
    }
}

# Reset Git
git reset --hard HEAD
Write-Host "🔄 Reset Git completato" -ForegroundColor Green

Write-Host "✅ Pulizia completata!" -ForegroundColor Cyan 