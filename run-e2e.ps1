# ===========================================
# Vo.AI - Script de Execução de Testes E2E
# ===========================================
# Execute este script para rodar os testes E2E

param(
    [switch]$Setup,
    [switch]$Headed,
    [string]$Test = ""
)

Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║           Vo.AI - Testes E2E com Playwright              ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Verificar arquivos de ambiente
$envFile = ".env.test"
$envFallback = ".env"

if (-not (Test-Path $envFile) -and -not (Test-Path $envFallback)) {
    Write-Host "❌ ERRO: Nenhum arquivo de ambiente encontrado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor, crie um arquivo .env.test ou .env com:" -ForegroundColor Yellow
    Write-Host "  DATABASE_URL=postgresql://..." -ForegroundColor Gray
    Write-Host "  NEXTAUTH_URL=http://localhost:3000" -ForegroundColor Gray
    Write-Host "  NEXTAUTH_SECRET=sua-chave-secreta-32-chars" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Copie de .env.example:" -ForegroundColor Yellow
    Write-Host "  Copy-Item .env.example .env" -ForegroundColor White
    exit 1
}

# Verificar DATABASE_URL
$envContent = if (Test-Path $envFile) { Get-Content $envFile -Raw } else { Get-Content $envFallback -Raw }
if ($envContent -notmatch 'DATABASE_URL\s*=\s*"?postgresql://[^"]+') {
    Write-Host "⚠️  AVISO: DATABASE_URL não parece estar configurado corretamente!" -ForegroundColor Yellow
    Write-Host "   Verifique seu arquivo de ambiente." -ForegroundColor Gray
    Write-Host ""
}

# Verificar se o servidor está rodando
Write-Host "🔍 Verificando servidor de desenvolvimento..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Servidor está rodando em http://localhost:3000" -ForegroundColor Green
} catch {
    Write-Host "❌ Servidor não está rodando!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Inicie o servidor em outro terminal:" -ForegroundColor Yellow
    Write-Host "  npm run dev" -ForegroundColor White
    Write-Host ""
    Write-Host "Ou deixe o Playwright iniciar automaticamente (pode demorar)" -ForegroundColor Gray
}

Write-Host ""

# Setup mode
if ($Setup) {
    Write-Host "📦 Instalando dependências do Playwright..." -ForegroundColor Cyan
    npx playwright install chromium
    Write-Host "✅ Setup concluído!" -ForegroundColor Green
    exit 0
}

# Build test command
$testCmd = "npx playwright test"

if ($Test) {
    $testCmd += " $Test"
}

$testCmd += " --project=chromium"

if ($Headed) {
    $testCmd += " --headed"
}

$testCmd += " --reporter=list"

Write-Host "🧪 Executando: $testCmd" -ForegroundColor Cyan
Write-Host ""

# Execute tests
Invoke-Expression $testCmd

$exitCode = $LASTEXITCODE

Write-Host ""
if ($exitCode -eq 0) {
    Write-Host "✅ Todos os testes passaram!" -ForegroundColor Green
} else {
    Write-Host "❌ Alguns testes falharam (exit code: $exitCode)" -ForegroundColor Red
    Write-Host ""
    Write-Host "📊 Para ver o relatório HTML:" -ForegroundColor Yellow
    Write-Host "   npx playwright show-report" -ForegroundColor White
}

exit $exitCode
