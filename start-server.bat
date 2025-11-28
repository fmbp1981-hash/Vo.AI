@echo off
echo ========================================
echo Iniciando Vo.AI Server
echo ========================================
echo.

cd /d "%~dp0"

echo [1/2] Criando diretorios necessarios...
mkdir "src\app\api\proposals\generate" 2>nul
mkdir "src\app\api\proposals\[id]" 2>nul
mkdir "src\lib" 2>nul

echo.
echo [2/2] Iniciando servidor de desenvolvimento...
echo.
echo O projeto estara disponivel em: http://localhost:3000
echo Pressione Ctrl+C para parar o servidor
echo.

npm run dev

pause
