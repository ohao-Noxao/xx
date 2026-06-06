import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (body.type === 'like') {
      const post = await db.fanPost.update({
        where: { id },
        data: { likes: { increment: 1 } },
        include: { comments: true },
      })
      return NextResponse.json(post)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Update post error:', error)
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.fanPost.delete({ where: { id } })
    return NextResponse.json({ message: 'Post deleted' })
  } catch (error) {
    console.error('Delete post error:', error)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}
