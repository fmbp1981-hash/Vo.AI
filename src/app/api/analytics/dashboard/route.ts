import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/analytics/dashboard
 * Returns dashboard metrics and analytics data
 */
export async function GET(request: NextRequest) {
    try {
        // Get all leads
        const leads = await prisma.lead.findMany({
            include: {
                assignedUser: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        // Calculate metrics
        const totalLeads = leads.length;
        const novoLeads = leads.filter(l => l.status === 'Novo Lead').length;
        const qualificados = leads.filter(l => l.qualificado === true).length;
        const propostas = leads.filter(l => l.status === 'Proposta Enviada').length;
        const fechados = leads.filter(l => l.status === 'Fechado').length;

        // Calculate conversion rate
        const conversionRate = totalLeads > 0
            ? Math.round((fechados / totalLeads) * 100)
            : 0;

        // Calculate average score
        const avgScore = totalLeads > 0
            ? Math.round(leads.reduce((sum, l) => sum + (l.score || 0), 0) / totalLeads)
            : 0;

        // Pipeline distribution
        const pipeline = {
            'Novo Lead': novoLeads,
            'Qualificação': leads.filter(l => l.status === 'Qualificação').length,
            'Proposta Enviada': propostas,
            'Negociação': leads.filter(l => l.status === 'Negociação').length,
            'Fechado': fechados,
            'Perdido': leads.filter(l => l.status === 'Perdido').length,
        };

        // Recent activities (last 10 leads updated)
        const recentActivities = leads
            .sort((a, b) => {
                const dateA = a.dataUltimaMensagem || a.created;
                const dateB = b.dataUltimaMensagem || b.created;
                return dateB.getTime() - dateA.getTime();
            })
            .slice(0, 10)
            .map(lead => ({
                id: lead.id,
                nome: lead.nome,
                acao: lead.ultimaMensagem ? 'Enviou mensagem' : 'Criado',
                timestamp: (lead.dataUltimaMensagem || lead.created).toISOString(),
                canal: lead.canal || 'Desconhecido',
            }));

        // Top consultants (by number of leads)
        const consultantStats = leads.reduce((acc, lead) => {
            if (lead.assignedTo && lead.assignedUser) {
                if (!acc[lead.assignedTo]) {
                    acc[lead.assignedTo] = {
                        id: lead.assignedTo,
                        name: lead.assignedUser.name || lead.assignedUser.email,
                        email: lead.assignedUser.email,
                        leadsCount: 0,
                        fechados: 0,
                    };
                }
                acc[lead.assignedTo].leadsCount++;
                if (lead.status === 'Fechado') {
                    acc[lead.assignedTo].fechados++;
                }
            }
            return acc;
        }, {} as Record<string, any>);

        const topConsultants = Object.values(consultantStats)
            .sort((a: any, b: any) => b.leadsCount - a.leadsCount)
            .slice(0, 5)
            .map((consultant: any) => ({
                ...consultant,
                conversionRate: consultant.leadsCount > 0
                    ? Math.round((consultant.fechados / consultant.leadsCount) * 100)
                    : 0,
            }));

        // Conversion funnel
        const funnel = [
            { stage: 'Novo Lead', count: novoLeads, percentage: 100 },
            { stage: 'Qualificação', count: qualificados, percentage: totalLeads > 0 ? Math.round((qualificados / totalLeads) * 100) : 0 },
            { stage: 'Proposta', count: propostas, percentage: totalLeads > 0 ? Math.round((propostas / totalLeads) * 100) : 0 },
            { stage: 'Fechado', count: fechados, percentage: totalLeads > 0 ? Math.round((fechados / totalLeads) * 100) : 0 },
        ];

        return NextResponse.json({
            success: true,
            data: {
                metrics: {
                    totalLeads,
                    novoLeads,
                    qualificados,
                    propostas,
                    fechados,
                    conversionRate,
                    avgScore,
                },
                pipeline,
                funnel,
                recentActivities,
                topConsultants,
            },
            timestamp: new Date().toISOString(),
        });
    } catch (error: any) {
        console.error('[Dashboard API] Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to fetch dashboard data',
            },
            { status: 500 }
        );
    }
}
