'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Users, Bell, Reply, X, Clock, Type, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

interface Message {
  id: string
  username: string
  content: string
  avatar: string | null
  createdAt: string
  replyTo?: {
    username: string
    snippet: string
  } | null
}

interface ReactionsMap {
  [messageId: string]: string[]
}

const REACTION_OPTIONS = ['+1', '哈哈', '泪目', '加油', '赞']

const POLL_INTERVAL = 5000 // 5 seconds
const REACTIONS_STORAGE_KEY = 'fan-site-reactions'

// Waveform typing indicator
function WaveformTypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2 bg-white/5 dark:bg-white/3 rounded-lg">
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="w-1 rounded-full bg-white/50 dark:bg-white/30"
          style={{ height: 4 }}
          animate={{
            height: [4, 16, 8, 12, 4],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.1,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

function ReactionPill({ text, count, onRemove }: { text: string; count: number; onRemove?: () => void }) {
  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onRemove}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 dark:bg-white/5 text-white/60 dark:text-white/40 hover:bg-white/15 dark:hover:bg-white/8 border border-white/10 dark:border-white/5 transition-colors"
    >
      <span>{text}</span>
      {count > 1 && <span>{count}</span>}
    </motion.button>
  )
}

interface ChatRoomProps {
  isActive?: boolean
  defaultUsername?: string
  defaultAvatar?: string
}

