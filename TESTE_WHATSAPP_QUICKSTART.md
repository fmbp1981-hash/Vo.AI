# 🚀 Guia Rápido de Configuração e Teste - WhatsApp Integration

## 📋 Pré-requisitos

Antes de testar, você precisa configurar as credenciais da Evolution API no arquivo `.env`.

## 1️⃣ Configurar .env

Abra o arquivo `.env` na raiz do projeto e adicione as seguintes variáveis:

```env
# WhatsApp Multi-Provider Configuration
WHATSAPP_PROVIDER="evolution-api"

# Evolution API Credentials
EVOLUTION_API_URL="https://your-evolution-instance.com"
EVOLUTION_API_KEY="your-api-key-here"
EVOLUTION_INSTANCE_NAME="voai-agir"
```

### Como Obter Credenciais Evolution API

**Opção 1: Cloud (Recomendado para MVP)**
- Acesse um provedor de Evolution API cloud
- Contrate um plano (geralmente R$ 60-120/mês)
- Receba as credenciais por email

**Opção 2: Self-Hosted (Econômico)**
- Instale Evolution API em um VPS próprio
- Configure as credenciais localmente
- Custo: apenas VPS (~R$ 30/mês)

## 2️⃣ Iniciar Servidor de Desenvolvimento

```bash
cd "G:/Meu Drive/Profissional/Empreendedorismo/Inteligência Artificial/IntelliX.AI/Sistemas/Vo.AI"
npm run dev
```

Aguarde até ver:
```
✓ Ready in X.Xs
Local: http://localhost:3000
```

## 3️⃣ Testar Endpoints

### Teste 1: Status de Conexão

**Navegador ou curl:**
```bash
curl http://localhost:3000/api/whatsapp/status
```

**Resposta esperada (sem configuração):**
```json
{
  "success": false,
  "error": "WhatsApp provider not configured",
  "data": {
    "configured": false,
    "provider": "evolution-api"
  }
}
```

**Resposta esperada (com configuração):**
```json
{
  "success": true,
  "data": {
    "state": "open",
    "status": "connected",
    "configured": true,
    "provider": "evolution-api"
  }
}
```

---

### Teste 2: QR Code (Conectar WhatsApp)

**Navegador:**
```
http://localhost:3000/api/whatsapp/qrcode
```

**Ou curl:**
```bash
curl http://localhost:3000/api/whatsapp/qrcode
```

**Resposta esperada:**
```json
{
  "success": true,
  "data": {
    "qrcode": "data:image/png;base64,iVBORw0KG...",
    "status": "disconnected"
  }
}
```

**Como usar:**
1. Copie o valor de `qrcode` (base64)
2. Cole em uma tag `<img src="...">` no navegador
3. Escaneie com WhatsApp → Aparelhos conectados → Conectar aparelho

---

### Teste 3: Enviar Mensagem Manual

**Criar arquivo `test-send.json`:**
```json
{
  "phone": "(11) 99999-9999",
  "message": "Teste do Vo.AI! 🚀"
}
```

**Enviar com curl:**
```bash
curl -X POST http://localhost:3000/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -d @test-send.json
```

**Ou inline:**
```bash
curl -X POST http://localhost:3000/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{"phone":"5511999999999","message":"Teste!"}'
```

**Resposta esperada:**
```json
{
  "success": true,
  "data": {
    "messageId": "...",
    "status": "sent"
  },
  "phone": "5511999999999"
}
```

---

### Teste 4: Webhook (Simulação)

**Criar arquivo `test-webhook.json` simulando Evolution API:**
```json
{
  "data": {
    "key": {
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": false,
      "id": "test-message-id"
    },
    "messageType": "conversation",
    "message": {
      "conversation": "Olá! Quero viajar para Paris em dezembro."
    }
  }
}
```

**Testar webhook:**
```bash
curl -X POST http://localhost:3000/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d @test-webhook.json
```

**Resposta esperada:**
```json
{
  "success": true,
  "leadId": "clxxxxx..."
}
```

**Verificar logs no console** para ver:
- Lead criado
- IA gerando resposta
- Mensagem enviada via WhatsApp

---

## 4️⃣ Configurar Webhook na Evolution API

Após WhatsApp conectado, configure o webhook:

**Na Evolution API Dashboard:**
1. Acesse configurações da instância
2. Webhook URL: `https://seu-dominio.com/api/whatsapp/webhook`
3. Eventos: marque `messages.upsert`
4. Salvar

**Para testes locais, use ngrok:**
```bash
ngrok http 3000
```

Copie a URL: `https://xxxx-xx-xx-xxx-xxx.ngrok.io`

Configure webhook: `https://xxxx-xx-xx-xxx-xxx.ngrok.io/api/whatsapp/webhook`

---

## 5️⃣ Teste End-to-End

1. **Conectar WhatsApp** via QR code
2. **Configurar webhook** da Evolution API
3. **Enviar mensagem** do seu WhatsApp para o número conectado:
   - "Olá! Quero viajar para Paris."
4. **Verificar:**
   - Sofia AI responde automaticamente
   - Lead criado no banco de dados
   - Conversa salva

---

## 🐛 Troubleshooting

### Erro: "WhatsApp provider not configured"
- ✅ Verifique se `.env` tem as variáveis corretas
- ✅ Reinicie o servidor (`npm run dev`)

### Erro: "Failed to get QR code"
- ✅ Verifique `EVOLUTION_API_URL` e `EVOLUTION_API_KEY`
- ✅ Teste URL da API direto no navegador

### Mensagem não chega no webhook
- ✅ Verifique se webhook está configurado na Evolution API
- ✅ Teste URL do webhook com curl
- ✅ Verifique logs do servidor

### IA não responde
- ✅ Verifique `OPENAI_API_KEY` no `.env`
- ✅ Verifique logs para erros da OpenAI
- ✅ Confirme que lead foi criado no banco

---

## ✅ Checklist de Testes

- [ ] Status endpoint funciona
- [ ] QR code é gerado
- [ ] WhatsApp conectado com sucesso
- [ ] Mensagem manual enviada
- [ ] Webhook recebe mensagens
- [ ] Sofia AI responde corretamente
- [ ] Lead criado no banco
- [ ] Conversa salva no banco
- [ ] Handover funciona ("quero falar com consultor")

---

## 📞 Próximos Passos

Após todos os testes passarem:
1. Deploy em staging/produção
2. Configurar webhook production
3. Testar com usuários reais
4. Monitorar logs e métricas

**Status:** Pronto para testes! 🚀
