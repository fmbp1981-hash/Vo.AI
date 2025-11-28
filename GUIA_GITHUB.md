# 📦 Guia de Publicação no GitHub - Vo.AI

## 🎯 Preparação Completa para GitHub

Este guia mostra como subir o projeto no GitHub de forma profissional.

---

## ✅ ANTES DE SUBIR - Checklist

### 1. Arquivos Sensíveis Protegidos ✅
- [x] `.gitignore` configurado
- [x] `.env` não será commitado (apenas `.env.example`)
- [x] `dev.db` não será commitado
- [x] `node_modules` ignorado

### 2. Documentação Completa ✅
- [x] README_GITHUB.md criado (renomear para README.md)
- [x] LICENSE criado
- [x] CONTRIBUTING.md criado
- [x] Todos os guias técnicos presentes

### 3. Código Limpo ✅
- [x] TypeScript 100%
- [x] Estrutura organizada
- [x] Comentários removidos
- [x] Console.logs de debug removidos

---

## 🚀 PASSO A PASSO - Subir no GitHub

### 1. Preparar Repositório Local (5min)

```bash
cd C:\Users\Dell\Downloads\Vo.AI

# Renomear README para GitHub
mv README.md README_OLD.md
mv README_GITHUB.md README.md

# Inicializar Git (se ainda não foi)
git init

# Adicionar todos os arquivos
git add .

# Primeiro commit
git commit -m "feat: MVP 80% - Sistema completo CRM + IA para agências de viagens"
```

### 2. Criar Repositório no GitHub (3min)

#### Opção A: Público (Open Source)
1. Acesse: https://github.com/new
2. Nome: `vo-ai` ou `voai-crm`
3. Descrição: `🚀 CRM + IA para Agências de Viagens - Sistema completo com chat IA, geração de roteiros e automação`
4. Público ✅
5. **NÃO** adicione README, .gitignore ou LICENSE (já temos)
6. Criar repositório

#### Opção B: Privado (Recomendado)
1. Mesmos passos acima
2. Selecione **Private** 🔒
3. Convide colaboradores depois (Settings → Collaborators)

### 3. Conectar e Fazer Push (2min)

```bash
# Adicionar remote
git remote add origin https://github.com/SEU-USUARIO/vo-ai.git

# Verificar remote
git remote -v

# Push inicial
git branch -M main
git push -u origin main
```

**Pronto! Projeto no GitHub! 🎉**

---

## 📋 ESTRUTURA QUE SERÁ COMMITADA

```
vo-ai/
├── .github/
│   └── workflows/
│       └── ci.yml          ← CI/CD automático
├── docs/                   ← Documentação adicional
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/
├── src/                    ← Todo o código fonte
├── .env.example           ← Template (SEM secrets)
├── .gitignore             ← Arquivos ignorados
├── CONTRIBUTING.md        ← Guia de contribuição
├── LICENSE                ← Licença
├── README.md              ← README principal
├── package.json
├── package-lock.json
├── tsconfig.json
├── next.config.ts
└── [todos os outros .md]
```

### ❌ O QUE NÃO SERÁ COMMITADO

```
node_modules/              ← Dependências
.next/                     ← Build
.env                       ← Secrets
dev.db                     ← Database local
*.log                      ← Logs
```

---

## 🔐 SEGURANÇA - Verificação Final

### Antes do primeiro push, verifique:

```bash
# 1. Verificar o que será commitado
git status

# 2. Ver diff de tudo
git diff --staged

# 3. Verificar se .env NÃO está na lista
git status | grep ".env"
# Se aparecer: git reset .env

# 4. Verificar .gitignore
cat .gitignore
```

### ⚠️ CRÍTICO: Remover Secrets

Se acidentalmente commitou `.env`:

```bash
# Remover do stage
git reset .env

# Ou remover do histórico (se já commitou)
git rm --cached .env
git commit -m "fix: remove .env from tracking"
```

---

## 🏷️ RELEASES & TAGS

### Criar Release v0.8.0 (MVP 80%)

```bash
# Criar tag
git tag -a v0.8.0 -m "MVP 80% - Core funcionalidades completas"

# Push tag
git push origin v0.8.0

# No GitHub, vá em Releases → Draft a new release
# - Tag: v0.8.0
# - Title: "MVP 80% - Sistema Core Completo"
# - Descrição: Cole o conteúdo de PROGRESSO_FINAL_ATUALIZADO.md
```

---

## 🌿 ESTRATÉGIA DE BRANCHES

### Estrutura Recomendada