export function ChatRoom({ isActive = true, defaultUsername = '', defaultAvatar = '' }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')

  const [loading, setLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [newMessageIds, setNewMessageIds] = useState<Set<string>>(new Set())
  const [unreadCount, setUnreadCount] = useState(0)
  const [reactions, setReactions] = useState<ReactionsMap>({})
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string; snippet: string } | null>(null)
  const [showNewMessageDivider, setShowNewMessageDivider] = useState(false)
  const [initialLoadDone, setInitialLoadDone] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isTypingRef = useRef(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const currentUser = defaultUsername || '匿名粉丝'

  // Load reactions from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(REACTIONS_STORAGE_KEY)
      if (stored) {
        setReactions(JSON.parse(stored))
      }
    } catch {
      // ignore
    }
  }, [])

  const addReaction = useCallback((messageId: string, reaction: string) => {
    setReactions(prev => {
      const current = prev[messageId] || []
      const updated = {
        ...prev,
        [messageId]: [...current, reaction]
      }
      try {
        localStorage.setItem(REACTIONS_STORAGE_KEY, JSON.stringify(updated))
      } catch {
        // ignore
      }
      return updated
    })
  }, [])

  const removeReaction = useCallback((messageId: string, reaction: string) => {
    setReactions(prev => {
      const current = prev[messageId] || []
      const index = current.lastIndexOf(reaction)
      if (index === -1) return prev
      const updatedList = [...current]
      updatedList.splice(index, 1)
      const updated = {
        ...prev,
        [messageId]: updatedList.length > 0 ? updatedList : undefined
      }
      // Remove empty entries
      if (updatedList.length === 0) {
        delete updated[messageId]
      }
      try {
        localStorage.setItem(REACTIONS_STORAGE_KEY, JSON.stringify(updated))
      } catch {
        // ignore
      }
      return updated
    })
  }, [])

  const getReactionCounts = useCallback((messageId: string): { text: string; count: number }[] => {
    const msgReactions = reactions[messageId] || []
    const countMap: Record<string, number> = {}
    msgReactions.forEach(r => {
      countMap[r] = (countMap[r] || 0) + 1
    })
    return Object.entries(countMap).map(([text, count]) => ({ text, count }))
  }, [reactions])

  const handleReply = useCallback((msg: Message) => {
    const snippet = msg.content.length > 10 ? msg.content.slice(0, 10) + '...' : msg.content
    setReplyingTo({ id: msg.id, username: msg.username, snippet })
    // Focus the input
    const inputEl = document.querySelector<HTMLInputElement>('[data-chat-input]')
    inputEl?.focus()
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchMessages = useCallback(async (isPolling = false) => {
    // Don't poll while user is typing
    if (isPolling && isTypingRef.current) return

    try {
      const res = await fetch('/api/messages')
      if (res.ok) {
        const data = await res.json()
        const reversed = data.reverse()
        setMessages(prev => {
          // Find new messages by comparing IDs
          const prevIds = new Set(prev.map(m => m.id))
          const newIds = reversed.filter(m => !prevIds.has(m.id)).map(m => m.id)

          if (newIds.length > 0 && isPolling) {
            // Mark new messages for highlight animation
            setNewMessageIds(new Set(newIds))
            // Auto-clear highlight after 2 seconds
            setTimeout(() => setNewMessageIds(new Set()), 2000)

            // Show new message divider
            setShowNewMessageDivider(true)
            setTimeout(() => setShowNewMessageDivider(false), 3000)

            // Count unread if chat tab is not active
            if (!isActive) {
              setUnreadCount(prevUnread => prevUnread + newIds.length)
            }
          }

          return reversed
        })
      }
    } catch {
      console.error('Failed to fetch messages')
    } finally {
      if (!isPolling) setLoading(false)
    }
  }, [isActive])

  // Initial load
  useEffect(() => {
    fetchMessages().then(() => setInitialLoadDone(true))
  }, [fetchMessages])

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Polling: fetch every 5 seconds when chat is active
  useEffect(() => {
    if (!isActive) return

    // Reset unread when chat becomes active
    setUnreadCount(0)

    const interval = setInterval(() => {
      fetchMessages(true)
    }, POLL_INTERVAL)

    return () => clearInterval(interval)
  }, [isActive, fetchMessages, messages.length])

  // Track typing state
  useEffect(() => {
    isTypingRef.current = newMessage.length > 0
    setIsTyping(newMessage.length > 0)
  }, [newMessage])

  const handleSend = async () => {
    if (!newMessage.trim()) return
    setIsSending(true)

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage.trim(),
          username: defaultUsername || '匿名粉丝',
          avatar: defaultAvatar || '',
        }),
      })

      if (res.ok) {
        const msg = await res.json()
        // Attach replyTo metadata if replying
        const enhancedMsg = replyingTo
          ? { ...msg, replyTo: { username: replyingTo.username, snippet: replyingTo.snippet } }
          : msg
        setMessages((prev) => [...prev, enhancedMsg])
        setNewMessage('')
        setReplyingTo(null)
      }
    } catch {
      toast({ title: '发送失败', variant: 'destructive' })
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)

    if (diffMins < 1) return '刚刚'
    if (diffMins < 60) return `${diffMins}分钟前`
    if (diffHours < 24) return `${diffHours}小时前`
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  const isOwnMessage = (msg: Message) => msg.username === currentUser

  // Compute stats
  const totalCharCount = messages.reduce((sum, m) => sum + m.content.length, 0)
  const lastActiveTime = messages.length > 0 ? messages[messages.length - 1].createdAt : null

  if (loading) {
    return (
      <div className="flex flex-col flex-1 animate-pulse">
        <div className="h-6 bg-white/20 dark:bg-white/10 rounded w-32 mb-4" />
        <div className="flex-1 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`flex items-start gap-3 ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}>
              <div className="w-8 h-8 bg-white/20 dark:bg-white/10 rounded-full shrink-0" />
              <div className="flex-1">
                <div className="h-3 bg-white/15 dark:bg-white/8 rounded w-20 mb-1" />
                <div className="h-4 bg-white/10 dark:bg-white/5 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col flex-1"
    >
      {/* Header */}
      <motion.div
        className="text-center mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-bold gradient-text drop-shadow-lg flex items-center justify-center gap-2">
          粉丝聊天室
        </h2>
        <div className="flex items-center justify-center gap-2 mt-1 text-white/60 dark:text-white/40 text-sm flex-wrap">
          <Users className="w-4 h-4" />
          <span>{messages.length} 条消息</span>
          <span className="text-white/30 dark:text-white/20">·</span>
          {/* Heartbeat online indicator */}
          <span className="flex items-center gap-1">
            <span className="relative flex h-2.5 w-2.5">
              <motion.span
                className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 dark:bg-emerald-500"
                animate={{ scale: [1, 1.4, 1], opacity: [0.7, 0, 0.7] }}
                transition={{ duration: 1, repeat: Infinity, type: 'tween' }}
              />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 dark:bg-emerald-500" />
            </span>
            在线
          </span>
          <span className="text-white/30 dark:text-white/20">·</span>
          <span className="flex items-center gap-1">
            <Type className="w-3 h-3" />
            {totalCharCount} 字
          </span>
          {lastActiveTime && (
            <>
              <span className="text-white/30 dark:text-white/20">·</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                最近活跃 {formatRelativeTime(lastActiveTime)}
              </span>
            </>
          )}
          {/* New messages indicator */}
          {unreadCount > 0 && !isActive && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center gap-1 bg-pink-500 dark:bg-pink-600 text-white text-xs px-2 py-0.5 rounded-full"
            >
              <Bell className="w-3 h-3" />
              {unreadCount} 条新消息
            </motion.span>
          )}
        </div>
      </motion.div>

      {/* Chat container with gradient background */}
      <div className="flex flex-col flex-1 relative">

        {/* Messages area with gradient overlays */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 scroll-smooth relative" ref={scrollContainerRef} style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(236,72,153,0.2) transparent' }}>
          {/* Top gradient overlay */}
          <div className="sticky top-0 left-0 right-0 h-6 bg-gradient-to-b from-white/8 dark:from-white/3 to-transparent pointer-events-none z-10 -mx-4 -mt-4 mb-0" />

          {/* Welcome message */}
          <div className="text-center py-3">
            <span className="text-white/30 dark:text-white/20 text-xs bg-white/5 dark:bg-white/3 rounded-full px-4 py-1">
              欢迎来到粉丝聊天室！请友善交流
            </span>
          </div>

          <AnimatePresence>
            {messages.map((msg, index) => {
              const own = isOwnMessage(msg)
              const isNew = newMessageIds.has(msg.id)
              const msgReactions = getReactionCounts(msg.id)
              return (
                <motion.div
                  key={msg.id}
                  initial={initialLoadDone ? { opacity: 0, y: 10, scale: 0.95 } : { opacity: 0, y: 20 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    backgroundColor: isNew ? 'rgba(236,72,153,0.15)' : 'transparent',
                  }}
                  exit={{ opacity: 0 }}
                  transition={{
                    delay: initialLoadDone ? 0 : index * 0.04,
                    backgroundColor: { duration: 1.5, delay: 0.5 },
                    default: { duration: 0.3, ease: 'easeOut' }
                  }}
                  className={`flex ${own ? 'justify-end' : 'justify-start'} rounded-lg p-0.5 -m-0.5`}
                >
                  <div className={`flex items-end gap-2 max-w-[80%] ${own ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 shadow-md ${
                      own
                        ? 'bg-gradient-to-br from-pink-400/80 to-fuchsia-400/80 dark:from-pink-600/80 dark:to-fuchsia-600/80 text-white'
                        : 'bg-gradient-to-br from-white/30 to-white/15 dark:from-white/15 dark:to-white/5 text-white/80 dark:text-white/60'
                    }`}>
                      {msg.avatar ? <span>{msg.avatar}</span> : <User className="w-4 h-4" />}
                    </div>

                    {/* Bubble with 3D shadow depth */}
                    <div className="relative group">
                      {/* Reply reference */}
                      {msg.replyTo && (
                        <div className={`mb-1 px-2.5 py-1 rounded-lg text-[10px] border-l-2 ${
                          own
                            ? 'bg-pink-400/10 dark:bg-pink-500/10 border-pink-300/40 dark:border-pink-400/30 text-pink-200/60 dark:text-pink-300/50'
                            : 'bg-white/5 dark:bg-white/3 border-white/20 dark:border-white/10 text-white/40 dark:text-white/30'
                        }`}>
                          <span className="font-medium">@{msg.replyTo.username}</span>: {msg.replyTo.snippet}
                        </div>
                      )}

                      <div className={`rounded-2xl px-3.5 py-2.5 ${
                        own
                          ? 'bg-pink-500/70 dark:bg-pink-600/70 text-white rounded-br-sm shadow-lg shadow-pink-500/20 dark:shadow-pink-600/15'
                          : 'bg-white/15 dark:bg-white/8 text-white/90 dark:text-white/80 rounded-bl-sm shadow-lg shadow-black/10 dark:shadow-black/5'
                      }`}>
                        {/* Username (only for others) */}
                        {!own && (
                          <p className="text-pink-300 dark:text-pink-400 text-xs font-medium mb-0.5">{msg.username}</p>
                        )}
                        <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                      </div>

                      {/* CSS triangle tail */}
                      {own ? (
                        <div className="absolute bottom-0 right-[-6px]">
                          <div className="w-0 h-0 border-l-[6px] border-l-pink-500/70 dark:border-l-pink-600/70 border-y-[5px] border-y-transparent" />
                        </div>
                      ) : (
                        <div className="absolute bottom-0 left-[-6px]">
                          <div className="w-0 h-0 border-r-[6px] border-r-white/15 dark:border-r-white/8 border-y-[5px] border-y-transparent" />
                        </div>
                      )}

                      {/* Reaction pills */}
                      {msgReactions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          <AnimatePresence>
                            {msgReactions.map(({ text, count }) => (
                              <ReactionPill
                                key={text}
                                text={text}
                                count={count}
                                onRemove={() => removeReaction(msg.id, text)}
                              />
                            ))}
                          </AnimatePresence>
                        </div>
                      )}

                      {/* Action buttons on hover */}
                      <div className="absolute -top-1 right-0 left-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                        <div className={`flex items-center gap-0.5 pointer-events-auto ${own ? 'flex-row-reverse' : 'flex-row'}`}>
                          {/* Reaction buttons */}
                          {REACTION_OPTIONS.map((reaction) => (
                            <motion.button
                              key={reaction}
                              onClick={() => addReaction(msg.id, reaction)}
                              className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 dark:bg-white/5 text-white/50 dark:text-white/40 hover:bg-white/20 dark:hover:bg-white/10 hover:text-white/80 dark:hover:text-white/60 transition-colors border border-white/10 dark:border-white/5"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              {reaction}
                            </motion.button>
                          ))}
                          {/* Reply button */}
                          <motion.button
                            onClick={() => handleReply(msg)}
                            className="p-1 rounded-full bg-white/10 dark:bg-white/5 text-white/50 dark:text-white/40 hover:bg-white/20 dark:hover:bg-white/10 hover:text-white/80 dark:hover:text-white/60 transition-colors border border-white/10 dark:border-white/5"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Reply className="w-3 h-3" />
                          </motion.button>
                        </div>
                      </div>

                      {/* Always-visible timestamp */}
                      <div className="flex justify-center mt-0.5">
                        <span className="text-[10px] text-white/20 dark:text-white/15 group-hover:text-white/40 dark:group-hover:text-white/30 transition-colors duration-200">
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {/* New message divider */}
          <AnimatePresence>
            {showNewMessageDivider && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex items-center gap-2 py-1"
              >
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-pink-400/40 dark:via-pink-500/30 to-transparent" />
                <span className="text-pink-400/60 dark:text-pink-500/40 text-[10px] font-medium whitespace-nowrap">新消息</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-pink-400/40 dark:via-pink-500/30 to-transparent" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Typing indicator with waveform */}
          {isSending && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex justify-end"
            >
              <div className="flex items-end gap-2">
                <div className="bg-pink-500/70 dark:bg-pink-600/70 rounded-2xl rounded-br-sm px-1 py-1 shadow-lg shadow-pink-500/20">
                  <WaveformTypingIndicator />
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-pink-400/80 to-fuchsia-400/80 dark:from-pink-600/80 dark:to-fuchsia-600/80 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-md">
                  {defaultAvatar ? <span>{defaultAvatar}</span> : <User className="w-4 h-4" />}
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />

          {/* Bottom gradient overlay */}
          <div className="sticky bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white/8 dark:from-white/3 to-transparent pointer-events-none z-10 -mx-4 -mb-4 mt-0" />
        </div>

        {/* Input area with glow when typing */}
        <motion.div
          className="border-t border-white/10 dark:border-white/5 p-3"
          animate={isTyping ? {
            boxShadow: '0 -8px 20px rgba(236,72,153,0.1)',
          } : {
            boxShadow: '0 0 0px rgba(236,72,153,0)',
          }}
          transition={{ duration: 0.3 }}
        >
          {/* Reply indicator */}
          <AnimatePresence>
            {replyingTo && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-2"
              >
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 dark:bg-white/3 border border-white/10 dark:border-white/5">
                  <Reply className="w-3 h-3 text-pink-400 dark:text-pink-500 shrink-0" />
                  <span className="text-xs text-white/50 dark:text-white/30 truncate flex-1">
                    回复 <span className="text-pink-300 dark:text-pink-400 font-medium">@{replyingTo.username}</span>: {replyingTo.snippet}
                  </span>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="text-white/30 dark:text-white/20 hover:text-white/60 dark:hover:text-white/40 transition-colors shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-2">
            <Input
              data-chat-input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={replyingTo ? `回复 @${replyingTo.username}...` : '发条消息...'}
              className={`bg-white/8 dark:bg-white/5 border-white/15 dark:border-white/10 text-white dark:text-white/90 placeholder-white/40 dark:placeholder-white/30 focus:border-pink-400/50 rounded-xl flex-1 transition-shadow ${isTyping ? 'shadow-[0_0_12px_rgba(236,72,153,0.15)]' : ''}`}
            />
            <Button
              onClick={handleSend}
              disabled={isSending || !newMessage.trim()}
              className="bg-pink-500 dark:bg-pink-600 hover:bg-pink-600 dark:hover:bg-pink-700 text-white rounded-xl shrink-0 shadow-lg shadow-pink-500/30 dark:shadow-pink-600/30 h-9 w-9 p-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
