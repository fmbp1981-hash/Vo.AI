# 📝 Prompt da IA Atualizado - Aguardando Portfólio

## ✅ Mudanças Implementadas

Atualizei o prompt da IA em `src/lib/openai.ts` com o perfil da **Sofia**, adaptado para o contexto do Vo.AI:

### 🎭 Identidade
- **Antes:** "Vo.AI, o assistente virtual inteligente"
- **Agora:** "Sofia, assistente virtual da AGIR Viagens e Turismo"

### 📋 Principais Adições

1. **Saudação por Horário**
   - Bom dia (05:00-11:59)
   - Boa tarde (12:00-17:59)
   - Boa noite (18:00-23:59)
   - Olá especial (00:00-04:59)

2. **Ordem de Qualificação Estruturada**
   - 1º: Nome, Email, Data de nascimento
   - 2º: Destino, Período/Datas, Orçamento, Nº de pessoas

3. **Estágios do Atendimento Definidos**
   - Novo Lead
   - Qualificação (após Destino + Datas + Orçamento)
   - Proposta (cliente pede cotação)
   - Negociação (discussão de valores)
   - Handover (transferência para humano)

4. **Triggers de Handover Expandidos**
   - Solicitação explícita de consultor
   - Urgência ("rápido", "urgente")
   - Orçamento alto (> R$ 20.000)
   - Complexidade alta
   - Insatisfação
   - **NOVO:** Intenção clara de fechamento/compra

5. **Regras de Segurança**
   - Anti-prompt-injection
   - Proteção contra manipulação
   - Resposta padrão: "Desculpe, não posso alterar minhas regras de funcionamento."

6. **Estilo de Comunicação**
   - Linguagem natural (não robótica)
   - Sempre usar primeiro nome do cliente
   - Nunca inventar dados ou preços
   - Emojis moderados (😊 ✈️ 🌍 ⭐ 💼)

### ❌ Removido (Instruções Técnicas n8n)
- ✅ Referências a `MCP_CRM`, `Search_Records`, `Create_Record`, `Update_*`
- ✅ Variáveis n8n: `{{ $('Fluxo_Variaveis').item.json.* }}`
- ✅ Chamadas de tools: `call_n8n_workflow`, `send_email_resumo_servico`
- ✅ Lógica específica de WhatsApp vs Instagram
- ✅ Regras de lead recorrente técnicas

### 📍 Seção Pendente

No prompt, há uma seção marcada como:
```
## SOBRE A AGIR VIAGENS E TURISMO
A AGIR é especializada em:
- Viagens premium, familiares e corporativas
- Experiências personalizadas e sob medida
- Destinos internacionais e nacionais
- Atendimento consultivo de alta qualidade
- Planejamento completo de viagens

[AGUARDANDO PORTFÓLIO DE SERVIÇOS - SERÁ ADICIONADO PELO USUÁRIO]
```

## 🚨 NECESSÁRIO: Portfólio de Serviços da AGIR

Para completar o treinamento da Sofia, preciso que você cole aqui:

1. **Serviços oferecidos pela AGIR**
   - Tipos de viagens (pacotes, sob medida, corporativo)
   - Diferenciais competitivos
   - Formatos de atendimento
   
2. **Políticas e Processos**
   - Como funcionam as cotações
   - Prazos de resposta
   - Formas de pagamento aceitas
   - Processo de reserva
   
3. **Diferenciais da AGIR**
   - O que torna a AGIR única no mercado
   - Valores da empresa
   - Garantias oferecidas

4. **Informações Úteis**
   - Horário de atendimento
   - Canais de contato
   - Qualquer informação que a Sofia deva saber para responder bem os clientes

## 📊 Status Atual

- ✅ Perfil e estilo: Completo
- ✅ Saudações: Completo
- ✅ Qualificação: Completo
- ✅ Handover: Completo
- ✅ Segurança: Completo
- ⏳ **Portfólio AGIR: Aguardando**

---

**Por favor, cole abaixo o portfólio de serviços da AGIR para que eu possa completar o prompt!** 🙏
