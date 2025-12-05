import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // 1. Create Default Tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'agir-viagens' },
    update: {},
    create: {
      name: 'Agir Viagens',
      slug: 'agir-viagens',
      isActive: true,
      settings: JSON.stringify({ theme: 'light', currency: 'BRL' }),
    },
  })
  console.log('✅ Tenant created:', tenant.name)

  // 2. Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: 'admin@agir.com'
      }
    },
    update: {},
    create: {
      email: 'admin@agir.com',
      tenantId: tenant.id,
      name: 'Admin AGIR',
      password: adminPassword,
      role: 'admin',
      avatar: null,
      isActive: true,
    },
  })
  console.log('✅ Admin user created:', admin.email)

  // 3. Create consultant user
  const consultantPassword = await bcrypt.hash('consultor123', 10)
  const consultant = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: 'consultor@agir.com'
      }
    },
    update: {},
    create: {
      email: 'consultor@agir.com',
      tenantId: tenant.id,
      name: 'Maria Silva',
      password: consultantPassword,
      role: 'consultant',
      avatar: null,
      isActive: true,
    },
  })
  console.log('✅ Consultant user created:', consultant.email)

  // 4. Create E2E Test Admin
  const testAdminPassword = await bcrypt.hash('Test@123456', 10)
  await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: 'admin@voai.test'
      }
    },
    update: {
      password: testAdminPassword,
      role: 'ADMIN',
    },
    create: {
      email: 'admin@voai.test',
      tenantId: tenant.id,
      name: 'Admin User',
      password: testAdminPassword,
      role: 'ADMIN',
      isActive: true,
    },
  })
  console.log('✅ E2E Admin user created: admin@voai.test')

  // 5. Create E2E Test Consultant
  const testConsultantPassword = await bcrypt.hash('Test@123456', 10)
  await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: 'consultant@voai.test'
      }
    },
    update: {
      password: testConsultantPassword,
      role: 'CONSULTANT',
    },
    create: {
      email: 'consultant@voai.test',
      tenantId: tenant.id,
      name: 'Consultant User',
      password: testConsultantPassword,
      role: 'CONSULTANT',
      isActive: true,
    },
  })
  console.log('✅ E2E Consultant user created: consultant@voai.test')

  // 6. Create sample leads
  const sampleLeads = [
    {
      nome: 'João Santos',
      email: 'joao@example.com',
      telefone: '+55 11 98765-4321',
      telefoneNormalizado: '5511987654321',
      status: 'Novo Lead',
      estagio: 'Novo Lead',
      canal: 'WhatsApp',
      destino: 'Paris',
      periodo: 'Julho 2025',
      dataPartida: new Date('2025-07-10'),
      dataRetorno: new Date('2025-07-20'),
      orcamento: 'R$ 15.000',
      pessoas: '2 adultos',
      score: 85,
      qualificado: true,
      assignedTo: consultant.id,
      assignedAt: new Date(),
      tenantId: tenant.id,
    },
    {
      nome: 'Maria Oliveira',
      email: 'maria@example.com',
      telefone: '+55 21 91234-5678',
      telefoneNormalizado: '5521912345678',
      status: 'Qualificação',
      estagio: 'Qualificação',
      canal: 'Instagram',
      destino: 'Dubai',
      periodo: 'Dezembro 2025',
      dataPartida: new Date('2025-12-15'),
      dataRetorno: new Date('2025-12-25'),
      orcamento: 'R$ 25.000',
      pessoas: '2 adultos + 1 criança',
      score: 92,
      qualificado: true,
      assignedTo: consultant.id,
      assignedAt: new Date(),
      tenantId: tenant.id,
    },
    {
      nome: 'Carlos Pereira',
      email: 'carlos@example.com',
      telefone: '+55 11 99999-8888',
      telefoneNormalizado: '5511999998888',
      status: 'Proposta',
      estagio: 'Proposta',
      canal: 'WhatsApp',
      destino: 'Maldivas',
      periodo: 'Agosto 2025',
      dataPartida: new Date('2025-08-05'),
      dataRetorno: new Date('2025-08-15'),
      orcamento: 'R$ 35.000',
      pessoas: '2 adultos',
      score: 95,
      qualificado: true,
      assignedTo: consultant.id,
      assignedAt: new Date(),
      tenantId: tenant.id,
    },
    {
      nome: 'Ana Costa',
      email: 'ana@example.com',
      telefone: '+55 31 98888-7777',
      telefoneNormalizado: '5531988887777',
      status: 'Negociação',
      estagio: 'Negociação',
      canal: 'Site',
      destino: 'Nova York',
      periodo: 'Novembro 2025',
      dataPartida: new Date('2025-11-20'),
      dataRetorno: new Date('2025-11-28'),
      orcamento: 'R$ 18.000',
      pessoas: '2 adultos',
      score: 88,
      qualificado: true,
      assignedTo: consultant.id,
      assignedAt: new Date(),
      tenantId: tenant.id,
    },
    {
      nome: 'Pedro Souza',
      email: 'pedro@example.com',
      telefone: '+55 41 97777-6666',
      telefoneNormalizado: '5541977776666',
      status: 'Novo Lead',
      estagio: 'Novo Lead',
      canal: 'WhatsApp',
      destino: 'Cancún',
      periodo: 'Janeiro 2026',
      orcamento: 'R$ 12.000',
      pessoas: '2 adultos',
      score: 75,
      qualificado: false,
      tenantId: tenant.id,
    },
  ]

  for (const leadData of sampleLeads) {
    const lead = await prisma.lead.create({
      data: leadData,
    })
    console.log(`✅ Lead created: ${lead.nome} - ${lead.destino}`)
  }

  // 7. Create sample conversation
  const firstLead = await prisma.lead.findFirst({
    where: { nome: 'João Santos' },
  })

  if (firstLead) {
    await prisma.conversation.create({
      data: {
        tenantId: tenant.id,
        leadId: firstLead.id,
        userId: consultant.id,
        channel: 'whatsapp',
        status: 'active',
        messages: JSON.stringify([
          {
            role: 'user',
            content: 'Olá! Gostaria de informações sobre viagem para Paris.',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            role: 'assistant',
            content: 'Olá! Que maravilhoso destino! Paris é perfeita para você. Quando está pensando em viajar?',
            timestamp: new Date(Date.now() - 3500000).toISOString(),
          },
          {
            role: 'user',
            content: 'Estou pensando em julho, por 10 dias.',
            timestamp: new Date(Date.now() - 3000000).toISOString(),
          },
          {
            role: 'assistant',
            content: 'Perfeito! Julho é alta temporada em Paris. Quantas pessoas viajarão e qual seu orçamento aproximado?',
            timestamp: new Date(Date.now() - 2900000).toISOString(),
          },
        ]),
      },
    })
    console.log('✅ Sample conversation created')
  }

  // 8. Create sample itinerary
  if (firstLead) {
    await prisma.itinerary.create({
      data: {
        tenantId: tenant.id,
        leadId: firstLead.id,
        userId: consultant.id,
        title: 'Roteiro Paris - 10 dias inesquecíveis',
        destination: 'Paris, França',
        startDate: new Date('2025-07-10'),
        endDate: new Date('2025-07-20'),
        budget: 'R$ 15.000',
        travelers: '2 adultos',
        tripType: 'Lua de mel',
        preferences: 'Cultura, gastronomia, romance',
        content: JSON.stringify({
          summary: 'Roteiro romântico por Paris com o melhor da cidade luz',
          days: [
            {
              day: 1,
              title: 'Chegada e Champs-Élysées',
              morning: 'Chegada ao CDG, transfer para hotel',
              afternoon: 'Passeio pela Champs-Élysées e Arco do Triunfo',
              evening: 'Jantar no Le Comptoir du Relais',
            },
            {
              day: 2,
              title: 'Torre Eiffel e Cruzeiro no Sena',
              morning: 'Visita à Torre Eiffel',
              afternoon: 'Almoço no Le Jules Verne',
              evening: 'Cruzeiro romântico no Rio Sena',
            },
          ],
          hotels: [
            {
              name: 'Hôtel Plaza Athénée',
              category: 'Luxo',
              price: 'R$ 3.500/noite',
            },
          ],
          estimatedCosts: {
            flights: 'R$ 5.000',
            accommodation: 'R$ 7.000',
            activities: 'R$ 2.000',
            food: 'R$ 1.000',
            total: 'R$ 15.000',
          },
        }),
        totalCost: 15000,
        status: 'sent',
      },
    })
    console.log('✅ Sample itinerary created')
  }

  // 9. Create sample proposal
  if (firstLead) {
    await prisma.proposal.create({
      data: {
        tenantId: tenant.id,
        leadId: firstLead.id,
        userId: consultant.id,
        title: 'Proposta - Paris Romântico 10 dias',
        content: JSON.stringify({
          package: 'Paris Completo',
          includes: [
            'Passagens aéreas São Paulo - Paris (ida e volta)',
            '9 noites no Hôtel Plaza Athénée',
            'Transfer aeroporto - hotel - aeroporto',
            'Tour Torre Eiffel com guia',
            'Cruzeiro no Rio Sena',
            'Seguro viagem',
          ],
          excludes: [
            'Refeições não mencionadas',
            'Despesas pessoais',
            'Gorjetas',
          ],
          paymentTerms: '30% entrada + 70% em até 10x',
        }),
        totalValue: 15000,
        status: 'sent',
        sentAt: new Date(),
      },
    })
    console.log('✅ Sample proposal created')
  }

  console.log('🎉 Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
