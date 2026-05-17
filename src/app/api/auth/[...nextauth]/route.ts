import NextAuth, { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from '@/lib/db'

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

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
        const inputHash = await sha256(credentials.password + salt)
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
