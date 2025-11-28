@echo off
REM ========================================
REM Script de Finalização - Vo.AI MVP
REM ========================================

echo.
echo ========================================
echo    Finalizando Setup - Vo.AI MVP
echo ========================================
echo.

REM 1. Criar diretórios
echo [1/5] Criando estrutura de diretorios...
mkdir "src\app\api\itinerary\generate" 2>nul
mkdir "src\app\api\whatsapp\webhook" 2>nul
mkdir "src\app\api\whatsapp\send" 2>nul
mkdir "src\app\api\whatsapp\qrcode" 2>nul
mkdir "src\app\api\whatsapp\status" 2>nul
echo   ✓ Diretorios criados
echo.

REM 2. Criar API de Roteiros
echo [2/5] Criando API de Roteiros...
(
echo import { NextRequest, NextResponse } from 'next/server'
echo import { generateItinerary } from '@/lib/openai'
echo import { db } from '@/lib/db'
echo import { withRateLimit, rateLimitPresets } from '@/lib/rate-limit'
echo.
echo export async function POST^(request: NextRequest^) {
echo   return withRateLimit^(
echo     request,
echo     handleGenerateItinerary,
echo     rateLimitPresets.strict
echo   ^)
echo }
echo.
echo async function handleGenerateItinerary^(request: NextRequest^): Promise^<NextResponse^> {
echo   try {
echo     const body = await request.json^(^)
echo     const { destino, dataPartida, dataRetorno, orcamento, pessoas, perfil, preferencias, leadId } = body
echo.
echo     if ^(!destino ^|^| !dataPartida ^|^| !dataRetorno^) {
echo       return NextResponse.json^(
echo         { error: 'Destino e datas são obrigatórios' },
echo         { status: 400 }
echo       ^)
echo     }
echo.
echo     console.log^('🗺️ Generating itinerary for:', { destino, dataPartida, dataRetorno }^)
echo.
echo     const itinerary = await generateItinerary^({
echo       destino,
echo       dataPartida,
echo       dataRetorno,
echo       orcamento,
echo       pessoas: parseInt^(pessoas ^|^| '1'^),
echo       perfil,
echo       preferencias,
echo     }^)
echo.
echo     if ^(leadId^) {
echo       try {
echo         await db.itinerary.create^({
echo           data: {
echo             leadId,
echo             destino,
echo             dataInicio: new Date^(dataPartida^),
echo             dataFim: new Date^(dataRetorno^),
echo             dias: calculateDays^(dataPartida, dataRetorno^),
echo             orcamento,
echo             pessoas: parseInt^(pessoas ^|^| '1'^),
echo             conteudo: itinerary,
echo             status: 'rascunho',
echo           },
echo         }^)
echo       } catch ^(dbError^) {
echo         console.error^('⚠️ Error saving itinerary:', dbError^)
echo       }
echo     }
echo.
echo     return NextResponse.json^({
echo       success: true,
echo       data: {
echo         itinerary,
echo         estimatedCost: orcamento,
echo         duration: calculateDays^(dataPartida, dataRetorno^),
echo       },
echo     }^)
echo.
echo   } catch ^(error: any^) {
echo     console.error^('❌ Itinerary generation error:', error^)
echo     return NextResponse.json^(
echo       { error: 'Erro ao gerar roteiro' },
echo       { status: 500 }
echo     ^)
echo   }
echo }
echo.
echo function calculateDays^(dataPartida: string, dataRetorno: string^): number {
echo   const start = new Date^(dataPartida^)
echo   const end = new Date^(dataRetorno^)
echo   const diff = end.getTime^(^) - start.getTime^(^)
echo   return Math.ceil^(diff / ^(1000 * 60 * 60 * 24^)^)
echo }
) > "src\app\api\itinerary\generate\route.ts"
echo   ✓ API de Roteiros criada
echo.

REM 3. Criar APIs do WhatsApp
echo [3/5] Criando APIs do WhatsApp...

