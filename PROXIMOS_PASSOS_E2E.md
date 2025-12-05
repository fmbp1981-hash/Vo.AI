# 🚀 Próximos Passos - Testes E2E Vo.AI

## ✅ O Que Está Pronto

- [x] 13 arquivos de testes E2E criados
- [x] 9 suites de testes implementadas (~50 casos de teste)
- [x] Configuração do Playwright completa
- [x] Scripts automatizados de execução
- [x] Documentação completa (README + Walkthrough)
- [/] Instalação do npm em andamento

---

## 📋 Próximos Passos (Nesta Ordem)

### 1. Aguardar Instalação do npm (EM ANDAMENTO)

```bash
# A instalação está rodando...
# Aguarde a conclusão com "added X packages"
```

### 2. Instalar Browsers do Playwright

```bash
npm run test:install
```

Isso irá baixar e instalar o Chromium para executar os testes (~100MB).

### 3. Criar Usuários de Teste

Os testes esperam que existam usuários específicos no banco de dados:

**Opção A - Criar Manualmente:**
1. Acesse `http://localhost:3000`
2. Faça login como admin ou crie os usuários:
   - Email: `admin@voai.test` / Senha: `Test@123456`
   - Email: `consultant@voai.test` / Senha: `Test@123456`

**Opção B - Ajustar Credenciais:**
Edite o arquivo `e2e/utils/test-data.ts` para usar credenciais existentes.

### 4. Iniciar a Aplicação

```bash
# Terminal 1
npm run dev
```

Aguarde até ver "Ready on http://localhost:3000"

### 5. Executar Primeiros Testes

```bash
# Terminal 2 - Modo interativo (recomendado para primeira vez)
npm run test:e2e:ui

# OU modo headed (ver browser)
npm run test:e2e:headed

# OU modo headless (sem ver browser)
npm run test:e2e
```

### 6. Verificar Resultados

Após executar os testes:

```bash
# Ver relatório HTML
npm run test:e2e:report
```

O relatório mostrará:
- ✅ Testes que passaram
- ❌ Testes que falharam
- 📸 Screenshots de falhas
- 🎥 Vídeos de execução

---

## 🐛 Se Testes Falharem

### Seletores não encontrados

**Causa**: A UI real pode ter seletores diferentes dos esperados.

**Solução**:
1. Execute `npm run test:e2e:ui`
2. Use o picker de elementos para encontrar seletores corretos
3. Atualize `e2e/utils/test-data.ts` na seção `SELECTORS`

### Usuários não encontrados

**Causa**: Usuários de teste não existem no banco.

**Solução**:
Crie os usuários conforme Passo 3 acima.

### Timeouts

**Causa**: Aplicação muito lenta ou testes muito rápidos.

**Solução**:
Ajuste timeouts em `playwright.config.ts`:
```typescript
use: {
  actionTimeout: 15000, // Aumentar se necessário
}
```

---

## 📊 Verificar Cobertura

Após primeiros testes, verifique quais passaram:

```bash
# Executar suite específica
npx playwright test e2e/tests/01-auth
npx playwright test e2e/tests/03-crm
```

---

## 🔄 Iteração e Ajustes

1. **Executar testes**
2. **Ver relatório** (`npm run test:e2e:report`)
3. **Ajustar seletores** se necessário
4. **Repetir**

---

## 📁 Arquivos Importantes

| Arquivo | Propósito |
|---------|-----------|
| `playwright.config.ts` | Configuração geral |
| `e2e/utils/test-data.ts` | Dados e seletores |
| `e2e/utils/test-helpers.ts` | Funções auxiliares |
| `e2e/README.md` | Documentação detalhada |
| `scripts/test-e2e.bat` | Script automatizado |

---

## 🎯 Comandos Rápidos

```bash
# Setup inicial (uma vez)
npm install
npm run test:install

# Executar testes
npm run dev                 # Terminal 1
npm run test:e2e:ui         # Terminal 2 (recomendado)

# Ver relatório
npm run test:e2e:report

# Teste específico
npx playwright test e2e/tests/01-auth/login.spec.ts

# Debug
npx playwright test --debug
```

---

## ✨ Dicas

1. **Use modo UI** na primeira vez para entender os testes
2. **Screenshots automáticos** são salvos em `test-results/` em caso de falha
3. **Testes são independentes** - podem rodar em qualquer ordem
4. **Modo headed** é ótimo para ver o que está acontecendo

---

## 🆘 Problemas?

1. Verifique `test-results/` para screenshots e vídeos
2. Execute `npm run test:e2e:ui` para debug interativo
3. Consulte `e2e/README.md` para mais detalhes

---

**Status Atual**: ⏳ Aguardando instalação do npm  
**Próximo Comando**: `npm run test:install`
