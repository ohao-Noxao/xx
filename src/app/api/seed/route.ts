import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === 'true'

    // Check if already seeded
    const existingPosts = await db.fanPost.count()
    if (existingPosts > 0 && !force) {
      return NextResponse.json({ message: 'Already seeded', count: existingPosts })
    }

    // If force, delete all existing data
    if (force) {
      await db.fanComment.deleteMany()
      await db.fanPost.deleteMany()
      await db.archive.deleteMany()
      await db.message.deleteMany()
      await db.user.deleteMany()
    }

    // Seed Archives
    await db.archive.createMany({
      data: [
        {
          title: '测试',
          content: '测试',
          date: '2021-03-15',
          imageUrl: '测试',
          category: '早期',
        },
        {
          title: '测试',
          content: '测试',
          date: '2021-10-09',
          imageUrl: '测试',
          category: '早期',
        },
        {
          title: '测试',
          content: '测试',
          date: '2022-06-15',
          imageUrl: '测试',
          category: '成长',
        },
        {
          title: '测试',
          content: '测试',
          date: '2022-11-22',
          imageUrl: null,
          category: '成长',
        },
        {
          title: '测试',
          content: '测试',
          date: '2023-04-08',
          imageUrl: '测试',
          category: '爆发',
        },
        {
          title: '测试',
          content: '测试',
          date: '2023-08-20',
          imageUrl: '测试',
          category: '爆发',
        },
        {
          title: '测试',
          content: '测试',
          date: '2024-06-10',
          imageUrl: '测试',
          category: '成长',
        },
        {
          title: '测试',
          content: '测试',
          date: '2024-12-01',
          imageUrl: '测试',
          category: '稳定期',
        },
        {
          title: '测试',
          content: '测试',
          date: '2025-02-14',
          imageUrl: null,
          category: '稳定期',
        },
      ],
    })

    // Seed Posts
    await db.fanPost.createMany({
      data: [
        {
          authorName: '小新站务',
          content: '置顶公告：欢迎加入小新粉丝圈！',
          imageUrl: null,
          likes: 0,
          pinned: true,
        },
        {
          authorName: '测试',
          content: '测试',
          imageUrl: null,
          likes: 0,
        },
        {
          authorName: '测试',
          content: '测试',
          imageUrl: null,
          likes: 0,
        },
      ],
    })

    // Seed Messages
    await db.message.createMany({
      data: [
        { username: '测试', content: '测试', avatar: 'T' },
        { username: '测试', content: '测试', avatar: 'T' },
        { username: '测试', content: '测试', avatar: 'T' },
        { username: '测试', content: '测试', avatar: 'T' },
        { username: '测试', content: '测试', avatar: 'T' },
        { username: '测试', content: '测试', avatar: 'T' },
      ],
    })

    return NextResponse.json({ message: 'Seed completed successfully!' })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 })
  }
}