REM Webhook
(
echo import { NextRequest, NextResponse } from 'next/server'
echo import { processWhatsAppWebhook } from '@/lib/whatsapp'
echo.
echo export async function POST^(request: NextRequest^) {
echo   try {
echo     const body = await request.json^(^)
echo     const result = await processWhatsAppWebhook^(body^)
echo     return NextResponse.json^({ success: true, data: result }^)
echo   } catch ^(error: any^) {
echo     return NextResponse.json^({ error: 'Webhook failed' }, { status: 500 }^)
echo   }
echo }
) > "src\app\api\whatsapp\webhook\route.ts"

REM Send
(
echo import { NextRequest, NextResponse } from 'next/server'
echo import { sendWhatsAppMessage } from '@/lib/whatsapp'
echo.
echo export async function POST^(request: NextRequest^) {
echo   try {
echo     const { phone, message } = await request.json^(^)
echo     if ^(!phone ^|^| !message^) {
echo       return NextResponse.json^({ error: 'Phone and message required' }, { status: 400 }^)
echo     }
echo     const result = await sendWhatsAppMessage^(phone, message^)
echo     return NextResponse.json^({ success: true, data: result }^)
echo   } catch ^(error: any^) {
echo     return NextResponse.json^({ error: 'Send failed' }, { status: 500 }^)
echo   }
echo }
) > "src\app\api\whatsapp\send\route.ts"

REM QR Code
(
echo import { NextRequest, NextResponse } from 'next/server'
echo import { getWhatsAppQRCode } from '@/lib/whatsapp'
echo.
echo export async function GET^(request: NextRequest^) {
echo   try {
echo     const qrCode = await getWhatsAppQRCode^(^)
echo     return NextResponse.json^({ success: true, data: { qrCode } }^)
echo   } catch ^(error: any^) {
echo     return NextResponse.json^({ error: 'QR failed' }, { status: 500 }^)
echo   }
echo }
) > "src\app\api\whatsapp\qrcode\route.ts"

REM Status
(
echo import { NextRequest, NextResponse } from 'next/server'
echo import { getWhatsAppStatus } from '@/lib/whatsapp'
echo.
echo export async function GET^(request: NextRequest^) {
echo   try {
echo     const status = await getWhatsAppStatus^(^)
echo     return NextResponse.json^({ success: true, data: status }^)
echo   } catch ^(error: any^) {
echo     return NextResponse.json^({ error: 'Status failed' }, { status: 500 }^)
echo   }
echo }
) > "src\app\api\whatsapp\status\route.ts"

echo   ✓ APIs do WhatsApp criadas
echo.

REM 4. Verificar .env
echo [4/5] Verificando .env...
if not exist ".env" (
    echo   ⚠ Arquivo .env nao encontrado!
    echo   Copiando .env.example...
    copy ".env.example" ".env" >nul
    echo   ✓ Arquivo .env criado
    echo.
    echo   ⚠ IMPORTANTE: Edite o arquivo .env e adicione:
    echo      - OPENAI_API_KEY
    echo      - NEXTAUTH_SECRET
) else (
    echo   ✓ Arquivo .env existe
)
echo.

REM 5. Instalar dependências
echo [5/5] Instalando dependencias...
call npm install openai ioredis axios
echo   ✓ Dependencias instaladas
echo.

echo ========================================
echo    ✓ Setup Finalizado com Sucesso!
echo ========================================
echo.
echo Proximos passos:
echo   1. Edite o arquivo .env ^(se ainda nao fez^)
echo   2. npm run db:push
echo   3. npm run dev
echo   4. Acesse: http://localhost:3000
echo.
echo APIs criadas:
echo   • POST /api/itinerary/generate - Gerar roteiros
echo   • POST /api/whatsapp/webhook - Receber mensagens
echo   • POST /api/whatsapp/send - Enviar mensagens
echo   • GET  /api/whatsapp/qrcode - Obter QR code
echo   • GET  /api/whatsapp/status - Status da conexao
echo.
echo 🎉 Pronto para usar! 🚀
echo.
pause
