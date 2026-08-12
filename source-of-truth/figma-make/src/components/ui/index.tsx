import type { ReactNode, CSSProperties, ButtonHTMLAttributes } from 'react'

// ─── Design Tokens ────────────────────────────────────────────────────────────
// 8pt grid: 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64
// Typography: 11, 12, 13, 14, 15, 17, 20, 22, 28, 34
// Radius: 4, 8, 12, 16, 20, 24, 9999 (full)

// ─── Badge ────────────────────────────────────────────────────────────────────
export type BadgeVariant = 'green' | 'amber' | 'red' | 'blue' | 'gray' | 'purple' | 'orange'

const BADGE: Record<BadgeVariant, string> = {
  green:  'bg-emerald-50  text-emerald-700 ring-1 ring-emerald-200/80',
  amber:  'bg-amber-50    text-amber-700   ring-1 ring-amber-200/80',
  red:    'bg-red-50      text-red-700     ring-1 ring-red-200/80',
  blue:   'bg-blue-50     text-blue-700    ring-1 ring-blue-200/80',
  gray:   'bg-slate-100   text-slate-600   ring-1 ring-slate-200/80',
  purple: 'bg-violet-50   text-violet-700  ring-1 ring-violet-200/80',
  orange: 'bg-orange-50   text-orange-700  ring-1 ring-orange-200/80',
}

