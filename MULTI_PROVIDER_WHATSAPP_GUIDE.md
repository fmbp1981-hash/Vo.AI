# 📱 Multi-Provider WhatsApp - Guia de Uso

## 🎯 Objetivo

O Vo.AI agora suporta **múltiplos provedores de WhatsApp API** sem precisar modificar código. Você pode trocar entre Evolution API, Z-API ou WhatsApp Business API (oficial) apenas mudando variáveis de ambiente.

## 🏗️ Arquitetura

```
IWhatsAppProvider (interface)
    ↓
    ├── EvolutionAPIProvider
    ├── ZAPIProvider
    └── WhatsAppBusinessAPIProvider (futuro)
    
WhatsAppProviderFactory → Cria provider baseado em .env
```

## 🚀 Como Usar

### 1. Importação Simples

```typescript
import { getWhatsAppProvider } from '@/lib/whatsapp'

// Obter provider configurado (baseado em .env)
const whatsapp = getWhatsAppProvider()

// Enviar mensagem
await whatsapp.sendTextMessage({
  number: '5511999999999',
  message: 'Olá! Como posso ajudar?'
})
```

### 2. Provider Customizado

```typescript
import { 
  createWhatsAppProvider, 
  WhatsAppProviderType 
} from '@/lib/whatsapp'

// Criar provider específico para um cliente
const whatsapp = createWhatsAppProvider(
  WhatsAppProviderType.Z_API,
  {
    apiUrl: 'https://api.z-api.io/instances/CLIENT123',
    apiKey: 'client-specific-token',
    instanceName: 'client-instance'
  }
)
```

### 3. Todos os Métodos Disponíveis

```typescript
const whatsapp = getWhatsAppProvider()

// Verificar status de conexão
const status = await whatsapp.getConnectionStatus()
console.log(status.status) // 'connected' | 'disconnected'

// Enviar texto
await whatsapp.sendTextMessage({
  number: '5511999999999',
  message: 'Texto simples'
})

// Enviar imagem
await whatsapp.sendMediaMessage({
  number: '5511999999999',
  mediaUrl: 'https://exemplo.com/imagem.jpg',
  mediaType: 'image',
  caption: 'Confira este roteiro!'
})

// Enviar botões
await whatsapp.sendButtonMessage({
  number: '5511999999999',
  title: 'Escolha uma opção',
  message: 'Como posso ajudar?',
  buttons: [
    { id: 'opcao1', displayText: '📋 Ver roteiros' },
    { id: 'opcao2', displayText: '💰 Solicitar orçamento' }
  ]
})

// Enviar lista/menu
await whatsapp.sendListMessage({
  number: '5511999999999',
  title: 'Destinos',
  message: 'Escolha seu destino:',
  buttonText: 'Ver opções',
  sections: [
    {
      title: 'Europa',
      rows: [
        { id: 'paris', title: 'Paris', description: 'Cidade luz' },
        { id: 'london', title: 'Londres', description: 'História e modernidade' }
      ]
    }
  ]
})

// Obter foto de perfil
const profile = await whatsapp.getProfilePicture('5511999999999')
console.log(profile.profilePictureUrl)

// Histórico de mensagens
const messages = await whatsapp.getChatHistory('5511999999999', 50)
```

## ⚙️ Configuração no .env

### Opção 1: Evolution API (Padrão)

```env
WHATSAPP_PROVIDER="evolution-api"
EVOLUTION_API_URL="https://your-evolution-instance.com"
EVOLUTION_API_KEY="your-api-key"
EVOLUTION_INSTANCE_NAME="voai-agir"
```

### Opção 2: Z-API

```env
WHATSAPP_PROVIDER="z-api"
ZAPI_URL="https://api.z-api.io/instances/YOUR_INSTANCE"
ZAPI_INSTANCE_ID="your-instance-id"
ZAPI_TOKEN="your-token"
```

### Opção 3: WhatsApp Business API (Futuro)

```env
WHATSAPP_PROVIDER="whatsapp-business-api"
WHATSAPP_BUSINESS_API_URL="https://graph.facebook.com/v18.0"
WHATSAPP_BUSINESS_API_TOKEN="your-meta-token"
WHATSAPP_PHONE_NUMBER_ID="your-phone-id"
```

## 🔄 Migração do Código Antigo

Se você estava usando o código antigo (`evolutionAPI` direto), apenas mude:

**Antes:**
```typescript
import { evolutionAPI } from '@/lib/whatsapp'

await evolutionAPI.sendTextMessage({...})
```

**Depois:**
```typescript
import { getWhatsAppProvider } from '@/lib/whatsapp'

const whatsapp = getWhatsAppProvider()
await whatsapp.sendTextMessage({...})
```

## 📦 Helpers Mantidos

Todas as funções auxiliares continuam disponíveis:

```typescript
import { 
  normalizePhoneNumber, 
  formatPhoneNumber,
  createQuickReplyButtons,
  createDestinationMenu
} from '@/lib/whatsapp'

const formatted = formatPhoneNumber('5511999999999')
// "+55 (11) 99999-9999"

const buttons = createQuickReplyButtons()
const menu = createDestinationMenu()
```

## 🧪 Testes

```typescript
// Verificar se provider está configurado
const whatsapp = getWhatsAppProvider()

if (!whatsapp.isConfigured()) {
  console.error('WhatsApp provider não configurado!')
}

// Testar conexão
const status = await whatsapp.getConnectionStatus()
console.log(`Status: ${status.status}`)
```

## 🔐 Webhooks

Cada provider tem seu próprio formato de webhook. Use os tipos da interface para normalizar:

```typescript
// API route: /api/webhooks/whatsapp/route.ts
import { getWhatsAppProvider } from '@/lib/whatsapp'

export async function POST(request: Request) {
  const data = await request.json()
  
  // Processar webhook (formato varia por provider)
  // ...
  
  // Responder usando provider
  const whatsapp = getWhatsAppProvider()
  await whatsapp.sendTextMessage({
    number: data.from,
    message: 'Mensagem recebida!'
  })
}
```

## 🎯 Benefícios

✅ **Flexibilidade** - Troque de provider sem modificar código  
✅ **Multi-tenant** - Providers diferentes por cliente  
✅ **Fallback** - Se um provider falha, tente outro  
✅ **Testing** - Mock providers facilmente  
✅ **Sem lock-in** - Nenhuma dependência direta de API específica  

## 🚧 Próximos Passos

- [ ] Implementar `WhatsAppBusinessAPIProvider`
- [ ] Adicionar retry logic
- [ ] Métricas por provider
- [ ] Fallback automático entre providers

## 📞 Suporte

- Evolution API: https://doc.evolution-api.com/
- Z-API: https://developer.z-api.io/
- WhatsApp Business: https://developers.facebook.com/docs/whatsapp

## 🔍 Verification and Testing

To ensure the integration is working correctly, you can use the provided test scripts.

### Testing Webhook Locally

1. Ensure your local server is running:
   ```bash
   npm run dev
   ```

2. In a separate terminal, run the test script:
   ```bash
   npx tsx scripts/test-webhook-local.ts
   ```

   This script simulates an incoming message from WhatsApp (Evolution API format) and sends it to your local webhook endpoint.

3. Check the server logs to see the processing steps:
   - Webhook reception
   - Lead creation/update
   - AI response generation
   - Message sending (mocked or real if provider is configured)

### Checking Status

You can check the connection status of your configured provider by accessing:
`GET /api/whatsapp/status`
