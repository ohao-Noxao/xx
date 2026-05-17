'use client'

import { useState, useCallback, useEffect, useRef, useMemo, useSyncExternalStore } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, BookOpen, MessageCircle, Sparkles, Sun, Moon, User } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useSession } from 'next-auth/react'
import { ProfileHeader } from '@/components/fan-site/profile-header'
import { PostFeed } from '@/components/fan-site/post-feed'
import { PostBox } from '@/components/fan-site/post-box'
import { ArchiveSection } from '@/components/fan-site/archive-section'
import { ChatRoom } from '@/components/fan-site/chat-room'
import { SiteStats } from '@/components/fan-site/site-stats'
import { ScrollToTop } from '@/components/fan-site/scroll-to-top'
import { AuthDialog } from '@/components/fan-site/auth-dialog'
import { ProfileSection } from '@/components/fan-site/profile-section'

type TabType = 'homepage' | 'archive' | 'chat' | 'profile'

const tabs = [
  { id: 'homepage' as TabType, label: '主页', icon: Home },
  { id: 'archive' as TabType, label: '档案馆', icon: BookOpen },
  { id: 'chat' as TabType, label: '聊天室', icon: MessageCircle },
  { id: 'profile' as TabType, label: '我的', icon: User },
]

const emptySubscribe = () => () => {}

