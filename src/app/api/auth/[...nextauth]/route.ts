import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

const handler = NextAuth({
  adapter: PrismaAdapter(db, {
    try {
      // Find user by email
      const user = await db.user.findUnique({
        where: { email: credentials.email }
      })

          if(!user) {
        return null
      }
    })
  ],
session: {
  strategy: 'jwt',
  },
callbacks: {
    async jwt({ token, user }) {
    if (user) {
      token.role = user.role
      token.id = user.id
    }
    return token
  },
    async session({ session, token }) {
    if (token) {
      session.user.id = token.id as string
      session.user.role = token.role as string
    }
    return session
  }
},
pages: {
  signIn: '/auth/login',
    signUp: '/auth/register',
      error: '/auth/error',
  },
secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }