@echo off
echo ==========================================
echo   Enviando correcoes para o GitHub
echo ==========================================
echo.
echo Adicionando arquivos...
git add .

echo.
echo Commitando alteracoes...
git commit -m "Fix Vercel build errors: syntax fixes in chat, activities, and itinerary components"

echo.
echo Enviando para o GitHub...
git push origin main

echo.
echo ==========================================
if %ERRORLEVEL% EQU 0 (
    echo   SUCESSO! Correcoes enviadas. O Vercel deve iniciar o build automaticamente.
) else (
    echo   ERRO! Verifique as mensagens acima.
)
echo ==========================================
pause
