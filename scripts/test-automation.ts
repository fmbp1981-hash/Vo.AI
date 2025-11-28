import { PrismaClient } from '@prisma/client';
import { AutomationEngine } from '../src/lib/automations';

const prisma = new PrismaClient();

async function testAutomation() {
    console.log('🧪 Testing Automation Engine...');

    try {
        // 1. Create a test user (consultant)
        const user = await prisma.user.upsert({
            where: { email: 'test@vo.ai' },
            update: {},
            create: {
                email: 'test@vo.ai',
                name: 'Test Consultant',
                role: 'consultant',
                isActive: true,
            },
        });
        console.log('✅ Test user ready:', user.id);

        // 2. Create a test lead assigned to this user
        const lead = await prisma.lead.create({
            data: {
                nome: 'Lead Teste Automação',
                telefone: '5511999999999',
                status: 'Novo Lead',
                assignedTo: user.id,
            },
        });
        console.log('✅ Test lead created:', lead.id);

        // 3. Trigger "lead_created" automation
        console.log('🔄 Triggering lead_created automation...');
        await AutomationEngine.trigger('lead_created', {
            leadId: lead.id,
            userId: user.id,
        });

        // 4. Verify if task was created
        const tasks = await prisma.task.findMany({
            where: { leadId: lead.id },
        });

        if (tasks.length > 0) {
            console.log('✅ SUCCESS: Task created automatically!');
            console.log('Task:', tasks[0].title, '-', tasks[0].description);
        } else {
            console.error('❌ FAILURE: No task created.');
        }

        // Clean up
        await prisma.task.deleteMany({ where: { leadId: lead.id } });
        await prisma.lead.delete({ where: { id: lead.id } });
        console.log('🧹 Cleanup complete.');

    } catch (error) {
        console.error('❌ Error during test:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testAutomation();
