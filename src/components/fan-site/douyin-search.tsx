'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, User, ExternalLink, CheckCircle, Loader2, Sparkles, X, Users as UsersIcon, Heart, Film } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

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

export function DouyinSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<DouyinUser[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setSearched(true)

    try {
      const res = await fetch(`/api/douyin-search?user_name=${encodeURIComponent(query.trim())}`)
      const data = await res.json()

      if (data.code === 200) {
        setResults(data.data || [])
      } else {
        setError(data.message || '搜索失败')
        setResults([])
      }
    } catch {
      setError('网络错误，请稍后重试')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    setSearched(false)
    setError(null)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <motion.div
        className="text-center mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-bold text-white drop-shadow-lg flex items-center justify-center gap-2">
          搜索达人
        </h2>
        <p className="text-white/60 text-sm mt-1">搜索抖音用户，实时查看粉丝、获赞、作品数据</p>
      </motion.div>

      {/* Search box */}
      <motion.div
        className="bg-white/12 backdrop-blur-xl border border-white/20 rounded-2xl p-5 mb-6 shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入抖音号或昵称搜索..."
              className="bg-white/8 border-white/15 text-white placeholder-white/40 focus:border-pink-400/50 pl-10 rounded-xl h-11"
            />
            {query && (
              <button
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="bg-pink-500 hover:bg-pink-600 text-white rounded-xl h-11 px-6 shadow-lg shadow-pink-500/30"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Search className="w-4 h-4 mr-1.5" />
                搜索
              </>
            )}
          </Button>
        </div>

        {/* Quick search suggestions */}
        <div className="flex flex-wrap gap-2">
          <span className="text-white/40 text-xs">热门搜索：</span>
          {['测试', '测试2', '测试3'].map((tag) => (
            <motion.button
              key={tag}
              onClick={() => {
                setQuery(tag)
              }}
              className="text-xs px-3 py-1 rounded-full bg-white/8 text-white/60 border border-white/10 hover:bg-white/15 hover:text-white/80 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {tag}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Loading state */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-12"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-4">
              <Loader2 className="w-8 h-8 text-pink-300 animate-spin" />
            </div>
            <p className="text-white/60 text-sm">正在搜索抖音用户...</p>
            <p className="text-white/40 text-xs mt-1">正在获取实时数据，请稍候</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error state */}
      <AnimatePresence>
        {error && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-500/15 backdrop-blur-xl border border-red-400/30 rounded-2xl p-5 text-center"
          >
            <p className="text-red-300 text-sm">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {!loading && !error && searched && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-white/60 text-sm">
                找到 <span className="text-pink-300 font-medium">{results.length}</span> 个相关用户
              </p>
            </div>

            {results.map((user, index) => (
              <motion.div
                key={user.douyinId || user.url || index}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ delay: index * 0.06 }}
                className="bg-white/12 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden shadow-lg hover:bg-white/16 transition-all group"
              >
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.nickname}
                          className="w-14 h-14 rounded-full object-cover border-2 border-white/20"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-400 to-fuchsia-400 flex items-center justify-center border-2 border-white/20 shadow-md">
                          <User className="w-6 h-6 text-white" />
                        </div>
                      )}
                      {user.verified && (
                        <div className="absolute -bottom-0.5 -right-0.5 bg-yellow-400 rounded-full p-0.5 border-2 border-white/30">
                          <CheckCircle className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-bold text-base truncate">{user.nickname}</h3>
                        {user.verified && (
                          <span className="text-xs bg-yellow-400/20 text-yellow-300 px-2 py-0.5 rounded-full border border-yellow-400/30 flex items-center gap-1 shrink-0">
                            <CheckCircle className="w-3 h-3" />
                            认证
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-white/50 mb-2 flex-wrap">
                        {user.douyinId && (
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            抖音号: {user.douyinId}
                          </span>
                        )}
                      </div>

                      {user.signature && (
                        <p className="text-white/55 text-sm line-clamp-2 leading-relaxed">{user.signature}</p>
                      )}
                    </div>

                    {/* Action */}
                    <a
                      href={user.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white/50 hover:text-white hover:bg-white/10 rounded-xl h-8 w-8 p-0"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </a>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/10">
                    <div className="flex items-center gap-1.5 text-sm">
                      <UsersIcon className="w-4 h-4 text-pink-300/70" />
                      <span className="text-white/40">粉丝</span>
                      <span className="text-white font-semibold">{user.followers || '--'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm">
                      <Heart className="w-4 h-4 text-rose-300/70" />
                      <span className="text-white/40">获赞</span>
                      <span className="text-white font-semibold">{user.totalFavorited || '--'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm">
                      <Film className="w-4 h-4 text-amber-300/70" />
                      <span className="text-white/40">作品</span>
                      <span className="text-white font-semibold">{user.awemeCount || '--'}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      <AnimatePresence>
        {!loading && !error && searched && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center py-12 text-white/60"
          >
            <p className="text-4xl mb-3">--</p>
            <p>未找到相关用户</p>
            <p className="text-white/40 text-sm mt-1">试试其他关键词吧</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Initial state */}
      <AnimatePresence>
        {!searched && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-16 text-white/40"
          >
            <motion.div
              className="text-6xl mb-4"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              --
            </motion.div>
            <p className="text-white/60 text-lg font-medium mb-2">搜索你喜欢的抖音达人</p>
            <p className="text-sm">输入抖音号或昵称，实时查看粉丝、获赞、作品数据</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
