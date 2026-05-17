'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Users, BadgeCheck, UserPlus } from 'lucide-react'

interface CircleStats {
  totalVisits: number
  memberCount: number
}

function generateGradientFromName(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue1 = Math.abs(hash) % 360
  const hue2 = (hue1 + 40 + (Math.abs(hash >> 8) % 60)) % 360
  return `from-[hsl(${hue1},70%,55%)] via-[hsl(${(hue1 + hue2) / 2},65%,50%)] to-[hsl(${hue2},70%,55%)]`
}

// Orbiting particle component
function OrbitingParticle({ delay, size, orbitRadius, speed }: { delay: number; size: number; orbitRadius: number; speed: number }) {
  return (
    <motion.div
      className="absolute rounded-full bg-pink-300/60 dark:bg-pink-400/40"
      style={{
        width: size,
        height: size,
        top: '50%',
        left: '50%',
        marginLeft: -size / 2,
        marginTop: -size / 2,
      }}
      animate={{
        x: [0, orbitRadius, 0, -orbitRadius, 0],
        y: [-orbitRadius, 0, orbitRadius, 0, -orbitRadius],
        opacity: [0.3, 0.7, 0.3, 0.7, 0.3],
        scale: [0.8, 1.2, 0.8, 1.2, 0.8],
      }}
      transition={{
        duration: speed,
        repeat: Infinity,
        delay,
        ease: 'easeInOut',
        type: 'tween',
      }}
    />
  )
}

// Animated counter for member count
function AnimatedMemberCount({ target }: { target: number }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (target === 0) return

    let startTime: number | null = null
    let animationFrame: number
    const duration = 1200

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      } else {
        setCount(target)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [target])

  return <>{count.toLocaleString()}</>
}

export function ProfileHeader() {
  const [circleStats, setCircleStats] = useState<CircleStats>({ totalVisits: 0, memberCount: 0 })

  const displayName = '小新'
  const circleName = '小新粉丝圈'

  // Fetch circle stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats')
        if (res.ok) {
          const data = await res.json()
          setCircleStats({
            totalVisits: data.totalVisits ?? 0,
            memberCount: data.memberCount ?? 0,
          })
        }
      } catch {
        // Silently fail
      }
    }
    fetchStats()
  }, [])

  // Circle stats display
  const displayStats = [
    {
      icon: UserPlus,
      label: '已加入',
      value: circleStats.memberCount,
      color: 'text-pink-200 dark:text-pink-300',
      gradient: 'from-pink-400/20 to-rose-400/20',
    },
    {
      icon: Users,
      label: '访问数',
      value: circleStats.totalVisits,
      color: 'text-emerald-200 dark:text-emerald-300',
      gradient: 'from-emerald-400/20 to-teal-400/20',
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center pt-4 pb-6"
    >
      {/* Avatar with double-ring and orbiting particles */}
      <div className="relative inline-block mb-4">
        {/* Outer animated ring */}
        <motion.div
          className="absolute -inset-4 rounded-full bg-gradient-to-r from-pink-400 via-fuchsia-400 to-violet-400 dark:from-pink-600 dark:via-fuchsia-600 dark:to-violet-600 opacity-40 blur-md"
          animate={{
            scale: [1, 1.08, 1],
            rotate: [0, 360],
          }}
          transition={{
            scale: { duration: 3, repeat: Infinity, type: 'tween' },
            rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
          }}
        />
        {/* Inner static ring */}
        <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-pink-400 via-rose-400 to-fuchsia-400 dark:from-pink-600 dark:via-rose-600 dark:to-fuchsia-600 opacity-60 blur-sm" />

        {/* Orbiting particles */}
        <OrbitingParticle delay={0} size={6} orbitRadius={70} speed={6} />
        <OrbitingParticle delay={1.5} size={4} orbitRadius={75} speed={8} />
        <OrbitingParticle delay={3} size={5} orbitRadius={68} speed={7} />
        <OrbitingParticle delay={4.5} size={3} orbitRadius={72} speed={9} />

        <div className="relative rounded-full border-4 border-white/40 dark:border-white/20 overflow-hidden shadow-xl shadow-pink-900/20 w-[120px] h-[120px] flex items-center justify-center bg-white/10 dark:bg-white/5 backdrop-blur-sm">
          <span className="text-white/60 dark:text-white/40 text-2xl font-bold">测试</span>
        </div>

        {/* Verified badge with gold shimmer */}
        <motion.div
          className="absolute -bottom-1 -right-1 rounded-full p-1 border-2 border-white/40 dark:border-white/20 overflow-hidden"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, type: 'tween' }}
        >
          <div className="gold-shimmer rounded-full p-1">
            <BadgeCheck className="w-4 h-4 text-white fill-white" />
          </div>
        </motion.div>
      </div>

      {/* Circle name with gradient text effect */}
      <motion.h1
        className="text-2xl font-bold gradient-text drop-shadow-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {circleName}
      </motion.h1>

      {/* Stats with breathing animation and glow */}
      <motion.div
        className="relative flex justify-center gap-4 mt-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {/* Subtle glow behind stats */}
        <div className="absolute inset-0 flex justify-center">
          <div className="w-64 h-8 bg-pink-400/10 dark:bg-pink-500/5 rounded-full blur-xl" />
        </div>

        {displayStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            className={`relative flex flex-col items-center gap-1 bg-gradient-to-br ${stat.gradient} backdrop-blur-sm rounded-2xl px-6 py-3 border border-white/15 dark:border-white/10 min-w-[90px]`}
            animate={{
              scale: [1, 1.02, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.5,
              type: 'tween',
            }}
          >
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
            <span className="text-white dark:text-white/90 font-bold text-lg leading-none">
              <AnimatedMemberCount target={stat.value} />
            </span>
            <span className="text-white/60 dark:text-white/40 text-xs">{stat.label}</span>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )
}