export function Badge({
  children, variant = 'gray', className = '',
}: { children: ReactNode; variant?: BadgeVariant; className?: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold leading-none tracking-wide ${BADGE[variant]} ${className}`}>
      {children}
    </span>
  )
}

// ─── Button ───────────────────────────────────────────────────────────────────
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'tinted'
type BtnSize = 'sm' | 'md' | 'lg'

const BTN_VARIANT: Record<BtnVariant, string> = {
  primary:   'bg-emerald-600 text-white active:bg-emerald-700',
  secondary: 'bg-slate-100   text-slate-800 active:bg-slate-200',
  ghost:     'text-slate-700 active:bg-slate-100',
  danger:    'bg-red-600     text-white active:bg-red-700',
  outline:   'border border-slate-300 text-slate-800 bg-white active:bg-slate-50',
  tinted:    'bg-emerald-50  text-emerald-700 active:bg-emerald-100',
}

const BTN_SIZE: Record<BtnSize, string> = {
  sm: 'px-3 py-2 text-[13px] rounded-xl',
  md: 'px-4 py-3 text-[15px] rounded-2xl',
  lg: 'px-5 py-4 text-[17px] rounded-2xl',
}

export function Button({
  children, variant = 'primary', size = 'md', className = '',
  onClick, disabled = false, fullWidth = false,
  ...rest
}: {
  children: ReactNode; variant?: BtnVariant; size?: BtnSize; className?: string
  onClick?: () => void; disabled?: boolean; fullWidth?: boolean
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'>) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${BTN_VARIANT[variant]} ${BTN_SIZE[size]}
        font-semibold transition-all duration-100 select-none
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-40 pointer-events-none' : ''}
        flex items-center justify-center gap-2
        ${className}
      `}
      {...rest}
    >
      {children}
    </button>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({
  children, className = '', onClick, noPad = false,
}: { children: ReactNode; className?: string; onClick?: () => void; noPad?: boolean }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-slate-100 shadow-sm
        ${onClick ? 'active:scale-[0.99] cursor-pointer transition-transform duration-100' : ''}
        ${noPad ? '' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KPI_ACCENT: Record<string, string> = {
  green:  'text-emerald-600',
  amber:  'text-amber-600',
  red:    'text-red-600',
  blue:   'text-blue-600',
  gray:   'text-slate-900',
  purple: 'text-violet-600',
  orange: 'text-orange-600',
}
const KPI_BG: Record<string, string> = {
  green:  'bg-emerald-50',
  amber:  'bg-amber-50',
  red:    'bg-red-50',
  blue:   'bg-blue-50',
  gray:   'bg-slate-50',
  purple: 'bg-violet-50',
  orange: 'bg-orange-50',
}

export function KpiCard({
  label, value, sub, variant = 'gray', icon, onClick,
}: { label: string; value: string; sub?: string; variant?: BadgeVariant; icon?: ReactNode; onClick?: () => void }) {
  return (
    <Card onClick={onClick} className="p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-[12px] text-slate-500 font-medium leading-tight">{label}</p>
        {icon && (
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${KPI_BG[variant]}`}>
            <span className={`${KPI_ACCENT[variant]}`}>{icon}</span>
          </div>
        )}
      </div>
      <p className={`text-[22px] font-bold font-mono leading-none tracking-tight ${KPI_ACCENT[variant]}`}>{value}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-1.5">{sub}</p>}
    </Card>
  )
}

// ─── Section Header ───────────────────────────────────────────────────────────
export function SectionHeader({
  title, action, onAction,
}: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-[12px] font-semibold text-slate-500 uppercase tracking-[0.08em]">{title}</h2>
      {action && (
        <button onClick={onAction} className="text-[13px] text-emerald-600 font-semibold">
          {action}
        </button>
      )}
    </div>
  )
}

// ─── Divider ──────────────────────────────────────────────────────────────────
export function Divider({ className = '' }: { className?: string }) {
  return <div className={`h-px bg-slate-100 ${className}`} />
}

// ─── Status Dot ───────────────────────────────────────────────────────────────
export function StatusDot({ color }: { color: 'green' | 'amber' | 'red' | 'blue' | 'gray' }) {
  const COLORS = { green: 'bg-emerald-500', amber: 'bg-amber-500', red: 'bg-red-500', blue: 'bg-blue-500', gray: 'bg-slate-400' }
  return <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${COLORS[color]}`} />
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({
  icon, title, body, action, onAction,
}: { icon: ReactNode; title: string; body: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center gap-4">
      <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400">
        {icon}
      </div>
      <div>
        <p className="text-[17px] font-semibold text-slate-800 mb-1">{title}</p>
        <p className="text-[14px] text-slate-500 leading-relaxed">{body}</p>
      </div>
      {action && (
        <Button onClick={onAction} size="md" className="mt-2">{action}</Button>
      )}
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export function Skeleton({ className = '', h = 'h-4' }: { className?: string; h?: string }) {
  return <div className={`skeleton rounded-xl ${h} ${className}`} />
}

export function SkeletonCard() {
  return (
    <Card className="p-4 flex flex-col gap-3">
      <Skeleton h="h-4" className="w-1/2" />
      <Skeleton h="h-6" className="w-3/4" />
      <Skeleton h="h-3" className="w-2/3" />
    </Card>
  )
}

// ─── Input / Text Field ───────────────────────────────────────────────────────
export function Input({
  label, value, onChange, type = 'text', placeholder = '', suffix, prefix, helper,
}: {
  label?: string; value: string; onChange?: (v: string) => void
  type?: string; placeholder?: string; suffix?: string; prefix?: ReactNode; helper?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[12px] font-semibold text-slate-500 uppercase tracking-[0.06em]">{label}</label>
      )}
      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all">
        {prefix && <div className="pl-3 text-slate-400">{prefix}</div>}
        <input
          type={type}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-3 py-3 bg-transparent text-[15px] text-slate-900 outline-none placeholder:text-slate-400"
        />
        {suffix && <span className="pr-3 text-[14px] text-slate-500 font-medium">{suffix}</span>}
      </div>
      {helper && <p className="text-[11px] text-slate-400">{helper}</p>}
    </div>
  )
}

// ─── Numeric Field ────────────────────────────────────────────────────────────
export function NumericField({
  label, value, onChange, unit, min = 0, step = 0.5,
}: { label?: string; value: number; onChange: (v: number) => void; unit?: string; min?: number; step?: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-[12px] font-semibold text-slate-500 uppercase tracking-[0.06em]">{label}</label>}
      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
        <button
          onClick={() => onChange(Math.max(min, value - step))}
          className="w-11 h-11 flex items-center justify-center text-slate-600 text-lg font-bold active:bg-slate-200 flex-shrink-0"
        >−</button>
        <div className="flex-1 flex items-center justify-center gap-1">
          <span className="text-[17px] font-bold font-mono text-slate-900">{value}</span>
          {unit && <span className="text-[13px] text-slate-500">{unit}</span>}
        </div>
        <button
          onClick={() => onChange(value + step)}
          className="w-11 h-11 flex items-center justify-center text-slate-600 text-lg font-bold active:bg-slate-200 flex-shrink-0"
        >+</button>
      </div>
    </div>
  )
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
export function ProgressBar({
  value, max, variant = 'green', showLabel = false, height = 6,
}: { value: number; max: number; variant?: 'green' | 'amber' | 'red' | 'blue'; showLabel?: boolean; height?: number }) {
  const pct = Math.min(100, (value / max) * 100)
  const FILL = { green: 'bg-emerald-500', amber: 'bg-amber-500', red: 'bg-red-500', blue: 'bg-blue-500' }
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-slate-100 rounded-full overflow-hidden" style={{ height }}>
        <div className={`h-full ${FILL[variant]} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      {showLabel && <span className="text-[11px] font-mono text-slate-500 w-8 text-right">{Math.round(pct)}%</span>}
    </div>
  )
}

// ─── Variance Pill ────────────────────────────────────────────────────────────
export function VariancePill({ value, pct }: { value: number; pct: number }) {
  const neg = value < 0
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] font-mono font-semibold
      ${neg ? 'bg-red-50 text-red-700' : value > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
      {value !== 0 && (neg ? '▼' : '▲')}{' '}
      {Math.abs(pct).toFixed(1)}%
    </span>
  )
}

// ─── Chips ───────────────────────────────────────────────────────────────────
export function ChipRow({
  options, value, onChange,
}: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hidden pb-0.5">
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all
            ${value === opt
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-600 active:bg-slate-200'
            }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

// ─── Segmented Control (iOS style) ────────────────────────────────────────────
export function SegmentedControl({
  options, value, onChange,
}: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex bg-slate-100/80 rounded-xl p-1 gap-1">
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`flex-1 py-1.5 rounded-lg text-[13px] font-semibold transition-all
            ${value === opt
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 active:text-slate-700'}`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

// ─── Step Indicator ───────────────────────────────────────────────────────────
export function StepIndicator({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center justify-center gap-0">
      {steps.map((_, i) => (
        <div key={i} className="flex items-center">
          <div className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
            i < current ? 'bg-emerald-500' :
            i === current ? 'bg-emerald-600 ring-2 ring-emerald-200' : 'bg-slate-200'
          }`} />
          {i < steps.length - 1 && (
            <div className={`h-px w-8 transition-colors ${i < current ? 'bg-emerald-400' : 'bg-slate-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Donut Chart ─────────────────────────────────────────────────────────────
export function DonutChart({
  segments, size = 88,
}: { segments: Array<{ value: number; color: string; label: string }>; size?: number }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  const r = size / 2 - 9
  const circ = 2 * Math.PI * r
  let offset = 0
  const style: CSSProperties = { transform: 'rotate(-90deg)', transformOrigin: 'center' }

  return (
    <svg width={size} height={size} style={{ overflow: 'visible' }}>
      {/* Track */}
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={8} />
      <g style={style}>
        {segments.map((seg, i) => {
          const len = (seg.value / total) * circ * 0.97 // small gap
          const el = (
            <circle
              key={i}
              cx={size / 2} cy={size / 2} r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={8}
              strokeDasharray={`${len} ${circ - len}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
            />
          )
          offset += (seg.value / total) * circ
          return el
        })}
      </g>
    </svg>
  )
}

// ─── Sparkline ────────────────────────────────────────────────────────────────
export function Sparkline({
  data, color = '#059669', height = 40, width = 120,
}: { data: number[]; color?: string; height?: number; width?: number }) {
  if (data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((v - min) / range) * (height - 6) - 3,
  }))
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const area = `${path} L${width},${height} L0,${height} Z`
  const gradId = `sg${color.replace('#', '')}`

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Last point dot */}
      <circle cx={pts[pts.length-1].x} cy={pts[pts.length-1].y} r="3" fill={color} />
    </svg>
  )
}

// ─── Line Chart ───────────────────────────────────────────────────────────────
export function LineChart({
  physical, theoretical, labels, width = 300, height = 120,
}: { physical: number[]; theoretical: number[]; labels: string[]; width?: number; height?: number }) {
  const all = [...physical, ...theoretical]
  const min = Math.min(...all) - 2
  const max = Math.max(...all) + 2
  const range = max - min
  const pL = 28, pR = 8, pT = 8, pB = 22

  const toX = (i: number) => pL + (i / (physical.length - 1)) * (width - pL - pR)
  const toY = (v: number) => pT + (1 - (v - min) / range) * (height - pT - pB)

  const linePath = (d: number[]) => d.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ')
  const areaPath = (d: number[]) => `${linePath(d)} L${(width - pR).toFixed(1)},${height - pB} L${pL},${height - pB} Z`

  const gridYs = [0.25, 0.5, 0.75, 1].map(t => min + range * t)

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="physGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#059669" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#059669" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Grid */}
      {gridYs.map((v, i) => (
        <g key={i}>
          <line x1={pL} y1={toY(v)} x2={width - pR} y2={toY(v)} stroke="#f1f5f9" strokeWidth="1" />
          <text x={pL - 4} y={toY(v) + 4} textAnchor="end" fontSize="9" fill="#94a3b8">{v.toFixed(0)}</text>
        </g>
      ))}
      {/* X labels every other */}
      {labels.filter((_, i) => i % 2 === 0).map((lbl, idx) => (
        <text key={idx} x={toX(idx * 2)} y={height - 4} textAnchor="middle" fontSize="9" fill="#94a3b8">
          {lbl.slice(0, 5)}
        </text>
      ))}
      {/* Theoretical area + line (dashed) */}
      <path d={areaPath(theoretical)} fill="none" />
      <path d={linePath(theoretical)} fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 2" />
      {/* Physical area + line */}
      <path d={areaPath(physical)} fill="url(#physGrad)" />
      <path d={linePath(physical)} fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots */}
      {physical.map((v, i) => (
        <circle key={i} cx={toX(i)} cy={toY(v)} r="2.5" fill="#059669" />
      ))}
    </svg>
  )
}

// ─── OCR Confidence Bar ───────────────────────────────────────────────────────
export function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 90 ? '#059669' : value >= 75 ? '#f59e0b' : '#ef4444'
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="text-[11px] font-mono font-semibold tabular-nums" style={{ color }}>{value}%</span>
    </div>
  )
}

// ─── Toast / Snackbar ─────────────────────────────────────────────────────────
export function Toast({
  message, type = 'success',
}: { message: string; type?: 'success' | 'error' | 'info' | 'warning' }) {
  const STYLE = {
    success: 'bg-emerald-600 text-white',
    error:   'bg-red-600 text-white',
    warning: 'bg-amber-500 text-white',
    info:    'bg-slate-800 text-white',
  }
  return (
    <div className={`px-4 py-3 rounded-2xl shadow-xl text-[14px] font-semibold ${STYLE[type]} animate-fade-in flex items-center gap-2`}>
      {type === 'success' && '✓ '}
      {type === 'error' && '✕ '}
      {message}
    </div>
  )
}

// ─── Info Banner ──────────────────────────────────────────────────────────────
export function InfoBanner({
  children, variant = 'blue',
}: { children: ReactNode; variant?: 'blue' | 'amber' | 'green' | 'red' }) {
  const STYLES = {
    blue:  'bg-blue-50 border-blue-100 text-blue-800',
    amber: 'bg-amber-50 border-amber-100 text-amber-800',
    green: 'bg-emerald-50 border-emerald-100 text-emerald-800',
    red:   'bg-red-50 border-red-100 text-red-800',
  }
  return (
    <div className={`px-4 py-3 rounded-2xl border text-[13px] leading-relaxed ${STYLES[variant]}`}>
      {children}
    </div>
  )
}

// ─── List Row ─────────────────────────────────────────────────────────────────
export function ListRow({
  leading, title, subtitle, trailing, onPress, separator = true,
}: {
  leading?: ReactNode; title: string; subtitle?: string
  trailing?: ReactNode; onPress?: () => void; separator?: boolean
}) {
  return (
    <div
      onClick={onPress}
      className={`flex items-center gap-3 px-4 py-3 ${onPress ? 'active:bg-slate-50 cursor-pointer' : ''} ${separator ? 'border-b border-slate-50' : ''}`}
    >
      {leading && <div className="flex-shrink-0">{leading}</div>}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium text-slate-900 leading-tight truncate">{title}</p>
        {subtitle && <p className="text-[12px] text-slate-500 mt-0.5 truncate">{subtitle}</p>}
      </div>
      {trailing && <div className="flex-shrink-0">{trailing}</div>}
    </div>
  )
}
