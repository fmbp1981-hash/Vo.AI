import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type AutomationTrigger =
    | 'lead_created'
    | 'stage_changed'
    | 'no_contact_3days'
    | 'proposal_sent'
    | 'proposal_viewed';

interface AutomationContext {
    leadId: string;
    userId?: string;
    previousStage?: string;
    currentStage?: string;
}

export class AutomationEngine {
    /**
     * Trigger automations based on an event
     */
    static async trigger(event: AutomationTrigger, context: AutomationContext) {
        console.log(`[Automation] Triggered: ${event} for lead ${context.leadId}`);

        try {
            switch (event) {
                case 'lead_created':
                    await this.handleLeadCreated(context);
                    break;
                case 'stage_changed':
                    await this.handleStageChanged(context);
                    break;
                case 'proposal_sent':
                    await this.handleProposalSent(context);
                    break;
                // Add more cases as needed
            }
        } catch (error) {
            console.error('[Automation] Error processing trigger:', error);
        }
    }

    /**
     * Handle new lead creation
     * - Create initial follow-up task
     */
    private static async handleLeadCreated(context: AutomationContext) {
        const { leadId, userId } = context;
        if (!userId) return;

        // Create "First Contact" task
        await prisma.task.create({
            data: {
                leadId,
                userId,
                type: 'follow_up',
                title: 'Primeiro Contato',
                description: 'Entrar em contato com o novo lead para qualificação.',
                priority: 'high',
                status: 'pending',
                dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // Due in 2 hours
                autoCreated: true,
            },
        });
    }

    /**
     * Handle stage changes
     */
    private static async handleStageChanged(context: AutomationContext) {
        const { leadId, userId, currentStage } = context;
        if (!userId || !currentStage) return;

        let taskTitle = '';
        let taskDesc = '';
        let dueHours = 24;

        switch (currentStage) {
            case 'Qualificação':
                taskTitle = 'Qualificar Lead';
                taskDesc = 'Coletar informações de orçamento, datas e preferências.';
                dueHours = 24;
                break;
            case 'Proposta':
                taskTitle = 'Criar Proposta';
                taskDesc = 'Gerar e enviar proposta personalizada.';
                dueHours = 48;
                break;
            case 'Negociação':
                taskTitle = 'Follow-up de Negociação';
                taskDesc = 'Verificar se o cliente tem dúvidas sobre a proposta.';
                dueHours = 24;
                break;
            case 'Fechado':
                taskTitle = 'Onboarding / Pós-venda';
                taskDesc = 'Enviar contrato e confirmar detalhes da viagem.';
                dueHours = 24;
                break;
        }

        if (taskTitle) {
            await prisma.task.create({
                data: {
                    leadId,
                    userId,
                    type: 'follow_up',
                    title: taskTitle,
                    description: taskDesc,
                    priority: 'medium',
                    status: 'pending',
                    dueDate: new Date(Date.now() + dueHours * 60 * 60 * 1000),
                    autoCreated: true,
                },
            });
        }
    }

    /**
     * Handle proposal sent
     */
    private static async handleProposalSent(context: AutomationContext) {
        const { leadId, userId } = context;
        if (!userId) return;

        // Create follow-up task for 3 days later
        await prisma.task.create({
            data: {
                leadId,
                userId,
                type: 'follow_up',
                title: 'Follow-up de Proposta',
                description: 'Verificar se o cliente visualizou a proposta e se tem dúvidas.',
                priority: 'high',
                status: 'pending',
                dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
                autoCreated: true,
            },
        });
    }
}
