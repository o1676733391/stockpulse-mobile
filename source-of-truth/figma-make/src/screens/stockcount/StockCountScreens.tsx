import { useState } from 'react'
import {
  ChevronRight, CheckCircle2, Clock, ChevronLeft,
  Barcode, MessageSquare, SkipForward, Check,
  AlertTriangle, TrendingDown, X, Play,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { TopBar } from '../../components/layout/TopBar'
import { Card, Badge, ProgressBar, SectionHeader } from '../../components/ui'
import type { Screen } from '../../types'

// ─── Mock data ─────────────────────────────────────────────────────────────────

const SCHEDULES = [
  {
    id: 'daily', label: 'Daily Stock Count', sub: 'Today, 10 March 2026',
    progress: 42, total: 68, status: 'in_progress' as const, screen: 'active-count' as Screen,
  },
  {
    id: 'weekly', label: 'Weekly Count', sub: 'Due 14 March 2026',
    progress: 0, total: 68, status: 'scheduled' as const, screen: 'active-count' as Screen,
  },
  {
    id: 'monthly', label: 'Monthly Inventory', sub: 'Due 31 March 2026',
    progress: 0, total: 152, status: 'scheduled' as const, screen: 'active-count' as Screen,
  },
  {
    id: 'quarterly', label: 'Quarterly Audit', sub: 'Due 30 Jun 2026',
    progress: 0, total: 152, status: 'scheduled' as const, screen: 'active-count' as Screen,
  },
]

const COUNT_ITEMS = [
  { name: 'Chicken Breast',  sku: 'CHK-001', unit: 'kg', expected: 27.0, category: 'Meat & Poultry'  },
  { name: 'Fresh Salmon',    sku: 'SAL-002', unit: 'kg', expected: 6.0,  category: 'Fish & Seafood'  },
  { name: 'Potatoes',        sku: 'POT-003', unit: 'kg', expected: 50.2, category: 'Vegetables'      },
  { name: 'Cooking Oil',     sku: 'OIL-004', unit: 'L',  expected: 24.0, category: 'Dry Goods'       },
  { name: 'Whole Milk',      sku: 'MLK-005', unit: 'L',  expected: 10.5, category: 'Dairy'           },
  { name: 'Gouda Cheese',    sku: 'CHS-006', unit: 'kg', expected: 7.2,  category: 'Dairy'           },
  { name: 'Tomatoes',        sku: 'TOM-007', unit: 'kg', expected: 14.0, category: 'Vegetables'      },
  { name: 'Romaine Lettuce', sku: 'LET-008', unit: 'kg', expected: 4.0,  category: 'Vegetables'      },
  { name: 'Ground Beef',     sku: 'BEF-009', unit: 'kg', expected: 18.0, category: 'Meat & Poultry'  },
  { name: 'Wheat Flour',     sku: 'FLR-010', unit: 'kg', expected: 95.0, category: 'Dry Goods'       },
]

const SUMMARY_ITEMS = [
  { name: 'Chicken Breast',  should: 27.0, is: 24.5, unit: 'kg', cost: 4.80  },
  { name: 'Fresh Salmon',    should: 6.0,  is: 4.2,  unit: 'kg', cost: 16.20 },
  { name: 'Whole Milk',      should: 10.5, is: 8.0,  unit: 'L',  cost: 1.10  },
  { name: 'Potatoes',        should: 50.2, is: 48.0, unit: 'kg', cost: 0.90  },
  { name: 'Romaine Lettuce', should: 4.0,  is: 3.1,  unit: 'kg', cost: 2.20  },
  { name: 'Ground Beef',     should: 18.0, is: 18.0, unit: 'kg', cost: 6.20  },
]

// ─── Schedule Screen ──────────────────────────────────────────────────────────

export function StockCountScreen() {
  const { navigate } = useApp()
  const inProgress = SCHEDULES.filter(s => s.status === 'in_progress')
  const scheduled  = SCHEDULES.filter(s => s.status === 'scheduled')

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <TopBar title="Stock Counts" large />
      <div className="flex-1 overflow-y-auto scrollbar-hidden">
        <div className="px-4 pt-4 pb-6 flex flex-col gap-4">

          {/* In-progress count — prominent card */}
          {inProgress.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.08em] mb-2 px-1">Active</p>
              {inProgress.map(s => (
                <Card key={s.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-[15px] font-bold text-slate-900">{s.label}</h3>
                        <Badge variant="amber">In Progress</Badge>
                      </div>
                      <p className="text-[12px] text-slate-500 flex items-center gap-1">
                        <Clock size={11} /> {s.sub}
                      </p>
                    </div>
                    <div className="text-right ml-3 flex-shrink-0">
                      <p className="text-[26px] font-bold font-mono text-amber-700 leading-none">{s.progress}</p>
                      <p className="text-[11px] text-amber-600">of {s.total}</p>
                    </div>
                  </div>

                  <div className="mb-1">
                    <ProgressBar value={s.progress} max={s.total} variant="green" height={8} />
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[12px] text-slate-500">{s.total - s.progress} items remaining</p>
                    <p className="text-[12px] font-semibold text-emerald-600">{Math.round((s.progress / s.total) * 100)}% complete</p>
                  </div>

                  <button
                    onClick={() => navigate(s.screen)}
                    className="w-full py-3.5 bg-emerald-600 rounded-xl text-[15px] font-semibold text-white
                      flex items-center justify-center gap-2 shadow-sm active:bg-emerald-700 transition-colors"
                  >
                    <Play size={15} className="fill-white" />
                    Continue Count
                  </button>
                </Card>
              ))}
            </div>
          )}

          {/* Scheduled counts */}
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.08em] mb-2 px-1">Scheduled</p>
            <div className="flex flex-col gap-2.5">
              {scheduled.map(s => (
                <Card key={s.id} className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <Clock size={18} className="text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-slate-900">{s.label}</p>
                      <p className="text-[12px] text-slate-500 mt-0.5">{s.sub} · {s.total} items</p>
                    </div>
                    <button
                      onClick={() => navigate(s.screen)}
                      className="flex-shrink-0 px-4 py-2 bg-slate-100 rounded-xl text-[13px] font-semibold text-slate-700 active:bg-slate-200 transition-colors"
                    >
                      Start
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Last completed */}
          <Card className="p-4 bg-slate-800" noPad={false}>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 size={18} className="text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-white">Last completed count</p>
                <p className="text-[12px] text-slate-400 mt-0.5">Daily Count · 08 Mar 2026 · 68 items</p>
                <p className="text-[12px] text-red-400 mt-0.5 font-mono">Variance −€142.80</p>
              </div>
              <button className="flex items-center gap-1 text-[12px] text-emerald-400 font-semibold flex-shrink-0">
                Report <ChevronRight size={13} />
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

// ─── Active Count ─────────────────────────────────────────────────────────────

export function ActiveCountScreen() {
  const { navigate, platform } = useApp()
  const ios = platform === 'ios'
  const [idx, setIdx]         = useState(0)
  const [counts, setCounts]   = useState<Record<number, string>>({})
  const [showNote, setShowNote] = useState(false)
  const [note, setNote]       = useState('')

  const item    = COUNT_ITEMS[idx]
  const total   = COUNT_ITEMS.length
  const value   = counts[idx] ?? ''
  const parsed  = parseFloat(value)
  const hasValue = !isNaN(parsed) && value !== ''
  const variance    = hasValue ? parsed - item.expected : null
  const variancePct = variance !== null ? (variance / item.expected) * 100 : null

  const isMajor = variance !== null && Math.abs(variancePct!) > 10
  const isMinor = variance !== null && Math.abs(variancePct!) > 0 && !isMajor
  const isMatch = variance !== null && variance === 0

  const next = () => {
    if (idx < total - 1) setIdx(i => i + 1)
    else navigate('count-summary')
  }
  const prev = () => idx > 0 && setIdx(i => i - 1)
  const skip = () => { if (idx < total - 1) setIdx(i => i + 1) }

  const pressDigit = (d: string) => () =>
    setCounts(c => ({ ...c, [idx]: (c[idx] ?? '') + d }))
  const pressDot = () =>
    setCounts(c => ({ ...c, [idx]: (c[idx] ?? '').includes('.') ? c[idx] : (c[idx] ?? '') + '.' }))
  const pressBack = () =>
    setCounts(c => ({ ...c, [idx]: (c[idx] ?? '').slice(0, -1) }))

  const progressPct = Math.round(((idx + 42) / 68) * 100) // simulate ongoing count

  return (
    <div className="flex flex-col h-full bg-white">

      {/* ── Compact top header ── */}
      <div className="flex-shrink-0 bg-white border-b border-slate-100 px-4 pt-3 pb-3">
        <div className="flex items-center justify-between mb-3">
          {/* Exit */}
          {ios ? (
            <button
              onClick={() => navigate('stock-count')}
              className="flex items-center gap-0.5 text-emerald-600 font-semibold text-[15px] active:opacity-60"
            >
              <ChevronLeft size={19} strokeWidth={2.5} /> Exit
            </button>
          ) : (
            <button
              onClick={() => navigate('stock-count')}
              className="w-9 h-9 rounded-full flex items-center justify-center active:bg-slate-100"
            >
              <X size={20} className="text-slate-700" />
            </button>
          )}

          {/* Progress count */}
          <div className="text-center">
            <p className="text-[11px] text-slate-400 font-medium">Daily Stock Count</p>
            <p className="text-[15px] font-bold text-slate-900">{idx + 1} of {total}</p>
          </div>

          {/* Note toggle + barcode */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowNote(!showNote)}
              className={`w-9 h-9 rounded-full flex items-center justify-center active:bg-slate-100 transition-colors
                ${showNote ? 'bg-blue-50' : ''}`}
            >
              <MessageSquare size={18} className={showNote ? 'text-blue-500' : 'text-slate-400'} />
            </button>
            <button className="w-9 h-9 rounded-full flex items-center justify-center active:bg-slate-100">
              <Barcode size={18} className="text-slate-400" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <ProgressBar value={idx + 42} max={68} variant="green" height={5} />
        <div className="flex justify-between mt-1">
          <p className="text-[10px] text-slate-400">42 completed</p>
          <p className="text-[10px] font-semibold text-emerald-600">{progressPct}%</p>
        </div>
      </div>

      {/* ── Item info + Should block ── */}
      <div className="flex-shrink-0 px-4 py-4 bg-white border-b border-slate-100">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-[11px] text-slate-400 font-medium">{item.category} · {item.sku}</p>
            <h2 className="text-[20px] font-bold text-slate-900 mt-0.5">{item.name}</h2>
          </div>
        </div>

        {/* SHOULD — the reference value, slate/gray */}
        <div className="bg-slate-100 rounded-2xl px-4 py-3 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <div className="w-2 h-2 rounded-full bg-slate-400" />
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Theory / Should be</p>
            </div>
            <p className="text-[11px] text-slate-400">System-calculated expected quantity</p>
          </div>
          <div className="text-right">
            <p className="text-[26px] font-bold font-mono text-slate-600 leading-none">{item.expected}</p>
            <p className="text-[13px] text-slate-400 font-medium">{item.unit}</p>
          </div>
        </div>
      </div>

      {/* ── IS input + variance ── */}
      <div className="flex-shrink-0 px-4 py-3 bg-white border-b border-slate-100">
        {/* IS — the physical count input, emerald */}
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide">Physical / Is</p>
        </div>
        <div className={`rounded-2xl px-4 py-3 flex items-center justify-between border-2 transition-all
          ${hasValue
            ? isMajor  ? 'bg-red-50    border-red-400'
              : isMinor  ? 'bg-amber-50  border-amber-400'
              : isMatch  ? 'bg-emerald-50 border-emerald-400'
              : 'bg-emerald-50 border-emerald-400'
            : 'bg-slate-50 border-slate-200'}`}
        >
          <p className={`text-[36px] font-bold font-mono leading-none transition-colors
            ${hasValue
              ? isMajor ? 'text-red-700' : isMatch ? 'text-emerald-700' : 'text-amber-700'
              : 'text-slate-300'}`}>
            {value || '—'}
          </p>
          <p className={`text-[15px] font-semibold ${hasValue ? 'text-slate-600' : 'text-slate-300'}`}>
            {item.unit}
          </p>
        </div>

        {/* Variance — live as user types */}
        {variance !== null && (
          <div className={`mt-2.5 flex items-center justify-between px-4 py-3 rounded-xl
            ${isMajor ? 'bg-red-50 border border-red-100' : isMatch ? 'bg-emerald-50 border border-emerald-100' : 'bg-amber-50 border border-amber-100'}`}
          >
            <div className="flex items-center gap-2">
              {isMajor  ? <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
               : isMatch ? <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
               : <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />}
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Variance</p>
                {isMajor && <p className="text-[10px] text-red-500 font-medium">Major — review required</p>}
              </div>
            </div>
            <div className="text-right">
              <p className={`text-[18px] font-bold font-mono leading-none
                ${isMajor ? 'text-red-700' : isMatch ? 'text-emerald-700' : 'text-amber-700'}`}>
                {variance > 0 ? '+' : ''}{variance.toFixed(1)} {item.unit}
              </p>
              <p className={`text-[12px] font-mono font-semibold
                ${isMajor ? 'text-red-500' : isMatch ? 'text-emerald-500' : 'text-amber-500'}`}>
                {variancePct! > 0 ? '+' : ''}{variancePct!.toFixed(1)}%
              </p>
            </div>
          </div>
        )}

        {/* Optional note field */}
        {showNote && (
          <div className="mt-2.5">
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Add a note about this count…"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] text-slate-800 outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              rows={2}
            />
          </div>
        )}
      </div>

      {/* ── Numeric keypad (large touch targets, one-hand optimized) ── */}
      <div className="flex-1 grid grid-cols-3 gap-2 px-4 py-3 min-h-0">
        {['1','2','3','4','5','6','7','8','9'].map(d => (
          <button
            key={d}
            onClick={pressDigit(d)}
            className="bg-slate-50 border border-slate-200 rounded-2xl text-[24px] font-semibold text-slate-800
              active:bg-slate-200 active:scale-95 transition-all flex items-center justify-center"
          >
            {d}
          </button>
        ))}
        <button
          onClick={pressDot}
          className="bg-slate-50 border border-slate-200 rounded-2xl text-[24px] font-semibold text-slate-800
            active:bg-slate-200 active:scale-95 transition-all flex items-center justify-center"
        >
          .
        </button>
        <button
          onClick={pressDigit('0')}
          className="bg-slate-50 border border-slate-200 rounded-2xl text-[24px] font-semibold text-slate-800
            active:bg-slate-200 active:scale-95 transition-all flex items-center justify-center"
        >
          0
        </button>
        <button
          onClick={pressBack}
          className="bg-slate-50 border border-slate-200 rounded-2xl text-[22px] font-semibold text-slate-500
            active:bg-slate-200 active:scale-95 transition-all flex items-center justify-center"
        >
          ⌫
        </button>
      </div>

      {/* ── Action row (bottom — within thumb reach) ── */}
      <div className="flex-shrink-0 px-4 pb-6 pt-2 flex gap-2.5">
        {/* Previous */}
        <button
          onClick={prev}
          disabled={idx === 0}
          className="flex items-center gap-1 px-3 py-3.5 bg-white border border-slate-200 rounded-2xl text-[13px] font-semibold text-slate-700 disabled:opacity-40 active:bg-slate-50 transition-colors"
        >
          <ChevronLeft size={16} /> Prev
        </button>

        {/* Skip */}
        <button
          onClick={skip}
          disabled={idx === total - 1}
          className="flex items-center gap-1 px-3 py-3.5 bg-slate-100 rounded-2xl text-[13px] font-semibold text-slate-600 disabled:opacity-40 active:bg-slate-200 transition-colors"
        >
          <SkipForward size={14} /> Skip
        </button>

        {/* Save & Next — primary, full-width */}
        <button
          onClick={next}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[14px] font-bold text-white
            shadow-sm active:scale-[0.98] transition-all
            ${hasValue ? 'bg-emerald-600 active:bg-emerald-700' : 'bg-slate-300'}`}
        >
          <Check size={17} strokeWidth={2.5} />
          {idx === total - 1 ? 'Finish Count' : 'Save & Next'}
        </button>
      </div>
    </div>
  )
}

// ─── Count Summary ─────────────────────────────────────────────────────────────

export function CountSummaryScreen() {
  const { navigate } = useApp()

  const varianceItems = SUMMARY_ITEMS.filter(s => s.is !== s.should)
  const matching      = SUMMARY_ITEMS.filter(s => s.is === s.should).length
  const minor         = varianceItems.filter(s => Math.abs((s.is - s.should) / s.should) <= 0.10).length
  const major         = varianceItems.filter(s => Math.abs((s.is - s.should) / s.should) >  0.10).length

  const totalVarianceEur = SUMMARY_ITEMS.reduce((sum, s) => {
    const diff = s.is - s.should
    return sum + diff * s.cost
  }, 0)

  const stats = [
    { label: 'Items Counted',   value: 68,      color: 'text-slate-900',   bg: 'bg-slate-50',    border: 'border-slate-100' },
    { label: 'Matching',        value: matching, color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-100' },
    { label: 'Minor Variance',  value: minor,    color: 'text-amber-700',   bg: 'bg-amber-50',    border: 'border-amber-100' },
    { label: 'Major Variance',  value: major,    color: 'text-red-700',     bg: 'bg-red-50',      border: 'border-red-100' },
  ]

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* ── Top summary header ── */}
      <div className="flex-shrink-0 bg-white border-b border-slate-100 px-4 pt-5 pb-5">
        {/* Completion badge */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={26} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-[18px] font-bold text-slate-900">Daily Count Complete</h1>
            <p className="text-[12px] text-slate-500">10 March 2026 · 68 items counted</p>
          </div>
        </div>

        {/* Variance value — big */}
        <div className={`rounded-2xl px-4 py-4 text-center mb-4
          ${totalVarianceEur < 0 ? 'bg-red-50 border border-red-100' : 'bg-emerald-50 border border-emerald-100'}`}>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.08em] mb-1">Total Variance Value</p>
          <p className={`text-[36px] font-bold font-mono leading-none
            ${totalVarianceEur < 0 ? 'text-red-700' : 'text-emerald-700'}`}>
            {totalVarianceEur > 0 ? '+' : ''}€{Math.abs(totalVarianceEur).toFixed(2)}
          </p>
          <p className={`text-[12px] mt-1.5 font-medium ${totalVarianceEur < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
            Across {varianceItems.length} items with variance
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-2">
          {stats.map(s => (
            <div
              key={s.label}
              className={`${s.bg} border ${s.border} rounded-2xl py-3 flex flex-col items-center gap-1`}
            >
              <p className={`text-[22px] font-bold font-mono leading-none ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-slate-500 font-medium text-center leading-tight px-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Items needing review ── */}
      <div className="flex-1 overflow-y-auto scrollbar-hidden">
        <div className="px-4 py-4 flex flex-col gap-2.5">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.08em] px-1">
            Needs Investigation ({varianceItems.length})
          </p>

          {varianceItems.map(s => {
            const variance    = s.is - s.should
            const variancePct = (variance / s.should) * 100
            const isMajor     = Math.abs(variancePct) > 10
            const varEur      = variance * s.cost

            return (
              <Card key={s.name} className="overflow-hidden" noPad>
                <div className="flex">
                  {/* Urgency stripe */}
                  <div className={`w-1 flex-shrink-0 ${isMajor ? 'bg-red-500' : 'bg-amber-400'}`} />

                  <div className="flex-1 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-[14px] font-bold text-slate-900">{s.name}</h3>
                        <p className="text-[11px] text-slate-400">Unit: {s.unit}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={isMajor ? 'red' : 'amber'}>
                          {isMajor ? 'Major' : 'Minor'}
                        </Badge>
                        <p className={`text-[11px] font-mono font-semibold ${varEur < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {varEur > 0 ? '+' : ''}€{Math.abs(varEur).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Should / Is / Variance — three columns */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-slate-50 rounded-xl p-2.5 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Should</p>
                        </div>
                        <p className="text-[14px] font-bold font-mono text-slate-600">{s.should}</p>
                        <p className="text-[10px] text-slate-400">{s.unit}</p>
                      </div>
                      <div className="bg-emerald-50 rounded-xl p-2.5 text-center border border-emerald-100">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wide">Is</p>
                        </div>
                        <p className="text-[14px] font-bold font-mono text-emerald-700">{s.is}</p>
                        <p className="text-[10px] text-emerald-400">{s.unit}</p>
                      </div>
                      <div className={`rounded-xl p-2.5 text-center border
                        ${isMajor ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <TrendingDown size={9} className={isMajor ? 'text-red-500' : 'text-amber-500'} />
                          <p className={`text-[9px] font-bold uppercase tracking-wide ${isMajor ? 'text-red-500' : 'text-amber-500'}`}>Diff</p>
                        </div>
                        <p className={`text-[14px] font-bold font-mono ${isMajor ? 'text-red-700' : 'text-amber-700'}`}>
                          {variance > 0 ? '+' : ''}{variance.toFixed(1)}
                        </p>
                        <p className={`text-[10px] font-mono ${isMajor ? 'text-red-400' : 'text-amber-400'}`}>
                          {variancePct.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}

          {/* Matching items summary */}
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3">
            <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
            <p className="text-[13px] text-emerald-700 font-medium">
              {matching} items matched exactly — no action needed
            </p>
          </div>
        </div>
      </div>

      {/* ── Bottom CTAs ── */}
      <div className="flex-shrink-0 px-4 pb-6 pt-3 bg-white border-t border-slate-100 flex flex-col gap-2.5">
        <button
          onClick={() => navigate('inventory')}
          className="w-full py-3.5 bg-emerald-600 rounded-2xl text-[15px] font-bold text-white shadow-sm active:bg-emerald-700 transition-colors"
        >
          Review Variances in Inventory
        </button>
        <button
          onClick={() => navigate('home')}
          className="w-full py-3.5 bg-slate-100 rounded-2xl text-[14px] font-semibold text-slate-700 active:bg-slate-200 transition-colors"
        >
          Complete & Return to Dashboard
        </button>
      </div>
    </div>
  )
}
