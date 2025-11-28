# 🎯 SISTEMA COMPLETO DE FOLLOW-UPS - 4 FLUXOS

## ✅ IMPLEMENTADO COM SUCESSO!

Sistema completo de follow-ups automáticos conforme especificação do cliente, com 4 fluxos distintos e integrados.

---

## 📋 FLUXOS IMPLEMENTADOS

### **FLUXO 1: Follow-ups de Não Resposta** ⏰
Gatilho: Lead sem responder mensagens

**Sequência:**
1. **2 horas** sem resposta → Mensagem amigável relembrando
2. **4 horas** sem resposta → Segunda tentativa com incentivo
3. **1 dia** sem resposta → Terceira tentativa com proposta
4. **2 dias** sem resposta → Última mensagem educada
5. **3 dias** sem resposta → **ATENDIMENTO ENCERRADO AUTOMATICAMENTE**

**Resultado:** Lead marcado como "Perdido" com motivo "Sem resposta após 3 dias"

**Comportamento:** Se o lead entrar em contato novamente, um NOVO atendimento é aberto automaticamente.

---

### **FLUXO 2: Reativação de Leads Inativos** 🔄
Gatilho: Lead parado em algum estágio (exceto Fechado/Perdido)

**Sequência:**
1. **30 dias** de inatividade → Mensagem de reativação
2. **45 dias** de inatividade → Segunda tentativa de reativação

**Objetivo:** Reativar leads que pararam no meio do funil e tentar converter em venda.

---

### **FLUXO 3: Lembretes de Viagem** ✈️
Gatilho: Lead com estágio "Fechado" e data de partida definida

**Sequência:**
1. **7 dias antes** da partida → Checklist completo (considera viagem nacional/internacional)
2. **1 dia antes** da partida → Últimas verificações
3. **No dia** da partida → Mensagem de boa viagem

**Diferenciação:**
- **Nacional:** RG/CNH, cartões, vouchers
- **Internacional:** Passaporte, vacinas, seguro viagem, chip internacional, moeda estrangeira

---

### **FLUXO 4: Feedback Pós-Viagem** 💙
Gatilho: 2 dias após a data de retorno

**Ação:** Envio de mensagem solicitando feedback sobre:
- Como foi a viagem
- Qualidade dos serviços contratados
- Avaliação do atendimento AGIR
- Se recomendaria os serviços
- Interesse em nova viagem

---

### **FLUXO ESPECIAL: Confirmação de Fechamento** 🎉
Gatilho: IMEDIATAMENTE quando lead passa para estágio "Fechado"

**Ação:** Envio automático via WhatsApp + Email com:
- Resumo completo da viagem
- Destino, datas, pessoas, valor
- Links de documentos (proposta PDF, roteiro)
- Alertas sobre documentação (nacional vs internacional)
- Aviso sobre lembretes futuros

---

## 🗂️ ESTRUTURA DO BANCO DE DADOS

### Campos Adicionados ao Model `Lead`:

```prisma
// Tipo de viagem (para diferenciar lembretes)
tipoViagem String? @default("nacional") // nacional, internacional

// Controle de follow-ups enviados
followUp2hEnviado    Boolean @default(false)
followUp4hEnviado    Boolean @default(false)
followUp1dEnviado    Boolean @default(false)
followUp2dEnviado    Boolean @default(false)
followUp30dEnviado   Boolean @default(false)
followUp45dEnviado   Boolean @default(false)

// Controle de lembretes de viagem
lembrete7dEnviado    Boolean @default(false)
lembrete1dEnviado    Boolean @default(false)
lembreteDiaEnviado   Boolean @default(false)

// Controle de feedback
feedbackEnviado      Boolean @default(false)

// Confirmação de fechamento
confirmacaoEnviada   Boolean @default(false)
```

### Novo Model `FollowUp`:

```prisma
model FollowUp {
  id           String   @id @default(cuid())
  leadId       String
  type         String   // Tipo do follow-up
  message      String   // Conteúdo da mensagem
  channel      String   // whatsapp, email, both
  status       String   @default("pending") // pending, sent, failed
  scheduledFor DateTime // Quando deve ser enviado
  sentAt       DateTime?
  errorMessage String?
  metadata     String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  lead Lead @relation(fields: [leadId], references: [id], onDelete: Cascade)
  
  @@map("follow_ups")
  @@index([leadId])
  @@index([scheduledFor])
  @@index([status])
}
```

