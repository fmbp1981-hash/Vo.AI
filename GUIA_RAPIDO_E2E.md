# ⚡ Guia Rápido - Executar Testes E2E

## 🎯 Comandos Rápidos (na ordem)

### 1. Limpar cache do npm (se houver problemas)
```bash
npm cache clean --force
```

### 2. Instalar Playwright
```bash
npm install -D @playwright/test
npx playwright install chromium
```

###  3. Criar Usuários de Teste
```bash
npx tsx scripts/create-test-users.ts
```

### 4. Iniciar Aplicação
```bash
# Terminal 1
npm run dev
```

### 5. Executar Testes
```bash
# Terminal 2 - Modo UI (recomendado primeira vez)
npm run test:e2e:ui

# OU modo headed (ver browser)
npm run test:e2e:headed

# OU modo headless (CI/CD)
npm run test:e2e
```

### 6. Ver Relatório
```bash
npm run test:e2e:report
```

---

## 🐛 Troubleshooting

### Cache Corrompido
```bash
npm cache clean --force
rm -rf node_modules
npm install
```

### Playwright não instalado
```bash
npm install -D @playwright/test
npx playwright install chromium
```

### Usuários não existem
```bash
npx tsx scripts/create-test-users.ts
```

### Aplicação não está rodando
```bash
npm run dev
# aguarde "Ready on http://localhost:3000"
```

---

## 📊 Status Atual

- ✅ Estrutura de testes criada (13 arquivos)
- ✅ 9 suites de testes (~50 casos)
- ⏳ Instalação do Playwright em andamento
- ⏳ Usuários de teste pendentes
- ⏳ Primeira execução pendente

---

## 🎬 Primeira Execução (Passo a Passo)

1. Aguardar instalação do npm concluir
2. `npx tsx scripts/create-test-users.ts`
3. `npm run dev` (Terminal 1)
4. `npm run test:e2e:ui` (Terminal 2)
5. Ver resultados no relatório

---

**Status**: ⏳ Aguardando instalação  
**Última Atualização**: 2025-12-02
