import { PrismaClient } from '@prisma/client';
import { addHours, differenceInHours, differenceInDays } from 'date-fns';

const prisma = new PrismaClient();

interface FollowUpConfig {
  type: string;
  delay: number;
  message: (lead: any) => string;
  condition: (lead: any) => boolean;
}

// FLUXO 1: Follow-ups de não resposta (2h, 4h, 1d, 2d)
const FOLLOWUP_CONFIGS: FollowUpConfig[] = [
  {
    type: 'no_response_2h',
    delay: 2,
    condition: (lead) => !lead.followUp2hEnviado && lead.dataUltimaMensagem && differenceInHours(new Date(), new Date(lead.dataUltimaMensagem)) >= 2,
    message: (lead) => `Olá ${lead.nome}! 👋\n\nNotei que você nos procurou há pouco tempo sobre uma viagem para ${lead.destino || 'seu destino dos sonhos'}. Estou aqui para ajudar! 🌍\n\nTem alguma dúvida que eu possa esclarecer? Posso criar um roteiro personalizado para você! ✈️`
  },
  {
    type: 'no_response_4h',
    delay: 4,
    condition: (lead) => !lead.followUp4hEnviado && lead.followUp2hEnviado && lead.dataUltimaMensagem && differenceInHours(new Date(), new Date(lead.dataUltimaMensagem)) >= 4,
    message: (lead) => `Oi ${lead.nome}! 😊\n\nSeguimos à disposição para planejar sua viagem! ${lead.destino ? `${lead.destino} é um destino incrível!` : 'Temos opções incríveis para você!'} 🎒\n\nQue tal conversarmos sobre o que você está buscando? Posso enviar algumas sugestões!`
  },
  {
    type: 'no_response_1d',
    delay: 24,
    condition: (lead) => !lead.followUp1dEnviado && lead.followUp4hEnviado && lead.dataUltimaMensagem && differenceInDays(new Date(), new Date(lead.dataUltimaMensagem)) >= 1,
    message: (lead) => `Olá ${lead.nome}! 🌟\n\nSó passando para lembrar que estamos prontos para realizar sua viagem dos sonhos! ${lead.orcamento ? `Tenho opções que se encaixam no seu orçamento de ${lead.orcamento}!` : ''}\n\nPosso preparar uma proposta completa para você? 📋✨`
  },
  {
    type: 'no_response_2d',
    delay: 48,
    condition: (lead) => !lead.followUp2dEnviado && lead.followUp1dEnviado && lead.dataUltimaMensagem && differenceInDays(new Date(), new Date(lead.dataUltimaMensagem)) >= 2,
    message: (lead) => `Oi ${lead.nome}! 💙\n\nEsta é minha última mensagem por enquanto para não incomodar. ${lead.dataPartida ? `Mas lembre-se: sua viagem está programada para ${new Date(lead.dataPartida).toLocaleDateString('pt-BR')}!` : ''}\n\nSe precisar de algo, estarei aqui! Basta chamar! 🙌`
  }
];

// FLUXO 2: Reativação de leads inativos (30d, 45d)
const INACTIVITY_CONFIGS: FollowUpConfig[] = [
  {
    type: 'inactivity_30d',
    delay: 30 * 24,
    condition: (lead) => !lead.followUp30dEnviado && lead.estagio !== 'Fechado' && lead.estagio !== 'Perdido' && lead.updatedAt && differenceInDays(new Date(), new Date(lead.updatedAt)) >= 30,
    message: (lead) => `Olá ${lead.nome}! 🌴\n\nFaz um tempo que não conversamos! ${lead.destino ? `Ainda está planejando aquela viagem para ${lead.destino}?` : 'Ainda está com planos de viajar?'}\n\nTemos novidades incríveis e promoções especiais! Que tal retomar nosso papo? 🎉✈️`
  },
  {
    type: 'inactivity_45d',
    delay: 45 * 24,
    condition: (lead) => !lead.followUp45dEnviado && lead.followUp30dEnviado && lead.estagio !== 'Fechado' && lead.estagio !== 'Perdido' && lead.updatedAt && differenceInDays(new Date(), new Date(lead.updatedAt)) >= 45,
    message: (lead) => `${lead.nome}, ainda pensando em viajar? 🤔\n\nSó queria avisar que continuamos com as melhores opções para você! ${lead.orcamento ? `E dentro do orçamento que você mencionou (${lead.orcamento})!` : ''}\n\nBora realizar esse sonho? Me chama! 💪🌍`
  }
];

