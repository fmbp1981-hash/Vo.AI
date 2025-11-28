# 🚀 GUIA DE INSTALAÇÃO - Vo.AI

## Status Atual: 80% MVP Completo ✅

---

## ⚡ INSTALAÇÃO RÁPIDA (10 minutos)

### Passo 1: Instalar Dependências
```bash
cd C:\Users\Dell\Downloads\Vo.AI
npm install
```

### Passo 2: Configurar OpenAI (OBRIGATÓRIO)
Edite o arquivo `.env` e adicione sua API Key:
```env
OPENAI_API_KEY="sk-proj-sua-chave-aqui"
```

**Como obter:**
1. Acesse: https://platform.openai.com/api-keys
2. Crie uma nova chave
3. Cole no arquivo `.env`

### Passo 3: Configurar Database
```bash
npm run db:setup
```

Este comando irá:
- ✅ Gerar Prisma Client
- ✅ Criar database SQLite
- ✅ Popular com dados de exemplo

### Passo 4: Iniciar Aplicação
```bash
npm run dev
```

Acesse: **http://localhost:3000**

---

## 👤 USUÁRIOS DE TESTE

### Admin
- **Email:** admin@agir.com
- **Senha:** admin123

### Consultor
- **Email:** consultor@agir.com
- **Senha:** consultor123

---

## 🧪 TESTAR FUNCIONALIDADES

### 1. Dashboard Principal
```
URL: http://localhost:3000
```
Visualize métricas gerais, KPIs e atividades recentes.

### 2. CRM Kanban
```
URL: http://localhost:3000/crm
```
- Veja 5 leads de exemplo
- Arraste cards entre colunas
- Clique em um card para ver detalhes

### 3. Chat IA
```
URL: http://localhost:3000/chat
```
**Testes sugeridos:**
- "Quero viajar para Paris em julho"
- "Qual o melhor destino para lua de mel?"
- "Preciso falar com um consultor"

### 4. Gerador de Roteiros
```
URL: http://localhost:3000/roteiros
```
Preencha o formulário e clique em "Gerar Roteiro com IA"

### 5. Propostas
```
URL: http://localhost:3000/propostas
```
Veja proposta de exemplo criada para João Santos

---

## 📋 VERIFICAR INSTALAÇÃO

Execute os comandos abaixo para verificar se tudo está funcionando:

```bash
# Verificar se o servidor está rodando
curl http://localhost:3000/api

# Testar API de leads
curl http://localhost:3000/api/leads

# Testar chat (se OpenAI configurada)
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d "{\"message\":\"Olá!\"}"
```

---

## 🔧 RESOLUÇÃO DE PROBLEMAS

### Erro: "OPENAI_API_KEY is not set"
**Solução:** Configure a chave no arquivo `.env`

### Erro: "PrismaClient is unable to connect"
**Solução:** Execute `npm run db:setup` novamente

### Erro: "Module not found"
**Solução:** Execute `npm install` novamente

### Porta 3000 em uso
**Solução:** Altere a porta no comando:
```bash
next dev -p 3001
```

### Redis não conectado
**Nota:** Redis é opcional para desenvolvimento. O sistema funciona sem ele.

---

## 📦 PRÓXIMAS INSTALAÇÕES (Opcionais)

### Socket.io (Real-time)
```bash
npm install socket.io socket.io-client
```

### MFA (Autenticação 2FA)
```bash
npm install otpauth qrcode
npm install --save-dev @types/qrcode
```

### Redis (Cache)
```bash
npm install ioredis
npm install --save-dev @types/ioredis
```

---

## 🗄️ ESTRUTURA DO BANCO DE DADOS

### Tabelas Criadas:
- ✅ **users** - Usuários do sistema
- ✅ **leads** - Leads/clientes
- ✅ **conversations** - Conversas do chat
- ✅ **itineraries** - Roteiros gerados
- ✅ **proposals** - Propostas enviadas
- ✅ **activities** - Log de atividades

### Dados de Exemplo:
- 2 usuários (admin + consultor)
- 5 leads em diferentes estágios
- 1 conversa completa
- 1 roteiro para Paris
- 1 proposta enviada

---

## 🔑 VARIÁVEIS DE AMBIENTE

Verifique o arquivo `.env`:

```env
# Database (SQLite para dev, PostgreSQL para produção)
DATABASE_URL="file:./dev.db"

# OpenAI (OBRIGATÓRIO)
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4-turbo-preview"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="voai-secret..."

# Redis (Opcional)
# REDIS_URL="redis://localhost:6379"

# WhatsApp (Opcional)
# EVOLUTION_API_URL="..."
# EVOLUTION_API_KEY="..."
```

---

## 📊 FUNCIONALIDADES DISPONÍVEIS

### ✅ Implementado (80%)
- CRM Kanban com drag & drop
- Chat IA com GPT-4
- Geração de roteiros
- Dashboard de métricas
- Sistema de leads
- Conversas salvas
- Propostas básicas

### ⏳ Em Desenvolvimento (20%)
- Socket.io (real-time)
- MFA (2FA)
- WhatsApp Business API
- Geração de PDF
- Assinatura digital

---

## 🎯 PRÓXIMOS PASSOS

1. **HOJE**
   - Testar todas as funcionalidades
   - Verificar integração OpenAI
   - Explorar interface

2. **ESTA SEMANA**
   - Implementar Socket.io
   - Configurar WhatsApp
   - Gerar PDFs de propostas

3. **PRÓXIMO MÊS**
   - Deploy em produção
   - Treinar equipe
   - Primeiros clientes reais

---

## 📞 SUPORTE

Problemas? Verifique:
1. `.env` está configurado?
2. `node_modules` foi instalado?
3. `npm run db:setup` foi executado?
4. OpenAI API Key é válida?

**Status:** Sistema pronto para testes! 🎉
