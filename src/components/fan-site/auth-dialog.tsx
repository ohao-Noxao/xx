'use client'

import { useState } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogIn, UserPlus, LogOut, Phone, Lock, User, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

type AuthMode = 'login' | 'register'

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone.trim() || !password.trim()) {
      toast({ title: '请填写手机号和密码', variant: 'destructive' })
      return
    }
    setIsLoading(true)
    try {
      const result = await signIn('credentials', {
        phone: phone.trim(),
        password,
        redirect: false,
      })
      if (result?.error) {
        toast({ title: result.error, variant: 'destructive' })
      } else {
        toast({ title: '登录成功！', description: '欢迎回来' })
        onSuccess()
      }
    } catch {
      toast({ title: '登录失败', description: '请稍后重试', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="login-phone" className="text-white/70 dark:text-white/50 text-xs">手机号</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 dark:text-white/20" />
          <Input
            id="login-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
            placeholder="请输入手机号"
            className="bg-white/8 dark:bg-white/5 border-white/15 dark:border-white/10 text-white dark:text-white/90 placeholder-white/30 dark:placeholder-white/20 focus:border-pink-400/50 pl-9 rounded-xl h-10"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="login-password" className="text-white/70 dark:text-white/50 text-xs">密码</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 dark:text-white/20" />
          <Input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入密码"
            className="bg-white/8 dark:bg-white/5 border-white/15 dark:border-white/10 text-white dark:text-white/90 placeholder-white/30 dark:placeholder-white/20 focus:border-pink-400/50 pl-9 pr-9 rounded-xl h-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 dark:text-white/20 hover:text-white/60 dark:hover:text-white/40 transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-pink-500 dark:bg-pink-600 hover:bg-pink-600 dark:hover:bg-pink-700 text-white rounded-xl h-10 shadow-lg shadow-pink-500/30 dark:shadow-pink-600/30"
      >
        {isLoading ? (
          <motion.div
            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        ) : (
          <>
            <LogIn className="w-4 h-4 mr-2" />
            登录
          </>
        )}
      </Button>
    </form>
  )
}

function RegisterForm({ onSuccess, onSwitchToLogin }: { onSuccess: () => void; onSwitchToLogin: () => void }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !phone.trim() || !password.trim()) {
      toast({ title: '请填写所有必填项', variant: 'destructive' })
      return
    }

    if (!/^1\d{10}$/.test(phone.trim())) {
      toast({ title: '请输入正确的手机号', variant: 'destructive' })
      return
    }

    if (password.length < 6) {
      toast({ title: '密码至少6位', variant: 'destructive' })
      return
    }

    if (password !== confirmPassword) {
      toast({ title: '两次密码不一致', variant: 'destructive' })
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast({ title: data.error, variant: 'destructive' })
        return
      }

      toast({ title: '注册成功！', description: '请登录' })
      onSwitchToLogin()
    } catch {
      toast({ title: '注册失败', description: '请稍后重试', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="register-name" className="text-white/70 dark:text-white/50 text-xs">昵称</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 dark:text-white/20" />
          <Input
            id="register-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="请输入昵称"
            maxLength={20}
            className="bg-white/8 dark:bg-white/5 border-white/15 dark:border-white/10 text-white dark:text-white/90 placeholder-white/30 dark:placeholder-white/20 focus:border-pink-400/50 pl-9 rounded-xl h-10"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="register-phone" className="text-white/70 dark:text-white/50 text-xs">手机号</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 dark:text-white/20" />
          <Input
            id="register-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
            placeholder="请输入手机号"
            className="bg-white/8 dark:bg-white/5 border-white/15 dark:border-white/10 text-white dark:text-white/90 placeholder-white/30 dark:placeholder-white/20 focus:border-pink-400/50 pl-9 rounded-xl h-10"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="register-password" className="text-white/70 dark:text-white/50 text-xs">密码</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 dark:text-white/20" />
          <Input
            id="register-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="至少6位密码"
            className="bg-white/8 dark:bg-white/5 border-white/15 dark:border-white/10 text-white dark:text-white/90 placeholder-white/30 dark:placeholder-white/20 focus:border-pink-400/50 pl-9 pr-9 rounded-xl h-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 dark:text-white/20 hover:text-white/60 dark:hover:text-white/40 transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="register-confirm" className="text-white/70 dark:text-white/50 text-xs">确认密码</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 dark:text-white/20" />
          <Input
            id="register-confirm"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="再次输入密码"
            className="bg-white/8 dark:bg-white/5 border-white/15 dark:border-white/10 text-white dark:text-white/90 placeholder-white/30 dark:placeholder-white/20 focus:border-pink-400/50 pl-9 rounded-xl h-10"
          />
        </div>
      </div>
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-pink-500 dark:bg-pink-600 hover:bg-pink-600 dark:hover:bg-pink-700 text-white rounded-xl h-10 shadow-lg shadow-pink-500/30 dark:shadow-pink-600/30"
      >
        {isLoading ? (
          <motion.div
            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        ) : (
          <>
            <UserPlus className="w-4 h-4 mr-2" />
            注册
          </>
        )}
      </Button>
    </form>
  )
}

// User avatar indicator shown when logged in
function UserAvatar({ onLogout }: { onLogout: () => void }) {
  const { data: session } = useSession()
  const avatar = (session?.user as { avatar?: string })?.avatar || ''

  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-fuchsia-400 dark:from-pink-600 dark:to-fuchsia-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-pink-500/20 dark:shadow-pink-600/20">
        {avatar || <User className="w-4 h-4" />}
      </div>
      <span className="text-white/80 dark:text-white/60 text-sm font-medium max-w-[80px] truncate hidden sm:block">
        {session?.user?.name || '测试'}
      </span>
      <button
        onClick={onLogout}
        className="text-white/40 dark:text-white/30 hover:text-white/70 dark:hover:text-white/50 transition-colors p-1 rounded-lg hover:bg-white/10 dark:hover:bg-white/5"
        title="退出登录"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  )
}