// FLUXO 3: Lembretes de viagem (7d, 1d, dia da viagem)
const REMINDER_CONFIGS = {
  reminder_7d: {
    type: 'reminder_7d',
    message: (lead: any) => {
      const isInternational = lead.tipoViagem === 'internacional';
      return `🎉 ${lead.nome}, faltam apenas 7 dias para sua viagem! 🎉\n\n✅ *Checklist importante:*\n${isInternational ? '🛂 Passaporte (validade mínima 6 meses)\n💉 Vacinas obrigatórias\n💳 Cartão internacional habilitado\n🌐 Seguro viagem internacional\n📱 Chip internacional ou roaming\n' : '🆔 RG ou CNH (documentos originais)\n💳 Cartões de débito/crédito\n'}📋 Vouchers e reservas impressos\n💊 Medicamentos pessoais\n🔌 Carregadores e adaptadores\n\nQualquer dúvida, estamos aqui! Boa viagem! ✈️🌍`;
    }
  },
  reminder_1d: {
    type: 'reminder_1d',
    message: (lead: any) => {
      const isInternational = lead.tipoViagem === 'internacional';
      return `⏰ ${lead.nome}, AMANHÃ é o grande dia! ⏰\n\n🎒 *Últimas verificações:*\n${isInternational ? '✈️ Check-in online já feito?\n🎫 Passaporte + passagens à mão?\n💵 Moeda estrangeira?\n📞 Seguro viagem ativo?\n' : '✈️ Check-in online já feito?\n🎫 Documentos + passagens?\n💰 Dinheiro em espécie?\n'}🔋 Dispositivos carregados?\n🧳 Bagagens pesadas e etiquetadas?\n\nTenha uma viagem incrível! 🌟 A equipe AGIR está torcendo por você! 💙`;
    }
  },
  reminder_day: {
    type: 'reminder_day',
    message: (lead: any) => `🚀 ${lead.nome}, HOJE É O DIA! 🚀\n\n✈️ Sua aventura começa agora! Chegue ao aeroporto com ${lead.tipoViagem === 'internacional' ? '3 horas' : '2 horas'} de antecedência.\n\n📸 Não esqueça de registrar tudo e marcar @agirviagens nas redes sociais! Queremos ver seus momentos incríveis! 🤳✨\n\nBoa viagem e volte com muitas histórias! 🌍💙`
  }
};

// FLUXO 4: Feedback pós-viagem (2 dias após retorno)
const FEEDBACK_CONFIG = {
  type: 'feedback_2d',
  message: (lead: any) => `Oi ${lead.nome}! 🙋‍♀️\n\nEspero que tenha aproveitado muito sua viagem para ${lead.destino}! 🌟\n\nGostaria muito de saber como foi sua experiência:\n\n1️⃣ Como foi a viagem em geral?\n2️⃣ Os serviços contratados atenderam suas expectativas?\n3️⃣ Como você avalia o atendimento da AGIR?\n4️⃣ Recomendaria nossos serviços?\n\nSeu feedback é muito importante para nós! 💙\n\nE já pensando na próxima... tem algum destino em mente? 😉✈️`
};

export class FollowUpService {
  
  async processNoResponseFollowUps() {
    console.log('🔄 Processando follow-ups de não resposta...');
    
    const leads = await prisma.lead.findMany({
      where: { estagio: { notIn: ['Fechado', 'Perdido', 'Cancelado'] } }
    });

    for (const lead of leads) {
      for (const config of FOLLOWUP_CONFIGS) {
        if (config.condition(lead)) {
          await this.scheduleFollowUp(lead, config);
        }
      }
      
      // Encerrar após 3 dias
      if (lead.dataUltimaMensagem && differenceInDays(new Date(), new Date(lead.dataUltimaMensagem)) >= 3) {
        await this.closeInactiveConversation(lead);
      }
    }
  }

  async processInactivityReactivation() {
    console.log('🔄 Processando reativação de leads inativos...');
    
    const leads = await prisma.lead.findMany({
      where: { estagio: { notIn: ['Fechado', 'Perdido', 'Cancelado'] } }
    });

    for (const lead of leads) {
      for (const config of INACTIVITY_CONFIGS) {
        if (config.condition(lead)) {
          await this.scheduleFollowUp(lead, config);
        }
      }
    }
  }

  async processTravelReminders() {
    console.log('🔄 Processando lembretes de viagem...');
    
    const leads = await prisma.lead.findMany({
      where: { estagio: 'Fechado', dataPartida: { not: null } }
    });

    const now = new Date();

    for (const lead of leads) {
      if (!lead.dataPartida) continue;

      const daysUntil = differenceInDays(new Date(lead.dataPartida), now);

      if (daysUntil === 7 && !lead.lembrete7dEnviado) {
        await this.scheduleTravelReminder(lead, REMINDER_CONFIGS.reminder_7d);
      }
      if (daysUntil === 1 && !lead.lembrete1dEnviado) {
        await this.scheduleTravelReminder(lead, REMINDER_CONFIGS.reminder_1d);
      }
      if (daysUntil === 0 && !lead.lembreteDiaEnviado) {
        await this.scheduleTravelReminder(lead, REMINDER_CONFIGS.reminder_day);
      }
    }
  }

  async processFeedbackRequests() {
    console.log('🔄 Processando feedback...');
    
    const leads = await prisma.lead.findMany({
      where: { estagio: 'Fechado', dataRetorno: { not: null }, feedbackEnviado: false }
    });

    const now = new Date();

    for (const lead of leads) {
      if (!lead.dataRetorno) continue;
      
      if (differenceInDays(now, new Date(lead.dataRetorno)) === 2) {
        await this.scheduleFeedback(lead);
      }
    }
  }