---

## 🔧 ARQUIVOS IMPLEMENTADOS

### 1. **Service Principal:** `src/lib/followUpService.ts`

Contém toda a lógica dos 4 fluxos:
- `processNoResponseFollowUps()` - Fluxo 1
- `processInactivityReactivation()` - Fluxo 2
- `processTravelReminders()` - Fluxo 3
- `processFeedbackRequests()` - Fluxo 4
- `sendClosureConfirmation()` - Fluxo Especial
- `processAll()` - Executa todos os processamentos

### 2. **Trigger Automático:** `src/app/api/leads/[id]/route.ts`

Modificado para disparar automaticamente a confirmação quando:
```typescript
if (estagio === 'Fechado' && existingLead.estagio !== 'Fechado') {
  await followUpService.sendClosureConfirmation(id)
}
```

---

## 🚀 COMO USAR

### **Automático (Recomendado):**

Configure um **cron job** para executar a cada hora:

```bash
# Cron expression: a cada hora
0 * * * *
```

**Endpoint:** `GET /api/follow-ups`

Isso processará automaticamente todos os follow-ups pendentes.

### **Manual (Para testes):**

```bash
# Processar todos os follow-ups
curl http://localhost:3000/api/follow-ups

# Enviar confirmação específica
curl -X POST http://localhost:3000/api/follow-ups \
  -H "Content-Type: application/json" \
  -d '{"leadId": "abc123", "action": "send_closure_confirmation"}'
```

### **Programático:**

```typescript
import followUpService from '@/lib/followUpService'

// Processar tudo
await followUpService.processAll()

// Processar apenas um fluxo
await followUpService.processTravelReminders()

// Enviar confirmação manual
await followUpService.sendClosureConfirmation(leadId)
```

---

## 📊 MENSAGENS POR FLUXO

### Fluxo 1 - Exemplo (2h sem resposta):
```
Olá João! 👋

Notei que você nos procurou há pouco tempo sobre uma viagem para Paris. 
Estou aqui para ajudar! 🌍

Tem alguma dúvida que eu possa esclarecer? 
Posso criar um roteiro personalizado para você! ✈️
```

### Fluxo 2 - Exemplo (30d inativo):
```
Olá Maria! 🌴

Faz um tempo que não conversamos! 
Ainda está planejando aquela viagem para Cancún?

Temos novidades incríveis e promoções especiais! 
Que tal retomar nosso papo? 🎉✈️
```

### Fluxo 3 - Exemplo (7d antes - Internacional):
```
🎉 Pedro, faltam apenas 7 dias para sua viagem! 🎉

✅ *Checklist importante:*
🛂 Passaporte (validade mínima 6 meses)
💉 Vacinas obrigatórias
💳 Cartão internacional habilitado
🌐 Seguro viagem internacional
📱 Chip internacional ou roaming
📋 Vouchers e reservas impressos
💊 Medicamentos pessoais
🔌 Carregadores e adaptadores

Qualquer dúvida, estamos aqui! Boa viagem! ✈️🌍
```

### Fluxo 4 - Exemplo (Feedback):
```
Oi Ana! 🙋‍♀️

Espero que tenha aproveitado muito sua viagem para Roma! 🌟

Gostaria muito de saber como foi sua experiência:

1️⃣ Como foi a viagem em geral?
2️⃣ Os serviços contratados atenderam suas expectativas?
3️⃣ Como você avalia o atendimento da AGIR?
4️⃣ Recomendaria nossos serviços?

Seu feedback é muito importante para nós! 💙

E já pensando na próxima... tem algum destino em mente? 😉✈️
```

