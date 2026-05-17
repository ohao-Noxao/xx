'use client'

import { useState, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ImagePlus, X, Send, Sparkles, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'

const MAX_POST_LENGTH = 500

const QUICK_REACTIONS = ['+1', '哈哈', '泪目', '加油', '棒', '赞', '心', '火', '开心', '感谢']

// Mood color based on content length
function getMoodColor(length: number): { bg: string; text: string; label: string } {
  if (length === 0) return { bg: 'bg-white/10', text: 'text-white/30', label: '' }
  if (length < 50) return { bg: 'bg-emerald-500/20', text: 'text-emerald-300', label: '轻松' }
  if (length < 150) return { bg: 'bg-sky-500/20', text: 'text-sky-300', label: '分享' }
  if (length < 300) return { bg: 'bg-amber-500/20', text: 'text-amber-300', label: '热情' }
  return { bg: 'bg-rose-500/20', text: 'text-rose-300', label: '深情' }
}

export function PostBox({ onPost, defaultAuthor, defaultAvatar }: { onPost?: () => void; defaultAuthor?: string; defaultAvatar?: string }) {
  const [content, setContent] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showReactions, setShowReactions] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const mood = useMemo(() => getMoodColor(content.length), [content])

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({ title: '请输入内容', description: '说点什么吧', variant: 'destructive' })
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          authorName: defaultAuthor?.trim() || '匿名粉丝',
          imageUrl: imagePreview || undefined,
        }),
      })

      if (res.ok) {
        toast({ title: '发布成功！', description: '你的动态已发布' })
        setContent('')
        setImagePreview(null)
        setIsExpanded(false)
        setShowReactions(false)
        onPost?.()
      }
    } catch {
      toast({ title: '发布失败', description: '请稍后重试', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      className="relative rounded-2xl p-5 mb-6 shadow-lg overflow-hidden"
      layout
    >
      {/* Gradient border animation when focused */}
      {isExpanded && (
        <motion.div
          className="absolute inset-0 rounded-2xl gradient-border-animated p-px"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="w-full h-full bg-white/12 dark:bg-white/5 backdrop-blur-xl rounded-2xl" />
        </motion.div>
      )}
      {!isExpanded && (
        <div className="absolute inset-0 bg-white/12 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl" />
      )}

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-3">
          <motion.div
            className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-fuchsia-400 dark:from-pink-600 dark:to-fuchsia-600 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0"
            key={defaultAvatar}
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            {defaultAvatar ? <span>{defaultAvatar}</span> : <User className="w-4 h-4" />}
          </motion.div>
          <span className="text-white/70 dark:text-white/50 text-sm font-medium">{defaultAuthor || '匿名粉丝'}</span>
          {/* Mood indicator */}
          {content.length > 0 && (
            <motion.div
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] ${mood.bg} ${mood.text}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              <motion.div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: 'currentColor' }}
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, type: 'tween' }}
              />
              <span>{mood.label}</span>
            </motion.div>
          )}
        </div>

        {/* Image preview */}
        <AnimatePresence>
          {imagePreview && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative mb-3 rounded-xl overflow-hidden border border-white/15 dark:border-white/10 h-32"
            >
              <img src={imagePreview} alt="预览" className="w-full h-full object-cover" />
              <button
                onClick={() => setImagePreview(null)}
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 rounded-full p-1 text-white/80 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative">
          <Textarea
            value={content}
            onChange={(e) => {
              if (e.target.value.length <= MAX_POST_LENGTH) {
                setContent(e.target.value)
              }
              if (!isExpanded && e.target.value) setIsExpanded(true)
            }}
            onFocus={() => setIsExpanded(true)}
            placeholder="说点什么吧..."
            className="bg-white/8 dark:bg-white/5 border-white/15 dark:border-white/10 text-white dark:text-white/90 placeholder-white/40 dark:placeholder-white/30 focus:border-pink-400/50 min-h-[80px] resize-none rounded-xl pb-7"
          />
          <span className={`absolute right-3 bottom-2 text-[10px] ${
            content.length > MAX_POST_LENGTH * 0.8 ? 'text-amber-300/60' : 'text-white/30 dark:text-white/20'
          }`}>
            {content.length}/{MAX_POST_LENGTH}
          </span>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/60 dark:text-white/40 hover:text-white dark:hover:text-white hover:bg-white/10 dark:hover:bg-white/5 rounded-xl"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImagePlus className="w-4 h-4 mr-1" />
                    图片
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          toast({ title: '图片不能超过5MB', variant: 'destructive' })
                          return
                        }
                        const reader = new FileReader()
                        reader.onload = (ev) => {
                          setImagePreview(ev.target?.result as string)
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/60 dark:text-white/40 hover:text-white dark:hover:text-white hover:bg-white/10 dark:hover:bg-white/5 rounded-xl"
                    onClick={() => setShowReactions(!showReactions)}
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    快捷
                  </Button>
                </div>

                {/* Quick reactions picker */}
                <AnimatePresence>
                  {showReactions && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="absolute bottom-full left-0 mb-2 overflow-hidden"
                    >
                      <div className="flex flex-wrap gap-1.5 p-2 glass-strong rounded-xl">
                        {QUICK_REACTIONS.map((reaction) => (
                          <motion.button
                            key={reaction}
                            onClick={() => {
                              setContent(prev => prev + reaction)
                              setShowReactions(false)
                            }}
                            className="text-xs px-2 py-1 rounded-lg hover:bg-white/15 dark:hover:bg-white/5 transition-colors text-white/80 dark:text-white/60"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            {reaction}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/40 dark:text-white/30 hover:text-white/60 dark:hover:text-white/50 rounded-xl"
                    onClick={() => {
                      setIsExpanded(false)
                      setContent('')
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  {/* Submit button with shimmer effect */}
                  <motion.div
                    className="relative"
                    whileTap={{ scale: 0.95 }}
                  >
                    {isSubmitting && (
                      <div className="absolute inset-0 rounded-xl shimmer" />
                    )}
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="bg-pink-500 dark:bg-pink-600 hover:bg-pink-600 dark:hover:bg-pink-700 text-white rounded-xl px-5 shadow-lg shadow-pink-500/30 dark:shadow-pink-600/30 relative z-10"
                      size="sm"
                    >
                      <Send className="w-4 h-4 mr-1" />
                      {isSubmitting ? '发布中...' : '发布'}
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
