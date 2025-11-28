@echo off
chcp 65001 >nul
echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║        🚀 VO.AI - EXECUÇÃO AUTOMÁTICA MVP                    ║
echo ║        Preparando ambiente para desenvolvimento...            ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

echo [1/8] Criando diretórios necessários...
mkdir "src\app\api\propostas\[id]\track" 2>nul
mkdir "src\app\api\propostas\[id]\sign" 2>nul
mkdir "src\app\api\roteiros\generate" 2>nul
mkdir "src\lib" 2>nul
mkdir "src\components\itinerary" 2>nul
mkdir "src\components\dashboard" 2>nul
mkdir "src\components\chat" 2>nul
echo ✅ Diretórios criados!
echo.

echo [2/8] Instalando dependências NPM...
call npm install pdfkit @types/pdfkit socket.io-client openai
echo ✅ Dependências instaladas!
echo.

echo [3/8] Verificando PostgreSQL...
call npm run db:check
echo.

echo [4/8] Sincronizando Prisma...
call npx prisma generate
call npx prisma db push
echo ✅ Database atualizado!
echo.

echo [5/8] Verificando variáveis de ambiente...
if not exist ".env" (
    echo ⚠️  Arquivo .env não encontrado!
    echo Copie .env.example para .env e configure:
    echo   - DATABASE_URL
    echo   - OPENAI_API_KEY
    echo   - WHATSAPP_API_TOKEN
    pause
) else (
    echo ✅ .env encontrado!
)
echo.

echo [6/8] Testando build...
call npm run build
echo.

echo [7/8] Checklist Manual:
echo.
echo    📋 ANTES DE EXECUTAR, VERIFIQUE:
echo    [ ] .env configurado corretamente
echo    [ ] PostgreSQL rodando
echo    [ ] Redis rodando (opcional mas recomendado)
echo    [ ] OpenAI API Key válida
echo    [ ] WhatsApp Business API configurada
echo.

echo [8/8] PRONTO PARA DESENVOLVIMENTO!
echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║  🎯 PRÓXIMOS PASSOS:                                         ║
echo ║                                                               ║
echo ║  1. Leia: IMPLEMENTACAO_COMPLETA_MVP_PENDENTE.md             ║
echo ║  2. Execute: npm run dev                                      ║
echo ║  3. Acesse: http://localhost:3000                            ║
echo ║  4. Teste cada funcionalidade do checklist                   ║
echo ║                                                               ║
echo ║  📝 Documentos importantes:                                  ║
echo ║     - IMPLEMENTACAO_COMPLETA_MVP_PENDENTE.md                 ║
echo ║     - ROADMAP_PRD_IMPLEMENTACAO.md                           ║
echo ║     - README.md                                               ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

echo Deseja iniciar o servidor agora? (S/N)
set /p resposta=

if /i "%resposta%"=="S" (
    echo.
    echo 🚀 Iniciando servidor de desenvolvimento...
    echo.
    call npm run dev
) else (
    echo.
    echo 👍 Ok! Execute 'npm run dev' quando estiver pronto.
    echo.
)

pause
