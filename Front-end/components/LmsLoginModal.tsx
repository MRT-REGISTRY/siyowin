'use client'

import { useState, useEffect, useRef } from 'react'
import { X, GraduationCap, BookOpen, Eye, EyeOff, ArrowLeft, LogIn, ChevronRight } from 'lucide-react'
import { getDashboardPathForRole, login, storeSession } from '@/utils/api'

// ── Siyowin brand colours (from logo) ────────────────────────────────
const BRAND = {
  red:    '#D9232D',
  navy:   '#1B3A8C',
  orange: '#F47920',
  redLight:   '#fef2f2',
  navyLight:  '#eff2fb',
  orangeLight:'#fff7ed',
}

type Role = 'student' | 'teacher' | null
type Step = 'choose' | 'login'

interface LmsLoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function LmsLoginModal({ isOpen, onClose }: LmsLoginModalProps) {
  const [step, setStep]         = useState<Step>('choose')
  const [role, setRole]         = useState<Role>(null)
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading]   = useState(false)
  const [visible, setVisible]   = useState(false)
  const [error, setError]       = useState('')

  const emailRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => setVisible(true), 10)
      return () => clearTimeout(t)
    } else {
      setVisible(false)
      const t = setTimeout(() => {
        setStep('choose'); setRole(null)
        setIdentifier(''); setPassword('')
        setShowPw(false); setRememberMe(true); setLoading(false); setError('')
      }, 380)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else        document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    if (step === 'login') setTimeout(() => emailRef.current?.focus(), 380)
  }, [step])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const selectRole = (r: Role) => { setRole(r); setStep('login'); setError('') }
  const handleBack = () => { setStep('choose'); setIdentifier(''); setPassword(''); setError('') }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!role) return

    setLoading(true)
    setError('')

    try {
      const loginPayload = role === 'student'
        ? { username: identifier, password, role }
        : { email: identifier, password, role }
      
      const result = await login(loginPayload)
      storeSession(result, rememberMe)
      window.location.href = getDashboardPathForRole(result.user.role)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed.')
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)'

  // Per-role colours
  const roleColor = role === 'teacher' ? BRAND.navy : BRAND.red
  const roleLightBg = role === 'teacher' ? BRAND.navyLight : BRAND.redLight
  const roleGradient = role === 'teacher'
    ? `linear-gradient(135deg, ${BRAND.navy}, #2c55c7)`
    : `linear-gradient(135deg, ${BRAND.red}, ${BRAND.orange})`
  const roleShadow = role === 'teacher'
    ? '0 10px 28px rgba(27,58,140,0.35)'
    : '0 10px 28px rgba(217,35,45,0.30)'
  const roleRing = role === 'teacher' ? '#93c5fd' : '#fca5a5'
  const barGradient = `linear-gradient(to right, ${BRAND.red}, ${BRAND.orange}, ${BRAND.navy})`

  return (
    /* Backdrop */
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        backgroundColor: visible ? 'rgba(8,12,30,0.70)' : 'rgba(8,12,30,0)',
        backdropFilter: visible ? 'blur(10px)' : 'blur(0px)',
        transition: `background-color 380ms ease, backdrop-filter 380ms ease`,
      }}
    >
      {/* Panel */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '460px',
          borderRadius: '28px',
          overflow: 'hidden',
          background: '#ffffff',
          boxShadow: '0 40px 100px rgba(0,0,0,0.28)',
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.90) translateY(32px)',
          opacity: visible ? 1 : 0,
          transition: `transform 400ms ${ease}, opacity 400ms ease`,
        }}
      >
        {/* Rainbow brand bar */}
        <div style={{ height: '5px', background: barGradient }} />

        {/* Header */}
        <div className="relative px-7 pt-5 pb-3 text-center">
          {step === 'login' && (
            <button onClick={handleBack}
              className="absolute left-7 top-6 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 active:scale-90">
              <ArrowLeft size={17} strokeWidth={2} />
            </button>
          )}
          
          <div className="flex flex-col items-center">
            {/* Real logo */}
            <img
              src="/photos/logo.png"
              alt="Siyowin Logo"
              className="h-12 w-auto object-contain"
            />
            <p className="mt-1 text-xs text-gray-400">
              {step === 'choose'
                ? 'Learning Management System'
                : role === 'student' ? 'Student Portal' : 'Staff Portal'}
            </p>
          </div>

          <button onClick={onClose}
            className="absolute right-7 top-6 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 active:scale-90">
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* ── Sliding content ── */}
        <div style={{ overflow: 'hidden' }}>

          {/* STEP 1: Choose role */}
          <div style={{
            padding: step === 'choose' ? '8px 28px 32px' : '0',
            maxHeight: step === 'choose' ? '500px' : '0px',
            opacity: step === 'choose' ? 1 : 0,
            transform: step === 'choose' ? 'translateX(0)' : 'translateX(-24px)',
            transition: `max-height 420ms ${ease}, opacity 350ms ease, transform 380ms ${ease}, padding 420ms ${ease}`,
            overflow: 'hidden',
          }}>
            <p className="mb-5 text-center text-sm font-medium text-gray-500">
              How would you like to sign in today?
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Student */}
              <RoleCard
                icon={<GraduationCap size={34} strokeWidth={1.4} />}
                label="Student"
                sublabel="Student Portal"
                description="Access your classes, notes & results"
                color={BRAND.red}
                accentColor={BRAND.orange}
                lightBg={BRAND.redLight}
                onClick={() => selectRole('student')}
              />
              {/* Teacher */}
              <RoleCard
                icon={<BookOpen size={34} strokeWidth={1.4} />}
                label="Teacher"
                sublabel="Staff Portal"
                description="Manage courses, marks & students"
                color={BRAND.navy}
                accentColor="#2c55c7"
                lightBg={BRAND.navyLight}
                onClick={() => selectRole('teacher')}
              />
            </div>

            {/* Divider */}
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-100" />
              <span className="text-xs text-gray-400">secure access</span>
              <div className="h-px flex-1 bg-gray-100" />
            </div>

            <p className="text-center text-xs text-gray-400">
              Need help?{' '}
              <a href="#" className="underline-offset-2 hover:underline" style={{ color: BRAND.red }}>
                Contact support
              </a>
            </p>
          </div>

          {/* STEP 2: Login form */}
          <div style={{
            padding: step === 'login' ? '4px 28px 32px' : '0',
            maxHeight: step === 'login' ? '600px' : '0px',
            opacity: step === 'login' ? 1 : 0,
            transform: step === 'login' ? 'translateX(0)' : 'translateX(24px)',
            transition: `max-height 420ms ${ease}, opacity 350ms ease, transform 380ms ${ease}, padding 420ms ${ease}`,
            overflow: 'hidden',
          }}>

            {/* Role badge */}
            <div className="mb-5 flex justify-center">
              <span className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold"
                style={{ background: roleLightBg, color: roleColor }}>
                {role === 'teacher'
                  ? <><BookOpen size={13} strokeWidth={2} /> Staff Sign In</>
                  : <><GraduationCap size={13} strokeWidth={2} /> Student Sign In</>}
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
                  {error}
                </p>
              )}

              {/* Identifier (Username for students, Email for teachers/admin) */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                  {role === 'student' ? 'Username' : 'Email'}
                </label>
                <input
                  ref={emailRef}
                  type={role === 'student' ? 'text' : 'email'}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  placeholder={role === 'student' ? 'Enter your username' : 'you@siyowin.lk'}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-transparent focus:bg-white"
                  style={{ boxShadow: `0 0 0 0px ${roleRing}`, outline: 'none' }}
                  onFocus={(e) => { e.target.style.boxShadow = `0 0 0 3px ${roleRing}` }}
                  onBlur={(e)  => { e.target.style.boxShadow = `0 0 0 0px ${roleRing}` }}
                />
              </div>

              {/* Password */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-600">Password</label>
                  <a href="#" className="text-xs underline-offset-2 hover:underline" style={{ color: roleColor }}>
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                    required placeholder="••••••••"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-4 pr-12 text-sm text-gray-800 outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-transparent focus:bg-white"
                    onFocus={(e) => { e.target.style.boxShadow = `0 0 0 3px ${roleRing}` }}
                    onBlur={(e)  => { e.target.style.boxShadow = `0 0 0 0px ${roleRing}` }}
                  />
                  <button type="button" onClick={() => setShowPw((p) => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600">
                    {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="h-4 w-4 rounded"
                  style={{ accentColor: roleColor }} />
                <label htmlFor="remember" className="text-xs text-gray-500 cursor-pointer">
                  Remember me on this device
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit" disabled={loading}
                className="relative mt-1 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl py-3.5 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 active:scale-95 disabled:opacity-70"
                style={{ background: roleGradient, boxShadow: roleShadow }}
              >
                {loading ? <><Spinner /> Signing in…</> : <><LogIn size={16} strokeWidth={2.5} /> Sign In</>}
                {/* Shimmer on hover */}
                <span className="absolute inset-0 -translate-x-full bg-white/15 skew-x-12 transition-transform duration-700 hover:translate-x-full" />
              </button>
            </form>


          </div>
        </div>
      </div>
    </div>
  )
}

// ── Role Card ─────────────────────────────────────────────────────────
function RoleCard({ icon, label, sublabel, description, color, accentColor, lightBg, onClick }: {
  icon: React.ReactNode; label: string; sublabel: string; description: string
  color: string; accentColor: string; lightBg: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col items-center gap-3 rounded-2xl border-2 border-transparent p-5 text-center transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg active:scale-95"
      style={{ background: lightBg, borderColor: 'transparent' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = color + '40' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent' }}
    >
      {/* Icon circle with gradient border */}
      <span
        className="flex h-16 w-16 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110"
        style={{ background: `linear-gradient(135deg, ${color}22, ${accentColor}22)`, color }}
      >
        {icon}
      </span>
      <div>
        <p className="text-sm font-bold" style={{ color }}>{label}</p>
        <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: accentColor }}>{sublabel}</p>
        <p className="mt-1 text-xs leading-4 text-gray-500">{description}</p>
      </div>
      <ChevronRight size={13}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{ color }} />
    </button>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────
function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  )
}
