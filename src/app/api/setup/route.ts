import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role } = await request.json()

    // Validate required fields
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, senha e nome são obrigatórios' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Usuário já existe com este email' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || 'consultant',
        isActive: true
      }
    })

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      success: true,
      data: userWithoutPassword
    })

  } catch (error: any) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao criar usuário',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

// Create default admin user if none exists
export async function GET() {
  try {
    const adminUser = await db.user.findFirst({
      where: { role: 'admin' }
    })

    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('admin123', 12)
      
      const admin = await db.user.create({
        data: {
          email: 'admin@voai.com',
          password: hashedPassword,
          name: 'Administrador',
          role: 'admin',
          isActive: true
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Usuário administrador padrão criado',
        data: {
          email: admin.email,
          password: 'admin123'
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Usuário administrador já existe'
    })

  } catch (error: any) {
    console.error('Error checking admin user:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao verificar usuário administrador',
        details: error.message 
      },
      { status: 500 }
    )
  }
}