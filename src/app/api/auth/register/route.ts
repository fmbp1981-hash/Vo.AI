import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { name, email, password } = body

        // Validate required fields
        if (!name || !email || !password) {
            return NextResponse.json(
                { error: 'Nome, email e senha são obrigatórios' },
                { status: 400 }
            )
        }

        // Get or create default tenant
        let tenant = await db.tenant.findFirst({
            where: { slug: 'default' }
        })

        if (!tenant) {
            tenant = await db.tenant.create({
                data: {
                    name: 'Default',
                    slug: 'default',
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
                { error: 'Este email já está cadastrado' },
                { status: 400 }
            )
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12)

        // Create user
        const user = await db.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: 'consultant',
                tenantId: tenant.id,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Conta criada com sucesso!',
            user
        })

    } catch (error: any) {
        console.error('Error creating user:', error)
        return NextResponse.json(
            { error: 'Erro ao criar conta. Tente novamente.' },
            { status: 500 }
        )
    }
}
