import { useState, useEffect } from 'react'
import {
  ChefHat, Scan, TrendingUp, Fingerprint, ScanFace, Eye, EyeOff,
  ArrowRight, Users, CheckCircle2, ChevronRight, Mail, Lock,
  Store, Globe, DollarSign, Clock, ArrowLeft, RefreshCw,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { Button, StepIndicator, Badge } from '../../components/ui'

// ─── Splash ───────────────────────────────────────────────────────────────────

export function SplashScreen() {
  const { navigate, platform } = useApp()
  const ios = platform === 'ios'
  const [dots, setDots] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setDots(d => (d + 1) % 4), 400)
    const nav = setTimeout(() => navigate('welcome'), 2400)
    return () => { clearInterval(t); clearTimeout(nav) }
  }, [])

  return (
    <div className="flex flex-col items-center justify-between h-full bg-emerald-600 py-16 select-none">
      {/* Top spacer */}
      <div />

      {/* Brand mark */}
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          {/* Outer pulse ring */}
          <div className="absolute inset-0 rounded-3xl bg-white/10 scale-[1.18] animate-ping" style={{ animationDuration: '2s' }} />
          <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl">
            <ChefHat size={44} className="text-white" strokeWidth={1.8} />
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-[32px] font-bold text-white tracking-tight leading-none">StockPulse</h1>
          <p className="text-emerald-100 text-[14px] mt-2 font-medium tracking-wide">F&B Inventory Intelligence</p>
        </div>
      </div>

      {/* Loading indicator */}
      <div className="flex flex-col items-center gap-5">
        <div className="flex items-center gap-2">
          {[0, 1, 2].map(i => (
            <div key={i} className={`w-2 h-2 rounded-full transition-all duration-300
              ${dots > i ? 'bg-white scale-110' : 'bg-white/30 scale-90'}`} />
          ))}
        </div>
        <p className="text-emerald-200/70 text-[12px]">
          {ios ? 'iPhone · iOS' : 'Android'}
        </p>
      </div>
    </div>
  )
}

// ─── Welcome ──────────────────────────────────────────────────────────────────

