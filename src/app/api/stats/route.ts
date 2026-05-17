import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const [totalVisits, todayVisits, totalPosts, totalMessages, totalArchives, memberCount] =
      await Promise.all([
        db.siteVisit.count(),
        db.siteVisit.count({
          where: { visitedAt: { gte: startOfDay } },
        }),
        db.fanPost.count(),
        db.message.count(),
        db.archive.count(),
        db.user.count(),
      ])

    return NextResponse.json({
      totalVisits,
      todayVisits,
      totalPosts,
      totalMessages,
      totalArchives,
      memberCount,
    })
  } catch (error) {
    console.error('Get stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const path = body.path || '/'
    const userAgent = request.headers.get('user-agent') || null

    const visit = await db.siteVisit.create({
      data: {
        path,
        userAgent,
      },
    })

    return NextResponse.json(visit, { status: 201 })
  } catch (error) {
    console.error('Record visit error:', error)
    return NextResponse.json(
      { error: 'Failed to record visit' },
      { status: 500 }
    )
  }
}
