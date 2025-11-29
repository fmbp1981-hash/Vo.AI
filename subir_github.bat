@echo off
echo ==========================================
echo   Subindo Projeto para o GitHub - Vo.AI
echo ==========================================
echo.
echo Este script vai te ajudar a enviar o codigo para o GitHub.
echo Voce precisa ter criado um repositorio VAZIO no GitHub antes.
echo.
set /p REPO_URL="Cole a URL do seu repositorio GitHub (ex: https://github.com/seu-usuario/vo-ai.git): "

if "%REPO_URL%"=="" (
    echo.
    echo Erro: URL nao pode ser vazia.
    pause
    exit /b
)

echo.
echo Adicionando origem remota...
git remote add origin %REPO_URL% || git remote set-url origin %REPO_URL%

echo.
echo Renomeando branch principal para main...
git branch -M main

echo.
echo Enviando arquivos...
git push -u origin main

echo.
echo ==========================================
if %ERRORLEVEL% EQU 0 (
    echo   SUCESSO! Projeto enviado para o GitHub.
) else (
    echo   ERRO! Verifique se voce tem permissao ou se a URL esta correta.
)
echo ==========================================
pause
