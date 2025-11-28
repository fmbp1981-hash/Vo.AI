# 🚀 PRÓXIMOS PASSOS - COMANDOS PARA EXECUTAR

## ✅ O QUE FOI IMPLEMENTADO AGORA

1. ✅ Sistema completo de follow-ups (4 fluxos automáticos)
2. ✅ Confirmação automática ao fechar venda
3. ✅ Diferenciação nacional/internacional
4. ✅ Campo "Tipo de Viagem" no CRM
5. ✅ Documentação técnica completa

---

## 🔧 COMANDOS PARA EXECUTAR AGORA

### **1. Atualizar o Banco de Dados** (OBRIGATÓRIO)

```bash
cd C:\Users\Dell\Downloads\Vo.AI

# Gerar o Prisma Client atualizado
npx prisma generate

# Aplicar as mudanças no banco (adiciona campos de follow-up)
npx prisma db push

# Verificar se funcionou (abre interface visual do banco)
npx prisma studio
```

**O que isso faz:**
- Adiciona campo `tipoViagem` na tabela `leads`
- Adiciona 11 campos de controle de follow-ups (`followUp2hEnviado`, etc.)
- Cria a tabela `follow_ups` completa

---

### **2. Instalar Dependências Necessárias**

```bash
# date-fns para manipulação de datas (usado no followUpService)
npm install date-fns

# Se ainda não tiver:
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install framer-motion
npm install socket.io-client
```

---

### **3. Testar o Sistema de Follow-ups**

#### **Opção A: Criar um lead de teste e mover para "Fechado"**

1. Inicie o servidor:
```bash
npm run dev
```

2. Acesse: `http://localhost:3000/crm`

3. Crie um novo lead com:
   - Nome: "João Teste"
   - Destino: "Paris"
   - Data de Partida: (daqui a 7 dias)
   - Data de Retorno: (daqui a 14 dias)
   - **Tipo de Viagem:** Internacional

4. Arraste o lead para a coluna "Fechado"

5. Verifique o console do terminal - deve aparecer:
```
✅ Confirmação de fechamento enviada para João Teste
```

6. Abra Prisma Studio e verifique:
```bash
npx prisma studio
```
   - Tabela `leads` → campo `confirmacaoEnviada` deve estar `true`
   - Tabela `follow_ups` → deve ter um registro novo

---

#### **Opção B: Testar via API diretamente**

```bash
# Criar um endpoint de teste (opcional)
# Ou usar o console do navegador:
```

No console do navegador (F12):

```javascript
// Enviar confirmação para um lead específico
fetch('/api/follow-ups', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    leadId: 'SEU_LEAD_ID_AQUI',
    action: 'send_closure_confirmation'
  })
})
.then(r => r.json())
.then(console.log)

// Processar TODOS os follow-ups pendentes
fetch('/api/follow-ups')
.then(r => r.json())
.then(console.log)
```

---

### **4. Configurar Variáveis de Ambiente** (Se ainda não tiver)

Edite o arquivo `.env`:

```env
# Banco de Dados
DATABASE_URL="file:./dev.db"  # Para SQLite local
# ou
DATABASE_URL="postgresql://user:password@localhost:5432/voai"  # Para PostgreSQL

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="sua-chave-secreta-aqui"

# OpenAI (quando implementar)
OPENAI_API_KEY="sk-..."

# WhatsApp (quando implementar)
WHATSAPP_API_KEY="..."
WHATSAPP_PHONE_ID="..."

# Email (quando implementar)
SENDGRID_API_KEY="SG..."
EMAIL_FROM="contato@agirviagens.com.br"
```

---

## 📊 VERIFICAR SE ESTÁ FUNCIONANDO

### **Checklist de Validação:**

1. **Banco Atualizado?**
```bash
npx prisma studio
```
   - ✅ Tabela `leads` tem campo `tipoViagem`?
   - ✅ Tabela `leads` tem campos `followUp2hEnviado`, `followUp4hEnviado`, etc.?
   - ✅ Tabela `follow_ups` existe?

2. **UI Atualizada?**
   - Abra `http://localhost:3000/crm`
   - Clique em "Novo Lead"
   - ✅ Tem campo "Tipo de Viagem" com 🇧🇷 Nacional e 🌍 Internacional?

3. **Trigger Funcionando?**
   - Mova um lead para "Fechado"
   - ✅ Aparece log no console: `✅ Confirmação de fechamento enviada`?
   - ✅ Campo `confirmacaoEnviada` = true no banco?

---

## 🎯 PRÓXIMAS IMPLEMENTAÇÕES (EM ORDEM)

### **PRIORIDADE 1: OpenAI GPT-4 + Motor de Roteiros** (2 dias)

```bash
# Instalar dependências
npm install openai langchain
```

**Arquivos a criar:**
1. `src/lib/openaiService.ts` - Integração OpenAI
2. `src/lib/itineraryGenerator.ts` - Geração de roteiros
3. `src/app/api/roteiros/generate/route.ts` - Endpoint

**Funcionalidades:**
- Gerar roteiro em <10s
- Streaming de resposta
- Fallback GPT-3.5
- Cache de roteiros

---

### **PRIORIDADE 2: WhatsApp Business API** (2 dias)

```bash
# Instalar dependências
npm install twilio
# ou
npm install @messagebird/sdk
```

