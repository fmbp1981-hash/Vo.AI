# Guia de Contribuição - Vo.AI

Obrigado por considerar contribuir com o Vo.AI! 🎉

## 🚀 Como Contribuir

### 1. Setup do Ambiente

```bash
# Fork e clone o repositório
git clone https://github.com/seu-usuario/vo-ai.git
cd vo-ai

# Instale as dependências
npm install

# Configure o .env
cp .env.example .env
# Adicione suas chaves de API

# Setup do banco
npm run db:setup

# Rode o projeto
npm run dev
```

### 2. Crie uma Branch

```bash
# Para novas features
git checkout -b feature/nome-da-feature

# Para correções de bugs
git checkout -b fix/nome-do-bug

# Para documentação
git checkout -b docs/descricao
```

### 3. Faça suas Alterações

- Escreva código limpo e bem documentado
- Siga o padrão de código do projeto
- Adicione testes quando aplicável
- Atualize a documentação se necessário

### 4. Commit

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Exemplos:
git commit -m "feat: adiciona integração com WhatsApp"
git commit -m "fix: corrige drag & drop no CRM"
git commit -m "docs: atualiza README com novos comandos"
git commit -m "refactor: melhora performance do chat"
git commit -m "test: adiciona testes para API de leads"
```

Tipos de commit:
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação, ponto e vírgula, etc
- `refactor`: Refatoração de código
- `test`: Testes
- `chore`: Tarefas de build, configs, etc

### 5. Push e Pull Request

```bash
git push origin feature/nome-da-feature
```

Depois abra um Pull Request no GitHub com:
- Título claro e descritivo
- Descrição detalhada das mudanças
- Screenshots (se aplicável)
- Referência a issues relacionadas

## 📋 Padrões de Código

### TypeScript

- Use tipos explícitos sempre que possível
- Evite `any`, prefira `unknown`
- Use interfaces para objetos complexos
- Documente funções complexas com JSDoc

```typescript
/**
 * Gera um roteiro personalizado usando IA
 * @param params - Parâmetros do roteiro
 * @returns Roteiro gerado
 */
async function generateItinerary(params: ItineraryParams): Promise<Itinerary> {
  // ...
}
```

### React Components

- Use componentes funcionais com hooks
- Prefira composição sobre herança
- Mantenha componentes pequenos e focados
- Use TypeScript para props

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary'
  onClick: () => void
  children: React.ReactNode
}

export function Button({ variant = 'primary', onClick, children }: ButtonProps) {
  // ...
}
```

### Naming Conventions

- **Componentes:** PascalCase (`LeadCard.tsx`)
- **Funções:** camelCase (`generateReport`)
- **Constantes:** SCREAMING_SNAKE_CASE (`API_BASE_URL`)
- **Arquivos:** kebab-case (`user-profile.ts`)
- **Types/Interfaces:** PascalCase (`UserProfile`)

### Estrutura de Arquivos

```
src/
├── app/
│   ├── (auth)/          # Rotas autenticadas
│   ├── (public)/        # Rotas públicas
│   └── api/             # API routes
├── components/
│   ├── ui/              # Componentes base
│   ├── forms/           # Formulários
│   └── [feature]/       # Por funcionalidade
├── lib/
│   ├── api/             # Clients de API
│   ├── utils/           # Utilitários
│   └── hooks/           # Custom hooks
└── types/               # TypeScript types globais
```

## 🧪 Testes

### Executar Testes

```bash
npm test              # Todos os testes
npm test -- --watch   # Watch mode
npm run test:coverage # Com coverage
```

### Escrever Testes

```typescript
import { render, screen } from '@testing-library/react'
import { LeadCard } from './LeadCard'

describe('LeadCard', () => {
  it('should render lead name', () => {
    const lead = { name: 'João Silva', ... }
    render(<LeadCard lead={lead} />)
    expect(screen.getByText('João Silva')).toBeInTheDocument()
  })
})
```

## 📚 Documentação

- Documente funções complexas
- Atualize README.md quando necessário
- Adicione comentários apenas quando o código não é auto-explicativo
- Use JSDoc para funções públicas

## 🐛 Reportando Bugs

Ao reportar bugs, inclua:

1. **Descrição clara** do problema
2. **Passos para reproduzir**
3. **Comportamento esperado** vs **atual**
4. **Screenshots** ou logs (se aplicável)
5. **Ambiente:** SO, Node version, browser

## 💡 Sugerindo Features

Antes de sugerir uma feature:

1. Verifique se já não existe uma issue
2. Descreva o problema que resolve
3. Explique a solução proposta
4. Considere alternativas

## ✅ Checklist do Pull Request

Antes de submeter, verifique:

- [ ] Código compila sem erros (`npm run build`)
- [ ] Testes passam (`npm test`)
- [ ] Linter passa (`npm run lint`)
- [ ] Código está documentado
- [ ] Commits seguem Conventional Commits
- [ ] Branch está atualizada com `main`
- [ ] Screenshots adicionados (se UI)

## 🔍 Code Review

Todo PR passa por code review. Esperamos:

- Código limpo e legível
- Sem erros de linting
- Testes adequados
- Documentação atualizada

## 📞 Dúvidas?

- Abra uma [Discussion](https://github.com/seu-usuario/vo-ai/discussions)
- Consulte a [Documentação](docs/)
- Entre em contato: dev@agir.com.br

## 🙏 Obrigado!

Toda contribuição é valiosa, seja código, documentação, testes ou feedback!

---

**Happy Coding! 🚀**
