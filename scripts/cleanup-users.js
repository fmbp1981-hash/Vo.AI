const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    const adminEmail = 'fmbp1981@gmail.com';

    console.log(`Cleaning up users except ${adminEmail}...`);

    try {
        const deleted = await prisma.user.deleteMany({
            where: {
                email: {
                    not: adminEmail,
                },
            },
        });
        console.log(`Deleted ${deleted.count} users.`);
    } catch (error) {
        console.error('Error deleting users:', error);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
