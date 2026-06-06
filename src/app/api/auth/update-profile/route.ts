import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()

    if (!user?.id) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, avatar } = body

    const updateData: { name?: string; avatar?: string } = {}

    if (name !== undefined && name.trim()) {
      if (name.trim().length > 20) {
        return NextResponse.json(
          { error: '昵称不能超过20个字符' },
          { status: 400 }
        )
      }
      updateData.name = name.trim()
    }

    if (avatar !== undefined) {
      updateData.avatar = avatar
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: '没有需要更新的内容' },
        { status: 400 }
      )
    }

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: updateData,
    })

    return NextResponse.json({
      id: updatedUser.id,
      name: updatedUser.name,
      avatar: updatedUser.avatar,
      phone: updatedUser.phone,
    })
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json(
      { error: '更新失败，请稍后重试' },
      { status: 500 }
    )
  }
}
