# ⚡ COMANDOS RÁPIDOS - Vo.AI

## 🚀 COMEÇAR AGORA (Copy & Paste)

### Setup Inicial (5 minutos)
```bash
cd C:\Users\Dell\Downloads\Vo.AI
npm install
npm run db:setup
npm run dev
```

Depois acesse: **http://localhost:3000**

---

## 📋 COMANDOS ESSENCIAIS

### Desenvolvimento
```bash
npm run dev              # Inicia servidor (porta 3000)
npm run build            # Build de produção
npm start                # Inicia produção
npm run lint             # Verifica código
```

### Database
```bash
npm run db:push          # Atualiza schema no banco
npm run db:generate      # Gera Prisma Client
npm run db:migrate       # Cria migration
npm run db:seed          # Popula dados de teste
npm run db:setup         # Faz tudo: generate + push + seed
npx prisma studio        # Abre interface visual do banco
```

### Verificações
```bash
node verificar-instalacao.js    # Verifica se tudo está OK
npm run lint                     # Checa erros no código
```

---

## 🧪 TESTAR FUNCIONALIDADES

### 1. Dashboard
```
http://localhost:3000
```

### 2. CRM Kanban
```
http://localhost:3000/crm
```
**Teste:** Arraste um card entre colunas

### 3. Chat IA
```
http://localhost:3000/chat
```
**Teste:** Digite "Quero viajar para Paris"

### 4. Roteiros
```
http://localhost:3000/roteiros
```
**Teste:** Preencha o formulário e clique "Gerar"

### 5. Propostas
```
http://localhost:3000/propostas
```

---

## 🔧 RESOLVER PROBLEMAS

### Erro: "Cannot find module"
```bash
npm install
npm run db:generate
```

### Erro: "OPENAI_API_KEY is not set"
```bash
# Edite .env e adicione:
OPENAI_API_KEY="sk-sua-chave"
```

### Erro: Database não conecta
```bash
npm run db:setup
```

### Porta 3000 em uso
```bash
# Use outra porta
npm run dev -- -p 3001
```

### Limpar tudo e recomeçar
```bash
rm -rf node_modules
rm -rf .next
rm dev.db
npm install
npm run db:setup
```

---

## 📊 VERIFICAR STATUS

### Ver logs do servidor
```bash
npm run dev
# Logs aparecem no terminal
```

### Verificar banco de dados
```bash
npx prisma studio
# Abre em: http://localhost:5555
```

### Testar API manualmente
```bash
# Windows (PowerShell)
Invoke-WebRequest -Uri "http://localhost:3000/api/leads" -Method GET

# Ou use Postman/Insomnia
GET http://localhost:3000/api/leads
```

---

## 👤 LOGIN DE TESTE

### Admin
```
Email: admin@agir.com
Senha: admin123
```

### Consultor
```
Email: consultor@agir.com
Senha: consultor123
```

---

## 🔑 OBTER OPENAI API KEY

1. Acesse: https://platform.openai.com/api-keys
2. Faça login/cadastro
3. Clique "Create new secret key"
4. Copie a chave (começa com `sk-proj-...`)
5. Cole no arquivo `.env`:
```env
OPENAI_API_KEY="sk-proj-sua-chave-aqui"
```

---

## 📦 INSTALAR DEPENDÊNCIAS EXTRAS

### Socket.io (Real-time)
```bash
npm install socket.io socket.io-client
```

### MFA (2FA)
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

## 🚀 DEPLOY PRODUÇÃO

### Vercel (Recomendado)
```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Deploy
vercel

# 3. Configurar variáveis de ambiente
vercel env add DATABASE_URL
vercel env add OPENAI_API_KEY
vercel env add NEXTAUTH_SECRET
```

### Railway
```bash
# 1. Criar conta em railway.app
# 2. Conectar repositório GitHub
# 3. Configurar variáveis
# 4. Deploy automático
```

---

## 📂 ESTRUTURA IMPORTANTE

```
Vo.AI/
├── .env                    ← Configure aqui!
├── package.json            ← Comandos npm
├── prisma/
│   ├── schema.prisma      ← Modelo do banco
│   └── seed.ts            ← Dados de teste
├── src/
│   ├── app/
│   │   ├── api/           ← APIs REST
│   │   ├── (routes)/      ← Páginas
│   │   └── layout.tsx
│   ├── components/        ← Componentes React
│   ├── lib/               ← Utilitários
│   └── hooks/             ← Custom hooks
└── public/                ← Assets estáticos
```

---

## 🎯 PRÓXIMOS PASSOS

### Hoje
- [x] Instalar dependências
- [x] Configurar .env
- [x] Rodar database setup
- [x] Testar aplicação local

### Esta Semana
- [ ] Implementar Socket.io
- [ ] Conectar WhatsApp
- [ ] Gerar PDFs

### Próxima Semana
- [ ] Deploy staging
- [ ] Testes com equipe
- [ ] Refinamentos

---

## 📞 AJUDA RÁPIDA

### Ver documentação completa
```
GUIA_INSTALACAO.md         ← Passo a passo
ROADMAP_CONTINUACAO.md     ← Plano detalhado
RESUMO_EXECUTIVO_CONTINUACAO.md  ← Visão geral
```

### Verificar instalação
```bash
node verificar-instalacao.js
```

### Logs e debug
```bash
npm run dev    # Ver logs em tempo real
```

---

## ✅ CHECKLIST RÁPIDO

Antes de começar a desenvolver:

- [ ] `npm install` executado
- [ ] Arquivo `.env` existe
- [ ] `OPENAI_API_KEY` configurada
- [ ] `npm run db:setup` executado
- [ ] `npm run dev` rodando
- [ ] http://localhost:3000 abrindo
- [ ] Login funcionando
- [ ] CRM mostrando 5 leads

Se todos ✅ → **Pronto para continuar!** 🚀

---

**Dica:** Salve esta página nos favoritos! 📌
