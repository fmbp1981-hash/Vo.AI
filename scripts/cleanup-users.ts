import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const adminEmail = 'fmbp1981@gmail.com';

    console.log(`Cleaning up users except ${adminEmail}...`);

    const deleted = await prisma.user.deleteMany({
        where: {
            email: {
                not: adminEmail,
            },
        },
    });

    console.log(`Deleted ${deleted.count} users.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
