# 🗺️ ROADMAP DE CONTINUAÇÃO - Vo.AI
## Implementação por Ordem de Prioridade

**Status Atual:** 80% MVP Completo  
**Objetivo:** Atingir 100% MVP em 2 semanas

---

## 🎯 VISÃO GERAL DAS PRIORIDADES

```
PRIORIDADE 1 (CRÍTICO) → Database + Core APIs
PRIORIDADE 2 (ALTA)    → Real-time + Notificações  
PRIORIDADE 3 (ALTA)    → WhatsApp Integration
PRIORIDADE 4 (MÉDIA)   → PDF Propostas + Tracking
PRIORIDADE 5 (MÉDIA)   → MFA + Segurança Avançada
PRIORIDADE 6 (BAIXA)   → Automações + Refinamentos
```

---

## 📋 PRIORIDADE 1: FOUNDATION (CRÍTICO)
**Status:** 95% - Falta apenas testar  
**Tempo:** 2-3 horas  
**Impacto:** ⭐⭐⭐⭐⭐ (Bloqueia tudo)

### ✅ Já Implementado:
- Schema Prisma completo
- APIs REST (leads, chat, roteiros, propostas)
- OpenAI integration
- Redis cache structure
- Rate limiting

### ⏳ Falta Completar:

#### 1.1 Verificar e Testar Database
```bash
# Executar
cd C:\Users\Dell\Downloads\Vo.AI
npm install
npm run db:setup
npm run dev

# Testar no browser
http://localhost:3000
```

**Checklist:**
- [ ] Database criada (dev.db)
- [ ] 5 leads de exemplo carregados
- [ ] 2 usuários criados (admin, consultor)
- [ ] APIs respondendo corretamente

#### 1.2 Validar OpenAI Integration
```bash
# Teste manual via Postman ou curl
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Olá!"}'
```

**Checklist:**
- [ ] OPENAI_API_KEY configurada no .env
- [ ] Chat responde corretamente
- [ ] Roteiros são gerados (<10s)
- [ ] Cache Redis funciona (opcional)

---

## 📋 PRIORIDADE 2: REAL-TIME & NOTIFICATIONS
**Status:** 70% - Código pronto, falta integrar  
**Tempo:** 4-6 horas  
**Impacto:** ⭐⭐⭐⭐ (UX crítico)

### O que implementar:

#### 2.1 Socket.io Server (2h)
**Arquivo:** `src/app/api/socket/route.ts`

```typescript
import { Server } from 'socket.io'
import { NextApiRequest } from 'next'
import { Server as HTTPServer } from 'http'

export const config = {
  api: {
    bodyParser: false,
  },
}

let io: Server

export default function handler(req: NextApiRequest, res: any) {
  if (!io) {
    const httpServer: HTTPServer = res.socket.server
    io = new Server(httpServer, {
      path: '/api/socket',
      addTrailingSlash: false,
    })

    io.on('connection', (socket) => {
      console.log('✅ Client connected:', socket.id)

      // Join rooms
      socket.on('join', ({ userId, role }) => {
        socket.join(`user:${userId}`)
        socket.join(`role:${role}`)
      })

      // Lead updates
      socket.on('lead:update', (data) => {
        io.to(`role:consultant`).emit('lead:updated', data)
      })

      // Chat messages
      socket.on('chat:message', (data) => {
        io.to(`lead:${data.leadId}`).emit('chat:new-message', data)
      })

      socket.on('disconnect', () => {
        console.log('❌ Client disconnected:', socket.id)
      })
    })
  }

  res.end()
}
```

#### 2.2 Notification Center Component (2h)
**Arquivo:** `src/components/notification-center.tsx`

```typescript
import { useEffect, useState } from 'react'
import { useSocket } from '@/hooks/use-socket'
import { Bell } from 'lucide-react'

export function NotificationCenter({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<any[]>([])
  const { socket, isConnected } = useSocket()

  useEffect(() => {
    if (!socket) return

    socket.on('notification', (data) => {
      setNotifications(prev => [data, ...prev].slice(0, 10))
    })

    return () => {
      socket.off('notification')
    }
  }, [socket])

  return (
    <div className="relative">
      <Bell className="w-5 h-5" />
      {notifications.length > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
          {notifications.length}
        </span>
      )}
    </div>
  )
}
```

