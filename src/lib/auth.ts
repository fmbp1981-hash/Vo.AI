import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

// Tempo de expiração da sessão (30 minutos de inatividade)
const SESSION_MAX_AGE = 30 * 60 // 30 minutos em segundos

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(db),
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('EMAIL_PASSWORD_REQUIRED')
                }

                const user = await db.user.findFirst({
                    where: {
                        email: credentials.email
                    },
                    include: {
                        tenant: true
                    }
                })

                if (!user) {
                    throw new Error('USER_NOT_FOUND')
                }

                if (!user.password) {
                    throw new Error('PASSWORD_NOT_SET')
                }

                const isCorrectPassword = await bcrypt.compare(
                    credentials.password,
                    user.password
                )

                if (!isCorrectPassword) {
                    throw new Error('INVALID_PASSWORD')
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    company: user.tenant?.name || 'Sistema de Gestão',
                    tenantId: user.tenantId,
                }
            }
        })
    ],
    session: {
        strategy: 'jwt',
        maxAge: SESSION_MAX_AGE, // Sessão expira após 30 minutos de inatividade
        updateAge: 5 * 60, // Atualiza a sessão a cada 5 minutos de atividade
    },
    jwt: {
        maxAge: SESSION_MAX_AGE, // Token JWT também expira em 30 minutos
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role
                token.id = user.id
                token.company = user.company
                token.tenantId = user.tenantId
            }
            return token
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string
                session.user.role = token.role as string
                session.user.company = token.company as string
                session.user.tenantId = token.tenantId as string
            }
            return session
        }
    },
    pages: {
        signIn: '/auth/login',
        signUp: '/auth/register',
        error: '/auth/error'
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === 'development',
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

