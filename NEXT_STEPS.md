# 🚀 PRÓXIMOS PASSOS - Vo.AI

## 📌 O QUE FAZER AGORA (Ordem de Prioridade)

---

## 1️⃣ CONFIGURAR DATABASE (CRÍTICO - 1-2 horas)

### Opção A: PostgreSQL Local (Desenvolvimento)
```bash
# Instalar PostgreSQL no Windows
# Download: https://www.postgresql.org/download/windows/

# Após instalação, criar database
createdb voai_dev

# Configurar .env
DATABASE_URL="postgresql://postgres:sua_senha@localhost:5432/voai_dev"

# Executar migrations
cd C:\Users\Dell\Downloads\Vo.AI
npm run db:migrate
npm run db:seed
```

### Opção B: Supabase (Recomendado - Cloud)
```bash
# 1. Criar projeto em https://supabase.com (grátis)
# 2. Copiar Connection String
# 3. Adicionar ao .env
DATABASE_URL="postgresql://postgres:[senha]@db.xxx.supabase.co:5432/postgres"

# 4. Executar migrations
npm run db:migrate
npm run db:seed
```

---

## 2️⃣ CONFIGURAR REDIS (1 hora)

### Opção A: Redis Local
```bash
# Download Redis para Windows
# https://github.com/microsoftarchive/redis/releases

# Iniciar Redis
redis-server

# Configurar .env
REDIS_URL="redis://localhost:6379"
```

### Opção B: Upstash (Recomendado - Cloud Grátis)
```bash
# 1. Criar conta em https://upstash.com
# 2. Criar database Redis
# 3. Copiar URL e adicionar ao .env
REDIS_URL="rediss://default:[senha]@xxx.upstash.io:6379"
```

---

## 3️⃣ CONFIGURAR OPENAI API (30 minutos)

```bash
# 1. Criar conta em https://platform.openai.com
# 2. Gerar API Key
# 3. Adicionar ao .env

OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4-turbo-preview"
OPENAI_FALLBACK_MODEL="gpt-3.5-turbo"
```

### Testar integração:
```bash
# Criar arquivo test-openai.ts
cd C:\Users\Dell\Downloads\Vo.AI
node --loader ts-node/esm test-openai.ts
```

---

## 4️⃣ CONFIGURAR WHATSAPP API (1-2 horas)

### Opção Recomendada: Evolution API
```bash
# 1. Deploy Evolution API (Docker ou Cloud)
# https://github.com/EvolutionAPI/evolution-api

# 2. Configurar .env
EVOLUTION_API_URL="https://sua-instancia.evolution-api.com"
EVOLUTION_API_KEY="sua-chave"
EVOLUTION_INSTANCE_NAME="voai-agir"

# 3. Conectar WhatsApp
# - Escanear QR Code pela interface
# - Webhook configurado automaticamente
```

### Alternativa: Z-API
```bash
# 1. Criar conta em https://z-api.io
# 2. Criar instância
# 3. Configurar .env
ZAPI_URL="https://api.z-api.io"
ZAPI_INSTANCE="sua-instancia"
ZAPI_TOKEN="seu-token"
```

---

## 5️⃣ INICIAR BACKEND (30 minutos)

```bash
cd C:\Users\Dell\Downloads\Vo.AI\backend

# Instalar dependências
npm install

# Executar migrations se ainda não fez
npx prisma migrate dev

# Iniciar backend em desenvolvimento
npm run start:dev

# Backend rodará em http://localhost:3001
```

---

## 6️⃣ CONECTAR FRONTEND AO BACKEND (1 hora)

```bash
# Configurar .env.local do frontend
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_WS_URL="ws://localhost:3001"

# Iniciar frontend
cd C:\Users\Dell\Downloads\Vo.AI
npm run dev

# Aplicação rodará em http://localhost:3000
```

---

## 7️⃣ TESTAR FLUXO COMPLETO (2-3 horas)

### Checklist de Testes:
```
✅ 1. Login com NextAuth
✅ 2. Criar novo lead no CRM
✅ 3. Arrastar lead entre colunas (Kanban)
✅ 4. Abrir chat e enviar mensagem
✅ 5. IA responder automaticamente
✅ 6. Criar roteiro com destino/datas
✅ 7. IA gerar roteiro <10s
✅ 8. Gerar proposta PDF
✅ 9. Enviar proposta por WhatsApp
✅ 10. Tracking de visualização
```

---

## 📝 ARQUIVOS .ENV NECESSÁRIOS

