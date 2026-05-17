'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUp } from 'lucide-react'

export function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          onClick={scrollToTop}
          className="fixed bottom-24 right-4 z-40 flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 dark:from-pink-600 dark:to-rose-600 shadow-lg hover:scale-110 active:scale-95 transition-transform relative group"
          whileHover={{
            boxShadow: '0 0 16px 4px rgba(236,72,153,0.4)',
          }}
          whileTap={{ scale: 0.9 }}
          aria-label="回到顶部"
        >
          {/* Pulse ring animation */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-pink-400/40 dark:border-pink-500/30"
            animate={{
              scale: [0.8, 1.5],
              opacity: [0.6, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />

          {/* Arrow with rotation on hover */}
          <motion.div
            whileHover={{ rotate: -360 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <ArrowUp className="w-4 h-4 text-white" />
          </motion.div>
        </motion.button>
      )}
    </AnimatePresence>
  )
}
