@echo off
echo ========================================
echo Habilitando Scripts e Executando Vo.AI
echo ========================================
echo.

echo [1/3] Habilitando execucao de scripts...
powershell -Command "Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force"

echo.
echo [2/3] Instalando dependencias...
cd /d "%~dp0"
call npm install

echo.
echo [3/3] Iniciando servidor de desenvolvimento...
echo.
echo O projeto estara disponivel em: http://localhost:3000
echo Pressione Ctrl+C para parar o servidor
echo.
call npm run dev

pause
