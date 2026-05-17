import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

// Cache for search results (5 minutes)
const searchCache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create()
  }
  return zaiInstance
}

interface DouyinUser {
  nickname: string
  douyinId: string
  shortId: string
  avatar: string
  signature: string
  followers: string
  totalFavorited: string
  awemeCount: string
  verified: boolean
  url: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userName = searchParams.get('user_name')

    if (!userName || userName.trim() === '') {
      return NextResponse.json(
        { code: 422, message: 'user_name 参数是必填的' },
        { status: 422 }
      )
    }

    // Check cache
    const cacheKey = userName.trim().toLowerCase()
    const cached = searchCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json({
        code: 200,
        message: '请求成功',
        message_zh: '请求成功，本次请求将被计费。',
        data: cached.data,
        cached: true,
      })
    }

    const zai = await getZAI()

    // Search for Douyin users - use multiple queries for better results
    const [searchResults1, searchResults2] = await Promise.all([
      zai.functions.invoke('web_search', {
        query: `抖音 ${userName} 个人主页 site:douyin.com`,
        num: 10,
      }),
      zai.functions.invoke('web_search', {
        query: `抖音号 ${userName} douyin.com`,
        num: 10,
      }),
    ])

    const allSearchResults = [...searchResults1, ...searchResults2]

    // Find all douyin profile URLs
    const douyinProfileUrls = [...new Set(
      allSearchResults
        .filter((r: { url: string }) => r.url.includes('douyin.com/user/'))
        .map((r: { url: string }) => r.url)
    )].slice(0, 5)

    const users: DouyinUser[] = []
    const seenIds = new Set<string>()

    // Try to read each profile page to get detailed stats
    for (const url of douyinProfileUrls) {
      try {
        const pageResult = await zai.functions.invoke('page_reader', {
          url: url,
        })

        if (!pageResult?.data?.html) continue

        const html = pageResult.data.html
        const title = pageResult.data.title || ''

        // Extract nickname from title
        const titleNickname = title
          .replace(/ - 抖音$/, '')
          .replace(/的个人主页.*$/, '')
          .replace(/抖音$/, '')
          .trim()

        // Try to extract from RENDER_DATA script
        const jsonMatch = html.match(
          /<script\s+id="RENDER_DATA"\s+type="application\/json">([^<]+)<\/script>/
        )

        let userData: Record<string, unknown> | null = null
        if (jsonMatch) {
          try {
            const decodedData = decodeURIComponent(jsonMatch[1])
            const parsed = JSON.parse(decodedData)
            userData =
              findNestedValue(parsed, 'user') ||
              findNestedValue(parsed, 'userInfo') ||
              findNestedValue(parsed, 'userDetail')
          } catch {
            // JSON parsing failed
          }
        }

        // Also try to find data in other script tags
        if (!userData) {
          const ssrMatch = html.match(/window\.__INIT_PROPS__\s*=\s*({.+?})\s*<\/script>/s)
          if (ssrMatch) {
            try {
              const parsed = JSON.parse(ssrMatch[1])
              userData =
                findNestedValue(parsed, 'user') ||
                findNestedValue(parsed, 'userInfo') ||
                findNestedValue(parsed, 'userDetail')
            } catch {
              // ignore
            }
          }
        }

        // Extract stats from the parsed user data
        const nickname = getStringValue(userData, 'nickname') || titleNickname
        const douyinId = getStringValue(userData, 'uniqueId') || ''
        const shortId = getStringValue(userData, 'shortId') || ''
        const avatar =
          getNestedString(userData, 'avatar168x168.urlList.0') ||
          getNestedString(userData, 'avatar300x300.urlList.0') ||
          getNestedString(userData, 'avatarMedium.urlList.0') ||
          getNestedString(userData, 'avatarLarger.urlList.0') ||
          ''
        const signature = getStringValue(userData, 'signature') || ''
        const followerCount = getNumberValue(userData, 'followerCount') || 0
        const totalFavorited = getNumberValue(userData, 'totalFavorited') || 0
        const awemeCount = getNumberValue(userData, 'awemeCount') || 0
        const verified = !!(
          getBoolValue(userData, 'verified') ||
          getStringValue(userData, 'customVerify')
        )

        // If no RENDER_DATA, try extracting from search result snippets
        const searchResult = allSearchResults.find(
          (r: { url: string }) => r.url === url
        )
        const snippet = searchResult?.snippet || ''

        // Try extracting numbers from snippet if we don't have them
        const snippetFollowers = extractNumberFromSnippet(snippet, /(\d+(?:\.\d+)?[万亿]?)\s*粉丝/)
        const snippetLikes = extractNumberFromSnippet(snippet, /(\d+(?:\.\d+)?[万亿]?)\s*获赞/)
        const snippetWorks = extractNumberFromSnippet(snippet, /(\d+(?:\.\d+)?[万亿]?)\s*作品/)

        const id = douyinId || shortId || extractIdFromUrl(url)
        if (nickname && !seenIds.has(id)) {
          seenIds.add(id)
          users.push({
            nickname,
            douyinId,
            shortId,
            avatar,
            signature,
            followers: followerCount > 0 ? formatCount(followerCount) : (snippetFollowers || ''),
            totalFavorited: totalFavorited > 0 ? formatCount(totalFavorited) : (snippetLikes || ''),
            awemeCount: awemeCount > 0 ? formatCount(awemeCount) : (snippetWorks || ''),
            verified,
            url,
          })
        }
      } catch {
        // Page reading failed, try to use search result data instead
        const searchResult = allSearchResults.find(
          (r: { url: string }) => r.url === url
        )
        if (searchResult) {
          const snippet = searchResult.snippet || ''
          const titleName = searchResult.name
            .replace(/ - 抖音$/, '')
            .trim()
          const id = extractIdFromUrl(url)

          if (titleName && !seenIds.has(id)) {
            seenIds.add(id)
            users.push({
              nickname: titleName,
              douyinId: id,
              shortId: '',
              avatar: searchResult.favicon || '',
              signature: snippet.substring(0, 100),
              followers: extractNumberFromSnippet(snippet, /(\d+(?:\.\d+)?[万亿]?)\s*粉丝/) || '',
              totalFavorited: extractNumberFromSnippet(snippet, /(\d+(?:\.\d+)?[万亿]?)\s*获赞/) || '',
              awemeCount: extractNumberFromSnippet(snippet, /(\d+(?:\.\d+)?[万亿]?)\s*作品/) || '',
              verified: snippet.includes('认证') || snippet.includes('官方'),
              url,
            })
          }
        }
      }
    }

    // Also add results that only appeared in search snippets (no profile page read)
    for (const result of allSearchResults) {
      if (!result.url.includes('douyin.com')) continue
      const id = extractIdFromUrl(result.url) || result.url
      if (seenIds.has(id)) continue

      const snippet = result.snippet || ''
      const titleName = result.name.replace(/ - 抖音$/, '').trim()
      if (!titleName || !snippet.includes('粉丝')) continue

      seenIds.add(id)
      users.push({
        nickname: titleName,
        douyinId: extractIdFromUrl(result.url) || '',
        shortId: '',
        avatar: result.favicon || '',
        signature: snippet.substring(0, 100),
        followers: extractNumberFromSnippet(snippet, /(\d+(?:\.\d+)?[万亿]?)\s*粉丝/) || '',
        totalFavorited: extractNumberFromSnippet(snippet, /(\d+(?:\.\d+)?[万亿]?)\s*获赞/) || '',
        awemeCount: extractNumberFromSnippet(snippet, /(\d+(?:\.\d+)?[万亿]?)\s*作品/) || '',
        verified: snippet.includes('认证') || snippet.includes('官方'),
        url: result.url,
      })
    }

    const limitedUsers = users.slice(0, 20)
    searchCache.set(cacheKey, { data: limitedUsers, timestamp: Date.now() })

    return NextResponse.json({
      code: 200,
      message: '请求成功',
      message_zh: '请求成功，本次请求将被计费。',
      data: limitedUsers,
      total: limitedUsers.length,
      cached: false,
    })
  } catch (error) {
    console.error('Douyin search error:', error)
    return NextResponse.json(
      {
        code: 500,
        message: '搜索失败，请稍后重试',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

function extractIdFromUrl(url: string): string {
  const match = url.match(/user\/([A-Za-z0-9]+)/)
  return match ? match[1] : ''
}

function formatCount(count: number): string {
  if (count >= 100000000) {
    return `${(count / 100000000).toFixed(1)}亿`
  }
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}万`
  }
  return count.toLocaleString()
}

function extractNumberFromSnippet(snippet: string, regex: RegExp): string {
  const match = snippet.match(regex)
  return match ? match[1] : ''
}

function findNestedValue(obj: unknown, key: string): unknown {
  if (!obj || typeof obj !== 'object') return null
  const record = obj as Record<string, unknown>
  if (record[key] !== undefined) return record[key]
  for (const k of Object.keys(record)) {
    const result = findNestedValue(record[k], key)
    if (result !== null && result !== undefined) return result
  }
  return null
}

function getStringValue(obj: Record<string, unknown> | null, key: string): string {
  if (!obj) return ''
  const val = obj[key]
  return typeof val === 'string' ? val : ''
}

function getNumberValue(obj: Record<string, unknown> | null, key: string): number {
  if (!obj) return 0
  const val = obj[key]
  return typeof val === 'number' ? val : 0
}

function getBoolValue(obj: Record<string, unknown> | null, key: string): boolean {
  if (!obj) return false
  const val = obj[key]
  return typeof val === 'boolean' ? val : false
}

function getNestedString(obj: Record<string, unknown> | null, path: string): string {
  if (!obj) return ''
  const parts = path.split('.')
  let current: unknown = obj
  for (const part of parts) {
    if (current === null || current === undefined) return ''
    current = current[part]
  }
  return typeof current === 'string' ? current : ''
}