### `/backend/.env`
```env
# Database
DATABASE_URL="postgresql://..."
REDIS_URL="redis://..."

# Auth
JWT_SECRET="seu-secret-super-secreto-aqui"
JWT_EXPIRES_IN="7d"

# OpenAI
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4-turbo-preview"

# WhatsApp
EVOLUTION_API_URL="https://..."
EVOLUTION_API_KEY="..."
EVOLUTION_INSTANCE_NAME="voai-agir"

# APIs Externas (opcional para MVP)
AMADEUS_API_KEY="..."
AMADEUS_API_SECRET="..."
BOOKING_API_KEY="..."
GOOGLE_MAPS_API_KEY="..."

# Uploads
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_S3_BUCKET="voai-uploads"
AWS_REGION="us-east-1"

# Monitoring (opcional)
SENTRY_DSN="..."
```

### `/.env.local`
```env
# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="seu-secret-aqui"

# Database (Prisma)
DATABASE_URL="postgresql://..."

# APIs
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_WS_URL="ws://localhost:3001"

# Features
NEXT_PUBLIC_ENABLE_AI="true"
NEXT_PUBLIC_ENABLE_WHATSAPP="true"
```

---

## 🛠️ SCRIPTS ÚTEIS

### Package.json Scripts (adicionar se não existirem):
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "db:migrate": "npx prisma migrate dev",
    "db:seed": "npx prisma db seed",
    "db:studio": "npx prisma studio",
    "backend:dev": "cd backend && npm run start:dev",
    "backend:build": "cd backend && npm run build",
    "test": "jest",
    "lint": "next lint"
  }
}
```

---

## 🐛 TROUBLESHOOTING COMUM

### Problema: Erro de conexão com database
```bash
# Verificar se PostgreSQL está rodando
pg_isready

# Testar conexão
psql -U postgres -d voai_dev
```

### Problema: CORS error ao chamar backend
```typescript
// backend/src/main.ts
app.enableCors({
  origin: 'http://localhost:3000',
  credentials: true,
});
```

### Problema: OpenAI timeout
```typescript
// Aumentar timeout
const response = await openai.chat.completions.create({
  // ...config
}, {
  timeout: 30000, // 30 segundos
});
```

### Problema: WhatsApp não conecta
```bash
# Verificar webhook
curl -X POST https://sua-evolution-api.com/webhook \
  -H "apikey: sua-chave" \
  -d '{"url": "https://seu-backend.com/webhooks/whatsapp"}'
```

---

## 📚 DOCUMENTAÇÃO ÚTIL

- **Prisma:** https://www.prisma.io/docs
- **NestJS:** https://docs.nestjs.com
- **Next.js:** https://nextjs.org/docs
- **NextAuth:** https://next-auth.js.org
- **OpenAI:** https://platform.openai.com/docs
- **Evolution API:** https://doc.evolution-api.com
- **Tailwind:** https://tailwindcss.com/docs
- **Framer Motion:** https://www.framer.com/motion
- **Radix UI:** https://www.radix-ui.com

---

## 🎯 METAS DESTA SEMANA

- [ ] Database configurado e migrations executadas
- [ ] Backend rodando e respondendo
- [ ] OpenAI integrado e testado
- [ ] WhatsApp conectado (QR Code escaneado)
- [ ] Primeiro fluxo end-to-end funcionando:
  - Lead criado → Chat IA → Roteiro gerado → Proposta enviada

---

## 💡 DICAS IMPORTANTES

1. **Começe pelo database** - Sem ele, nada funciona
2. **Use Supabase e Upstash** - Evita setup local complexo
3. **Teste OpenAI primeiro** - É a feature core
4. **WhatsApp pode esperar** - Use Webchat para MVP inicial
5. **Não otimize ainda** - Foque em funcionar, depois refina
6. **Commit frequente** - Git commit a cada feature funcional
7. **Documente decisões** - Ajuda na manutenção

---

## 🚦 SEMÁFORO DE BLOQUEIOS

🔴 **CRÍTICO (Bloqueia tudo):**
- Database não configurado
- Backend não inicia

🟡 **IMPORTANTE (Bloqueia features):**
- OpenAI não conectado
- WhatsApp não funciona

🟢 **DESEJÁVEL (Pode esperar):**
- PDF generation
- Analytics avançado
- PWA/Mobile

---

## 📞 PRECISA DE AJUDA?

Execute: `@workspace /help` ou `@workspace /explain [arquivo]`

**Boa sorte! 🚀**