#### 2.3 Update APIs to Emit Events (1h)
Modificar APIs para emitir eventos Socket.io:

```typescript
// Em /api/leads/[id]/route.ts (PUT)
import { getSocketIO } from '@/lib/socket'

// Após atualizar lead
const io = getSocketIO()
io.to('role:consultant').emit('lead:updated', updatedLead)
```

**Checklist:**
- [ ] Socket.io server configurado
- [ ] useSocket hook criado
- [ ] Notification center implementado
- [ ] APIs emitindo eventos
- [ ] Teste com 2 navegadores

---

## 📋 PRIORIDADE 3: WHATSAPP INTEGRATION
**Status:** 85% - Biblioteca pronta, falta deploy  
**Tempo:** 3-4 horas  
**Impacto:** ⭐⭐⭐⭐ (Canal principal)

### 3.1 Setup Evolution API (1h)

**Opção A: Cloud (Recomendado)**
```bash
# 1. Contratar serviço
https://evolution-api.com

# 2. Configurar .env
EVOLUTION_API_URL="https://sua-instancia.evolution-api.com"
EVOLUTION_API_KEY="sua-chave"
EVOLUTION_INSTANCE_NAME="voai-agir"
```

**Opção B: Self-Hosted (Docker)**
```bash
# Clone e execute
git clone https://github.com/EvolutionAPI/evolution-api
cd evolution-api
docker-compose up -d
```

### 3.2 Connect WhatsApp (30min)
```bash
# 1. Acessar painel Evolution API
# 2. Criar instância "voai-agir"
# 3. Escanear QR Code com WhatsApp Business
# 4. Configurar webhook
```

### 3.3 Webhook Handler (1h)
**Arquivo:** `src/app/api/webhooks/whatsapp/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { generateChatCompletion } from '@/lib/openai'
import { sendWhatsAppMessage } from '@/lib/whatsapp'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  const data = await request.json()

  // Message received from WhatsApp
  if (data.event === 'messages.upsert') {
    const message = data.data.messages[0]
    
    if (message.key.fromMe) return NextResponse.json({ ok: true })

    const phone = message.key.remoteJid.split('@')[0]
    const text = message.message?.conversation || 
                 message.message?.extendedTextMessage?.text

    // Find or create lead
    let lead = await db.lead.findFirst({
      where: { telefoneNormalizado: phone }
    })

    if (!lead) {
      lead = await db.lead.create({
        data: {
          nome: message.pushName || 'Novo Lead',
          telefone: phone,
          telefoneNormalizado: phone,
          canal: 'WhatsApp',
          status: 'Novo Lead',
          estagio: 'Novo Lead',
        }
      })
    }

    // Generate AI response
    const response = await generateChatCompletion({
      messages: [{ role: 'user', content: text }],
      leadContext: lead,
    })

    // Send response
    await sendWhatsAppMessage({
      to: phone,
      message: response.content,
    })

    // Save conversation
    await db.conversation.create({
      data: {
        leadId: lead.id,
        channel: 'whatsapp',
        messages: JSON.stringify([
          { role: 'user', content: text, timestamp: new Date() },
          { role: 'assistant', content: response.content, timestamp: new Date() }
        ]),
        status: response.needsHandover ? 'waiting' : 'active',
      }
    })

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ ok: true })
}
```

### 3.4 Test End-to-End (30min)
**Checklist:**
- [ ] QR Code escaneado
- [ ] Enviar "Olá" via WhatsApp
- [ ] IA responde automaticamente
- [ ] Lead criado no CRM
- [ ] Conversa salva no banco

---

## 📋 PRIORIDADE 4: PDF PROPOSALS
**Status:** 40% - Estrutura básica  
**Tempo:** 3-4 horas  
**Impacto:** ⭐⭐⭐ (Importante mas não bloqueante)

### 4.1 PDF Generator (2h)
**Arquivo:** `src/lib/pdf-generator.ts`

Usar @react-pdf/renderer já instalado:

