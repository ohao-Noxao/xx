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

function generateSalt(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, password } = body

    if (!name || !phone || !password) {
      return NextResponse.json(
        { error: '请填写所有必填项' },
        { status: 400 }
      )
    }

    if (name.length > 20) {
      return NextResponse.json(
        { error: '昵称不能超过20个字符' },
        { status: 400 }
      )
    }

    if (!/^1\d{10}$/.test(phone)) {
      return NextResponse.json(
        { error: '请输入正确的手机号' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: '密码至少6位' },
        { status: 400 }
      )
    }

    // Check if phone already exists
    const existingUser = await db.user.findUnique({
      where: { phone },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: '该手机号已被注册' },
        { status: 409 }
      )
    }

    // Hash password with salt using Web Crypto API (Edge runtime compatible)
    const salt = generateSalt()
    const hashedPassword = salt + ':' + await sha256(password + salt)

    // Create user
    const user = await db.user.create({
      data: {
        name,
        phone,
        password: hashedPassword,
        avatar: '',
      },
    })

    // Auto-login: sign JWT and set cookie
    const token = await signToken({
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      phone: user.phone,
    })

    const response = NextResponse.json({
      id: user.id,
      name: user.name,
      phone: user.phone,
      avatar: user.avatar,
    }, { status: 201 })

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: '注册失败，请稍后重试' },
      { status: 500 }
    )
  }
}
