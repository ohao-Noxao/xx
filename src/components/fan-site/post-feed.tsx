'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, MessageCircle, Share2, Trash2, Check, Bookmark, Search, X, Pin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

interface Comment {
  id: string
  authorName: string
  content: string
  createdAt: string
}

interface Post {
  id: string
  authorName: string
  content: string
  imageUrl: string | null
  likes: number
  pinned: boolean
  createdAt: string
  comments: Comment[]
}

const MAX_COMMENT_LENGTH = 200
const BOOKMARKS_KEY = 'fan-site-bookmarks'

function getBookmarks(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const stored = localStorage.getItem(BOOKMARKS_KEY)
    return stored ? new Set(JSON.parse(stored) as string[]) : new Set()
  } catch {
    return new Set()
  }
}

function saveBookmarks(bookmarks: Set<string>) {
  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...bookmarks]))
  } catch {
    // localStorage not available
  }
}

// Heart particle burst component
function HeartBurst({ x, y }: { x: number; y: number }) {
  const particles = useMemo(() =>
    [...Array(6)].map((_, i) => ({
      id: i,
      angle: (i * 60) * (Math.PI / 180),
      distance: 20 + Math.random() * 15,
      size: 8 + Math.random() * 6,
    })),
    []
  )

  return (
    <div className="fixed pointer-events-none z-50" style={{ left: x, top: y }}>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute"
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: Math.cos(p.angle) * p.distance,
            y: Math.sin(p.angle) * p.distance,
            opacity: 0,
            scale: 0.3,
          }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <Heart
            className="text-pink-400 fill-pink-400"
            style={{ width: p.size, height: p.size }}
          />
        </motion.div>
      ))}
    </div>
  )
}