function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const mounted = useMounted()

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-full bg-white/10 dark:bg-white/5 border border-white/15 dark:border-white/10" />
    )
  }

  const isDark = theme === 'dark'

  return (
    <motion.button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-amber-400/20 via-orange-400/20 to-pink-400/20 dark:from-amber-500/10 dark:via-orange-500/10 dark:to-pink-500/10 hover:from-amber-400/30 hover:via-orange-400/30 hover:to-pink-400/30 dark:hover:from-amber-500/20 dark:hover:via-orange-500/20 dark:hover:to-pink-500/20 border border-white/20 dark:border-white/10 transition-all duration-300 overflow-hidden"
      whileTap={{ scale: 0.9 }}
      aria-label={isDark ? '切换到亮色模式' : '切换到暗色模式'}
    >
      {/* Glow ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{
          boxShadow: isDark
            ? '0 0 12px rgba(251, 191, 36, 0.3), inset 0 0 8px rgba(251, 191, 36, 0.1)'
            : '0 0 12px rgba(251, 191, 36, 0.2), inset 0 0 8px rgba(251, 191, 36, 0.05)',
        }}
        transition={{ duration: 0.4 }}
      />
      <motion.div
        initial={false}
        animate={{ rotate: isDark ? 180 : 0 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      >
        {isDark ? (
          <Moon className="w-4 h-4 text-amber-300" />
        ) : (
          <Sun className="w-4 h-4 text-amber-200" />
        )}
      </motion.div>
    </motion.button>
  )
}

// Sparkle component with varied sizes, speeds, and rotation
function FloatingSparkles() {
  const sparkles = useMemo(() =>
    [...Array(24)].map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 10 + Math.random() * 14,
      duration: 3 + Math.random() * 4,
      delay: Math.random() * 4,
      yRange: 10 + Math.random() * 20,
      rotationRange: 15 + Math.random() * 30,
    })),
    []
  )

  return (
    <div className="fixed inset-0 -z-5 pointer-events-none overflow-hidden">
      {sparkles.map((s) => (
        <motion.div
          key={s.id}
          className="absolute text-white/20 dark:text-white/10"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
          }}
          animate={{
            y: [0, -s.yRange, 0],
            opacity: [0.15, 0.5, 0.15],
            scale: [1, 1.3, 1],
            rotate: [0, s.rotationRange, 0],
          }}
          transition={{
            duration: s.duration,
            repeat: Infinity,
            delay: s.delay,
            type: 'tween',
          }}
        >
          <Sparkles className="w-4 h-4" style={{ width: s.size, height: s.size }} />
        </motion.div>
      ))}
    </div>
  )
}

// Tab content with slide transitions
const tabVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 60 : -60,
    opacity: 0,
  }),
}

export function FanSiteApp() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<TabType>('homepage')
  const [postRefreshKey, setPostRefreshKey] = useState(0)
  const [scrollY, setScrollY] = useState(0)
  const [[, direction], setDirection] = useState<[number, number]>([0, 0])
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const mainRef = useRef<HTMLDivElement>(null)

  // Auth-derived user info for child components
  const userName = session?.user?.name || ''
  const userAvatar = (session?.user as { avatar?: string })?.avatar || ''

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handlePostCreated = useCallback(() => {
    setPostRefreshKey((prev) => prev + 1)
  }, [])

  const handleTabChange = useCallback((tab: TabType) => {
    const tabIndex = tabs.findIndex(t => t.id === tab)
    const currentTabIndex = tabs.findIndex(t => t.id === activeTab)
    setDirection([tabIndex, tabIndex > currentTabIndex ? 1 : -1])
    setActiveTab(tab)
  }, [activeTab])

  // Parallax: nav opacity based on scroll
  const navOpacity = Math.max(0.6, 1 - scrollY / 600)
  const navBgOpacity = Math.min(0.95, 0.15 + scrollY / 400)

  const getTabIndex = (tab: TabType) => tabs.findIndex(t => t.id === tab)

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Animated background - light mode */}
      <div className="fixed inset-0 bg-gradient-to-br from-pink-400 via-rose-400 to-fuchsia-500 -z-10 dark:hidden" />
      {/* Animated background - dark mode */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 -z-10 hidden dark:block" />

      {/* Background blobs - light mode */}
      <div className="fixed inset-0 -z-10 opacity-30 dark:hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-pink-300 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-fuchsia-300 rounded-full blur-3xl animate-pulse delay-700" />
        <div className="absolute bottom-40 left-1/3 w-80 h-80 bg-rose-300 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-10 right-1/3 w-64 h-64 bg-violet-300 rounded-full blur-3xl animate-pulse delay-500" />
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-cyan-200 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
      {/* Background blobs - dark mode */}
      <div className="fixed inset-0 -z-10 hidden dark:block">
        <div className="absolute top-20 left-10 w-72 h-72 bg-pink-900/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl animate-pulse delay-700" />
        <div className="absolute bottom-40 left-1/3 w-80 h-80 bg-pink-800/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-10 right-1/3 w-64 h-64 bg-violet-900/25 rounded-full blur-3xl animate-pulse delay-500" />
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-cyan-900/15 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Gradient mesh overlay */}
      <div className="fixed inset-0 -z-10 gradient-mesh pointer-events-none" />

      {/* Floating sparkles */}
      <FloatingSparkles />

      {/* Top bar with auth */}
      <div className="fixed top-0 left-0 right-0 z-40 pointer-events-none">
        <div className="max-w-2xl mx-auto px-4 pt-3 flex justify-end">
          <div className="pointer-events-auto">
            <AuthDialog externalOpen={authDialogOpen} onExternalOpenChange={setAuthDialogOpen} />
          </div>
        </div>
      </div>

      {/* Pull to refresh hint */}
      <div className="flex justify-center pt-2 pb-1 dark:opacity-30">
        <motion.div
          className="pull-hint text-white/30 dark:text-white/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 2L8 11M8 11L4 7M8 11L12 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" transform="rotate(180 8 6.5)"/>
          </svg>
        </motion.div>
      </div>

      {/* Main content */}
      <main ref={mainRef} className="flex-1 pb-28 max-w-2xl w-full mx-auto px-4 pt-2">
        <AnimatePresence mode="wait" custom={direction}>
          {activeTab === 'homepage' && (
            <motion.div
              key="homepage"
              custom={direction}
              variants={tabVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <ProfileHeader />
              <SiteStats />
              <PostBox onPost={handlePostCreated} defaultAuthor={userName} defaultAvatar={userAvatar} />
              <PostFeed refreshKey={postRefreshKey} />
            </motion.div>
          )}
          {activeTab === 'archive' && (
            <motion.div
              key="archive"
              custom={direction}
              variants={tabVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <ArchiveSection />
            </motion.div>
          )}
          {activeTab === 'chat' && (
            <motion.div
              key="chat"
              custom={direction}
              variants={tabVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <ChatRoom isActive={activeTab === 'chat'} defaultUsername={userName} defaultAvatar={userAvatar} />
            </motion.div>
          )}
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              custom={direction}
              variants={tabVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <ProfileSection onLoginClick={() => setAuthDialogOpen(true)} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav
        className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 transition-opacity duration-300 pb-[env(safe-area-inset-bottom)]"
        style={{ opacity: navOpacity }}
      >
        {/* Gradient border at top of nav */}
        <div className="absolute -top-px left-4 right-4 h-px bg-gradient-to-r from-transparent via-pink-400/40 dark:via-pink-500/30 to-transparent" />
        <div
          className="flex items-center gap-2 backdrop-blur-xl border border-white/25 dark:border-white/10 rounded-full px-3 py-2 shadow-2xl transition-colors duration-300 relative"
          style={{
            backgroundColor: `rgba(255,255,255,${navBgOpacity})`,
          }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <motion.button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`relative flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-pink-500 dark:bg-pink-600 text-white shadow-lg shadow-pink-500/30 dark:shadow-pink-600/30'
                    : 'text-white/80 hover:text-white hover:bg-white/10 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/5'
                }`}
                whileTap={{ scale: 0.92 }}
                animate={isActive ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                transition={isActive ? { duration: 0.3, type: 'tween' } : {}}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-pink-500 dark:bg-pink-600 -z-10"
                    layoutId="activeTab"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                {/* Subtle glow behind active tab */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-full -z-20"
                    animate={{
                      boxShadow: [
                        '0 0 0px rgba(236,72,153,0)',
                        '0 0 20px rgba(236,72,153,0.3)',
                        '0 0 0px rgba(236,72,153,0)',
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', type: 'tween' }}
                  />
                )}
                {/* Dot indicator below active tab */}
                {isActive && (
                  <motion.div
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white"
                    layoutId="activeDot"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.1 }}
                  />
                )}
              </motion.button>
            )
          })}

          {/* Theme toggle button */}
          <div className="ml-1 pl-2 border-l border-white/15 dark:border-white/10">
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Scroll to top button */}
      <ScrollToTop />
    </div>
  )
}