**Arquivos a modificar:**
1. `src/lib/followUpService.ts` - Implementar `sendMessage()` real
2. `src/lib/whatsappService.ts` - Novo service
3. `src/app/api/webhooks/whatsapp/route.ts` - Webhook

**Funcionalidades:**
- Enviar mensagens
- Receber mensagens (webhook)
- Templates aprovados
- Integrar com follow-ups

---

### **PRIORIDADE 3: PDF de Propostas** (1 dia)

```bash
# Instalar dependências
npm install puppeteer
# ou
npm install jspdf html2canvas
```

**Arquivos a criar:**
1. `src/lib/pdfGenerator.ts` - Geração de PDF
2. `src/app/api/propostas/[id]/pdf/route.ts` - Endpoint
3. `src/components/proposta-template.tsx` - Template

**Funcionalidades:**
- Gerar PDF brandizado
- Upload para storage
- Tracking de visualização
- Link de compartilhamento

---

## 🔄 CONFIGURAR CRON JOB (PARA FOLLOW-UPS AUTOMÁTICOS)

### **Opção 1: Vercel (Produção)**

Criar arquivo `vercel.json` na raiz:

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

**Isso executa o processamento de follow-ups A CADA HORA.**

---

### **Opção 2: Node-Cron (Local)**

Criar `src/lib/cron.ts`:

```typescript
import cron from 'node-cron'
import followUpService from '@/lib/followUpService'

export function setupCronJobs() {
  // A cada hora
  cron.schedule('0 * * * *', async () => {
    console.log('🔄 Executando follow-ups...')
    try {
      await followUpService.processAll()
      console.log('✅ Follow-ups processados!')
    } catch (error) {
      console.error('❌ Erro:', error)
    }
  })
}
```

Adicionar em `src/app/layout.tsx` ou criar endpoint separado.

---

## 📚 DOCUMENTAÇÃO CRIADA

Leia os seguintes arquivos para entender o que foi implementado:

1. **`FOLLOWUPS_COMPLETO_4_FLUXOS.md`**
   - Explicação detalhada dos 4 fluxos
   - Exemplos de mensagens
   - Como configurar cron job

2. **`RESUMO_IMPLEMENTACAO_FOLLOW_UPS.md`**
   - Resumo executivo
   - Arquivos modificados
   - Comandos rápidos

3. **`STATUS_IMPLEMENTACAO_COMPLETO_19NOV.md`**
   - Status geral do projeto
   - O que está pronto vs o que falta
   - Roadmap de 30 dias

---

## 🐛 TROUBLESHOOTING

### **Erro: "Cannot find module 'date-fns'"**
```bash
npm install date-fns
```

### **Erro: "Prisma Client não atualizado"**
```bash
npx prisma generate
```

### **Erro: "Tabela follow_ups não existe"**
```bash
npx prisma db push
```

### **Follow-ups não estão sendo enviados**
1. Verifique se o cron job está configurado
2. Execute manualmente: `GET /api/follow-ups`
3. Verifique logs do servidor

### **Confirmação não envia ao fechar lead**
1. Verifique console do servidor
2. Verifique se `followUpService` está importado corretamente
3. Teste manualmente:
```bash
curl -X POST http://localhost:3000/api/follow-ups \
  -H "Content-Type: application/json" \
  -d '{"leadId":"ID_DO_LEAD","action":"send_closure_confirmation"}'
```

---

## 🎯 RESUMO EXECUTIVO

### **O que você tem AGORA:**
✅ CRM Kanban funcional  
✅ Sistema de follow-ups completo (4 fluxos)  
✅ Trigger automático ao fechar venda  
✅ Dashboard com métricas  
✅ Chat básico  
✅ Autenticação  

### **O que falta para o MVP:**
⏳ Integração OpenAI GPT-4  
⏳ Integração WhatsApp Business API  
⏳ Geração de PDF de propostas  
⏳ Motor de roteirização com APIs externas  
⏳ Score automático de leads  

### **Tempo estimado para MVP completo:**
📅 **2-3 semanas** de desenvolvimento focado

---

## 📞 COMANDOS RÁPIDOS (COPIAR E COLAR)

```bash
# Atualizar banco
cd C:\Users\Dell\Downloads\Vo.AI
npx prisma generate && npx prisma db push

# Instalar dependências
npm install date-fns

# Iniciar servidor
npm run dev

# Ver banco de dados
npx prisma studio

# Testar follow-ups (via browser console em http://localhost:3000)
fetch('/api/follow-ups').then(r=>r.json()).then(console.log)
```

---

## ✅ CHECKLIST DE AÇÕES

- [ ] Executar `npx prisma db push`
- [ ] Instalar `date-fns`
- [ ] Testar criação de lead com tipo de viagem
- [ ] Testar mover lead para "Fechado"
- [ ] Verificar confirmação no console
- [ ] Abrir Prisma Studio e validar dados
- [ ] Ler documentação completa
- [ ] Decidir próxima prioridade (OpenAI ou WhatsApp)
- [ ] Configurar variáveis de ambiente para próxima integração

---

**IMPORTANTE:** 🔥  
Antes de continuar com novas features, execute os comandos acima para garantir que o sistema de follow-ups está funcionando 100%!

**Próximo comando mais importante:**
```bash
npx prisma db push
```

Boa sorte! 🚀
