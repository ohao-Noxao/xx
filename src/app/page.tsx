'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FanSiteApp } from '@/components/fan-site/fan-site-app'

const PULSING_RINGS = [0, 1, 2]

export default function Home() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const init = async () => {
      try {
        // Check localStorage flag to skip unnecessary seed calls
        const alreadySeeded = localStorage.getItem('fan-site-seeded')
        if (!alreadySeeded) {
          await fetch('/api/seed', { method: 'POST' })
          localStorage.setItem('fan-site-seeded', 'true')
        }
      } catch {
        // Already seeded or error, ignore
      }
      setReady(true)
    }
    init()
  }, [])

  return (
    <AnimatePresence mode="wait">
      {!ready ? (
        <motion.div
          key="loading"
          className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-400 via-rose-400 to-fuchsia-500 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-white text-center relative">
            {/* Pulsing concentric rings */}
            <div className="relative w-24 h-24 mx-auto mb-6">
              {PULSING_RINGS.map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full border-2 border-white/40 dark:border-white/20"
                  animate={{
                    scale: [1, 2.2, 2.5],
                    opacity: [0.6, 0.2, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.6,
                    ease: 'easeOut',
                  }}
                />
              ))}
              {/* Center dot */}
              <motion.div
                className="absolute inset-0 m-auto w-6 h-6 rounded-full bg-white/80 dark:bg-pink-500/80"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, type: 'tween' }}
              />
            </div>
            {/* Site name with fade-in */}
            <motion.p
              className="text-lg font-medium"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              小新粉丝圈
            </motion.p>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <FanSiteApp />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
