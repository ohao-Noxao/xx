'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Eye, Users, MessageCircle, FileText } from 'lucide-react'

interface SiteStatsData {
  totalVisits: number
  todayVisits: number
  totalPosts: number
  totalMessages: number
  totalArchives: number
}

function AnimatedCounter({ target, duration = 1200 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0)
  const countRef = useRef(0)

  useEffect(() => {
    if (target === 0) {
      countRef.current = 0
      return
    }

    let startTime: number | null = null
    let animationFrame: number

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const newValue = Math.floor(eased * target)
      if (newValue !== countRef.current) {
        countRef.current = newValue
        setCount(newValue)
      }

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      } else {
        countRef.current = target
        setCount(target)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [target, duration])

  return (
    <motion.span
      key={`counter-${target}`}
      initial={{ scale: 1 }}
      animate={{ scale: [1, 1.15, 1] }}
      transition={{ duration: 0.3, type: 'tween', ease: 'easeInOut' }}
    >
      {count.toLocaleString()}
    </motion.span>
  )
}

export function SiteStats() {
  const [stats, setStats] = useState<SiteStatsData | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      // Record visit
      try {
        const alreadyRecorded = localStorage.getItem('fan-site-visit-recorded')
        if (!alreadyRecorded) {
          await fetch('/api/stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: window.location.pathname }),
          })
          localStorage.setItem('fan-site-visit-recorded', 'true')
        }
      } catch {
        // Silently fail
      }

      // Fetch stats
      try {
        const res = await fetch('/api/stats')
        if (res.ok && !cancelled) {
          const data = await res.json()
          setStats(data)
        }
      } catch {
        // Silently fail
      }
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, [])

  const statItems = [
    {
      icon: Eye,
      label: '总访问',
      value: stats?.totalVisits ?? 0,
      color: 'text-pink-200 dark:text-pink-300',
      glowColor: 'rgba(236,72,153,0.3)',
    },
    {
      icon: Users,
      label: '今日',
      value: stats?.todayVisits ?? 0,
      color: 'text-emerald-200 dark:text-emerald-300',
      glowColor: 'rgba(52,211,153,0.3)',
    },
    {
      icon: FileText,
      label: '动态',
      value: stats?.totalPosts ?? 0,
      color: 'text-amber-200 dark:text-amber-300',
      glowColor: 'rgba(251,191,36,0.3)',
    },
    {
      icon: MessageCircle,
      label: '消息',
      value: stats?.totalMessages ?? 0,
      color: 'text-sky-200 dark:text-sky-300',
      glowColor: 'rgba(56,189,248,0.3)',
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="mb-4"
    >
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {statItems.map((item) => (
          <motion.div
            key={item.label}
            className="relative flex items-center gap-1.5 bg-white/12 dark:bg-white/5 backdrop-blur-xl rounded-full px-3 py-1.5 border border-white/20 dark:border-white/10 shimmer overflow-hidden"
            whileHover={{
              scale: 1.08,
              boxShadow: `0 0 16px ${item.glowColor}`,
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
            <span className="text-white dark:text-white/90 font-bold text-sm leading-none">
              <AnimatedCounter target={item.value} />
            </span>
            <span className="text-white/60 dark:text-white/40 text-[10px] leading-none">
              {item.label}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
