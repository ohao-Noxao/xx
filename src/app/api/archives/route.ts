import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const archives = await db.archive.findMany({
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(archives)
  } catch (error) {
    console.error('Get archives error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch archives' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, content, date, imageUrl, category } = body

    if (!title || !content || !date) {
      return NextResponse.json(
        { error: 'title, content, and date are required' },
        { status: 400 }
      )
    }

    const archive = await db.archive.create({
      data: {
        title,
        content,
        date,
        imageUrl: imageUrl || null,
        category: category || '日常',
      },
    })

    return NextResponse.json(archive, { status: 201 })
  } catch (error) {
    console.error('Create archive error:', error)
    return NextResponse.json(
      { error: 'Failed to create archive' },
      { status: 500 }
    )
  }
}
