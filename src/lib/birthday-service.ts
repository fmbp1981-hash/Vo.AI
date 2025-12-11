/**
 * Birthday Service
 * 
 * Serviço para verificar aniversariantes e enviar mensagens de felicitações
 */

import { db } from './db'
import { getWhatsAppProvider } from './whatsapp'
import { sendNotification } from './notifications'

export interface BirthdayLead {
    id: string
    nome: string
    telefone?: string
    telefoneNormalizado?: string
    email?: string
    dataNascimento: string
    assignedTo?: string
}

export class BirthdayService {
    /**
     * Verificar aniversariantes do dia
     */
    static async getTodayBirthdays(tenantId?: string): Promise<BirthdayLead[]> {
        const today = new Date()
        const day = today.getDate().toString().padStart(2, '0')
        const month = (today.getMonth() + 1).toString().padStart(2, '0')

        // Buscar leads com data de nascimento no formato DD/MM ou DD-MM
        const leads = await db.lead.findMany({
            where: {
                ...(tenantId && { tenantId }),
                dataNascimento: {
                    not: null,
                },
                OR: [
                    { dataNascimento: { contains: `${day}/${month}` } },
                    { dataNascimento: { contains: `${day}-${month}` } },
                    { dataNascimento: { startsWith: `${day}/${month}` } },
                    { dataNascimento: { startsWith: `${day}-${month}` } },
                ],
            },
            select: {
                id: true,
                nome: true,
                telefone: true,
                telefoneNormalizado: true,
                email: true,
                dataNascimento: true,
                assignedTo: true,
            },
        })

        return leads as BirthdayLead[]
    }

    /**
     * Gerar mensagem de aniversário personalizada
     */
    static generateBirthdayMessage(nome: string): string {
        const primeiroNome = nome.split(' ')[0]

        const messages = [
            `🎂 Feliz Aniversário, ${primeiroNome}! 🎉\n\nToda a equipe da AGIR Viagens deseja a você um dia muito especial, repleto de alegrias e realizações!\n\nQue tal celebrar com uma viagem dos sonhos? 🌍✨\n\nEstamos aqui para ajudar a tornar seu próximo destino inesquecível!\n\nUm grande abraço! 💐`,

            `🎊 Parabéns, ${primeiroNome}! 🎂\n\nHoje é seu dia especial e queremos celebrar com você!\n\nA AGIR Viagens deseja muita saúde, paz e muitas viagens incríveis! ✈️🌴\n\nConte conosco para transformar seus sonhos de viagem em realidade!\n\nFelicidades! 🥳`,

            `✨ Feliz Aniversário, ${primeiroNome}! ✨\n\nNeste dia tão especial, a família AGIR Viagens quer celebrar com você!\n\nQue seu novo ciclo seja repleto de aventuras, descobertas e destinos incríveis! 🗺️🎁\n\nEstamos prontos para ajudar você a viver experiências inesquecíveis!\n\nMuitas felicidades! 🎈`,
        ]

        // Selecionar mensagem aleatória
        return messages[Math.floor(Math.random() * messages.length)]
    }

    /**
     * Enviar mensagens de aniversário
     */
    static async sendBirthdayMessages(tenantId?: string): Promise<{ sent: number; failed: number }> {
        const birthdays = await this.getTodayBirthdays(tenantId)
        let sent = 0
        let failed = 0

        for (const lead of birthdays) {
            try {
                const message = this.generateBirthdayMessage(lead.nome)

                // Enviar via WhatsApp se tiver telefone
                if (lead.telefoneNormalizado || lead.telefone) {
                    const whatsapp = getWhatsAppProvider()
                    await whatsapp.sendTextMessage(
                        lead.telefoneNormalizado || lead.telefone!,
                        message
                    )

                    // Atualizar última mensagem do lead
                    await db.lead.update({
                        where: { id: lead.id },
                        data: {
                            ultimaMensagem: '🎂 Mensagem de aniversário enviada',
                            dataUltimaMensagem: new Date(),
                        },
                    })

                    sent++
                    console.log(`[Birthday] Mensagem enviada para ${lead.nome}`)
                }

                // Notificar consultor responsável
                if (lead.assignedTo) {
                    await sendNotification({
                        userId: lead.assignedTo,
                        type: 'birthday',
                        title: '🎂 Aniversariante do dia!',
                        message: `${lead.nome} está fazendo aniversário hoje. Uma mensagem de felicitações foi enviada.`,
                        link: `/crm`,
                    })
                }
            } catch (error) {
                console.error(`[Birthday] Erro ao enviar para ${lead.nome}:`, error)
                failed++
            }
        }

        return { sent, failed }
    }

    /**
     * Verificar aniversariantes da semana (para planejamento)
     */
    static async getWeekBirthdays(tenantId?: string): Promise<BirthdayLead[]> {
        const today = new Date()
        const birthdaysThisWeek: BirthdayLead[] = []

        for (let i = 0; i < 7; i++) {
            const date = new Date(today)
            date.setDate(date.getDate() + i)

            const day = date.getDate().toString().padStart(2, '0')
            const month = (date.getMonth() + 1).toString().padStart(2, '0')

            const leads = await db.lead.findMany({
                where: {
                    ...(tenantId && { tenantId }),
                    dataNascimento: {
                        not: null,
                    },
                    OR: [
                        { dataNascimento: { contains: `${day}/${month}` } },
                        { dataNascimento: { contains: `${day}-${month}` } },
                    ],
                },
                select: {
                    id: true,
                    nome: true,
                    telefone: true,
                    telefoneNormalizado: true,
                    email: true,
                    dataNascimento: true,
                    assignedTo: true,
                },
            })

            birthdaysThisWeek.push(...(leads as BirthdayLead[]))
        }

        return birthdaysThisWeek
    }
}

export default BirthdayService
