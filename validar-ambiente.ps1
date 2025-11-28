# Validação de Ambiente - Vo.AI MVP
# Execute: .\validar-ambiente.ps1

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   VO.AI - VALIDAÇÃO DE AMBIENTE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$erros = 0
$avisos = 0

# Verificar Node.js
Write-Host "[1/10] Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "  ✅ Node.js instalado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Node.js NÃO encontrado!" -ForegroundColor Red
    $erros++
}

# Verificar NPM
Write-Host "[2/10] Verificando NPM..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "  ✅ NPM instalado: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "  ❌ NPM NÃO encontrado!" -ForegroundColor Red
    $erros++
}

# Verificar package.json
Write-Host "[3/10] Verificando package.json..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    Write-Host "  ✅ package.json encontrado" -ForegroundColor Green
} else {
    Write-Host "  ❌ package.json NÃO encontrado!" -ForegroundColor Red
    $erros++
}

# Verificar node_modules
Write-Host "[4/10] Verificando dependências..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "  ✅ node_modules encontrado" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  node_modules NÃO encontrado. Execute: npm install" -ForegroundColor Yellow
    $avisos++
}

# Verificar .env
Write-Host "[5/10] Verificando .env..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "  ✅ .env encontrado" -ForegroundColor Green
    
    # Verificar variáveis críticas
    $envContent = Get-Content ".env" -Raw
    
    if ($envContent -match "DATABASE_URL=") {
        Write-Host "    ✅ DATABASE_URL configurado" -ForegroundColor Green
    } else {
        Write-Host "    ⚠️  DATABASE_URL faltando" -ForegroundColor Yellow
        $avisos++
    }
    
    if ($envContent -match "OPENAI_API_KEY=") {
        Write-Host "    ✅ OPENAI_API_KEY configurado" -ForegroundColor Green
    } else {
        Write-Host "    ⚠️  OPENAI_API_KEY faltando" -ForegroundColor Yellow
        $avisos++
    }
    
    if ($envContent -match "NEXT_PUBLIC_SUPABASE_URL=") {
        Write-Host "    ✅ SUPABASE_URL configurado" -ForegroundColor Green
    } else {
        Write-Host "    ⚠️  SUPABASE_URL faltando" -ForegroundColor Yellow
        $avisos++
    }
    
} else {
    Write-Host "  ❌ .env NÃO encontrado! Copie .env.example" -ForegroundColor Red
    $erros++
}

# Verificar Prisma
Write-Host "[6/10] Verificando Prisma..." -ForegroundColor Yellow
if (Test-Path "prisma/schema.prisma") {
    Write-Host "  ✅ schema.prisma encontrado" -ForegroundColor Green
} else {
    Write-Host "  ❌ schema.prisma NÃO encontrado!" -ForegroundColor Red
    $erros++
}

# Verificar diretórios críticos
Write-Host "[7/10] Verificando estrutura de diretórios..." -ForegroundColor Yellow
$diretorios = @(
    "src/app/api/leads",
    "src/app/api/propostas",
    "src/app/api/chat",
    "src/app/api/dashboard",
    "src/components"
)

foreach ($dir in $diretorios) {
    if (Test-Path $dir) {
        Write-Host "  ✅ $dir" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  $dir faltando" -ForegroundColor Yellow
        $avisos++
    }
}

# Verificar novos diretórios necessários
Write-Host "[8/10] Verificando diretórios novos..." -ForegroundColor Yellow
$novos = @(
    "src/app/api/propostas/[id]/track",
    "src/app/api/propostas/[id]/sign",
    "src/app/api/roteiros/generate",
    "src/lib",
    "src/components/dashboard",
    "src/components/chat",
    "src/components/itinerary"
)

$faltando = @()
foreach ($dir in $novos) {
    if (Test-Path $dir) {
        Write-Host "  ✅ $dir" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $dir FALTANDO" -ForegroundColor Red
        $faltando += $dir
    }
}

# Verificar dependências críticas
Write-Host "[9/10] Verificando dependências NPM..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    
    $deps = @("@dnd-kit/core", "socket.io-client", "openai", "pdfkit")
    foreach ($dep in $deps) {
        if ($packageJson.dependencies.$dep -or $packageJson.devDependencies.$dep) {
            Write-Host "  ✅ $dep" -ForegroundColor Green
        } else {
            Write-Host "  ❌ $dep FALTANDO" -ForegroundColor Red
            $avisos++
        }
    }
}

# Verificar Git
Write-Host "[10/10] Verificando Git..." -ForegroundColor Yellow
try {
    $gitVersion = git --version
    Write-Host "  ✅ Git instalado: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️  Git NÃO encontrado (necessário para GitHub)" -ForegroundColor Yellow
    $avisos++
}

# Resumo
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "           RESUMO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($erros -eq 0 -and $avisos -eq 0) {
    Write-Host "✅ TUDO OK! Ambiente pronto." -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximos passos:" -ForegroundColor Yellow
    Write-Host "  1. Copie os códigos de IMPLEMENTACAO_COMPLETA_MVP_PENDENTE.md"
    Write-Host "  2. Execute: npm run dev"
    Write-Host "  3. Acesse: http://localhost:3000"
} elseif ($erros -eq 0) {
    Write-Host "⚠️  Ambiente OK com avisos ($avisos)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Recomendações:" -ForegroundColor Yellow
    if ($avisos -gt 0) {
        Write-Host "  - Configure variáveis faltantes no .env"
        Write-Host "  - Execute: npm install"
        if ($faltando.Count -gt 0) {
            Write-Host "  - Crie os diretórios faltantes"
        }
    }
} else {
    Write-Host "❌ Ambiente com problemas ($erros erros, $avisos avisos)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Corrija os erros acima antes de continuar." -ForegroundColor Red
}

Write-Host ""

# Criar diretórios faltantes?
if ($faltando.Count -gt 0) {
    Write-Host ""
    Write-Host "Deseja criar os diretórios faltantes? (S/N)" -ForegroundColor Yellow
    $resposta = Read-Host
    
    if ($resposta -eq "S" -or $resposta -eq "s") {
        foreach ($dir in $faltando) {
            New-Item -Path $dir -ItemType Directory -Force | Out-Null
            Write-Host "  ✅ Criado: $dir" -ForegroundColor Green
        }
        Write-Host ""
        Write-Host "✅ Diretórios criados com sucesso!" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Pressione qualquer tecla para sair..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
