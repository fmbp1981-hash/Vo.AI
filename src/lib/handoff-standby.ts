/**
 * AI Handoff & Standby System
 * Manages AI-to-Human handover with standby mode
 */

import { prisma } from './prisma';
import { whatsappService } from './whatsapp';
import { instagramService } from './instagram';
import { io } from './socket';

export type HandoffMode = 'ai' | 'human' | 'standby';
export type HandoffReason = 
  | 'high_intent'
  | 'complex_query'
  | 'user_request'
  | 'ai_limitation'
  | 'escalation'
  | 'manual';

interface HandoffRequest {
  conversationId: string;
  leadId: string;
  reason: HandoffReason;
  context: string;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  channel: string;
}

export class HandoffStandbyService {
  /**
   * Request handoff from AI to Human
   */
  async requestHandoff(request: HandoffRequest): Promise<boolean> {
    try {
      const { conversationId, leadId, reason, context, urgency, channel } = request;

      // Update conversation to waiting_handoff
      const conversation = await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          status: 'waiting_handoff',
          handoffMode: 'human',
          handoffReason: reason,
          handoffRequestedAt: new Date(),
        },
        include: {
          lead: true,
          user: true,
        },
      });

      // Get lead details
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        include: {
          assignedUser: true,
        },
      });

      if (!lead) {
        console.error('Lead not found for handoff');
        return false;
      }

      // Find available consultant or use assigned
      let consultant = lead.assignedUser;
      
      if (!consultant) {
        // Find available consultant (simplified - could be more sophisticated)
        consultant = await prisma.user.findFirst({
          where: {
            role: 'consultant',
            isActive: true,
            notifyOnHandoff: true,
          },
        });
      }

      if (!consultant) {
        console.error('No consultant available for handoff');
        return false;
      }

      // Assign conversation to consultant
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          userId: consultant.id,
          assignedAt: new Date(),
        },
      });

      // Update lead assignment
      if (!lead.assignedTo) {
        await prisma.lead.update({
          where: { id: leadId },
          data: {
            assignedTo: consultant.id,
            assignedAt: new Date(),
          },
        });
      }

      // Create notification in system
      await prisma.notification.create({
        data: {
          userId: consultant.id,
          type: 'handoff',
          title: `🚨 Handoff Urgente: ${lead.nome}`,
          message: `Lead ${lead.nome} precisa de atendimento humano. Motivo: ${this.getReasonText(reason)}`,
          link: `/chat/${conversationId}`,
        },
      });

      // Send WhatsApp notification to consultant
      if (consultant.phoneNumber) {
        await this.notifyConsultantViaWhatsApp(consultant, lead, reason, urgency);
      }

      // Emit real-time notification via Socket.io
      io.to(`user:${consultant.id}`).emit('handoff_request', {
        conversationId,
        leadId,
        leadName: lead.nome,
        reason,
        urgency,
        context,
        channel,
      });

      // Send message to lead
      await this.sendHandoffMessageToLead(lead, channel, consultant.name || 'consultor');

      // Put AI in standby mode
      await this.setAIStandby(conversationId);

      console.log(`✅ Handoff requested: ${conversationId} → ${consultant.name}`);
      return true;
    } catch (error) {
      console.error('Error requesting handoff:', error);
      return false;
    }
  }

  /**
   * Accept handoff - Consultant starts attending
   */
  async acceptHandoff(conversationId: string, consultantId: string): Promise<boolean> {
    try {
      const conversation = await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          status: 'human_attending',
          handoffMode: 'human',
          handoffAcceptedAt: new Date(),
          consultantNotified: true,
        },
      });

      // Emit to Socket.io
      io.to(`conversation:${conversationId}`).emit('handoff_accepted', {
        consultantId,
        timestamp: new Date(),
      });

      console.log(`✅ Handoff accepted: ${conversationId} by ${consultantId}`);
      return true;
    } catch (error) {
      console.error('Error accepting handoff:', error);
      return false;
    }
  }

  /**
   * Finish human attendance - Return to AI (standby ends)
   */
  async finishHumanAttendance(conversationId: string): Promise<boolean> {
    try {
      const conversation = await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          status: 'active',
          handoffMode: 'ai',
          handoffReason: null,
          lastHumanMessageAt: new Date(),
        },
        include: {
          lead: true,
        },
      });

      // Send message to lead
      if (conversation.lead) {
        await this.sendReturnToAIMessage(conversation.lead, conversation.channel);
      }

      // Emit to Socket.io
      io.to(`conversation:${conversationId}`).emit('handoff_finished', {
        timestamp: new Date(),
        mode: 'ai',
      });

      console.log(`✅ Human attendance finished: ${conversationId} - AI resumed`);
      return true;
    } catch (error) {
      console.error('Error finishing human attendance:', error);
      return false;
    }
  }

  /**
   * Set AI in standby mode
   */
  async setAIStandby(conversationId: string): Promise<void> {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        handoffMode: 'standby',
        lastAiMessageAt: new Date(),
      },
    });

    console.log(`🤖 AI in standby: ${conversationId}`);
  }

  /**
   * Check if AI should respond (not in standby)
   */
  async canAIRespond(conversationId: string): Promise<boolean> {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { handoffMode: true, status: true },
    });

    if (!conversation) return false;

    // AI can respond only if mode is 'ai' and status is 'active'
    return conversation.handoffMode === 'ai' && conversation.status === 'active';
  }

  /**
   * Detect if handoff is needed based on AI response
   */
  detectHandoffIntent(message: string, aiResponse: string): {
    needsHandoff: boolean;
    reason?: HandoffReason;
    urgency?: 'low' | 'medium' | 'high' | 'urgent';
  } {
    const lowerMessage = message.toLowerCase();
    const lowerResponse = aiResponse.toLowerCase();

    // High intent keywords
    const highIntentKeywords = [
      'fechar', 'comprar', 'contratar', 'pagamento', 'pagar',
      'confirmação', 'assinar', 'negociar', 'desconto', 'urgente'
    ];

    // User requesting human
    const humanRequestKeywords = [
      'falar com humano', 'atendente', 'consultor', 'pessoa',
      'alguém', 'gerente', 'representante'
    ];

    // Complex queries
    const complexKeywords = [
      'não entendi', 'não sei', 'complicado', 'difícil',
      'específico', 'detalhado', 'personalizado'
    ];

    // Check for user requesting human
    if (humanRequestKeywords.some(kw => lowerMessage.includes(kw))) {
      return {
        needsHandoff: true,
        reason: 'user_request',
        urgency: 'high',
      };
    }

    // Check for high intent
    if (highIntentKeywords.some(kw => lowerMessage.includes(kw))) {
      return {
        needsHandoff: true,
        reason: 'high_intent',
        urgency: 'urgent',
      };
    }

    // Check for complex queries
    if (complexKeywords.some(kw => lowerMessage.includes(kw) || lowerResponse.includes(kw))) {
      return {
        needsHandoff: true,
        reason: 'complex_query',
        urgency: 'medium',
      };
    }

    return { needsHandoff: false };
  }

  /**
   * Send WhatsApp notification to consultant
   */
  private async notifyConsultantViaWhatsApp(
    consultant: any,
    lead: any,
    reason: HandoffReason,
    urgency: string
  ): Promise<void> {
    const urgencyEmoji = {
      low: '🔵',
      medium: '🟡',
      high: '🟠',
      urgent: '🔴',
    }[urgency];

    const message = `${urgencyEmoji} *NOVO ATENDIMENTO AGUARDANDO*\n\n` +
      `👤 *Lead:* ${lead.nome}\n` +
      `📱 *Canal:* ${lead.canal || 'WhatsApp'}\n` +
      `📍 *Destino:* ${lead.destino || 'Não informado'}\n` +
      `💰 *Orçamento:* ${lead.orcamento || 'Não informado'}\n` +
      `⚡ *Motivo:* ${this.getReasonText(reason)}\n\n` +
      `🔗 Acesse o sistema para atender: https://app.voai.com.br/chat/${lead.id}`;

    try {
      await whatsappService.sendMessage(consultant.phoneNumber, message);
    } catch (error) {
      console.error('Error sending WhatsApp notification to consultant:', error);
    }
  }

  /**
   * Send handoff message to lead
   */
  private async sendHandoffMessageToLead(
    lead: any,
    channel: string,
    consultantName: string
  ): Promise<void> {
    const message = 
      `Vou transferir você para ${consultantName}, um consultor especializado que pode te ajudar melhor com sua viagem! ✨\n\n` +
      `Aguarde um momento enquanto ele se conecta...`;

    try {
      if (channel === 'whatsapp' && lead.telefoneNormalizado) {
        await whatsappService.sendMessage(lead.telefoneNormalizado, message);
      } else if (channel === 'instagram') {
        await instagramService.sendMessage(lead.userId, message);
      }
    } catch (error) {
      console.error('Error sending handoff message to lead:', error);
    }
  }

  /**
   * Send return to AI message
   */
  private async sendReturnToAIMessage(lead: any, channel: string): Promise<void> {
    const message = 
      `Obrigado por conversar com nosso consultor! 😊\n\n` +
      `Estou de volta para te ajudar com qualquer dúvida. Se precisar falar novamente com um consultor, é só me avisar!`;

    try {
      if (channel === 'whatsapp' && lead.telefoneNormalizado) {
        await whatsappService.sendMessage(lead.telefoneNormalizado, message);
      } else if (channel === 'instagram') {
        await instagramService.sendMessage(lead.userId, message);
      }
    } catch (error) {
      console.error('Error sending return to AI message:', error);
    }
  }

  /**
   * Get human-readable reason text
   */
  private getReasonText(reason: HandoffReason): string {
    const reasons: Record<HandoffReason, string> = {
      high_intent: 'Alta intenção de compra',
      complex_query: 'Consulta complexa',
      user_request: 'Cliente solicitou atendimento humano',
      ai_limitation: 'Limitação do assistente IA',
      escalation: 'Escalação necessária',
      manual: 'Transferência manual',
    };

    return reasons[reason] || reason;
  }
}

export const handoffStandbyService = new HandoffStandbyService();