```typescript
import React from 'react'
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 30 },
  header: { fontSize: 24, marginBottom: 20, color: '#00D9FF' },
  section: { marginBottom: 10 },
})

export const ProposalPDF = ({ data }: any) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text>AGIR Viagens - Proposta Comercial</Text>
      </View>
      <View style={styles.section}>
        <Text>Cliente: {data.leadName}</Text>
        <Text>Destino: {data.destination}</Text>
        <Text>Período: {data.period}</Text>
        <Text>Valor: {data.totalValue}</Text>
      </View>
    </Page>
  </Document>
)
```

### 4.2 Generate on API (1h)
**Arquivo:** `src/app/api/propostas/[id]/pdf/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateProposalPDF } from '@/lib/pdf-generator'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const proposal = await db.proposal.findUnique({
    where: { id: params.id },
    include: { lead: true, user: true }
  })

  if (!proposal) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const pdfBuffer = await generateProposalPDF(proposal)

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="proposta-${proposal.id}.pdf"`,
    },
  })
}
```

**Checklist:**
- [ ] PDF gerado com design profissional
- [ ] Inclui logo AGIR
- [ ] Dados dinâmicos preenchidos
- [ ] Download funcionando

---

## 📋 PRIORIDADE 5: MFA & SECURITY
**Status:** 80% - Código pronto  
**Tempo:** 2-3 horas  
**Impacto:** ⭐⭐⭐ (Segurança importante)

### 5.1 MFA Setup API (1h)
Criar rotas:
- POST /api/auth/mfa/setup
- POST /api/auth/mfa/verify
- POST /api/auth/mfa/disable

### 5.2 Login Flow Integration (1h)
Modificar fluxo NextAuth para exigir MFA após senha correta.

### 5.3 Backup Codes (30min)
Implementar geração e uso de códigos de backup.

---

## 📋 PRIORIDADE 6: AUTOMATIONS
**Status:** 20% - Conceito definido  
**Tempo:** 6-8 horas  
**Impacto:** ⭐⭐ (Nice to have)

### 6.1 Follow-up Automático
- Emails/WhatsApp automáticos após X dias sem resposta
- Lembretes de reunião
- Aniversário do cliente

### 6.2 Lead Scoring Automático
- Algoritmo de pontuação baseado em engajamento
- Auto-qualificação de leads

### 6.3 Workflow Automation
- Mover lead automaticamente após proposta aceita
- Criar tarefas automáticas para consultores

---

## 🎯 CRONOGRAMA SUGERIDO

### Semana 1 (Agora - 24 Nov)
- ✅ Dia 1-2: PRIORIDADE 1 (Foundation)
- ⏳ Dia 3-4: PRIORIDADE 2 (Real-time)
- ⏳ Dia 5: PRIORIDADE 3 (WhatsApp)

### Semana 2 (25 Nov - 1 Dez)
- ⏳ Dia 1-2: PRIORIDADE 4 (PDF)
- ⏳ Dia 3: PRIORIDADE 5 (MFA)
- ⏳ Dia 4-5: Testes e refinamentos

### Semana 3 (2-8 Dez)
- ⏳ PRIORIDADE 6 (Automations)
- ⏳ Deploy em staging
- ⏳ Treinamento equipe

### Semana 4 (9-15 Dez)
- ⏳ Deploy em produção
- ⏳ Monitoramento
- ⏳ Ajustes finais

---

## 📊 MÉTRICAS DE SUCESSO

### Technical
- [ ] 100% das APIs funcionando
- [ ] Tempo de resposta < 2s
- [ ] Uptime > 99%
- [ ] 0 erros críticos

### Business
- [ ] 10+ roteiros gerados
- [ ] 50+ conversas processadas
- [ ] 5+ propostas enviadas
- [ ] >70% satisfação

---

## 🚀 COMEÇAR AGORA

```bash
# 1. Instalar
cd C:\Users\Dell\Downloads\Vo.AI
npm install

# 2. Configurar .env
# Adicione sua OPENAI_API_KEY

# 3. Setup database
npm run db:setup

# 4. Iniciar
npm run dev

# 5. Testar
node verificar-instalacao.js
```

**Próxima ação:** Execute os comandos acima! 🎯
