# Configuração de Variáveis de Ambiente no Vercel

Seu projeto Vo.AI está rodando no Vercel, mas precisa das **Variáveis de Ambiente** configuradas para acessar o banco de dados e funcionar corretamente.

O erro `Environment variable not found: DATABASE_URL` indica que a aplicação não sabe onde está o seu banco de dados.

## Passo a Passo para Corrigir

1.  Acesse o [Dashboard do Vercel](https://vercel.com/dashboard).
2.  Selecione o projeto **Vo.AI**.
3.  Vá em **Settings** (Configurações) -> **Environment Variables**.
4.  Adicione as seguintes variáveis (você pode copiar os valores do seu arquivo `.env` local ou `.env.example`):

### Variáveis Obrigatórias (Críticas)

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | URL de conexão do PostgreSQL (Supabase/Neon) | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_SECRET` | Chave secreta para criptografar sessões | `qualquer-string-longa-e-aleatoria` |
| `NEXTAUTH_URL` | URL do seu site em produção | `https://vo-ai.vercel.app` |

### Outras Variáveis Importantes

| Variável | Descrição |
|----------|-----------|
| `OPENAI_API_KEY` | Para funcionalidades de IA |
| `WHATSAPP_PROVIDER` | `evolution-api` (padrão) |
| `EVOLUTION_API_URL` | URL da Evolution API |
| `EVOLUTION_API_KEY` | Chave da Evolution API |

## Após Configurar

1.  Depois de adicionar as variáveis, vá na aba **Deployments**.
2.  Clique no último deploy (ou faça um novo commit por aqui para forçar).
3.  Clique em **Redeploy** para que as novas variáveis entrem em vigor.
