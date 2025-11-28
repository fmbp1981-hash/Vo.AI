# 🚀 INSTRUÇÕES DE SETUP - Vo.AI

## Status: Pronto para Iniciar! 🎯

O projeto está em **80% de conclusão**. Vamos completar a configuração básica.

---

## ⚡ SETUP RÁPIDO (5 minutos)

### 1️⃣ Instalar Dependências
```bash
cd C:\Users\Dell\Downloads\Vo.AI
npm install
```

### 2️⃣ Configurar OpenAI API Key
Edite o arquivo `.env` e adicione sua chave:
```env
OPENAI_API_KEY="sk-sua-chave-aqui"
```

### 3️⃣ Criar Banco de Dados
```bash
npx prisma generate
npx prisma db push
```

### 4️⃣ Iniciar Aplicação
```bash
npm run dev
```

Acesse: **http://localhost:3000**

---

## 📋 PRIORIDADES DE IMPLEMENTAÇÃO

### ✅ JÁ IMPLEMENTADO (80%)
1. **CRM Kanban** - Drag & drop completo
2. **OpenAI GPT-4** - Backend pronto
3. **Frontend** - Interface completa
4. **Schema Database** - Prisma configurado
5. **APIs REST** - 10+ endpoints

### ⏳ PRÓXIMAS PRIORIDADES

#### **PRIORIDADE 1: Finalizar Database (30min)**
- ✅ Schema Prisma configurado
- ✅ SQLite para desenvolvimento rápido
- ⏳ Popular com dados de teste
- ⏳ Criar seed script

#### **PRIORIDADE 2: Conectar APIs Backend (1h)**
- ⏳ Testar rotas /api/leads
- ⏳ Testar rotas /api/chat
- ⏳ Testar rotas /api/roteiros
- ⏳ Validar persistência

#### **PRIORIDADE 3: Socket.io Real-Time (2h)**
- ⏳ Criar /pages/api/socket.ts
- ⏳ Configurar servidor WebSocket
- ⏳ Testar notificações

#### **PRIORIDADE 4: WhatsApp Integration (2h)**
- ⏳ Configurar Evolution API
- ⏳ Webhook handler
- ⏳ Testar envio/recebimento

#### **PRIORIDADE 5: PDF Propostas (3h)**
- ⏳ Template profissional
- ⏳ Geração com @react-pdf/renderer
- ⏳ Download automático

---

## 🧪 TESTAR FUNCIONALIDADES

### CRM Kanban
```
URL: http://localhost:3000/crm
Teste: Arrastar cards entre colunas
```

### Chat IA
```
URL: http://localhost:3000/chat
Teste: Enviar mensagem "Quero viajar para Paris"
```

### Gerador de Roteiros
```
URL: http://localhost:3000/roteiros
Teste: Preencher formulário e gerar
```

---

## 🛠️ COMANDOS ÚTEIS

```bash
# Desenvolvimento
npm run dev

# Build produção
npm run build
npm start

# Database
npx prisma studio        # Interface visual do banco
npx prisma db push      # Atualizar schema
npx prisma generate     # Gerar client

# Lint
npm run lint
```

---

## 📦 DEPENDÊNCIAS NECESSÁRIAS

### Já Instaladas ✅
- Next.js 15
- Prisma ORM
- OpenAI SDK
- @dnd-kit (drag & drop)
- Framer Motion
- Radix UI

### A Instalar (Conforme Necessidade)
```bash
# Socket.io (real-time)
npm install socket.io socket.io-client

# MFA (autenticação 2FA)
npm install otpauth qrcode

# Redis (cache - opcional)
npm install ioredis
```

---

## 🔐 VARIÁVEIS DE AMBIENTE (.env)

```env
# Database
DATABASE_URL="file:./dev.db"

# OpenAI (OBRIGATÓRIO)
OPENAI_API_KEY="sk-..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="seu-secret-aqui"

# WhatsApp (Opcional)
EVOLUTION_API_URL="..."
EVOLUTION_API_KEY="..."
```

---

## 🎯 PRÓXIMOS PASSOS SUGERIDOS

1. **AGORA** - Instalar dependências e rodar aplicação
2. **HOJE** - Testar todas as rotas de API
3. **AMANHÃ** - Implementar Socket.io para real-time
4. **ESTA SEMANA** - WhatsApp + PDF Proposals

---

## 📞 SUPORTE

Se encontrar problemas:
1. Verifique se o `.env` está configurado
2. Certifique-se que `npm install` foi executado
3. Execute `npx prisma generate`
4. Reinicie o servidor

**Status:** Pronto para continuar! 🚀