export function WelcomeScreen() {
  const { navigate } = useApp()

  const features = [
    {
      icon: Scan,
      color: 'bg-blue-50',
      iconColor: 'text-blue-600',
      label: 'AI POS Scanning',
      text: 'Scan sales reports and auto-deduct ingredients via OCR',
    },
    {
      icon: TrendingUp,
      color: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      label: 'Smart Reordering',
      text: 'Never run out of stock with Perfect Order Quantity',
    },
    {
      icon: ChefHat,
      color: 'bg-orange-50',
      iconColor: 'text-orange-600',
      label: 'Recipe & BOM',
      text: 'Link menu items to ingredients for automatic tracking',
    },
    {
      icon: Users,
      color: 'bg-violet-50',
      iconColor: 'text-violet-600',
      label: 'Role-Based Access',
      text: 'Admin, Manager, and Staff with granular permissions',
    },
  ]

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Hero area */}
      <div className="flex-shrink-0 bg-gradient-to-b from-emerald-600 to-emerald-500 px-6 pt-8 pb-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
            <ChefHat size={22} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-[17px] leading-none">StockPulse</p>
            <p className="text-emerald-200 text-[12px]">F&B Inventory Intelligence</p>
          </div>
        </div>
        <h1 className="text-[26px] font-bold text-white leading-tight mb-2">
          Smarter inventory for your restaurant
        </h1>
        <p className="text-emerald-100 text-[14px] leading-relaxed">
          Track stock, reduce waste, and optimize orders — all from your phone.
        </p>
      </div>

      {/* Features */}
      <div className="flex-1 overflow-y-auto scrollbar-hidden px-5 py-5">
        <div className="flex flex-col gap-3">
          {features.map(f => {
            const Icon = f.icon
            return (
              <div key={f.label} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${f.color}`}>
                  <Icon size={20} className={f.iconColor} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-slate-900">{f.label}</p>
                  <p className="text-[12px] text-slate-500 mt-0.5 leading-tight">{f.text}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* CTAs */}
      <div className="flex-shrink-0 px-5 pb-8 pt-3 flex flex-col gap-3">
        <Button onClick={() => navigate('login')} fullWidth size="lg">
          Sign In to Your Store
        </Button>
        <Button onClick={() => navigate('onboarding')} variant="outline" fullWidth size="lg">
          Create Restaurant Account
        </Button>
        <button
          onClick={() => navigate('login')}
          className="text-[13px] text-slate-500 text-center py-1.5"
        >
          Join an existing team →
        </button>
      </div>
    </div>
  )
}

// ─── Login ────────────────────────────────────────────────────────────────────

export function LoginScreen() {
  const { navigate, platform } = useApp()
  const [email, setEmail]   = useState('anna@restaurant.de')
  const [password, setPassword] = useState('••••••••')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const ios = platform === 'ios'

  const handleSignIn = () => {
    setLoading(true)
    setTimeout(() => { setLoading(false); navigate('home') }, 800)
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Top decoration */}
      <div className="flex-shrink-0 h-1.5 bg-emerald-500" />

      <div className="flex-1 flex flex-col overflow-y-auto scrollbar-hidden">
        {/* Brand header */}
        <div className="px-6 pt-8 pb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <ChefHat size={22} className="text-emerald-600" strokeWidth={2} />
            </div>
            <div>
              <p className="text-[17px] font-bold text-slate-900 leading-none">StockPulse</p>
              <p className="text-[11px] text-slate-400">F&B Inventory Intelligence</p>
            </div>
          </div>
          <h1 className="text-[28px] font-bold text-slate-900 leading-tight">Welcome back</h1>
          <p className="text-[14px] text-slate-500 mt-1">Sign in to your store account</p>
        </div>

        {/* Form */}
        <div className="px-6 flex flex-col gap-4">
          {/* Email field */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] mb-1.5 block">
              Email address
            </label>
            <div className={`flex items-center gap-3 bg-slate-50 border rounded-2xl px-4 h-[52px]
              focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-400 border-slate-200 transition-all`}>
              <Mail size={17} className="text-slate-400 flex-shrink-0" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="flex-1 bg-transparent text-[15px] text-slate-800 outline-none"
              />
            </div>
          </div>

          {/* Password field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em]">
                Password
              </label>
              <button
                onClick={() => navigate('forgot-password')}
                className="text-[13px] text-emerald-600 font-semibold"
              >
                Forgot password?
              </button>
            </div>
            <div className={`flex items-center gap-3 bg-slate-50 border rounded-2xl px-4 h-[52px]
              focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-400 border-slate-200 transition-all`}>
              <Lock size={17} className="text-slate-400 flex-shrink-0" />
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="flex-1 bg-transparent text-[15px] text-slate-800 outline-none"
              />
              <button onClick={() => setShowPw(!showPw)} className="text-slate-400 p-1">
                {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {/* Sign In */}
          <Button
            onClick={handleSignIn}
            disabled={loading}
            fullWidth size="lg"
            className="mt-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <RefreshCw size={16} className="animate-spin" /> Signing in…
              </span>
            ) : 'Sign In'}
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-[12px] text-slate-400">or continue with</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          {/* Biometric — platform-differentiated */}
          {ios ? (
            <button
              onClick={handleSignIn}
              className="flex items-center justify-center gap-3 h-[52px] border-2 border-slate-200 rounded-2xl
                text-[15px] font-semibold text-slate-700 bg-white active:bg-slate-50 transition-colors"
            >
              <ScanFace size={22} className="text-emerald-600" />
              Sign in with Face ID
            </button>
          ) : (
            <button
              onClick={handleSignIn}
              className="flex items-center justify-center gap-3 h-[52px] border-2 border-slate-200 rounded-2xl
                text-[15px] font-semibold text-slate-700 bg-white active:bg-slate-50 transition-colors"
            >
              <Fingerprint size={22} className="text-emerald-600" />
              Sign in with Fingerprint
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-6 pb-8 pt-4">
        <p className="text-center text-[13px] text-slate-400">
          {"Don't have an account? "}
          <button
            onClick={() => navigate('onboarding')}
            className="text-emerald-600 font-semibold"
          >
            Get started
          </button>
        </p>
      </div>
    </div>
  )
}

// ─── Forgot Password ──────────────────────────────────────────────────────────

export function ForgotPasswordScreen() {
  const { navigate, platform } = useApp()
  const ios = platform === 'ios'
  const [email, setEmail] = useState('anna@restaurant.de')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSend = () => {
    setLoading(true)
    setTimeout(() => { setLoading(false); setSent(true) }, 900)
  }

  if (sent) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="flex-shrink-0 h-1.5 bg-emerald-500" />
        {/* Back */}
        <div className="px-4 pt-3">
          <button
            onClick={() => navigate('login')}
            className={`flex items-center gap-1 text-emerald-600 font-semibold text-[15px] py-2 ${ios ? '' : 'hidden'}`}
          >
            <ArrowLeft size={18} /> Login
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8">
          <div className="w-24 h-24 rounded-3xl bg-emerald-50 flex items-center justify-center">
            <Mail size={42} className="text-emerald-500" strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <h2 className="text-[24px] font-bold text-slate-900 mb-3">Check your email</h2>
            <p className="text-[14px] text-slate-500 leading-relaxed">
              We sent a password reset link to
            </p>
            <p className="text-[15px] font-semibold text-slate-800 mt-1">{email}</p>
          </div>
          <div className="w-full flex flex-col gap-3">
            <Button onClick={() => navigate('login')} fullWidth size="lg">
              Back to Sign In
            </Button>
            <button
              onClick={() => setSent(false)}
              className="text-[13px] text-slate-500 text-center py-2"
            >
              {"Didn't receive it? Resend email"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-shrink-0 h-1.5 bg-emerald-500" />

      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Back nav */}
        <div className="px-4 pt-3">
          <button
            onClick={() => navigate('login')}
            className="flex items-center gap-1 text-emerald-600 font-semibold text-[15px] py-2"
          >
            <ArrowLeft size={18} /> {ios ? 'Sign In' : 'Back'}
          </button>
        </div>

        <div className="px-6 pt-4 pb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-5">
            <Lock size={22} className="text-emerald-600" />
          </div>
          <h1 className="text-[26px] font-bold text-slate-900 leading-tight mb-2">
            Forgot your password?
          </h1>
          <p className="text-[14px] text-slate-500 leading-relaxed">
            Enter your email address and we will send you a link to reset your password.
          </p>
        </div>

        <div className="px-6 flex flex-col gap-5">
          <div>
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] mb-1.5 block">
              Email address
            </label>
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 h-[52px]
              focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-400 transition-all">
              <Mail size={17} className="text-slate-400 flex-shrink-0" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@restaurant.com"
                className="flex-1 bg-transparent text-[15px] text-slate-800 outline-none"
              />
            </div>
          </div>

          <Button onClick={handleSend} disabled={loading} fullWidth size="lg">
            {loading ? (
              <span className="flex items-center gap-2">
                <RefreshCw size={16} className="animate-spin" /> Sending…
              </span>
            ) : 'Send Reset Link'}
          </Button>

          <p className="text-center text-[13px] text-slate-400">
            Remembered your password?{' '}
            <button onClick={() => navigate('login')} className="text-emerald-600 font-semibold">
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Onboarding ───────────────────────────────────────────────────────────────

type ScheduleId = 'daily' | 'weekly' | 'monthly' | 'quarterly'

interface SelectRowProps {
  label: string
  value: string
  icon: typeof Store
}

function SelectRow({ label, value, icon: Icon }: SelectRowProps) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] mb-1.5 block">
        {label}
      </label>
      <button className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 h-[52px]
        flex items-center justify-between text-left active:bg-slate-100 transition-colors">
        <div className="flex items-center gap-3">
          <Icon size={17} className="text-slate-400 flex-shrink-0" />
          <span className="text-[15px] text-slate-700">{value}</span>
        </div>
        <ChevronRight size={16} className="text-slate-400" />
      </button>
    </div>
  )
}

export function OnboardingScreen() {
  const { navigate } = useApp()
  const [step, setStep] = useState(0)
  const [storeName, setStoreName] = useState('')
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPw, setAdminPw] = useState('')
  const [schedule, setSchedule] = useState<ScheduleId>('daily')
  const [showPw, setShowPw] = useState(false)

  const STEPS = ['Restaurant', 'Inventory', 'Admin', 'Team', 'Done']
  const next = () => step < STEPS.length - 1 ? setStep(s => s + 1) : navigate('home')
  const back = () => step > 0 ? setStep(s => s - 1) : navigate('welcome')

  const scheduleOptions: { id: ScheduleId; label: string; desc: string; badge?: string }[] = [
    { id: 'daily',     label: 'Daily',     badge: 'Recommended', desc: 'Best for high-volume kitchens — count every day' },
    { id: 'weekly',    label: 'Weekly',    desc: 'Count every week — suitable for most restaurants' },
    { id: 'monthly',   label: 'Monthly',   desc: 'Full monthly inventory — lower frequency operations' },
    { id: 'quarterly', label: 'Quarterly', desc: 'Quarterly audit — for low-turnover inventory' },
  ]

  const teamMembers = [
    { name: 'Marco Bauer',   email: 'marco@restaurant.de',   role: 'Manager', avatar: 'MB' },
    { name: 'Lena Fischer',  email: 'lena@restaurant.de',    role: 'Staff',   avatar: 'LF' },
  ]

  const completionChecks = [
    'Restaurant configured',
    `${schedule.charAt(0).toUpperCase() + schedule.slice(1)} stock count schedule set`,
    'Administrator account created',
    '2 team members invited',
  ]

  const canContinue = step === 0 ? storeName.trim().length > 0
    : step === 2 ? (adminName.trim().length > 0 && adminEmail.trim().length > 0 && adminPw.length >= 6)
    : true

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <button onClick={back} className="flex items-center gap-1 text-emerald-600 font-semibold text-[15px]">
            <ArrowLeft size={18} />
            {step === 0 ? 'Cancel' : 'Back'}
          </button>
          <button onClick={() => navigate('home')} className="text-[13px] text-slate-400 font-medium">
            Skip setup
          </button>
        </div>
        <StepIndicator steps={STEPS} current={step} />
        <p className="text-[11px] text-center text-slate-400 mt-2">Step {step + 1} of {STEPS.length}</p>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto scrollbar-hidden">

        {/* ── Step 0: Restaurant info ── */}
        {step === 0 && (
          <div className="px-5 py-5 flex flex-col gap-5">
            <div>
              <h2 className="text-[22px] font-bold text-slate-900 mb-1">Restaurant information</h2>
              <p className="text-[14px] text-slate-500">Tell us about your store to get started</p>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] mb-1.5 block">
                Store name
              </label>
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 h-[52px]
                focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-400 transition-all">
                <Store size={17} className="text-slate-400 flex-shrink-0" />
                <input
                  value={storeName}
                  onChange={e => setStoreName(e.target.value)}
                  placeholder="e.g. Bella Cucina Restaurant"
                  className="flex-1 bg-transparent text-[15px] text-slate-800 outline-none"
                />
              </div>
            </div>

            <SelectRow label="Country"   value="Germany"               icon={Globe} />
            <SelectRow label="Currency"  value="EUR (€)"               icon={DollarSign} />
            <SelectRow label="Language"  value="English"               icon={Globe} />
            <SelectRow label="Time zone" value="Europe/Berlin (UTC+1)" icon={Clock} />
          </div>
        )}

        {/* ── Step 1: Inventory preferences ── */}
        {step === 1 && (
          <div className="px-5 py-5 flex flex-col gap-5">
            <div>
              <h2 className="text-[22px] font-bold text-slate-900 mb-1">Inventory preferences</h2>
              <p className="text-[14px] text-slate-500">Set your default stock count schedule</p>
            </div>
            <div className="flex flex-col gap-3">
              {scheduleOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setSchedule(opt.id)}
                  className={`flex items-start gap-3.5 p-4 rounded-2xl border-2 text-left transition-all
                    ${schedule === opt.id
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 bg-white active:bg-slate-50'}`}
                >
                  {/* Radio */}
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5
                    ${schedule === opt.id ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`}>
                    {schedule === opt.id && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-[15px] font-semibold text-slate-900">{opt.label}</p>
                      {opt.badge && (
                        <Badge variant="green">{opt.badge}</Badge>
                      )}
                    </div>
                    <p className="text-[13px] text-slate-500 leading-snug">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: Admin setup ── */}
        {step === 2 && (
          <div className="px-5 py-5 flex flex-col gap-5">
            <div>
              <h2 className="text-[22px] font-bold text-slate-900 mb-1">Administrator account</h2>
              <p className="text-[14px] text-slate-500">Create the owner account for this store</p>
            </div>

            {/* Role card */}
            <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="purple">Store Owner</Badge>
              </div>
              <p className="text-[13px] text-slate-600 leading-relaxed">
                The store owner has full access to all features including inventory, costs, recipes, suppliers, reports, and team management.
              </p>
            </div>

            {/* Name */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] mb-1.5 block">
                Full name
              </label>
              <input
                value={adminName}
                onChange={e => setAdminName(e.target.value)}
                placeholder="e.g. Anna Schmidt"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 h-[52px]
                  text-[15px] text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition-all"
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] mb-1.5 block">
                Work email
              </label>
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 h-[52px]
                focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-400 transition-all">
                <Mail size={17} className="text-slate-400 flex-shrink-0" />
                <input
                  type="email"
                  value={adminEmail}
                  onChange={e => setAdminEmail(e.target.value)}
                  placeholder="anna@restaurant.de"
                  className="flex-1 bg-transparent text-[15px] text-slate-800 outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] mb-1.5 block">
                Password
              </label>
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 h-[52px]
                focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-400 transition-all">
                <Lock size={17} className="text-slate-400 flex-shrink-0" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={adminPw}
                  onChange={e => setAdminPw(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="flex-1 bg-transparent text-[15px] text-slate-800 outline-none"
                />
                <button onClick={() => setShowPw(!showPw)} className="text-slate-400 p-1">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {adminPw.length > 0 && adminPw.length < 6 && (
                <p className="text-[12px] text-red-500 mt-1.5">Password must be at least 6 characters</p>
              )}
            </div>
          </div>
        )}

        {/* ── Step 3: Team invites ── */}
        {step === 3 && (
          <div className="px-5 py-5 flex flex-col gap-5">
            <div>
              <h2 className="text-[22px] font-bold text-slate-900 mb-1">Invite your team</h2>
              <p className="text-[14px] text-slate-500">Add managers and staff to get started</p>
            </div>

            <div className="flex flex-col gap-3">
              {teamMembers.map(m => (
                <div key={m.email} className="flex items-center gap-3.5 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                  <div className="w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-[13px] font-bold flex-shrink-0">
                    {m.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-slate-900">{m.name}</p>
                    <p className="text-[12px] text-slate-500 truncate">{m.email}</p>
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
                    <Badge variant={m.role === 'Manager' ? 'blue' : 'gray'}>{m.role}</Badge>
                    <CheckCircle2 size={14} className="text-emerald-500" />
                  </div>
                </div>
              ))}

              <button className="flex items-center justify-center gap-2.5 p-4 border-2 border-dashed border-slate-200 rounded-2xl text-[14px] text-emerald-600 font-semibold active:bg-emerald-50 transition-colors">
                <Users size={18} />
                Invite another team member
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <p className="text-[12px] text-slate-500 leading-relaxed">
                Team members will receive an email invitation. You can also add members later in <span className="font-semibold text-slate-700">Settings → Team & Roles</span>.
              </p>
            </div>
          </div>
        )}

        {/* ── Step 4: Done ── */}
        {step === 4 && (
          <div className="flex flex-col items-center justify-center px-5 py-10 gap-6 text-center min-h-full">
            <div className="w-24 h-24 rounded-3xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 size={48} className="text-emerald-500" strokeWidth={1.5} />
            </div>

            <div>
              <h2 className="text-[26px] font-bold text-slate-900 mb-3">
                {storeName.trim() || "You're"} ready!
              </h2>
              <p className="text-[14px] text-slate-500 leading-relaxed max-w-xs">
                Your restaurant is configured and ready to go. Start by adding your inventory or scanning your first POS report.
              </p>
            </div>

            <div className="w-full flex flex-col gap-2.5">
              {completionChecks.map(check => (
                <div key={check} className="flex items-center gap-3 p-3.5 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                  <p className="text-[13px] font-medium text-slate-700">{check}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="flex-shrink-0 px-5 pb-8 pt-3">
        <Button
          onClick={next}
          fullWidth size="lg"
          disabled={!canContinue}
        >
          <span className="flex items-center justify-center gap-2">
            {step === STEPS.length - 1 ? 'Go to Dashboard' : 'Continue'}
            <ArrowRight size={18} />
          </span>
        </Button>
      </div>
    </div>
  )
}
