# 🚀 Vo.AI - Plataforma SaaS para AGIR Viagens

**CRM Kanban Inteligente + Chatbot IA Omnicanal + Motor de Roteirização Automática**

![Status](https://img.shields.io/badge/MVP-75%25-green)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-purple)

---

## 📋 Sobre o Projeto

Vo.AI é uma plataforma completa que integra:

- **CRM Kanban** com drag & drop para gestão do ciclo de vendas
- **Chat IA omnicanal** (WhatsApp + Webchat) com GPT-4
- **Motor de roteirização automática** com IA
- **Handover inteligente** para consultores humanos
- **Geração de propostas** PDF com tracking

### 🎯 Objetivo

Reduzir tempo operacional, elevar conversão e oferecer atendimento 24/7 com handover fluido para humanos.

---

## 🚀 Quick Start (5 minutos)

```bash
# 1. Execute o script de setup
finalize-setup.bat

# 2. Configure o .env
# Adicione: OPENAI_API_KEY=sk-proj-xxxxxxxxxx

# 3. Setup database
npm run db:push

# 4. Rodar aplicação
npm run dev

# 5. Abrir: http://localhost:3000
```

---

## ✨ Funcionalidades (75% MVP Completo)

- [x] **CRM Kanban** - Drag & drop funcional
- [x] **Chat IA** - GPT-4 com contexto
- [x] **WhatsApp API** - Biblioteca completa
- [x] **Gerador de Roteiros** - IA em <10s
- [x] **PostgreSQL + Redis** - Cache e rate limiting
- [x] **Frontend Conectado** - UI completa

---

## 📖 Documentação Completa

### Guias de Setup
- **[SETUP_RAPIDO.md](./SETUP_RAPIDO.md)** - Setup em 5 minutos
- **[PROGRESSO_FINAL.md](./PROGRESSO_FINAL.md)** - Status e próximos passos

### Implementações Técnicas  
- **[IMPLEMENTACAO_01_DRAG_DROP.md](./IMPLEMENTACAO_01_DRAG_DROP.md)** - CRM Kanban
- **[IMPLEMENTACAO_02_OPENAI_GPT4.md](./IMPLEMENTACAO_02_OPENAI_GPT4.md)** - OpenAI
- **[IMPLEMENTACAO_03_WHATSAPP_API.md](./IMPLEMENTACAO_03_WHATSAPP_API.md)** - WhatsApp
- **[IMPLEMENTACAO_04_POSTGRESQL_REDIS.md](./IMPLEMENTACAO_04_POSTGRESQL_REDIS.md)** - Database
- **[IMPLEMENTACAO_05_FRONTEND_CONECTADO.md](./IMPLEMENTACAO_05_FRONTEND_CONECTADO.md)** - Frontend

### Análise
- **[ANALISE_PRD_vs_IMPLEMENTACAO.md](./ANALISE_PRD_vs_IMPLEMENTACAO.md)** - Comparação PRD

---

## 🧪 Testar Localmente

```bash
# CRM Kanban com Drag & Drop
http://localhost:3000/crm

# Chat IA com GPT-4
http://localhost:3000/chat

# Gerador de Roteiros
http://localhost:3000/roteiros

# Dashboard
http://localhost:3000
```

---

## 🛠️ Stack Tecnológica

### Frontend
- **Next.js 15** - Framework React com SSR
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **@dnd-kit** - Drag & drop
- **Framer Motion** - Animações

### Backend
- **Next.js API Routes** - Backend serverless
- **Prisma ORM** - Database ORM
- **PostgreSQL** - Database (Supabase)
- **Redis** - Cache (Upstash)

### Integrações
- **OpenAI GPT-4** - Chat IA
- **Evolution API** - WhatsApp Business
- **NextAuth** - Autenticação

---

## 📊 Status do Projeto

**MVP:** 75% Completo ✅  
**Código:** 3.000 linhas  
**Documentação:** 75KB  
**APIs:** 6 endpoints  

### Próximos Passos
1. Deploy Staging (2h)
2. Socket.io Real-Time (2h)
3. WhatsApp Config (2h)

---

## 💰 Custos Estimados

### Desenvolvimento
- PostgreSQL: Grátis (Supabase free tier)
- Redis: Grátis (Upstash free tier)
- Vercel: Grátis (free tier)

### Produção
- OpenAI GPT-4: R$ 400-800/mês
- WhatsApp API: R$ 60-120/mês
- **Total: R$ 460-920/mês**

---

**Made with ❤️ for AGIR Viagens**  
**Status:** 🟢 Pronto para Testes Internos

## ✨ Technology Stack

This scaffold provides a robust foundation built with:

### 🎯 Core Framework
- **⚡ Next.js 15** - The React framework for production with App Router
- **📘 TypeScript 5** - Type-safe JavaScript for better developer experience
- **🎨 Tailwind CSS 4** - Utility-first CSS framework for rapid UI development

### 🧩 UI Components & Styling
- **🧩 shadcn/ui** - High-quality, accessible components built on Radix UI
- **🎯 Lucide React** - Beautiful & consistent icon library
- **🌈 Framer Motion** - Production-ready motion library for React
- **🎨 Next Themes** - Perfect dark mode in 2 lines of code

### 📋 Forms & Validation
- **🎣 React Hook Form** - Performant forms with easy validation
- **✅ Zod** - TypeScript-first schema validation

### 🔄 State Management & Data Fetching
- **🐻 Zustand** - Simple, scalable state management
- **🔄 TanStack Query** - Powerful data synchronization for React
- **🌐 Axios** - Promise-based HTTP client

### 🗄️ Database & Backend
- **🗄️ Prisma** - Next-generation Node.js and TypeScript ORM
- **🔐 NextAuth.js** - Complete open-source authentication solution

### 🎨 Advanced UI Features
- **📊 TanStack Table** - Headless UI for building tables and datagrids
- **🖱️ DND Kit** - Modern drag and drop toolkit for React
- **📊 Recharts** - Redefined chart library built with React and D3
- **🖼️ Sharp** - High performance image processing

### 🌍 Internationalization & Utilities
- **🌍 Next Intl** - Internationalization library for Next.js
- **📅 Date-fns** - Modern JavaScript date utility library
- **🪝 ReactUse** - Collection of essential React hooks for modern development

## 🎯 Why This Scaffold?

- **🏎️ Fast Development** - Pre-configured tooling and best practices
- **🎨 Beautiful UI** - Complete shadcn/ui component library with advanced interactions
- **🔒 Type Safety** - Full TypeScript configuration with Zod validation
- **📱 Responsive** - Mobile-first design principles with smooth animations
- **🗄️ Database Ready** - Prisma ORM configured for rapid backend development
- **🔐 Auth Included** - NextAuth.js for secure authentication flows
- **📊 Data Visualization** - Charts, tables, and drag-and-drop functionality
- **🌍 i18n Ready** - Multi-language support with Next Intl
- **🚀 Production Ready** - Optimized build and deployment settings
- **🤖 AI-Friendly** - Structured codebase perfect for AI assistance

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to see your application running.

## 🤖 Powered by Z.ai

This scaffold is optimized for use with [Z.ai](https://chat.z.ai) - your AI assistant for:

- **💻 Code Generation** - Generate components, pages, and features instantly
- **🎨 UI Development** - Create beautiful interfaces with AI assistance  
- **🔧 Bug Fixing** - Identify and resolve issues with intelligent suggestions
- **📝 Documentation** - Auto-generate comprehensive documentation
- **🚀 Optimization** - Performance improvements and best practices

Ready to build something amazing? Start chatting with Z.ai at [chat.z.ai](https://chat.z.ai) and experience the future of AI-powered development!

## 📁 Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable React components
│   └── ui/             # shadcn/ui components
├── hooks/              # Custom React hooks
└── lib/                # Utility functions and configurations
```

## 🎨 Available Features & Components

This scaffold includes a comprehensive set of modern web development tools:

### 🧩 UI Components (shadcn/ui)
- **Layout**: Card, Separator, Aspect Ratio, Resizable Panels
- **Forms**: Input, Textarea, Select, Checkbox, Radio Group, Switch
- **Feedback**: Alert, Toast (Sonner), Progress, Skeleton
- **Navigation**: Breadcrumb, Menubar, Navigation Menu, Pagination
- **Overlay**: Dialog, Sheet, Popover, Tooltip, Hover Card
- **Data Display**: Badge, Avatar, Calendar

### 📊 Advanced Data Features
- **Tables**: Powerful data tables with sorting, filtering, pagination (TanStack Table)
- **Charts**: Beautiful visualizations with Recharts
- **Forms**: Type-safe forms with React Hook Form + Zod validation

### 🎨 Interactive Features
- **Animations**: Smooth micro-interactions with Framer Motion
- **Drag & Drop**: Modern drag-and-drop functionality with DND Kit
- **Theme Switching**: Built-in dark/light mode support

### 🔐 Backend Integration
- **Authentication**: Ready-to-use auth flows with NextAuth.js
- **Database**: Type-safe database operations with Prisma
- **API Client**: HTTP requests with Axios + TanStack Query
- **State Management**: Simple and scalable with Zustand

### 🌍 Production Features
- **Internationalization**: Multi-language support with Next Intl
- **Image Optimization**: Automatic image processing with Sharp
- **Type Safety**: End-to-end TypeScript with Zod validation
- **Essential Hooks**: 100+ useful React hooks with ReactUse for common patterns

## 🤝 Get Started with Z.ai

1. **Clone this scaffold** to jumpstart your project
2. **Visit [chat.z.ai](https://chat.z.ai)** to access your AI coding assistant
3. **Start building** with intelligent code generation and assistance
4. **Deploy with confidence** using the production-ready setup

---

Built with ❤️ for the developer community. Supercharged by [Z.ai](https://chat.z.ai) 🚀
