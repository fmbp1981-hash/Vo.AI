# 🚀 SETUP RÁPIDO - Vo.AI

**Tempo estimado:** 30 minutos  
**Última atualização:** 18/11/2025

---

## ✅ Pré-requisitos

- [x] Node.js 18+ instalado
- [x] Git instalado
- [x] Conta GitHub (opcional)
- [x] Editor de código (VS Code recomendado)

---

## 📦 1. Instalar Dependências

```bash
cd C:\Users\Dell\Downloads\Vo.AI

# Instalar todas as dependências
npm install

# Instalar dependências NOVAS (críticas)
npm install openai ioredis axios

# Instalar tipos (dev)
npm install -D @types/ioredis
```

---

## 🔑 2. Configurar Variáveis de Ambiente

### Criar arquivo .env

```bash
# Copiar template
copy .env.example .env

# Editar .env no VS Code ou Notepad
code .env
```

### Configurações MÍNIMAS para desenvolvimento local:

```env
# Database (SQLite para dev local - OK para testar)
DATABASE_URL="file:./dev.db"

# OpenAI (OBRIGATÓRIO para chat IA)
OPENAI_API_KEY="sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxx"

# NextAuth (gerar secret)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="seu-secret-aqui-use-openssl-rand-base64-32"

# Redis (OPCIONAL para dev - usar quando tiver)
# REDIS_URL="redis://localhost:6379"

# WhatsApp (OPCIONAL - configurar depois)
# EVOLUTION_API_URL="https://sua-instancia.com"
# EVOLUTION_API_KEY="sua-chave"
```

### Gerar NEXTAUTH_SECRET:

**Windows (PowerShell):**
```powershell
# Método 1: Node
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Método 2: Manual
# Use qualquer string longa e aleatória (32+ caracteres)
```

### Obter OPENAI_API_KEY:

```
1. Acesse: https://platform.openai.com/api-keys
2. Faça login/cadastro
3. Click "Create new secret key"
4. Nome: "Vo.AI Development"
5. Copie a chave (começa com sk-proj-...)
6. Cole no .env
```

---

## 🗄️ 3. Setup Database

### Opção A: SQLite (Desenvolvimento Local) - RÁPIDO

```bash
# Gerar client Prisma
npm run db:generate

# Criar tabelas
npm run db:push

# Pronto! Banco criado em prisma/dev.db
```

### Opção B: PostgreSQL (Produção) - RECOMENDADO

Ver: `IMPLEMENTACAO_04_POSTGRESQL_REDIS.md`

```bash
# 1. Criar conta Supabase: https://supabase.com
# 2. Novo projeto → Copiar DATABASE_URL
# 3. Atualizar .env
# 4. Rodar migrations
npm run db:push
```

---

## 🚀 4. Iniciar Aplicação

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Aplicação rodando em:
# http://localhost:3000
```

---

## 🧪 5. Testar Funcionalidades

### A. Testar Interface

```
http://localhost:3000/          - Dashboard
http://localhost:3000/crm       - CRM Kanban (drag & drop!)
http://localhost:3000/chat      - Chat Interface
http://localhost:3000/roteiros  - Gerador de Roteiros
http://localhost:3000/propostas - Propostas
```

### B. Testar API Chat (OpenAI)

```bash
# Windows PowerShell
Invoke-RestMethod -Uri "http://localhost:3000/api/chat" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"message":"Olá! Quero viajar para Paris"}'

# Ou use Postman/Insomnia
POST http://localhost:3000/api/chat
Content-Type: application/json

{
  "message": "Quero viajar para Paris em julho"
}
```

**Response esperado:**
```json
{
  "success": true,
  "data": {
    "message": "Olá! Que maravilha que você quer conhecer Paris! 🗼...",
    "conversationId": "..."
  }
}
```

### C. Testar Drag & Drop

```
1. Acesse: http://localhost:3000/crm
2. Arraste um card de "Novos Leads" para "Qualificação"
3. Veja o toast de confirmação
4. Recarregue a página - mudança persiste!
```

---

## 🔧 6. Comandos Úteis

```bash
# Ver banco de dados visualmente
npm run db:studio
# Abre em: http://localhost:5555

