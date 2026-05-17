import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // Fetch pinned posts first, then regular posts, each group sorted by createdAt desc
    const pinnedPosts = await db.fanPost.findMany({
      where: { pinned: true },
      include: { comments: { orderBy: { createdAt: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    })
    const regularPosts = await db.fanPost.findMany({
      where: { pinned: false },
      include: { comments: { orderBy: { createdAt: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    })
    const posts = [...pinnedPosts, ...regularPosts]
    return NextResponse.json(posts)
  } catch (error) {
    console.error('Get posts error:', error)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { authorName, content, imageUrl, pinned } = body

    if (!content || content.trim() === '') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const post = await db.fanPost.create({
      data: {
        authorName: authorName || '测试',
        content: content.trim(),
        imageUrl: imageUrl || null,
        pinned: pinned === true,
      },
      include: { comments: true },
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('Create post error:', error)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}
