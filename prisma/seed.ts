import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const shouldSeedE2EUsers = process.env.SEED_E2E_USERS === '1'
const shouldSeedSampleData = process.env.SEED_SAMPLE_DATA === '1'

async function main() {
  console.log('🌱 Starting database seed...')

  // 1. Create Default Tenant
  const tenantSlug = process.env.DEFAULT_TENANT_SLUG || 'agir-viagens'
  const tenantName = process.env.DEFAULT_TENANT_NAME || 'Agir Viagens'
  const tenant = await prisma.tenant.upsert({
    where: { slug: tenantSlug },
    update: {
      name: tenantName,
      isActive: true,
    },
    create: {
      name: tenantName,
      slug: tenantSlug,
      isActive: true,
      settings: JSON.stringify({ theme: 'light', currency: 'BRL' }),
    },
  })
  console.log('✅ Tenant ensured:', tenant.slug)

  if (!shouldSeedE2EUsers && !shouldSeedSampleData) {
    console.log('ℹ️ Seed running in clean mode (no users, no sample data).')
    console.log('🎉 Seed completed successfully!')
    return
  }

  // Optional seeds (disabled by default)
  if (shouldSeedE2EUsers) {
    const bcrypt = (await import('bcryptjs')).default

    const testPasswordHash = await bcrypt.hash('Test@123456', 10)

    await prisma.user.upsert({
      where: {
        tenantId_email: {
          tenantId: tenant.id,
          email: 'admin@voai.test',
        },
      },
      update: {
        password: testPasswordHash,
        role: 'admin',
      },
      create: {
        email: 'admin@voai.test',
        tenantId: tenant.id,
        name: 'Admin User',
        password: testPasswordHash,
        role: 'admin',
        isActive: true,
      },
    })

    await prisma.user.upsert({
      where: {
        tenantId_email: {
          tenantId: tenant.id,
          email: 'consultant@voai.test',
        },
      },
      update: {
        password: testPasswordHash,
        role: 'consultant',
      },
      create: {
        email: 'consultant@voai.test',
        tenantId: tenant.id,
        name: 'Consultant User',
        password: testPasswordHash,
        role: 'consultant',
        isActive: true,
      },
    })

    console.log('✅ E2E users seeded')
  }

  if (shouldSeedSampleData) {
    console.log('ℹ️ Sample data seeding is currently disabled in clean reset mode.')
    console.log('ℹ️ If you need demo data, implement a dedicated demo seed or re-enable it explicitly.')
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