# Gerar tipos Prisma (após mudar schema)
npm run db:generate

# Reset database (CUIDADO: apaga tudo)
npm run db:reset

# Build para produção
npm run build

# Rodar produção localmente
npm run start
```

---

## 🐛 7. Troubleshooting

### Erro: "Cannot find module 'openai'"
```bash
npm install openai
```

### Erro: "Invalid API key"
```
1. Verifique .env tem OPENAI_API_KEY correto
2. Chave começa com sk-proj- ou sk-...
3. Reinicie npm run dev após alterar .env
```

### Erro: "Prisma Client not generated"
```bash
npm run db:generate
```

### Erro: "Port 3000 already in use"
```bash
# Windows - matar processo na porta 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Ou mudar porta
$env:PORT=3001; npm run dev
```

### Banco de dados vazio / sem leads
```bash
# Opção 1: Criar lead pela UI
# Vá em /crm e clique "Novo Lead"

# Opção 2: Via API
POST http://localhost:3000/api/leads
{
  "nome": "João Silva",
  "email": "joao@example.com",
  "telefone": "11999999999",
  "destino": "Paris"
}
```

---

## 📚 8. Próximos Passos

### Agora você pode:

✅ **Explorar a interface** - Todas as páginas funcionais  
✅ **Testar drag & drop** - CRM Kanban funcionando  
✅ **Conversar com IA** - Chat GPT-4 respondendo  
✅ **Criar leads** - CRUD completo  

### Para produção (fazer depois):

⏳ **Migrar para PostgreSQL** - Ver IMPLEMENTACAO_04  
⏳ **Configurar Redis** - Cache e rate limiting  
⏳ **Setup WhatsApp** - Ver IMPLEMENTACAO_03  
⏳ **Deploy** - Vercel + Supabase  

---

## 📖 Documentação Disponível

```
ANALISE_PRD_vs_IMPLEMENTACAO.md    - Comparação completa PRD
IMPLEMENTACAO_01_DRAG_DROP.md      - Drag & drop CRM
IMPLEMENTACAO_02_OPENAI_GPT4.md    - Integração OpenAI
IMPLEMENTACAO_03_WHATSAPP_API.md   - WhatsApp Business
IMPLEMENTACAO_04_POSTGRESQL_REDIS.md - PostgreSQL + Redis
STATUS_PROJETO.md                   - Status geral
RESUMO_FINAL_DIA.md                - Resumo do dia
```

---

## ⚡ Setup Expresso (5 minutos)

Se já tem tudo instalado:

```bash
# 1. Instalar
npm install openai ioredis axios -D @types/ioredis

# 2. Criar .env (copie template)
copy .env.example .env

# 3. Editar .env - adicione:
#    OPENAI_API_KEY=sk-proj-xxx
#    NEXTAUTH_SECRET=qualquer-string-longa

# 4. Setup database
npm run db:generate
npm run db:push

# 5. Rodar!
npm run dev

# 6. Abrir: http://localhost:3000
```

---

## 🎯 Testar Rapidamente

```bash
# Terminal 1: Rodar app
npm run dev

# Terminal 2: Testar API
curl -X POST http://localhost:3000/api/chat `
  -H "Content-Type: application/json" `
  -d '{"message":"Olá"}'

# Navegador: Testar UI
http://localhost:3000/crm
```

---

## 💡 Dicas

- 💾 **Salvar sempre:** Ctrl+S no VS Code
- 🔄 **Reiniciar dev:** Ctrl+C e npm run dev
- 🗄️ **Ver banco:** npm run db:studio
- 📝 **Logs:** Verifique o terminal do npm run dev
- 🐛 **Debug:** Use console.log() e veja logs

---

## 🆘 Precisa de Ajuda?

### Logs
```bash
# Ver logs detalhados
npm run dev

# Procure por:
# ✅ - Sucesso
# ⚠️  - Warning
# ❌ - Erro
```

### Resetar tudo
```bash
# Limpar node_modules e reinstalar
rm -rf node_modules package-lock.json
npm install

# Resetar banco
npm run db:reset
```

---

**🎉 Pronto! Aplicação rodando com sucesso!**

Abra http://localhost:3000 e explore o sistema! 🚀
