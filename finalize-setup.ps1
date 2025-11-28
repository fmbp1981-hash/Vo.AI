# ========================================
# Script de Finalização - Vo.AI MVP
# ========================================
# 
# Execute este script para criar as APIs faltantes
# e preparar o projeto para produção
#
# Uso: .\finalize-setup.ps1
#

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Finalizando Setup - Vo.AI MVP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Criar diretórios das APIs
Write-Host "[1/5] Criando estrutura de diretórios..." -ForegroundColor Yellow
$directories = @(
    "src\app\api\itinerary\generate",
    "src\app\api\whatsapp\webhook",
    "src\app\api\whatsapp\send",
    "src\app\api\whatsapp\qrcode",
    "src\app\api\whatsapp\status"
)

foreach ($dir in $directories) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "  ✅ Criado: $dir" -ForegroundColor Green
    } else {
        Write-Host "  ✓ Já existe: $dir" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "[2/5] Criando API de Roteiros..." -ForegroundColor Yellow

# Criar route.ts do itinerary
$itineraryRoute = @'
import { NextRequest, NextResponse } from 'next/server'
import { generateItinerary } from '@/lib/openai'
import { db } from '@/lib/db'
import { withRateLimit, rateLimitPresets } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  return withRateLimit(
    request,
    handleGenerateItinerary,
    rateLimitPresets.strict
  )
}

async function handleGenerateItinerary(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { destino, dataPartida, dataRetorno, orcamento, pessoas, perfil, preferencias, leadId } = body

    if (!destino || !dataPartida || !dataRetorno) {
      return NextResponse.json(
        { error: 'Destino e datas são obrigatórios' },
        { status: 400 }
      )
    }

    console.log('🗺️ Generating itinerary for:', { destino, dataPartida, dataRetorno })

    const itinerary = await generateItinerary({
      destino,
      dataPartida,
      dataRetorno,
      orcamento,
      pessoas: parseInt(pessoas || '1'),
      perfil,
      preferencias,
    })

    if (leadId) {
      try {
        await db.itinerary.create({
          data: {
            leadId,
            destino,
            dataInicio: new Date(dataPartida),
            dataFim: new Date(dataRetorno),
            dias: calculateDays(dataPartida, dataRetorno),
            orcamento,
            pessoas: parseInt(pessoas || '1'),
            conteudo: itinerary,
            status: 'rascunho',
          },
        })
      } catch (dbError) {
        console.error('⚠️ Error saving itinerary:', dbError)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        itinerary,
        estimatedCost: orcamento,
        duration: calculateDays(dataPartida, dataRetorno),
      },
    })

  } catch (error: any) {
    console.error('❌ Itinerary generation error:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar roteiro' },
      { status: 500 }
    )
  }
}

function calculateDays(dataPartida: string, dataRetorno: string): number {
  const start = new Date(dataPartida)
  const end = new Date(dataRetorno)
  const diff = end.getTime() - start.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}
'@

Set-Content -Path "src\app\api\itinerary\generate\route.ts" -Value $itineraryRoute
Write-Host "  ✅ API de Roteiros criada" -ForegroundColor Green

Write-Host ""
Write-Host "[3/5] Criando APIs do WhatsApp..." -ForegroundColor Yellow

