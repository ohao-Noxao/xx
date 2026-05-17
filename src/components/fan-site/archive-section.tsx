'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  Tag,
  Plus,
  Image as ImageIcon,
  X,
  Loader2,
  Clock,
  Film,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Archive {
  id: string
  title: string
  content: string
  date: string
  imageUrl: string | null
  category: string
}

const CATEGORY_COLORS: Record<string, string> = {
  '早期': 'from-amber-400 to-orange-400',
  '成长': 'from-pink-400 to-rose-400',
  '爆发': 'from-emerald-400 to-teal-400',
  '稳定期': 'from-sky-400 to-blue-400',
}

const CATEGORY_OPTIONS = ['早期', '成长', '爆发', '稳定期']

export function ArchiveSection() {
  const [archives, setArchives] = useState<Archive[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('全部')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [formDate, setFormDate] = useState('')
  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formImageUrl, setFormImageUrl] = useState('')
  const [formCategory, setFormCategory] = useState('成长')

  const fetchArchives = useCallback(async () => {
    try {
      const res = await fetch('/api/archives')
      if (res.ok) {
        const data = await res.json()
        setArchives(data)
      }
    } catch {
      console.error('Failed to fetch archives')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchArchives()
  }, [fetchArchives])

  const categories = useMemo(
    () => ['全部', ...Array.from(new Set(archives.map((a) => a.category)))],
    [archives]
  )

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { '全部': archives.length }
    archives.forEach((a) => {
      counts[a.category] = (counts[a.category] || 0) + 1
    })
    return counts
  }, [archives])

  const filteredArchives =
    selectedCategory === '全部'
      ? archives
      : archives.filter((a) => a.category === selectedCategory)

  // Group archives by year for year markers
  const yearGroups = useMemo(() => {
    const groups: { year: string; items: Archive[] }[] = []
    let currentYear = ''
    filteredArchives.forEach((archive) => {
      const year = archive.date
        ? archive.date.split('-')[0] || archive.date.slice(0, 4)
        : '未知'
      if (year !== currentYear) {
        currentYear = year
        groups.push({ year, items: [archive] })
      } else {
        groups[groups.length - 1].items.push(archive)
      }
    })
    return groups
  }, [filteredArchives])

  const resetForm = useCallback(() => {
    setFormDate('')
    setFormTitle('')
    setFormContent('')
    setFormImageUrl('')
    setFormCategory('成长')
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!formDate || !formTitle || !formContent) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/archives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          content: formContent,
          date: formDate,
          imageUrl: formImageUrl || null,
          category: formCategory,
        }),
      })
      if (res.ok) {
        await fetchArchives()
        setDialogOpen(false)
        resetForm()
      }
    } catch {
      console.error('Failed to create archive')
    } finally {
      setSubmitting(false)
    }
  }, [formDate, formTitle, formContent, formImageUrl, formCategory, fetchArchives, resetForm])

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '测试'
    const parts = dateStr.split('-')
    if (parts.length >= 3) {
      return `${parts[0]}.${parts[1]}.${parts[2]}`
    }
    return dateStr
  }

  const formatDateShort = (dateStr: string) => {
    if (!dateStr) return '测试'
    const parts = dateStr.split('-')
    if (parts.length >= 2) {
      return `${parts[1]}.${parts[2] || '01'}`
    }
    return dateStr
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex gap-4 items-start"
          >
            {/* Left skeleton */}
            <div className="flex-shrink-0 w-20">
              <div className="h-6 bg-white/20 dark:bg-white/10 rounded-full animate-pulse w-16 mx-auto" />
            </div>
            {/* Right skeleton */}
            <div className="flex-1 bg-white/12 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl overflow-hidden animate-pulse">
              <div className="h-40 bg-white/15 dark:bg-white/8" />
              <div className="p-4 space-y-3">
                <div className="h-5 bg-white/20 dark:bg-white/10 rounded w-2/3" />
                <div className="h-4 bg-white/15 dark:bg-white/8 rounded w-full" />
                <div className="h-4 bg-white/10 dark:bg-white/5 rounded w-3/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
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
        <h2 className="text-2xl font-bold gradient-text drop-shadow-lg flex items-center justify-center gap-2">
          小新档案馆
        </h2>
        <p className="text-white/50 dark:text-white/40 text-sm mt-1">
          时间线 · 共 {archives.length} 条记录
        </p>
      </motion.div>

      {/* Category filter with count badges + Insert button */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <div className="flex flex-wrap gap-2 flex-1">
          {categories.map((cat) => (
            <motion.button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`relative flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-white/25 dark:bg-white/10 text-white border border-white/30 dark:border-white/15'
                  : 'bg-white/8 dark:bg-white/5 text-white/60 dark:text-white/40 border border-white/10 dark:border-white/5 hover:bg-white/15 dark:hover:bg-white/8 hover:text-white/80 dark:hover:text-white/60'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              layout
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <span>{cat}</span>
              <motion.span
                key={`count-${cat}-${selectedCategory === cat}`}
                className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold ${
                  selectedCategory === cat
                    ? 'bg-white/30 dark:bg-white/15 text-white'
                    : 'bg-white/10 dark:bg-white/5 text-white/50 dark:text-white/30'
                }`}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              >
                {categoryCounts[cat] || 0}
              </motion.span>
              {selectedCategory === cat && (
                <motion.span
                  className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-white/60 dark:bg-white/40"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0, 0.8] }}
                  transition={{ duration: 1.5, repeat: Infinity, type: 'tween' }}
                />
              )}
            </motion.button>
          ))}
        </div>

        {/* Insert event button */}
        <motion.div layout transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
          <Button
            onClick={() => setDialogOpen(true)}
            className="bg-gradient-to-r from-pink-500 to-fuchsia-500 hover:from-pink-600 hover:to-fuchsia-600 text-white border-0 shadow-lg shadow-pink-500/25 rounded-full px-4 h-9 gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">插入事件</span>
          </Button>
        </motion.div>
      </div>

      {/* Timeline - Left: dates, Right: media cards */}
      <div className="relative">
        {/* Gradient timeline line */}
        <div className="absolute left-[38px] sm:left-[42px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-pink-400/60 via-fuchsia-400/40 to-violet-400/20 dark:from-pink-500/40 dark:via-fuchsia-500/25 dark:to-violet-500/15" />

        <AnimatePresence mode="popLayout">
          {yearGroups.map((group) => (
            <div key={group.year}>
              {/* Year marker */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative flex items-center gap-3 pb-3 pt-2"
              >
                <div className="flex-shrink-0 flex items-center justify-center">
                  <div className="w-[80px] sm:w-[84px] flex justify-center">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-fuchsia-500 dark:from-pink-600 dark:to-fuchsia-700 flex items-center justify-center shadow-lg glow-pink z-10">
                      <span className="text-white text-[10px] font-bold">
                        {group.year.slice(-2)}
                      </span>
                    </div>
                  </div>
                </div>
                <span className="text-white/60 dark:text-white/40 text-xs font-bold tracking-widest uppercase">
                  {group.year}
                </span>
              </motion.div>

              {group.items.map((archive, index) => (
                <motion.div
                  key={archive.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 25,
                    delay: index * 0.06,
                  }}
                  layout
                  className="relative flex gap-3 sm:gap-4 pb-6"
                >
                  {/* Left side: Date marker on the timeline */}
                  <div className="flex-shrink-0 w-[80px] sm:w-[84px] flex flex-col items-center pt-3">
                    {/* Pulsing timeline dot */}
                    <div className="relative z-10">
                      <motion.div
                        className="w-4 h-4 rounded-full border-2 border-white/40 dark:border-white/20 bg-gradient-to-br from-pink-400 to-fuchsia-400 dark:from-pink-600 dark:to-fuchsia-600 shadow-lg shadow-pink-500/30 dark:shadow-pink-600/20"
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'easeInOut',
                          type: 'tween',
                        }}
                      />
                      {/* Pulse ring */}
                      <motion.div
                        className="absolute inset-0 rounded-full bg-pink-400/30 dark:bg-pink-500/20"
                        animate={{ scale: [0.8, 1.6], opacity: [0.6, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                      />
                    </div>
                    {/* Date pill */}
                    <motion.div
                      className="mt-2 px-2 py-1 rounded-full bg-white/15 dark:bg-white/8 backdrop-blur-sm border border-white/20 dark:border-white/10 text-center"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20, delay: index * 0.06 + 0.1 }}
                    >
                      <span className="text-white/80 dark:text-white/60 text-xs font-medium whitespace-nowrap">
                        {formatDateShort(archive.date)}
                      </span>
                    </motion.div>
                  </div>

                  {/* Right side: Media card */}
                  <div className="flex-1 min-w-0">
                    <motion.div
                      className="bg-white/12 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl overflow-hidden shadow-lg hover:bg-white/16 dark:hover:bg-white/8 transition-all hover:shadow-xl"
                      whileHover={{ y: -2 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                      {/* Image / Video area */}
                      <div className="relative h-44 sm:h-52 overflow-hidden bg-white/8 dark:bg-white/5 flex items-center justify-center">
                        {archive.imageUrl ? (
                          <div className="relative w-full h-full flex items-center justify-center">
                            <span className="text-white/30 dark:text-white/20 text-2xl font-bold">
                              测试
                            </span>
                            {/* Media type indicator */}
                            <div className="absolute top-3 left-3">
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-black/30 backdrop-blur-sm text-white/80">
                                <Film className="w-3 h-3" />
                                测试
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-white/20 dark:text-white/15">
                            <ImageIcon className="w-10 h-10" />
                            <span className="text-sm">测试</span>
                          </div>
                        )}
                        {/* Gradient overlay at bottom of image */}
                        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent" />
                        {/* Category badge on image */}
                        <div className="absolute top-3 right-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${
                              CATEGORY_COLORS[archive.category] ||
                              'from-gray-400 to-gray-500'
                            } text-white shadow-md`}
                          >
                            <Tag className="w-3 h-3 mr-1" />
                            {archive.category}
                          </span>
                        </div>
                      </div>

                      {/* Content below image */}
                      <div className="p-4 sm:p-5">
                        <div className="flex items-center gap-2 text-white/50 dark:text-white/40 text-xs mb-2">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatDate(archive.date)}</span>
                        </div>
                        <h3 className="text-white dark:text-white/90 font-bold text-base sm:text-lg mb-2">
                          {archive.title}
                        </h3>
                        <p className="text-white/65 dark:text-white/50 text-sm leading-relaxed">
                          {archive.content}
                        </p>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty state */}
      {filteredArchives.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 text-white/60 dark:text-white/40"
        >
          <Clock className="w-12 h-12 mx-auto mb-3 text-white/20 dark:text-white/15" />
          <p>暂无档案记录</p>
          <p className="text-sm mt-1 text-white/40 dark:text-white/25">
            点击「插入事件」添加第一条记录
          </p>
        </motion.div>
      )}

      {/* Insert Event Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-white/12 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white dark:text-white/90 flex items-center gap-2">
              <Plus className="w-5 h-5 text-pink-400" />
              插入事件
            </DialogTitle>
            <DialogDescription className="text-white/50 dark:text-white/40">
              添加新的档案记录到时间线
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Date */}
            <div className="space-y-1.5">
              <label className="text-white/70 dark:text-white/50 text-sm font-medium flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                日期
              </label>
              <Input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="bg-white/10 dark:bg-white/5 border-white/20 dark:border-white/10 text-white dark:text-white/80 placeholder:text-white/30 focus-visible:border-pink-400/50 focus-visible:ring-pink-400/20"
              />
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-white/70 dark:text-white/50 text-sm font-medium">
                标题
              </label>
              <Input
                placeholder="测试"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="bg-white/10 dark:bg-white/5 border-white/20 dark:border-white/10 text-white dark:text-white/80 placeholder:text-white/30 focus-visible:border-pink-400/50 focus-visible:ring-pink-400/20"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-white/70 dark:text-white/50 text-sm font-medium">
                描述
              </label>
              <Textarea
                placeholder="测试"
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                className="bg-white/10 dark:bg-white/5 border-white/20 dark:border-white/10 text-white dark:text-white/80 placeholder:text-white/30 focus-visible:border-pink-400/50 focus-visible:ring-pink-400/20 min-h-[80px]"
              />
            </div>

            {/* Image URL */}
            <div className="space-y-1.5">
              <label className="text-white/70 dark:text-white/50 text-sm font-medium flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" />
                图片链接（可选）
              </label>
              <Input
                placeholder="测试"
                value={formImageUrl}
                onChange={(e) => setFormImageUrl(e.target.value)}
                className="bg-white/10 dark:bg-white/5 border-white/20 dark:border-white/10 text-white dark:text-white/80 placeholder:text-white/30 focus-visible:border-pink-400/50 focus-visible:ring-pink-400/20"
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-white/70 dark:text-white/50 text-sm font-medium flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                分类
              </label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger className="bg-white/10 dark:bg-white/5 border-white/20 dark:border-white/10 text-white dark:text-white/80 w-full focus-visible:border-pink-400/50 focus-visible:ring-pink-400/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900/95 backdrop-blur-xl border-white/20">
                  {CATEGORY_OPTIONS.map((cat) => (
                    <SelectItem
                      key={cat}
                      value={cat}
                      className="text-white/80 focus:bg-white/10 focus:text-white"
                    >
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex-row gap-2 sm:justify-end">
            <DialogClose asChild>
              <Button
                variant="ghost"
                className="text-white/60 dark:text-white/40 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4 mr-1" />
                取消
              </Button>
            </DialogClose>
            <Button
              onClick={handleSubmit}
              disabled={!formDate || !formTitle || !formContent || submitting}
              className="bg-gradient-to-r from-pink-500 to-fuchsia-500 hover:from-pink-600 hover:to-fuchsia-600 text-white border-0 shadow-lg shadow-pink-500/25 disabled:opacity-50 disabled:shadow-none"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  提交中
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-1" />
                  插入
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