export function AuthDialog({ externalOpen, onExternalOpenChange }: { externalOpen?: boolean; onExternalOpenChange?: (open: boolean) => void } = {}) {
  const { data: session, status } = useSession()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<AuthMode>('login')
  const { toast } = useToast()

  // Sync with external open state
  const isDialogOpen = externalOpen !== undefined ? externalOpen : open
  const setIsDialogOpen = (value: boolean) => {
    setOpen(value)
    onExternalOpenChange?.(value)
  }

  const handleLogout = async () => {
    await signOut({ redirect: false })
    toast({ title: '已退出登录' })
  }

  const handleAuthSuccess = () => {
    setIsDialogOpen(false)
  }

  // When logged in, show user avatar and logout button
  if (status === 'authenticated' && session?.user) {
    return <UserAvatar onLogout={handleLogout} />
  }

  // When not logged in, show login button
  return (
    <>
      <motion.button
        onClick={() => setIsDialogOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/12 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-white/10 transition-all text-white/80 dark:text-white/60 hover:text-white text-sm shadow-md"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        <LogIn className="w-4 h-4" />
        <span className="hidden sm:inline">登录</span>
      </motion.button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-gradient-to-br from-pink-500/90 via-rose-500/90 to-fuchsia-600/90 dark:from-slate-800/95 dark:via-slate-800/95 dark:to-slate-900/95 backdrop-blur-2xl border border-white/25 dark:border-white/10 shadow-2xl max-w-sm p-0 overflow-hidden">
          {/* Decorative background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-fuchsia-400/20 dark:bg-fuchsia-500/10 rounded-full blur-2xl" />
          </div>

          <div className="relative p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-white text-xl font-bold text-center">
                {mode === 'login' ? '欢迎回来' : '加入粉丝圈'}
              </DialogTitle>
              <DialogDescription className="text-white/50 dark:text-white/40 text-center text-sm">
                {mode === 'login' ? '欢迎回到粉丝圈' : '注册新账号，开始你的粉丝之旅'}
              </DialogDescription>
            </DialogHeader>

            {/* Tab switcher */}
            <div className="flex items-center gap-1 p-1 bg-white/10 dark:bg-white/5 rounded-xl mb-5">
              <motion.button
                onClick={() => setMode('login')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'login'
                    ? 'bg-white/20 dark:bg-white/15 text-white'
                    : 'text-white/50 dark:text-white/30 hover:text-white/70 dark:hover:text-white/50'
                }`}
                whileTap={{ scale: 0.97 }}
              >
                <LogIn className="w-3.5 h-3.5" />
                登录
              </motion.button>
              <motion.button
                onClick={() => setMode('register')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'register'
                    ? 'bg-white/20 dark:bg-white/15 text-white'
                    : 'text-white/50 dark:text-white/30 hover:text-white/70 dark:hover:text-white/50'
                }`}
                whileTap={{ scale: 0.97 }}
              >
                <UserPlus className="w-3.5 h-3.5" />
                注册
              </motion.button>
            </div>

            {/* Form content with animated transition */}
            <AnimatePresence mode="wait">
              {mode === 'login' ? (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <LoginForm onSuccess={handleAuthSuccess} />
                </motion.div>
              ) : (
                <motion.div
                  key="register"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <RegisterForm
                    onSuccess={handleAuthSuccess}
                    onSwitchToLogin={() => setMode('login')}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Switch mode link */}
            <div className="mt-4 text-center text-xs text-white/40 dark:text-white/30">
              {mode === 'login' ? (
                <>
                  还没有账号？
                  <button
                    onClick={() => setMode('register')}
                    className="text-pink-200/70 dark:text-pink-300/60 hover:text-pink-200 dark:hover:text-pink-300 underline underline-offset-2 transition-colors ml-1"
                  >
                    立即注册
                  </button>
                </>
              ) : (
                <>
                  已有账号？
                  <button
                    onClick={() => setMode('login')}
                    className="text-pink-200/70 dark:text-pink-300/60 hover:text-pink-200 dark:hover:text-pink-300 underline underline-offset-2 transition-colors ml-1"
                  >
                    去登录
                  </button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