### Fluxo Especial - Confirmação de Fechamento:
```
🎉 *CONFIRMAÇÃO - AGIR Viagens* 🎉

Olá Carlos! Sua viagem está confirmada! ✈️

📋 *RESUMO:*
🌍 Destino: Dubai
📅 Partida: 15/12/2025
📅 Retorno: 22/12/2025
👥 Pessoas: 2 adultos + 1 criança

🛂 Viagem internacional - não esqueça seu passaporte!
📱 Em breve você receberá lembretes!

Equipe AGIR Viagens 💙
```

---

## ⚙️ CONFIGURAÇÃO DO CRON

### Vercel (Produção):

1. Criar `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/follow-ups",
      "schedule": "0 * * * *"
    }
  ]
}
```

### Local (Desenvolvimento):

Usar `node-cron`:

```typescript
import cron from 'node-cron'
import followUpService from '@/lib/followUpService'

// A cada hora
cron.schedule('0 * * * *', async () => {
  console.log('🔄 Executando follow-ups...')
  await followUpService.processAll()
})
```

---

## 🔌 PRÓXIMOS PASSOS PARA PRODUÇÃO

### 1. **Integração WhatsApp Business API**

Substituir em `followUpService.ts`:

```typescript
private async sendMessage(lead: any, message: string, channel: string) {
  if (channel === 'whatsapp' || channel === 'both') {
    await whatsappAPI.sendMessage(lead.telefoneNormalizado, message)
  }
  
  if (channel === 'email' || channel === 'both') {
    await emailService.sendEmail(lead.email, 'AGIR Viagens', message)
  }
}
```

### 2. **Integração Email (SendGrid/Mailgun)**

```typescript
import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

await sgMail.send({
  to: lead.email,
  from: 'contato@agirviagens.com.br',
  subject: 'Confirmação de Viagem - AGIR',
  text: message,
  html: messageHTML
})
```

### 3. **Deploy do Cron Job**

- Vercel: adicionar `vercel.json`
- AWS: usar CloudWatch Events + Lambda
- Google Cloud: usar Cloud Scheduler

---

## 📈 MÉTRICAS E MONITORING

### Monitorar:

1. **Taxa de Resposta por Follow-up**
   - Quantos leads respondem após cada follow-up
   - Qual follow-up tem melhor taxa

2. **Taxa de Reativação**
   - Quantos leads inativos voltam após 30d/45d

3. **Engajamento com Lembretes**
   - Quantos clientes abrem os lembretes de viagem

4. **NPS do Feedback**
   - Score médio de satisfação dos clientes

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [x] Schema Prisma atualizado com campos de follow-up
- [x] Model `FollowUp` criado
- [x] Service `followUpService.ts` implementado
- [x] Fluxo 1: Follow-ups de não resposta (2h, 4h, 1d, 2d, 3d)
- [x] Fluxo 2: Reativação de inativos (30d, 45d)
- [x] Fluxo 3: Lembretes de viagem (7d, 1d, dia)
- [x] Fluxo 4: Feedback pós-viagem (2d após retorno)
- [x] Fluxo Especial: Confirmação imediata ao fechar
- [x] Trigger automático no update de lead
- [x] Diferenciação nacional/internacional
- [x] Campo `tipoViagem` no CRM
- [ ] Integração WhatsApp Business API (próximo passo)
- [ ] Integração Email SendGrid/Mailgun (próximo passo)
- [ ] Configuração de Cron Job em produção (próximo passo)
- [ ] Dashboard de métricas de follow-up (futuro)

---

## 🎉 RESULTADO FINAL

Sistema robusto e completo de follow-ups que:

✅ Reduz perda de leads por falta de resposta  
✅ Reativa leads inativos automaticamente  
✅ Garante experiência premium com lembretes personalizados  
✅ Coleta feedback valioso para melhoria contínua  
✅ Automatiza comunicação em momentos-chave  
✅ Diferencia viagens nacionais e internacionais  
✅ Executa sem intervenção humana (quando integrado com cron)

**Status:** ✅ **PRONTO PARA TESTES E INTEGRAÇÃO COM APIs EXTERNAS**

---

## 📞 SUPORTE

Para dúvidas sobre implementação:
- Verificar logs em `/api/follow-ups`
- Consultar tabela `follow_ups` no banco
- Revisar campos `followUp*Enviado` nos leads
