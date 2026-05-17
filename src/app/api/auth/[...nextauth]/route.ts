import NextAuth, { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { createHash } from 'crypto'
import { db } from '@/lib/db'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        phone: { label: 'Phone', type: 'tel' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.password) {
          throw new Error('请输入手机号和密码')
        }

        const user = await db.user.findUnique({
          where: { phone: credentials.phone },
        })

        if (!user) {
          throw new Error('用户不存在')
        }

        const [salt, storedHash] = user.password.split(':')
        const inputHash = createHash('sha256').update(credentials.password + salt).digest('hex')
        const isValid = inputHash === storedHash
        if (!isValid) {
          throw new Error('密码错误')
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          phone: user.phone,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.name = user.name
        token.avatar = (user as { avatar?: string }).avatar
        token.phone = (user as { phone?: string }).phone
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.name = token.name as string
        ;(session.user as { avatar?: string }).avatar = token.avatar as string
        ;(session.user as { phone?: string }).phone = token.phone as string
      }
      return session
    },
  },
  pages: {
    signIn: '/',
  },
  secret: process.env.NEXTAUTH_SECRET || 'dev-only-secret-please-set-NEXTAUTH_SECRET-in-production',
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
