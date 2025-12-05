@echo off
REM Script para executar testes E2E no Windows
REM Uso: test-e2e.bat [headed|ui]

echo ================================
echo  Vo.AI - Testes End-to-End
echo ================================
echo.

REM Verificar se node_modules existe
if not exist "node_modules" (
    echo [ERRO] node_modules não encontrado!
    echo Execute 'npm install' primeiro.
    exit /b 1
)

REM Verificar se Playwright está instalado
if not exist "node_modules\.bin\playwright.cmd" (
    echo [AVISO] Playwright não encontrado. Instalando...
    call npm install -D @playwright/test
    call npm run test:install
)

REM Verificar se a aplicação está rodando
echo Verificando se aplicação está rodando em localhost:3000...
powershell -Command "$response = try { Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 3 } catch { $null }; if ($response) { exit 0 } else { exit 1 }"

if errorlevel 1 (
    echo.
    echo [AVISO] Aplicação NÃO está rodando!
    echo.
    echo Por favor, inicie a aplicação primeiro:
    echo   npm run dev
    echo.
    echo Aguardando 5 segundos...
    timeout /t 5 /nobreak >nul
    
    REM Tentar novamente
    powershell -Command "$response = try { Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 3 } catch { $null }; if ($response) { exit 0 } else { exit 1 }"
    
    if errorlevel 1 (
        echo [ERRO] Aplicação ainda não está rodando. Abortando.
        exit /b 1
    )
)

echo [OK] Aplicação está rodando!
echo.

REM Determinar modo de execução
set MODE=%1

if "%MODE%"=="headed" (
    echo Executando testes em modo HEADED (browser visível)...
    call npm run test:e2e:headed
) else if "%MODE%"=="ui" (
    echo Abrindo Playwright UI...
    call npm run test:e2e:ui
) else (
    echo Executando testes em modo HEADLESS...
    call npm run test:e2e
)

if errorlevel 1 (
    echo.
    echo [ERRO] Testes falharam!
    exit /b 1
)

echo.
echo ================================
echo  Testes concluídos com sucesso!
echo ================================
echo.
echo Para ver o relatório:
echo   npm run test:e2e:report
echo.

exit /b 0