```
main          ← Produção (protegido)
  ├── develop      ← Desenvolvimento ativo
  │   ├── feature/socket-io
  │   ├── feature/whatsapp
  │   └── feature/pdf-generator
  └── hotfix/      ← Correções urgentes
```

### Configurar Branches

```bash
# Criar branch develop
git checkout -b develop
git push -u origin develop

# Proteger main no GitHub
# Settings → Branches → Add rule
# - Branch name: main
# - Require pull request reviews
# - Require status checks
```

### Workflow de Desenvolvimento

```bash
# 1. Criar feature
git checkout develop
git pull
git checkout -b feature/socket-io

# 2. Desenvolver e committar
git add .
git commit -m "feat: implementa Socket.io real-time"

# 3. Push e PR
git push origin feature/socket-io
# Abrir PR: feature/socket-io → develop
```

---

## 📊 CI/CD com GitHub Actions

O arquivo `.github/workflows/ci.yml` já está pronto! Ele vai:

✅ Rodar em cada push/PR  
✅ Testar Node 18 e 20  
✅ Instalar dependências  
✅ Gerar Prisma Client  
✅ Rodar linter  
✅ Fazer build  

### Ver Status

Após o push, veja em: `Actions` tab no GitHub

---

## 🎨 MELHORAR PÁGINA DO GITHUB

### 1. Adicionar Logo

```bash
# Criar pasta docs/
mkdir -p docs

# Adicione logo.png em docs/
# No README.md:
# ![Vo.AI](docs/logo.png)
```

### 2. Adicionar Preview

```bash
# Screenshot da aplicação
# Salve em docs/preview.png
```

### 3. Adicionar Badges

No README.md (já incluído):
- Status do projeto
- Versão
- Tecnologias
- CI/CD status

### 4. GitHub Topics

No repositório, adicione topics:
- `nextjs`
- `typescript`
- `crm`
- `ai`
- `chatbot`
- `travel`
- `saas`

---

## 👥 COLABORADORES

### Adicionar Colaboradores (Privado)

1. Settings → Collaborators
2. Add people
3. Permissões:
   - **Read:** Ver código
   - **Write:** Fazer commits
   - **Admin:** Tudo

### Adicionar Contribuidores (Público)

No README.md:
```markdown
## 👥 Contribuidores

<a href="https://github.com/seu-usuario/vo-ai/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=seu-usuario/vo-ai" />
</a>
```

---

## 📝 ISSUES E PROJECTS

### Configurar Issues

1. **Issues** tab → **Labels**
2. Criar labels:
   - `bug` - Correções
   - `feature` - Novas funcionalidades
   - `enhancement` - Melhorias
   - `documentation` - Docs
   - `help wanted` - Ajuda necessária
   - `good first issue` - Para iniciantes

### Criar Project Board

1. **Projects** tab → New project
2. Board Kanban com colunas:
   - 📋 Backlog
   - 🔨 In Progress
   - 👀 In Review
   - ✅ Done

---

## 🚀 DEPLOY AUTOMÁTICO

### Conectar Vercel

```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Conectar repositório
vercel login
vercel link

# 3. Deploy automático configurado!
# Cada push em main → deploy produção
# Cada PR → preview deploy
```

### Variáveis no Vercel

No dashboard Vercel:
1. Settings → Environment Variables
2. Adicionar:
   - `DATABASE_URL`
   - `OPENAI_API_KEY`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`

---

## ✅ CHECKLIST FINAL

Antes de tornar público:

- [ ] README.md completo e atrativo
- [ ] LICENSE adequado
- [ ] CONTRIBUTING.md claro
- [ ] .env.example atualizado
- [ ] Secrets removidos
- [ ] CI/CD funcionando
- [ ] Issues configuradas
- [ ] Branch main protegido
- [ ] Documentação completa
- [ ] Screenshots adicionados

---

## 🎯 PRÓXIMOS PASSOS

Após subir no GitHub:

1. **Hoje:** Fazer primeiro push
2. **Amanhã:** Adicionar logo e screenshots
3. **Esta semana:** Configurar CI/CD completo
4. **Próxima semana:** Deploy em staging

---

## 📞 COMANDOS RÁPIDOS

```bash
# Status
git status

# Ver histórico
git log --oneline --graph

# Ver branches
git branch -a

# Atualizar
git pull

# Criar branch
git checkout -b feature/nome

# Commit
git commit -m "tipo: mensagem"

# Push
git push

# Ver remote
git remote -v
```

---

## 🎉 PRONTO!

Seu projeto está profissionalmente configurado para GitHub! 🚀

**Próxima ação:** Execute os comandos do **Passo 1** acima! 👆

---

**Dúvidas?** Consulte a [documentação oficial do Git](https://git-scm.com/doc)
