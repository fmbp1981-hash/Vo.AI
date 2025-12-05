/**
 * Script para criar usuários de teste para testes E2E
 * Execute: npx tsx scripts/create-test-users.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const TEST_USERS = [
    {
        name: 'Admin Test User',
        email: 'admin@voai.test',
        password: 'Test@123456',
        role: 'ADMIN',
    },
    {
        name: 'Consultant Test User',
        email: 'consultant@voai.test',
        password: 'Test@123456',
        role: 'CONSULTANT',
    },
];

async function main() {
    console.log('🚀 Criando usuários de teste para E2E...\n');

    for (const userData of TEST_USERS) {
        try {
            // Verificar se usuário já existe
            const existing = await prisma.user.findUnique({
                where: { email: userData.email },
            });

            if (existing) {
                console.log(`⚠️  Usuário ${userData.email} já existe - pulando...`);
                continue;
            }

            // Hash da senha
            const hashedPassword = await bcrypt.hash(userData.password, 10);

            // Criar usuário
            const user = await prisma.user.create({
                data: {
                    name: userData.name,
                    email: userData.email,
                    password: hashedPassword,
                    role: userData.role as any,
                    emailVerified: new Date(), // Marcar como verificado para testes
                },
            });

            console.log(`✅ Criado: ${user.email} (${user.role})`);
        } catch (error) {
            console.error(`❌ Erro ao criar ${userData.email}:`, error);
        }
    }

    console.log('\n✨ Usuários de teste criados com sucesso!');
    console.log('\nCredenciais para testes:');
    console.log('━'.repeat(50));
    TEST_USERS.forEach(user => {
        console.log(`📧 ${user.email}`);
        console.log(`🔑 ${user.password}`);
        console.log(`👤 Role: ${user.role}`);
        console.log('━'.repeat(50));
    });
}

main()
    .catch((e) => {
        console.error('❌ Erro:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
