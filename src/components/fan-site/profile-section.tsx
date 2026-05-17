'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Edit3, User, Phone, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

const AVATAR_OPTIONS = ['🦊', '🐱', '🐶', '🐼', '🦄', '🐲', '🌸', '⭐', '🌙', '❤️', '🎭', '🎪', '🎨', '🎵', '🍀', '🔥', '💎', '🦋', '🌊', '🎯']

interface ProfileSectionProps {
  onLoginClick?: () => void
}

function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return phone
  return phone.slice(0, 3) + '****' + phone.slice(-4)
}

export function ProfileSection({ onLoginClick }: ProfileSectionProps) {
  const { data: session, status, update } = useSession()
  const [editOpen, setEditOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editAvatar, setEditAvatar] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const userName = session?.user?.name || ''
  const userAvatar = (session?.user as { avatar?: string })?.avatar || ''
  const userPhone = (session?.user as { phone?: string })?.phone || ''

  const handleEditOpen = () => {
    setEditName(userName)
    setEditAvatar(userAvatar)
    setEditOpen(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim() || undefined,
          avatar: editAvatar,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        // Update the session
        await update({
          name: data.name,
          avatar: data.avatar,
        })
        toast({ title: '资料已更新' })
        setEditOpen(false)
      } else {
        const data = await res.json()
        toast({ title: data.error || '更新失败', variant: 'destructive' })
      }
    } catch {
      toast({ title: '更新失败', description: '请稍后重试', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  // Not logged in state
  if (status !== 'authenticated' || !session?.user) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 px-4"
      >
        <motion.div
          className="w-24 h-24 rounded-full bg-white/10 dark:bg-white/5 border-2 border-dashed border-white/20 dark:border-white/10 flex items-center justify-center mb-6"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, type: 'tween' }}
        >
          <User className="w-10 h-10 text-white/30 dark:text-white/20" />
        </motion.div>
        <h2 className="text-xl font-bold text-white dark:text-white/90 mb-2">
          未登录
        </h2>
        <p className="text-white/50 dark:text-white/40 text-sm mb-6 text-center">
          登录后可以编辑个人资料、发布动态和参与聊天
        </p>
        <Button
          onClick={onLoginClick}
          className="bg-gradient-to-r from-pink-500 to-fuchsia-500 hover:from-pink-600 hover:to-fuchsia-600 text-white border-0 shadow-lg shadow-pink-500/25 rounded-xl px-6 h-11 gap-2"
        >
          <LogIn className="w-4 h-4" />
          登录 / 注册
        </Button>
      </motion.div>
    )
  }

  // Logged in state
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4"
    >
      {/* Profile card */}
      <div className="bg-white/12 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl overflow-hidden shadow-lg mb-6">
        {/* Cover gradient */}
        <div className="h-24 bg-gradient-to-r from-pink-500/30 via-fuchsia-500/30 to-purple-500/30 dark:from-pink-600/20 dark:via-fuchsia-600/20 dark:to-purple-600/20 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/5 dark:to-white/3" />
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center -mt-12 relative z-10">
          <motion.div
            className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-400 to-fuchsia-400 dark:from-pink-600 dark:to-fuchsia-600 flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-pink-500/30 dark:shadow-pink-600/30 border-4 border-white/20 dark:border-white/10"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            {userAvatar ? (
              <span className="text-3xl">{userAvatar}</span>
            ) : (
              <Camera className="w-8 h-8 text-white/40" />
            )}
          </motion.div>
        </div>

        {/* User info */}
        <div className="p-6 pt-3 text-center">
          <h2 className="text-xl font-bold text-white dark:text-white/90 mb-2">
            {userName || '匿名用户'}
          </h2>
          {userPhone && (
            <div className="flex items-center justify-center gap-2 text-white/50 dark:text-white/40 text-sm mb-4">
              <Phone className="w-3.5 h-3.5" />
              <span>{maskPhone(userPhone)}</span>
            </div>
          )}

          <Button
            onClick={handleEditOpen}
            className="bg-white/10 dark:bg-white/5 hover:bg-white/20 dark:hover:bg-white/10 text-white/80 dark:text-white/60 border border-white/20 dark:border-white/10 rounded-xl gap-2 mt-2"
            variant="ghost"
          >
            <Edit3 className="w-4 h-4" />
            编辑资料
          </Button>
        </div>
      </div>

      {/* Stats section */}
      <div className="bg-white/12 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl p-4 shadow-lg mb-6">
        <h3 className="text-white/70 dark:text-white/50 text-sm font-medium mb-3">账号信息</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-white/50 dark:text-white/40 text-sm">昵称</span>
            <span className="text-white/80 dark:text-white/70 text-sm font-medium">{userName || '未设置'}</span>
          </div>
          <div className="h-px bg-white/10 dark:bg-white/5" />
          <div className="flex items-center justify-between">
            <span className="text-white/50 dark:text-white/40 text-sm">头像</span>
            <span className="text-white/80 dark:text-white/70 text-sm font-medium">{userAvatar || '未设置'}</span>
          </div>
          <div className="h-px bg-white/10 dark:bg-white/5" />
          <div className="flex items-center justify-between">
            <span className="text-white/50 dark:text-white/40 text-sm">手机号</span>
            <span className="text-white/80 dark:text-white/70 text-sm font-medium">{userPhone ? maskPhone(userPhone) : '未绑定'}</span>
          </div>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-white/12 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white dark:text-white/90 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-pink-400" />
              编辑资料
            </DialogTitle>
            <DialogDescription className="text-white/50 dark:text-white/40">
              修改你的昵称和头像
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Avatar preview */}
            <div className="flex justify-center">
              <motion.div
                className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 to-fuchsia-400 dark:from-pink-600 dark:to-fuchsia-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-pink-500/20 dark:shadow-pink-600/20"
                key={editAvatar}
                initial={{ scale: 0.8, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              >
                {editAvatar ? (
                  <span className="text-2xl">{editAvatar}</span>
                ) : (
                  <Camera className="w-6 h-6 text-white/40" />
                )}
              </motion.div>
            </div>

            {/* Display name */}
            <div className="space-y-2">
              <Label className="text-white/70 dark:text-white/50 text-sm font-medium">昵称</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="输入昵称"
                maxLength={20}
                className="bg-white/10 dark:bg-white/5 border-white/20 dark:border-white/10 text-white dark:text-white/80 placeholder:text-white/30 focus-visible:border-pink-400/50 focus-visible:ring-pink-400/20"
              />
            </div>

            {/* Avatar input */}
            <div className="space-y-2">
              <Label className="text-white/70 dark:text-white/50 text-sm font-medium">头像</Label>
              <Input
                value={editAvatar}
                onChange={(e) => setEditAvatar(e.target.value.slice(0, 2))}
                placeholder="输入一个字符或表情"
                maxLength={2}
                className="bg-white/10 dark:bg-white/5 border-white/20 dark:border-white/10 text-white dark:text-white/80 placeholder:text-white/30 focus-visible:border-pink-400/50 focus-visible:ring-pink-400/20"
              />
            </div>

            {/* Predefined avatars */}
            <div className="space-y-2">
              <Label className="text-white/70 dark:text-white/50 text-sm font-medium">选择头像</Label>
              <div className="grid grid-cols-10 gap-1.5">
                {AVATAR_OPTIONS.map((emoji) => (
                  <motion.button
                    key={emoji}
                    onClick={() => setEditAvatar(emoji)}
                    className={`text-lg p-1.5 rounded-lg transition-all ${
                      editAvatar === emoji
                        ? 'bg-pink-500/40 dark:bg-pink-600/40 ring-2 ring-pink-400 dark:ring-pink-500 shadow-lg shadow-pink-500/20'
                        : 'bg-white/10 dark:bg-white/5 hover:bg-white/20 dark:hover:bg-white/10'
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {emoji}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex-row gap-2 sm:justify-end">
            <DialogClose asChild>
              <Button
                variant="ghost"
                className="text-white/60 dark:text-white/40 hover:text-white hover:bg-white/10"
              >
                取消
              </Button>
            </DialogClose>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-gradient-to-r from-pink-500 to-fuchsia-500 hover:from-pink-600 hover:to-fuchsia-600 text-white border-0 shadow-lg shadow-pink-500/25 disabled:opacity-50"
            >
              {isSaving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
