# 🚀 Vo.AI - CRM + IA para Agências de Viagens

[![Status](https://img.shields.io/badge/Status-MVP%2080%25-brightgreen)](https://github.com)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-Private-red)](LICENSE)

Plataforma SaaS completa de CRM com Inteligência Artificial para agências de viagens. Automatiza atendimento, gera roteiros personalizados e gerencia todo o pipeline de vendas.

![Vo.AI Preview](docs/preview.png)

---

## 🎯 Funcionalidades

### ✅ Implementado (MVP 80%)
- **CRM Kanban** - Gestão visual de leads com drag & drop
- **Chat IA** - Atendimento automatizado 24/7 com GPT-4
- **Gerador de Roteiros** - Criação automática de itinerários personalizados
- **Dashboard Analytics** - Métricas e KPIs em tempo real
- **Sistema de Propostas** - Geração e acompanhamento de propostas comerciais
- **Multi-usuário** - Gestão de consultores e permissões

### ⏳ Em Desenvolvimento (20%)
- **Socket.io Real-time** - Notificações instantâneas
- **WhatsApp Business** - Integração com Evolution API
- **PDF Automático** - Geração de propostas profissionais
- **MFA/2FA** - Autenticação de dois fatores

---

## 🛠️ Stack Tecnológica

### Core
- **Framework:** Next.js 15 (App Router)
- **Linguagem:** TypeScript 100%
- **Database:** Prisma ORM + PostgreSQL/SQLite
- **Cache:** Redis (Upstash)
- **Auth:** NextAuth.js

### Frontend
- **UI:** Tailwind CSS + Radix UI + shadcn/ui
- **Animações:** Framer Motion + @dnd-kit
- **Estado:** Zustand + TanStack Query
- **Forms:** React Hook Form + Zod

### Backend & Integrações
- **IA:** OpenAI GPT-4
- **WhatsApp:** Evolution API
- **Real-time:** Socket.io
- **PDF:** @react-pdf/renderer

---

## 🚀 Quick Start

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- OpenAI API Key

### Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/vo-ai.git
cd vo-ai

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite .env e adicione sua OPENAI_API_KEY

# Configure o banco de dados
npm run db:setup

# Inicie o servidor de desenvolvimento
npm run dev
```

Acesse: **http://localhost:3000**

### Usuários de Teste
```
Admin:
  Email: admin@agir.com
  Senha: admin123

Consultor:
  Email: consultor@agir.com
  Senha: consultor123
```

---

## 📋 Comandos Disponíveis

```bash
npm run dev          # Desenvolvimento (porta 3000)
npm run build        # Build de produção
npm start            # Servidor de produção
npm run lint         # Linter ESLint

npm run db:push      # Atualizar schema database
npm run db:generate  # Gerar Prisma Client
npm run db:seed      # Popular dados de teste
npm run db:setup     # Setup completo (generate + push + seed)

npx prisma studio    # Interface visual do banco
```

---

## 🌐 Deploy

### Vercel (Recomendado)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)

```bash
# CLI
npm install -g vercel
vercel

# Configure as variáveis de ambiente:
# - DATABASE_URL
# - OPENAI_API_KEY
# - NEXTAUTH_SECRET
# - NEXTAUTH_URL
```

### Docker

```bash
docker build -t voai .
docker run -p 3000:3000 voai
```

---

## 📊 Estrutura do Projeto

```
vo-ai/
├── src/
│   ├── app/
│   │   ├── api/              # API Routes (REST)
│   │   ├── (auth)/           # Páginas de autenticação
│   │   ├── (dashboard)/      # Páginas principais
│   │   └── layout.tsx
│   ├── components/           # Componentes React
│   │   ├── ui/              # shadcn/ui components
│   │   ├── crm/             # CRM específicos
│   │   └── chat/            # Chat components
│   ├── lib/                 # Utilitários
│   │   ├── db.ts           # Prisma client
│   │   ├── openai.ts       # OpenAI integration
│   │   ├── redis.ts        # Redis cache
│   │   └── whatsapp.ts     # WhatsApp API
│   └── hooks/              # Custom React hooks
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts            # Seed data
├── public/                # Assets estáticos
└── docs/                  # Documentação adicional
```

---

## 🔐 Variáveis de Ambiente

Copie `.env.example` para `.env` e configure:

```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/voai"

# OpenAI (OBRIGATÓRIO)
OPENAI_API_KEY="sk-proj-..."
OPENAI_MODEL="gpt-4-turbo-preview"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="seu-secret-aqui"

# Redis (Opcional)
REDIS_URL="redis://localhost:6379"

# WhatsApp Evolution API (Opcional)
EVOLUTION_API_URL="https://..."
EVOLUTION_API_KEY="..."
```

---

## 📈 Progresso do MVP

| Módulo | Progresso | Status |
|--------|-----------|--------|
| **Backend Core** | 95% | ✅ |
| **Frontend UI** | 90% | ✅ |
| **OpenAI Integration** | 100% | ✅ |
| **CRM Kanban** | 100% | ✅ |
| **Dashboard** | 95% | ✅ |
| **Chat IA** | 90% | ✅ |
| **Roteiros** | 85% | ✅ |
| **Propostas** | 70% | ⏳ |
| **Socket.io** | 70% | ⏳ |
| **WhatsApp API** | 85% | ⏳ |
| **PDF Generator** | 40% | ⏳ |
| **MFA/2FA** | 80% | ⏳ |
| **TOTAL MVP** | **80%** | 🚧 |

---

## 🧪 Testar Funcionalidades

Após rodar `npm run dev`, teste:

- **Dashboard:** http://localhost:3000
- **CRM Kanban:** http://localhost:3000/crm
- **Chat IA:** http://localhost:3000/chat
- **Roteiros:** http://localhost:3000/roteiros
- **Propostas:** http://localhost:3000/propostas

---

## 📚 Documentação

- [Guia de Instalação](GUIA_INSTALACAO.md)
- [Comandos Rápidos](COMANDOS_RAPIDOS.md)
- [Roadmap](ROADMAP_CONTINUACAO.md)
- [Status do Projeto](STATUS_PROJETO.md)

### Documentação Técnica
- [Implementação Drag & Drop](IMPLEMENTACAO_01_DRAG_DROP.md)
- [Integração OpenAI](IMPLEMENTACAO_02_OPENAI_GPT4.md)
- [WhatsApp API](IMPLEMENTACAO_03_WHATSAPP_API.md)
- [Database & Cache](IMPLEMENTACAO_04_POSTGRESQL_REDIS.md)
- [Frontend](IMPLEMENTACAO_05_FRONTEND_CONECTADO.md)
- [Socket.io](IMPLEMENTACAO_06_SOCKET_IO.md)

---

## 🤝 Contribuindo

Este é um projeto privado. Para contribuir:

1. Faça fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 🐛 Reportar Bugs

Encontrou um bug? Abra uma [issue](https://github.com/seu-usuario/vo-ai/issues) com:

- Descrição clara do problema
- Passos para reproduzir
- Comportamento esperado vs atual
- Screenshots (se aplicável)
- Versão do Node.js e sistema operacional

---

## 📄 Licença

Este projeto é propriedade privada de **AGIR Viagens**.

Todos os direitos reservados © 2025 AGIR Viagens

---

## 👥 Time

Desenvolvido com ❤️ por:
- **Tech Lead:** [Seu Nome]
- **Cliente:** AGIR Viagens

---

## 📞 Suporte

- **Documentação:** [LEIA-ME-PRIMEIRO.md](LEIA-ME-PRIMEIRO.md)
- **Issues:** [GitHub Issues](https://github.com/seu-usuario/vo-ai/issues)
- **Email:** suporte@agir.com.br

---

## 🎯 Roadmap

### Q4 2025 (Atual)
- [x] MVP 80% - Core funcionalidades
- [ ] MVP 100% - Real-time + WhatsApp
- [ ] Deploy staging
- [ ] Testes com equipe

### Q1 2026
- [ ] Automações avançadas
- [ ] Analytics detalhado
- [ ] Mobile PWA
- [ ] Integrações adicionais

### Q2 2026
- [ ] White-label
- [ ] API pública
- [ ] Marketplace de plugins

---

## ⭐ Star History

Se este projeto te ajudou, deixe uma ⭐!

---

**Status:** 🟢 Em Desenvolvimento Ativo  
**Última Atualização:** 18/11/2025  
**Versão:** 0.8.0 (MVP Avançado)