  async sendClosureConfirmation(leadId: string) {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { proposals: true, itineraries: true }
    });

    if (!lead || lead.confirmacaoEnviada) return;

    const message = `🎉 *CONFIRMAÇÃO - AGIR Viagens* 🎉\n\n` +
      `Olá ${lead.nome}! Sua viagem está confirmada! ✈️\n\n` +
      `📋 *RESUMO:*\n` +
      `🌍 Destino: ${lead.destino}\n` +
      `📅 Partida: ${lead.dataPartida ? new Date(lead.dataPartida).toLocaleDateString('pt-BR') : 'A definir'}\n` +
      `📅 Retorno: ${lead.dataRetorno ? new Date(lead.dataRetorno).toLocaleDateString('pt-BR') : 'A definir'}\n` +
      `👥 Pessoas: ${lead.pessoas}\n\n` +
      `${lead.tipoViagem === 'internacional' ? '🛂 Viagem internacional - não esqueça seu passaporte!\n' : '🆔 Viagem nacional - leve RG ou CNH\n'}` +
      `📱 Em breve você receberá lembretes!\n\n` +
      `Equipe AGIR Viagens 💙`;

    await this.sendMessage(lead, message, 'both');
    await prisma.lead.update({ where: { id: leadId }, data: { confirmacaoEnviada: true } });
  }

  private async scheduleFollowUp(lead: any, config: FollowUpConfig) {
    const scheduledFor = addHours(new Date(), config.delay);
    
    await prisma.followUp.create({
      data: {
        leadId: lead.id,
        type: config.type,
        message: config.message(lead),
        channel: 'whatsapp',
        scheduledFor,
        status: 'pending'
      }
    });

    const updateData: any = {};
    if (config.type === 'no_response_2h') updateData.followUp2hEnviado = true;
    if (config.type === 'no_response_4h') updateData.followUp4hEnviado = true;
    if (config.type === 'no_response_1d') updateData.followUp1dEnviado = true;
    if (config.type === 'no_response_2d') updateData.followUp2dEnviado = true;
    if (config.type === 'inactivity_30d') updateData.followUp30dEnviado = true;
    if (config.type === 'inactivity_45d') updateData.followUp45dEnviado = true;

    await prisma.lead.update({ where: { id: lead.id }, data: updateData });
  }

  private async scheduleTravelReminder(lead: any, config: any) {
    await prisma.followUp.create({
      data: {
        leadId: lead.id,
        type: config.type,
        message: config.message(lead),
        channel: 'both',
        scheduledFor: new Date(),
        status: 'pending'
      }
    });

    const updateData: any = {};
    if (config.type === 'reminder_7d') updateData.lembrete7dEnviado = true;
    if (config.type === 'reminder_1d') updateData.lembrete1dEnviado = true;
    if (config.type === 'reminder_day') updateData.lembreteDiaEnviado = true;

    await prisma.lead.update({ where: { id: lead.id }, data: updateData });
    await this.sendMessage(lead, config.message(lead), 'both');
  }

  private async scheduleFeedback(lead: any) {
    await prisma.followUp.create({
      data: {
        leadId: lead.id,
        type: FEEDBACK_CONFIG.type,
        message: FEEDBACK_CONFIG.message(lead),
        channel: 'whatsapp',
        scheduledFor: new Date(),
        status: 'pending'
      }
    });

    await prisma.lead.update({ where: { id: lead.id }, data: { feedbackEnviado: true } });
    await this.sendMessage(lead, FEEDBACK_CONFIG.message(lead), 'whatsapp');
  }

  private async closeInactiveConversation(lead: any) {
    await prisma.conversation.updateMany({
      where: { leadId: lead.id, status: 'active' },
      data: { status: 'closed' }
    });

    await prisma.lead.update({
      where: { id: lead.id },
      data: { estagio: 'Perdido', motivoCancelamento: 'Sem resposta após 3 dias' }
    });
  }

  private async sendMessage(lead: any, message: string, channel: 'whatsapp' | 'email' | 'both') {
    // TODO: Integração WhatsApp e Email
    console.log(`📤 ${channel} para ${lead.nome}:`, message);
    return true;
  }

  async processPendingFollowUps() {
    const pending = await prisma.followUp.findMany({
      where: { status: 'pending', scheduledFor: { lte: new Date() } },
      include: { lead: true }
    });

    for (const followUp of pending) {
      try {
        await this.sendMessage(followUp.lead, followUp.message, followUp.channel as any);
        await prisma.followUp.update({
          where: { id: followUp.id },
          data: { status: 'sent', sentAt: new Date() }
        });
      } catch (error: any) {
        await prisma.followUp.update({
          where: { id: followUp.id },
          data: { status: 'failed', errorMessage: error.message }
        });
      }
    }
  }

  async processAll() {
    console.log('🚀 Processando follow-ups...');
    await this.processNoResponseFollowUps();
    await this.processInactivityReactivation();
    await this.processTravelReminders();
    await this.processFeedbackRequests();
    await this.processPendingFollowUps();
    console.log('✅ Concluído!');
  }
}

export default new FollowUpService();
