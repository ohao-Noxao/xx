import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { signToken } from '@/lib/auth'

export const runtime = 'edge'

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, password } = body

    if (!phone || !password) {
      return NextResponse.json({ error: '请输入手机号和密码' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { phone },
    })

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 401 })
    }

    const [salt, storedHash] = user.password.split(':')
    const inputHash = await sha256(password + salt)
    if (inputHash !== storedHash) {
      return NextResponse.json({ error: '密码错误' }, { status: 401 })
    }

    const token = await signToken({
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      phone: user.phone,
    })

    const response = NextResponse.json({
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      phone: user.phone,
    })

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: '登录失败，请稍后重试' }, { status: 500 })
  }
}