export function PostFeed({ refreshKey }: { refreshKey: number }) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedComments, setExpandedComments] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set())
  const [bookmarkPulse, setBookmarkPulse] = useState<string | null>(null)
  const [filterMode, setFilterMode] = useState<'all' | 'bookmarked'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [sharedPostId, setSharedPostId] = useState<string | null>(null)
  const [heartBurst, setHeartBurst] = useState<{ x: number; y: number } | null>(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const feedRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Scroll progress tracking
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0
      setScrollProgress(Math.min(100, progress))
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Load bookmarks from localStorage on mount
  useEffect(() => {
    setBookmarks(getBookmarks())
  }, [])

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/posts')
      if (res.ok) {
        const data = await res.json()
        setPosts(data)
      }
    } catch {
      console.error('Failed to fetch posts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts, refreshKey])

  const toggleBookmark = (postId: string) => {
    setBookmarks(prev => {
      const next = new Set(prev)
      if (next.has(postId)) {
        next.delete(postId)
      } else {
        next.add(postId)
        setBookmarkPulse(postId)
        setTimeout(() => setBookmarkPulse(null), 600)
      }
      saveBookmarks(next)
      return next
    })
  }

  // Filter and search posts
  const displayPosts = useMemo(() => {
    let filtered = posts

    // Apply bookmark filter
    if (filterMode === 'bookmarked') {
      filtered = filtered.filter(p => bookmarks.has(p.id))
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(p =>
        p.content.toLowerCase().includes(query) ||
        p.authorName.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [posts, filterMode, searchQuery, bookmarks])

  const handleLike = async (postId: string, e?: React.MouseEvent) => {
    if (likedPosts.has(postId)) return
    setLikedPosts(prev => new Set([...prev, postId]))

    // Heart burst effect
    if (e) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      setHeartBurst({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
      setTimeout(() => setHeartBurst(null), 700)
    }

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'like' }),
      })
      if (res.ok) {
        const updated = await res.json()
        setPosts(prev => prev.map(p => p.id === postId ? updated : p))
      }
    } catch {
      setLikedPosts(prev => {
        const next = new Set(prev)
        next.delete(postId)
        return next
      })
    }
  }

  const handleComment = async (postId: string) => {
    if (!commentText.trim()) return

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentText.trim() }),
      })
      if (res.ok) {
        setCommentText('')
        fetchPosts()
        toast({ title: '评论成功！' })
      }
    } catch {
      toast({ title: '评论失败', variant: 'destructive' })
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return
    try {
      const res = await fetch(`/api/posts/${deleteTargetId}`, { method: 'DELETE' })
      if (res.ok) {
        setPosts(prev => prev.filter(p => p.id !== deleteTargetId))
        toast({ title: '已删除' })
      }
    } catch {
      toast({ title: '删除失败', variant: 'destructive' })
    } finally {
      setDeleteDialogOpen(false)
      setDeleteTargetId(null)
    }
  }

  const handleShare = async (post: Post) => {
    const shareText = `${post.authorName}: ${post.content}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: '测试',
          text: shareText,
        })
        return
      } catch {
        // User cancelled, ignore
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(shareText)
      setSharedPostId(post.id)
      toast({ title: '已复制到剪贴板', description: '可以分享给朋友啦' })
      setTimeout(() => setSharedPostId(null), 2000)
    } catch {
      toast({ title: '分享失败', variant: 'destructive' })
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 30) return `${days}天前`
    return date.toLocaleDateString('zh-CN')
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white/12 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl p-5 animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/20 dark:bg-white/10 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-white/20 dark:bg-white/10 rounded w-24 mb-1" />
                <div className="h-3 bg-white/10 dark:bg-white/5 rounded w-16" />
              </div>
            </div>
            <div className="h-4 bg-white/15 dark:bg-white/8 rounded w-full mb-2" />
            <div className="h-4 bg-white/10 dark:bg-white/5 rounded w-3/4" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4" ref={feedRef}>
      {/* Scroll progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-0.5">
        <motion.div
          className="h-full bg-gradient-to-r from-pink-400 via-fuchsia-400 to-rose-400"
          style={{ width: `${scrollProgress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      {/* Heart burst particles */}
      <AnimatePresence>
        {heartBurst && <HeartBurst x={heartBurst.x} y={heartBurst.y} />}
      </AnimatePresence>

      {/* Search bar with glass-strong effect */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 dark:text-white/30" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索动态..."
          className="w-full glass-strong rounded-xl pl-10 pr-10 py-2.5 text-sm text-white dark:text-white/90 placeholder-white/40 dark:placeholder-white/30 focus:outline-none focus:shadow-[0_0_15px_rgba(236,72,153,0.25)] transition-shadow"
        />
        {searchQuery && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 dark:text-white/30 hover:text-white/70 dark:hover:text-white/60"
          >
            <X className="w-4 h-4" />
          </motion.button>
        )}
      </div>

      {/* Search result count */}
      <AnimatePresence>
        {searchQuery.trim() && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-white/50 dark:text-white/40 text-xs text-center"
          >
            找到 {displayPosts.length} 条结果
          </motion.p>
        )}
      </AnimatePresence>

      {/* Filter toggle: 全部 | 收藏 */}
      <div className="flex items-center gap-2">
        {(['all', 'bookmarked'] as const).map((mode) => (
          <motion.button
            key={mode}
            onClick={() => setFilterMode(mode)}
            className={`relative flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              filterMode === mode
                ? 'bg-white/25 dark:bg-white/10 text-white border border-white/30 dark:border-white/15'
                : 'bg-white/8 dark:bg-white/5 text-white/60 dark:text-white/40 border border-white/10 dark:border-white/5 hover:bg-white/15 dark:hover:bg-white/8 hover:text-white/80 dark:hover:text-white/60'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {mode === 'bookmarked' && (
              <Bookmark className={`w-3 h-3 ${filterMode === mode ? 'fill-white' : ''}`} />
            )}
            <span>{mode === 'all' ? '全部' : '收藏'}</span>
            {mode === 'bookmarked' && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-white/10 dark:bg-white/5 text-white/50">
                {bookmarks.size}
              </span>
            )}
          </motion.button>
        ))}
      </div>

      {/* Posts list */}
      <AnimatePresence mode="popLayout">
        {displayPosts.map((post, index) => {
          // Check if this is the last pinned post (separator before regular posts)
          const isLastPinned = post.pinned && (index === displayPosts.length - 1 || !displayPosts[index + 1]?.pinned)
          const hasPinnedPosts = displayPosts.some(p => p.pinned)

          return (
            <motion.div key={post.id} layout>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
                whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}
                className={`group backdrop-blur-xl rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow relative ${
                  post.pinned
                    ? 'bg-gradient-to-br from-amber-500/15 via-yellow-500/10 to-orange-500/10 dark:from-amber-500/10 dark:via-yellow-500/5 dark:to-orange-500/5 border border-amber-400/30 dark:border-amber-400/15'
                    : 'bg-white/12 dark:bg-white/5 border border-white/20 dark:border-white/10'
                }`}
              >
                {/* Shimmer animation for pinned posts */}
                {post.pinned && (
                  <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                    <div className="absolute inset-0 shimmer-effect" />
                  </div>
                )}

                {/* Pinned badge */}
                {post.pinned && (
                  <div className="px-5 pt-3 flex items-center gap-2">
                    <motion.div
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/25 dark:bg-amber-500/15 border border-amber-400/30 dark:border-amber-400/20"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    >
                      <Pin className="w-3 h-3 text-amber-400 dark:text-amber-300 fill-amber-400 dark:fill-amber-300" />
                      <span className="text-xs font-bold text-amber-300 dark:text-amber-200">置顶</span>
                    </motion.div>
                  </div>
                )}

                {/* Post header */}
                <div className="p-5 pb-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ${
                        post.pinned
                          ? 'bg-gradient-to-br from-amber-400 to-orange-400 dark:from-amber-500 dark:to-orange-500'
                          : 'bg-gradient-to-br from-pink-400 to-fuchsia-400 dark:from-pink-600 dark:to-fuchsia-600'
                      }`}>
                        {post.authorName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={`font-semibold text-sm ${post.pinned ? 'text-amber-100 dark:text-amber-100' : 'text-white dark:text-white/90'}`}>{post.authorName}</p>
                          {post.pinned && (
                            <Pin className="w-3 h-3 text-amber-400/60 dark:text-amber-300/40" />
                          )}
                        </div>
                        <p className={`text-xs ${post.pinned ? 'text-amber-300/60 dark:text-amber-200/40' : 'text-white/50 dark:text-white/40'}`}>{formatTime(post.createdAt)}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white/40 dark:text-white/30 hover:text-red-400 hover:bg-white/10 dark:hover:bg-white/5 rounded-full h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      onClick={() => {
                        setDeleteTargetId(post.id)
                        setDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  {/* Content */}
                  <p className={`text-sm leading-relaxed whitespace-pre-wrap ${post.pinned ? 'text-amber-50/90 dark:text-amber-50/80' : 'text-white/90 dark:text-white/80'}`}>{post.content}</p>
                </div>

                {/* Image */}
                {post.imageUrl && (
                  <div className="relative mx-5 mb-3 rounded-xl overflow-hidden bg-white/8 dark:bg-white/5 h-40 flex items-center justify-center">
                    <span className="text-white/30 dark:text-white/20 text-2xl font-bold">测试</span>
                  </div>
                )}

                {/* Actions */}
                <div className="px-5 pb-4">
                  <div className={`flex items-center gap-4 pt-2 ${post.pinned ? 'border-amber-400/15 dark:border-amber-400/10' : 'border-white/10 dark:border-white/5'} border-t`}>
                    <motion.button
                      onClick={(e) => handleLike(post.id, e)}
                      className={`relative flex items-center gap-1.5 text-sm transition-colors overflow-hidden ${
                        likedPosts.has(post.id) ? 'text-pink-400 dark:text-pink-400' : post.pinned ? 'text-amber-200/60 dark:text-amber-100/40 hover:text-pink-400' : 'text-white/60 dark:text-white/40 hover:text-pink-400'
                      }`}
                      whileTap={{ scale: 1.2 }}
                    >
                      {likedPosts.has(post.id) && (
                        <motion.div
                          className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-400/20 to-fuchsia-400/20"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: [0, 1.5, 1], opacity: [0, 0.5, 0] }}
                          transition={{ duration: 1, repeat: Infinity, repeatDelay: 1.5, type: 'tween' }}
                        />
                      )}
                      <motion.div
                        animate={likedPosts.has(post.id) ? { scale: [1, 1.3, 1] } : {}}
                        transition={{ duration: 0.3, type: 'tween' }}
                      >
                        <Heart
                          className={`w-4.5 h-4.5 relative z-10 ${likedPosts.has(post.id) ? 'fill-pink-400' : ''}`}
                        />
                      </motion.div>
                      <span className="relative z-10">{post.likes}</span>
                    </motion.button>

                    <button
                      onClick={() => setExpandedComments(expandedComments === post.id ? null : post.id)}
                      className={`flex items-center gap-1.5 text-sm transition-colors ${
                        post.pinned ? 'text-amber-200/60 dark:text-amber-100/40 hover:text-amber-100 dark:hover:text-amber-100/70' : 'text-white/60 dark:text-white/40 hover:text-white/90 dark:hover:text-white/70'
                      }`}
                    >
                      <MessageCircle className="w-4.5 h-4.5" />
                      <span>{post.comments.length}</span>
                    </button>

                    <motion.button
                      onClick={() => handleShare(post)}
                      className={`flex items-center gap-1.5 text-sm transition-colors ${
                        sharedPostId === post.id ? 'text-emerald-400' : post.pinned ? 'text-amber-200/60 dark:text-amber-100/40 hover:text-amber-100 dark:hover:text-amber-100/70' : 'text-white/60 dark:text-white/40 hover:text-white/90 dark:hover:text-white/70'
                      }`}
                      whileTap={{ scale: 0.9 }}
                    >
                      <motion.div
                        animate={sharedPostId === post.id ? { rotate: [0, 360], scale: [1, 0.8, 1] } : {}}
                        transition={{ duration: 0.4, type: 'tween' }}
                      >
                        {sharedPostId === post.id ? (
                          <Check className="w-4.5 h-4.5" />
                        ) : (
                          <Share2 className="w-4.5 h-4.5" />
                        )}
                      </motion.div>
                      <span>{sharedPostId === post.id ? '已复制' : '分享'}</span>
                    </motion.button>

                    {/* Bookmark button with golden glow */}
                    <motion.button
                      onClick={() => toggleBookmark(post.id)}
                      className={`relative flex items-center gap-1.5 text-sm transition-colors ml-auto ${
                        bookmarks.has(post.id)
                          ? 'text-amber-400 dark:text-amber-300'
                          : post.pinned ? 'text-amber-200/60 dark:text-amber-100/40 hover:text-amber-400 dark:hover:text-amber-300' : 'text-white/60 dark:text-white/40 hover:text-amber-400 dark:hover:text-amber-300'
                      }`}
                      whileTap={{ scale: 1.2 }}
                      animate={bookmarkPulse === post.id ? { scale: [1, 1.3, 1] } : {}}
                      transition={bookmarkPulse === post.id ? { duration: 0.4, type: 'tween' } : {}}
                    >
                      {bookmarks.has(post.id) && (
                        <motion.div
                          className="absolute inset-0 rounded-full"
                          animate={{
                            boxShadow: ['0 0 0px rgba(251,191,36,0)', '0 0 12px rgba(251,191,36,0.4)', '0 0 0px rgba(251,191,36,0)'],
                          }}
                          transition={{ duration: 1.5, repeat: Infinity, type: 'tween' }}
                        />
                      )}
                      <Bookmark
                        className={`w-4.5 h-4.5 ${bookmarks.has(post.id) ? 'fill-amber-400 dark:fill-amber-300' : ''}`}
                      />
                    </motion.button>
                  </div>

                  {/* Comments section with gradient left border */}
                  <AnimatePresence>
                    {expandedComments === post.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 space-y-2">
                          {post.comments.map((comment, commentIdx) => (
                            <motion.div
                              key={comment.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: commentIdx * 0.05 }}
                              className="bg-white/8 dark:bg-white/5 rounded-xl p-3 text-sm flex items-start gap-2 border-l-2 border-l-gradient-to-b border-l-pink-400/40 dark:border-l-pink-500/30"
                              style={{
                                borderImage: 'linear-gradient(to bottom, rgba(236,72,153,0.4), rgba(168,85,247,0.2)) 1',
                              }}
                            >
                              <div className="w-6 h-6 bg-gradient-to-br from-pink-400/60 to-fuchsia-400/60 dark:from-pink-600/60 dark:to-fuchsia-600/60 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
                                {comment.authorName.charAt(0)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-pink-300 dark:text-pink-400 font-medium">{comment.authorName}</span>
                                <span className="text-white/80 dark:text-white/70 ml-2">{comment.content}</span>
                              </div>
                            </motion.div>
                          ))}

                          {post.comments.length === 0 && (
                            <p className="text-white/40 dark:text-white/30 text-sm text-center py-2">暂无评论，快来抢沙发！</p>
                          )}

                          <div className="mt-2">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 relative">
                                <Textarea
                                  value={expandedComments === post.id ? commentText : ''}
                                  onChange={(e) => {
                                    if (e.target.value.length <= MAX_COMMENT_LENGTH) {
                                      setCommentText(e.target.value)
                                    }
                                  }}
                                  placeholder="写条评论..."
                                  className="bg-white/8 dark:bg-white/5 border-white/15 dark:border-white/10 text-white dark:text-white/90 placeholder-white/40 dark:placeholder-white/30 min-h-[36px] resize-none rounded-xl text-sm py-2 pr-10"
                                  rows={1}
                                />
                                <span className={`absolute right-2 bottom-2 text-[10px] ${
                                  commentText.length > MAX_COMMENT_LENGTH * 0.8
                                    ? 'text-amber-300/60'
                                    : 'text-white/30 dark:text-white/20'
                                }`}>
                                  {commentText.length}/{MAX_COMMENT_LENGTH}
                                </span>
                              </div>
                              <Button
                                onClick={() => handleComment(post.id)}
                                size="sm"
                                className="bg-pink-500 dark:bg-pink-600 hover:bg-pink-600 dark:hover:bg-pink-700 text-white rounded-xl shrink-0"
                              >
                                发送
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Gradient divider between posts */}
              {!(isLastPinned && hasPinnedPosts && index < displayPosts.length - 1) && index < displayPosts.length - 1 && (
                <div className="flex items-center justify-center py-1">
                  <div className="h-px w-16 bg-gradient-to-r from-transparent via-pink-400/20 dark:via-pink-500/15 to-transparent" />
                </div>
              )}

              {/* Separator between pinned and regular posts */}
              {isLastPinned && hasPinnedPosts && index < displayPosts.length - 1 && (
                <motion.div
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="flex items-center gap-3 py-3"
                >
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-400/30 dark:via-amber-400/15 to-transparent" />
                  <span className="text-[10px] text-amber-400/50 dark:text-amber-400/30 font-medium tracking-wider">以上为置顶公告</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-400/30 dark:via-amber-400/15 to-transparent" />
                </motion.div>
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>

      {displayPosts.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 text-white/60 dark:text-white/40"
        >
          <p className="text-4xl mb-3">--</p>
          <p>{filterMode === 'bookmarked' ? '还没有收藏任何动态' : searchQuery ? '没有找到匹配的动态' : '还没有动态，快来发布第一条吧！'}</p>
        </motion.div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-white/15 dark:bg-white/5 backdrop-blur-xl border-white/20 dark:border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription className="text-white/60 dark:text-white/40">
              删除后将无法恢复，确定要删除这条动态吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeleteDialogOpen(false)}
              className="text-white/70 dark:text-white/50 hover:text-white hover:bg-white/10 dark:hover:bg-white/5"
            >
              取消
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
