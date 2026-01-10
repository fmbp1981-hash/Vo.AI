import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { name, company, email, password } = body

        // Validate required fields
        if (!name || !company || !email || !password) {
            return NextResponse.json(
                { error: 'Nome, empresa, email e senha são obrigatórios' },
                { status: 400 }
            )
        }

        // Generate slug from company name
        const slug = company
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')

        // Create or get tenant for this company
        let tenant = await db.tenant.findFirst({
            where: { slug }
        })

        if (!tenant) {
            tenant = await db.tenant.create({
                data: {
                    name: company,
                    slug,
                    isActive: true,
                }
            })
        }

        // Check if email already exists for this tenant
        const existingUser = await db.user.findFirst({
            where: {
                email,
                tenantId: tenant.id
            }
        })

        if (existingUser) {
            return NextResponse.json(
                { error: 'Este email já está cadastrado nesta empresa' },
                { status: 400 }
            )
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12)

        // Create user as client (agency) by default
        const user = await db.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: 'client',
                tenantId: tenant.id,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                tenant: {
                    select: {
                        name: true,
                    }
                }
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Conta criada com sucesso!',
            user
        })

    } catch (error: any) {
        console.error('Error creating user:', error)

        // Check for specific Prisma errors
        if (error.code === 'P2002') {
            const target = error.meta?.target || 'campo único'
            return NextResponse.json(
                { error: `Já existe um registro com este ${target}` },
                { status: 409 }
            )
        }

        return NextResponse.json(
            {
                error: 'Erro ao criar conta. Tente novamente.',
                details: error.message // Temporarily expose for debug
            },
            { status: 500 }
        )
    }
}
