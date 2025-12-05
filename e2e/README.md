# 🧪 Testes End-to-End - Vo.AI MVP

Suite completa de testes E2E usando Playwright para validar todas as funcionalidades do MVP.

## 📦 O Que Foi Implementado

### Configuração
- ✅ Playwright configurado para Next.js
- ✅ Helpers e utilities reutilizáveis
- ✅ Dados de teste centralizados
- ✅ Scripts automatizados de execução

### Suites de Testes

#### 1. Autenticação (`e2e/tests/01-auth/`)
- `login.spec.ts` - Login com validações completas
- `logout.spec.ts` - Logout e limpeza de sessão

#### 2. Dashboard (`e2e/tests/02-dashboard/`)
- `home.spec.ts` - Visualização e navegação do dashboard

#### 3. CRM (`e2e/tests/03-crm/`)
- `leads-list.spec.ts` - Listagem e filtros de leads
- `lead-create.spec.ts` - Criação de leads com validações
- `kanban.spec.ts` - Kanban board e drag & drop

#### 4. Chat (`e2e/tests/04-chat/`)
- `chat-interface.spec.ts` - Interface de chat e envio de mensagens

#### 5. Real-Time (`e2e/tests/05-realtime/`)
- `socket-connection.spec.ts` - Conexões WebSocket

## 🚀 Como Usar

### 1. Instalar Dependências

```bash
# Instalar pacotes (incluindo Playwright)
npm install

# Instalar browsers do Playwright
npm run test:install
```

### 2. Preparar Ambiente

Certifique-se de que a aplicação está rodando:

```bash
# Terminal 1: Rodar aplicação
npm run dev
```

### 3. Executar Testes

```bash
# Terminal 2: Rodar testes E2E

# Modo headless (padrão)
npm run test:e2e

# Modo headed (ver browser)
npm run test:e2e:headed

# Modo UI interativo
npm run test:e2e:ui

# Ou usar o script Windows
scripts\test-e2e.bat
scripts\test-e2e.bat headed  # Com browser visível
scripts\test-e2e.bat ui      # Modo interativo
```

### 4. Ver Relatório

```bash
# Abrir relatório HTML após os testes
npm run test:e2e:report
```

## 📝 Estrutura de Arquivos

```
e2e/
├── tests/
│   ├── 01-auth/         # Testes de autenticação
│   ├── 02-dashboard/    # Testes de dashboard
│   ├── 03-crm/          # Testes de CRM
│   ├── 04-chat/         # Testes de chat
│   └── 05-realtime/     # Testes real-time
├── utils/
│   ├── test-data.ts     # Dados de teste
│   └── test-helpers.ts  # Funções auxiliares
└── .env.example         # Variáveis de ambiente

playwright.config.ts     # Configuração do Playwright
scripts/test-e2e.bat    # Script de execução
```

## 🔧 Configuração

### Variáveis de Ambiente

Copie `e2e/.env.example` para `e2e/.env.test` e configure:

```env
E2E_BASE_URL=http://localhost:3000
TEST_ADMIN_EMAIL=admin@voai.test
TEST_ADMIN_PASSWORD=Test@123456
```

### Usuários de Teste

Os testes esperam que existam usuários no banco de dados:

- **Admin**: `admin@voai.test` / `Test@123456`
- **Consultant**: `consultant@voai.test` / `Test@123456`

Você pode criar esses usuários manualmente ou ajustar as credenciais em `e2e/utils/test-data.ts`.

## 📊 Executar Suites Específicas

```bash
# Apenas testes de autenticação
npx playwright test e2e/tests/01-auth

# Apenas testes de CRM
npx playwright test e2e/tests/03-crm

# Apenas um arquivo específico
npx playwright test e2e/tests/03-crm/kanban.spec.ts

# Com filtro por nome do teste
npx playwright test -g "login com credenciais válidas"
```

## 🐛 Debug

```bash
# Rodar com UI para debug
npm run test:e2e:ui

# Rodar com browser visível
npm run test:e2e:headed

# Ver traces de testes que falharam
npx playwright show-trace test-results/trace.zip
```

## 📸 Screenshots e Vídeos

Por padrão, o Playwright:
- Tira screenshots quando um teste falha
- Grava vídeo quando um teste falha
- Salva tudo em `test-results/`

## ✅ Cobertura Atual

### Implementado (9 suites)
- ✅ Login/Logout
- ✅ Dashboard
- ✅ CRM Leads List
- ✅ CRM Lead Create
- ✅ CRM Kanban
- ✅ Chat Interface
- ✅ Socket Connection

### Pendente
- ⏳ MFA Setup e Verificação
- ⏳ Lead Edit
- ⏳ WhatsApp Widget
- ⏳ Notificações Real-time

## 🎯 Próximos Passos

1. **Criar usuários de teste** no banco de dados
2. **Executar primeiros testes**: `npm run test:e2e:headed`
3. **Ajustar seletores** se necessário (baseado na UI real)
4. **Implementar testes pendentes** (MFA, Lead Edit, etc.)
5. **Integrar com CI/CD** (GitHub Actions, etc.)

## 📚 Recursos

- [Documentação Playwright](https://playwright.dev)
- [Guia de Best Practices](https://playwright.dev/docs/best-practices)
- [Seletores CSS](https://playwright.dev/docs/selectors)

## 🆘 Problemas Comuns

### Aplicação não está rodando
```bash
# Certifique-se de rodar npm run dev antes dos testes
npm run dev
```

### Seletores não encontrados
```bash
# Use o modo UI para inspecionar elementos
npm run test:e2e:ui
```

### Timeouts
```bash
# Ajuste timeouts em playwright.config.ts se necessário
```

## 📞 Suporte

Para questões sobre os testes E2E, verifique:
1. Logs de execução dos testes
2. Screenshots em `test-results/`
3. Relatório HTML: `npm run test:e2e:report`

---

**Status**: ✅ Pronto para execução  
**Última atualização**: 2025-12-01