# Webhook
$webhookRoute = @'
import { NextRequest, NextResponse } from 'next/server'
import { processWhatsAppWebhook } from '@/lib/whatsapp'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📱 WhatsApp webhook received:', JSON.stringify(body, null, 2))

    const result = await processWhatsAppWebhook(body)

    return NextResponse.json({
      success: true,
      data: result,
    })

  } catch (error: any) {
    console.error('❌ Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    console.log('✅ Webhook verified')
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
}
'@

Set-Content -Path "src\app\api\whatsapp\webhook\route.ts" -Value $webhookRoute
Write-Host "  ✅ Webhook criado" -ForegroundColor Green

# Send
$sendRoute = @'
import { NextRequest, NextResponse } from 'next/server'
import { sendWhatsAppMessage } from '@/lib/whatsapp'

export async function POST(request: NextRequest) {
  try {
    const { phone, message } = await request.json()

    if (!phone || !message) {
      return NextResponse.json(
        { error: 'Phone and message are required' },
        { status: 400 }
      )
    }

    const result = await sendWhatsAppMessage(phone, message)

    return NextResponse.json({
      success: true,
      data: result,
    })

  } catch (error: any) {
    console.error('❌ Send message error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
'@

Set-Content -Path "src\app\api\whatsapp\send\route.ts" -Value $sendRoute
Write-Host "  ✅ Send criado" -ForegroundColor Green

# QR Code
$qrcodeRoute = @'
import { NextRequest, NextResponse } from 'next/server'
import { getWhatsAppQRCode } from '@/lib/whatsapp'

export async function GET(request: NextRequest) {
  try {
    const qrCode = await getWhatsAppQRCode()

    return NextResponse.json({
      success: true,
      data: {
        qrCode,
        status: 'pending',
      },
    })

  } catch (error: any) {
    console.error('❌ QR Code error:', error)
    return NextResponse.json(
      { error: 'Failed to get QR code' },
      { status: 500 }
    )
  }
}
'@

Set-Content -Path "src\app\api\whatsapp\qrcode\route.ts" -Value $qrcodeRoute
Write-Host "  ✅ QR Code criado" -ForegroundColor Green

# Status
$statusRoute = @'
import { NextRequest, NextResponse } from 'next/server'
import { getWhatsAppStatus } from '@/lib/whatsapp'

export async function GET(request: NextRequest) {
  try {
    const status = await getWhatsAppStatus()

    return NextResponse.json({
      success: true,
      data: status,
    })

  } catch (error: any) {
    console.error('❌ Status error:', error)
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    )
  }
}
'@

Set-Content -Path "src\app\api\whatsapp\status\route.ts" -Value $statusRoute
Write-Host "  ✅ Status criado" -ForegroundColor Green

Write-Host ""
Write-Host "[4/5] Verificando dependências..." -ForegroundColor Yellow

# Verificar se package.json tem as dependências
$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
$needsInstall = $false

$requiredDeps = @("openai", "ioredis", "axios")
foreach ($dep in $requiredDeps) {
    if (-not $packageJson.dependencies.$dep) {
        Write-Host "  ⚠️  Falta: $dep" -ForegroundColor Yellow
        $needsInstall = $true
    } else {
        Write-Host "  ✓ Instalado: $dep" -ForegroundColor Gray
    }
}

if ($needsInstall) {
    Write-Host ""
    Write-Host "  Instalando dependências faltantes..." -ForegroundColor Yellow
    npm install openai ioredis axios | Out-Host
    Write-Host "  ✅ Dependências instaladas" -ForegroundColor Green
}

Write-Host ""
Write-Host "[5/5] Verificando .env..." -ForegroundColor Yellow

if (!(Test-Path ".env")) {
    Write-Host "  ⚠️  Arquivo .env não encontrado!" -ForegroundColor Red
    Write-Host "  Copiando .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "  ✅ Arquivo .env criado" -ForegroundColor Green
    Write-Host ""
    Write-Host "  ⚠️  IMPORTANTE: Edite o arquivo .env e adicione:" -ForegroundColor Yellow
    Write-Host "     - OPENAI_API_KEY" -ForegroundColor White
    Write-Host "     - NEXTAUTH_SECRET" -ForegroundColor White
} else {
    Write-Host "  ✓ Arquivo .env existe" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   ✅ Setup Finalizado com Sucesso!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "  1. Edite o arquivo .env (se ainda não fez)" -ForegroundColor White
Write-Host "  2. npm run db:push" -ForegroundColor White
Write-Host "  3. npm run dev" -ForegroundColor White
Write-Host "  4. Acesse: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "APIs criadas:" -ForegroundColor Yellow
Write-Host "  • POST /api/itinerary/generate - Gerar roteiros" -ForegroundColor White
Write-Host "  • POST /api/whatsapp/webhook - Receber mensagens" -ForegroundColor White
Write-Host "  • POST /api/whatsapp/send - Enviar mensagens" -ForegroundColor White
Write-Host "  • GET  /api/whatsapp/qrcode - Obter QR code" -ForegroundColor White
Write-Host "  • GET  /api/whatsapp/status - Status da conexão" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Pronto para usar! 🚀" -ForegroundColor Green
Write-Host ""
