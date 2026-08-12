import { useState } from 'react'
import { AlertTriangle, Lightbulb, Check, X, ChevronRight, Clock, PackageX, Minus, Plus, ArrowLeft } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { TopBar } from '../../components/layout/TopBar'
import { Card, Badge, SectionHeader } from '../../components/ui'

// ─── Data ─────────────────────────────────────────────────────────────────────

export const EXPIRY_ITEMS = [
  {
    id: 'e1', name: 'Fresh Salmon', batch: 'B1030', qty: 4.2, unit: 'kg', days: 1,
    value: 68.04, costPerUnit: 16.20, status: 'critical' as const,
    category: 'Fish & Seafood', expiryDate: '11 Mar 2026',
    suggestionId: 0,
  },
  {
    id: 'e2', name: 'Romaine Lettuce', batch: 'B1033', qty: 3.1, unit: 'kg', days: 2,
    value: 6.82, costPerUnit: 2.20, status: 'critical' as const,
    category: 'Vegetables', expiryDate: '12 Mar 2026',
    suggestionId: 1,
  },
  {
    id: 'e3', name: 'Whole Milk', batch: 'B1032', qty: 8, unit: 'L', days: 3,
    value: 8.80, costPerUnit: 1.10, status: 'soon' as const,
    category: 'Dairy', expiryDate: '13 Mar 2026',
    suggestionId: -1,
  },
  {
    id: 'e4', name: 'Ground Beef', batch: 'B1027', qty: 18, unit: 'kg', days: 3,
    value: 111.60, costPerUnit: 6.20, status: 'soon' as const,
    category: 'Meat & Poultry', expiryDate: '13 Mar 2026',
    suggestionId: 2,
  },
  {
    id: 'e5', name: 'Chicken Breast', batch: 'B1024', qty: 10, unit: 'kg', days: 3,
    value: 48.00, costPerUnit: 4.80, status: 'soon' as const,
    category: 'Meat & Poultry', expiryDate: '13 Mar 2026',
    suggestionId: -1,
  },
  {
    id: 'e6', name: 'Tomatoes', batch: 'B1028', qty: 12.4, unit: 'kg', days: 6,
    value: 22.32, costPerUnit: 1.80, status: 'soon' as const,
    category: 'Vegetables', expiryDate: '16 Mar 2026',
    suggestionId: -1,
  },
]

export const SUGGESTIONS = [
  {
    id: 0, item: 'Fresh Salmon', qty: 4.2, unit: 'kg', days: 1,
    promo: 'Salmon Lunch Special', uses: '3.8 kg', usesNum: 3.8, utilization: 90, saved: '€61.56', recipeId: 'r3',
    description: 'Feature salmon as the lunch special. Pairs well with the potato side already in stock.',
  },
  {
    id: 1, item: 'Romaine Lettuce', qty: 3.1, unit: 'kg', days: 2,
    promo: 'Caesar Salad Promotion', uses: '2.8 kg', usesNum: 2.8, utilization: 88, saved: '€5.72', recipeId: 'r4',
    description: 'Run a discounted caesar salad promotion for lunch service.',
  },
  {
    id: 2, item: 'Ground Beef', qty: 18, unit: 'kg', days: 3,
    promo: 'Burger Happy Hour', uses: '15 kg', usesNum: 15, utilization: 83, saved: '€93.00', recipeId: 'r2',
    description: 'Offer a happy-hour burger promotion in the evening shift.',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysLabel(days: number) {
  if (days <= 0) return 'Expired'
  if (days === 1) return 'Tomorrow'
  return `${days}d`
}

function expiryColor(status: 'critical' | 'soon' | 'ok') {
  return status === 'critical' ? 'bg-red-500' : status === 'soon' ? 'bg-amber-400' : 'bg-emerald-400'
}

function expiryBadgeVariant(status: 'critical' | 'soon' | 'ok'): 'red' | 'amber' | 'green' {
  return status === 'critical' ? 'red' : status === 'soon' ? 'amber' : 'green'
}

// ─── Expiration Center ────────────────────────────────────────────────────────

const TABS = ['Critical', 'Soon', 'All'] as const
type TabType = typeof TABS[number]

export function ExpirationScreen() {
  const { navigate } = useApp()
  const [tab, setTab] = useState<TabType>('Critical')
  const [markedUsed, setMarkedUsed] = useState<Set<string>>(new Set())
  const [adjusting, setAdjusting] = useState<string | null>(null)
  const [adjustQty, setAdjustQty] = useState(0)

  const expired = 2
  const next3 = EXPIRY_ITEMS.filter(i => i.days <= 3).length
  const next7 = EXPIRY_ITEMS.filter(i => i.days <= 7).length

  const filtered = EXPIRY_ITEMS.filter(i => {
    if (markedUsed.has(i.id)) return false
    if (tab === 'Critical') return i.status === 'critical'
    if (tab === 'Soon') return i.status === 'soon'
    return true
  })

  const markUsed = (id: string) => {
    setMarkedUsed(prev => new Set([...prev, id]))
    setAdjusting(null)
  }

  const totalRisk = EXPIRY_ITEMS
    .filter(i => !markedUsed.has(i.id) && i.days <= 7)
    .reduce((s, i) => s + i.value, 0)

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Expiration Alerts" large />

      {/* Summary */}
      <div className="flex-shrink-0 bg-white border-b border-slate-100 px-4 pb-3">
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="text-center p-2.5 bg-red-50 rounded-xl">
            <p className="text-xl font-bold font-mono text-red-700">{expired}</p>
            <p className="text-xs text-red-600 font-medium">Expired</p>
          </div>
          <div className="text-center p-2.5 bg-amber-50 rounded-xl">
            <p className="text-xl font-bold font-mono text-amber-700">{next3}</p>
            <p className="text-xs text-amber-600 font-medium">Next 3 days</p>
          </div>
          <div className="text-center p-2.5 bg-slate-50 rounded-xl">
            <p className="text-xl font-bold font-mono text-slate-700">{next7}</p>
            <p className="text-xs text-slate-500 font-medium">Next 7 days</p>
          </div>
        </div>

        {totalRisk > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-xl border border-red-100 mb-3">
            <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-700 font-medium">
              Total value at risk: <span className="font-mono font-bold">€{totalRisk.toFixed(2)}</span> in next 7 days
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors
                ${tab === t ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {t}
              {t === 'Critical' && expired + EXPIRY_ITEMS.filter(i => i.status === 'critical').length > 0 && (
                <span className={`ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold
                  ${tab === 'Critical' ? 'bg-red-500 text-white' : 'bg-red-500 text-white'}`}>
                  {expired + EXPIRY_ITEMS.filter(i => i.status === 'critical').length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hidden bg-slate-50 p-4 flex flex-col gap-2.5">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
              <Check size={24} className="text-emerald-500" />
            </div>
            <p className="text-slate-500 text-sm font-medium">No items in this category</p>
          </div>
        )}

        {filtered.map(item => {
          const isAdjusting = adjusting === item.id
          const hasSuggestion = item.suggestionId >= 0

          return (
            <Card key={item.id} className={`overflow-hidden ${item.status === 'critical' ? 'ring-1 ring-red-200' : ''}`}>
              <div className="flex">
                {/* Urgency stripe */}
                <div className={`w-1 flex-shrink-0 ${expiryColor(item.status)}`} />

                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <button className="flex-1 text-left" onClick={() => navigate('expiration-item', { expiryId: item.id })}>
                      <h3 className="font-semibold text-slate-900 text-sm">{item.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Batch #{item.batch} · {item.qty} {item.unit} · {item.category}
                      </p>
                    </button>
                    <div className="flex items-center gap-2 ml-2">
                      <Badge variant={expiryBadgeVariant(item.status)}>
                        {daysLabel(item.days)}
                      </Badge>
                      <ChevronRight size={14} className="text-slate-300" />
                    </div>
                  </div>

                  {/* BBD countdown bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} className={item.status === 'critical' ? 'text-red-400' : 'text-amber-400'} />
                        <p className="text-xs text-slate-500">
                          {item.days <= 0 ? 'Expired' : `Expires ${item.days === 1 ? 'tomorrow' : `in ${item.days} days`}`}
                          {' · '}
                          <span className="text-xs font-medium">{item.expiryDate}</span>
                        </p>
                      </div>
                    </div>
                    {item.days > 0 && (
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.status === 'critical' ? 'bg-red-400' : 'bg-amber-400'}`}
                          style={{ width: `${Math.min(100, (item.days / 7) * 100)}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <p className="text-xs text-slate-500">
                      Value at risk:{' '}
                      <span className="font-mono font-semibold text-slate-700">€{item.value.toFixed(2)}</span>
                    </p>
                  </div>

                  {/* Adjust quantity inline */}
                  {isAdjusting && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-xs font-semibold text-slate-700 mb-2">Adjust quantity used</p>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setAdjustQty(q => Math.max(0, q - 0.5))}
                          className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                          <Minus size={14} className="text-slate-600" />
                        </button>
                        <div className="flex-1 text-center">
                          <span className="font-mono font-bold text-slate-900 text-lg">{adjustQty.toFixed(1)}</span>
                          <span className="text-sm text-slate-500 ml-1">{item.unit}</span>
                        </div>
                        <button onClick={() => setAdjustQty(q => Math.min(item.qty, q + 0.5))}
                          className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                          <Plus size={14} className="text-slate-600" />
                        </button>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => setAdjusting(null)}
                          className="flex-1 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600">
                          Cancel
                        </button>
                        <button onClick={() => markUsed(item.id)}
                          disabled={adjustQty === 0}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold ${adjustQty > 0 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                          Confirm
                        </button>
                      </div>
                    </div>
                  )}

                  {!isAdjusting && (
                    <div className="flex gap-2 mt-3">
                      {hasSuggestion && (
                        <button onClick={() => navigate('waste-reduction', { suggestionId: item.suggestionId })}
                          className="flex items-center gap-1 px-2.5 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold flex-1 justify-center">
                          <Lightbulb size={12} /> Suggestion
                        </button>
                      )}
                      <button onClick={() => { setAdjusting(item.id); setAdjustQty(item.qty) }}
                        className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold text-center">
                        Adjust
                      </button>
                      <button onClick={() => markUsed(item.id)}
                        className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold text-center">
                        Mark Used
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )
        })}

        {/* Expired items section */}
        {(tab === 'Critical' || tab === 'All') && (
          <div>
            <SectionHeader title="Expired Items" />
            {[
              { name: 'Tomato Paste', batch: 'B1018', qty: '2.4 kg', expiryDate: '08 Mar 2026', value: '€6.00' },
              { name: 'Cream',        batch: 'B1019', qty: '3 L',    expiryDate: '09 Mar 2026', value: '€7.50' },
            ].map(item => (
              <Card key={item.batch} className="flex overflow-hidden mb-2 opacity-70">
                <div className="w-1 flex-shrink-0 bg-slate-400" />
                <div className="flex-1 px-4 py-3 flex items-center gap-3">
                  <PackageX size={16} className="text-slate-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-600">{item.name}</p>
                    <p className="text-xs text-slate-400">Batch #{item.batch} · {item.qty} · Expired {item.expiryDate}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="gray">Expired</Badge>
                    <p className="text-xs text-slate-400 mt-0.5">{item.value}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Expiration Item Detail ────────────────────────────────────────────────────

export function ExpirationItemScreen() {
  const { navigate, goBack, params, platform } = useApp()
  const item = EXPIRY_ITEMS.find(i => i.id === params.expiryId) ?? EXPIRY_ITEMS[0]
  const [markedUsed, setMarkedUsed] = useState(false)
  const [adjustQty, setAdjustQty] = useState(item.qty)
  const hasSuggestion = item.suggestionId >= 0

  const daysBarWidth = item.days > 0 ? Math.min(100, (item.days / 7) * 100) : 0

  if (markedUsed) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white px-8 gap-6">
        <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center">
          <Check size={36} className="text-emerald-500" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-1">Marked as Used</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            {adjustQty.toFixed(1)} {item.unit} of {item.name} has been recorded as used. Theoretical inventory updated.
          </p>
        </div>
        <button onClick={() => navigate('expiration')} className="w-full py-3.5 bg-emerald-600 rounded-2xl text-sm font-bold text-white">
          Back to Expiration Alerts
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`flex-shrink-0 bg-white border-b border-slate-100 px-4 pt-12 pb-4`}>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={goBack} className="flex items-center gap-1 text-slate-600">
            {platform === 'ios'
              ? <><ArrowLeft size={18} /><span className="text-sm font-medium">Back</span></>
              : <ArrowLeft size={20} />
            }
          </button>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{item.name}</h1>
            <p className="text-xs text-slate-400 mt-0.5">{item.category} · Batch #{item.batch}</p>
          </div>
          <Badge variant={expiryBadgeVariant(item.status)}>
            {daysLabel(item.days)}
          </Badge>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hidden bg-slate-50 p-4 flex flex-col gap-4">
        {/* Status card */}
        <div className={`rounded-2xl p-4 ${item.status === 'critical' ? 'bg-red-50 border border-red-100' : 'bg-amber-50 border border-amber-100'}`}>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={16} className={item.status === 'critical' ? 'text-red-500' : 'text-amber-500'} />
            <p className={`text-sm font-bold ${item.status === 'critical' ? 'text-red-700' : 'text-amber-700'}`}>
              {item.days === 1 ? 'Expires Tomorrow' : `Expires in ${item.days} days`}
            </p>
          </div>
          {/* BBD progress bar */}
          <div className="mb-2">
            <div className="h-2 bg-white/60 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${item.status === 'critical' ? 'bg-red-400' : 'bg-amber-400'}`}
                style={{ width: `${daysBarWidth}%` }}
              />
            </div>
          </div>
          <p className={`text-xs ${item.status === 'critical' ? 'text-red-600' : 'text-amber-700'}`}>
            Best-before date: <strong>{item.expiryDate}</strong>
          </p>
        </div>

        {/* Quantity & value */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold font-mono text-slate-900">{item.qty}</p>
            <p className="text-xs text-slate-500 mt-0.5">{item.unit} in batch</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold font-mono text-red-600">€{item.value.toFixed(2)}</p>
            <p className="text-xs text-slate-500 mt-0.5">Est. value at risk</p>
          </Card>
        </div>

        {/* Smart suggestion */}
        {hasSuggestion && (
          <Card className="p-4">
            <div className="flex items-center gap-1.5 mb-3">
              <Lightbulb size={15} className="text-emerald-600" />
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Smart Suggestion Available</p>
            </div>
            <p className="text-sm font-semibold text-slate-900 mb-1">
              {SUGGESTIONS[item.suggestionId].promo}
            </p>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              {SUGGESTIONS[item.suggestionId].description}
            </p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-slate-50 rounded-xl p-2.5 text-center">
                <p className="text-xs text-slate-400">Uses</p>
                <p className="text-xs font-mono font-bold text-slate-700 mt-0.5">{SUGGESTIONS[item.suggestionId].uses}</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-2.5 text-center">
                <p className="text-xs text-emerald-600">Utilization</p>
                <p className="text-sm font-mono font-bold text-emerald-700 mt-0.5">{SUGGESTIONS[item.suggestionId].utilization}%</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-2.5 text-center">
                <p className="text-xs text-emerald-600">Est. Saved</p>
                <p className="text-xs font-mono font-bold text-emerald-700 mt-0.5">{SUGGESTIONS[item.suggestionId].saved}</p>
              </div>
            </div>
            <button onClick={() => navigate('waste-reduction', { suggestionId: item.suggestionId })}
              className="w-full py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700 text-center">
              View Full Suggestion
            </button>
          </Card>
        )}

        {/* Adjust quantity */}
        <Card className="p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Mark as Used — Adjust Quantity</p>
          <div className="flex items-center gap-3 mb-1">
            <button onClick={() => setAdjustQty(q => Math.max(0, parseFloat((q - 0.5).toFixed(1))))}
              className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center active:bg-slate-200">
              <Minus size={16} className="text-slate-600" />
            </button>
            <div className="flex-1 text-center">
              <span className="font-mono font-bold text-slate-900 text-2xl">{adjustQty.toFixed(1)}</span>
              <span className="text-base text-slate-500 ml-1">{item.unit}</span>
            </div>
            <button onClick={() => setAdjustQty(q => Math.min(item.qty, parseFloat((q + 0.5).toFixed(1))))}
              className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center active:bg-slate-200">
              <Plus size={16} className="text-slate-600" />
            </button>
          </div>
          <p className="text-center text-xs text-slate-400">
            Est. waste reduction: <span className="font-mono font-semibold text-emerald-700">€{(adjustQty * item.costPerUnit).toFixed(2)}</span>
          </p>
        </Card>
      </div>

      <div className="flex-shrink-0 p-4 pb-6 bg-white border-t border-slate-100 flex flex-col gap-2.5">
        <button onClick={() => setMarkedUsed(true)}
          className="w-full py-3.5 bg-emerald-600 rounded-2xl text-sm font-bold text-white shadow-sm">
          Mark {adjustQty.toFixed(1)} {item.unit} as Used
        </button>
        {hasSuggestion && (
          <button onClick={() => navigate('waste-reduction', { suggestionId: item.suggestionId })}
            className="w-full py-3 text-sm font-semibold text-emerald-700 text-center">
            View Waste Reduction Suggestion
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Waste Reduction / Smart Suggestions ─────────────────────────────────────

export function WasteReductionScreen() {
  const { navigate, params } = useApp()
  const [used, setUsed] = useState<Set<number>>(new Set())
  const [dismissed, setDismissed] = useState<Set<number>>(new Set())

  // If a specific suggestion is linked, scroll to it (prototype: show all, highlight linked)
  const highlightId = params.suggestionId as number | undefined

  const visible = SUGGESTIONS.filter(s => !dismissed.has(s.id))

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Waste Reduction" />

      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-slate-100 px-4 py-4">
        <div className="flex items-center gap-2 mb-1">
          <Lightbulb size={16} className="text-emerald-500" />
          <p className="text-base font-bold text-slate-900">Save inventory before it expires</p>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          System-generated suggestions based on current stock and recipe mappings. Actual results may vary.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hidden bg-slate-50 p-4 flex flex-col gap-3">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
              <Check size={24} className="text-emerald-500" />
            </div>
            <p className="text-slate-500 text-sm font-medium">All suggestions actioned</p>
          </div>
        ) : visible.map(s => {
          const isHighlighted = highlightId === s.id
          const isUsed = used.has(s.id)

          return (
            <Card key={s.id}
              className={`overflow-hidden transition-all ${isUsed ? 'opacity-60' : ''} ${isHighlighted ? 'ring-2 ring-emerald-400' : ''}`}>
              <div className="flex">
                {/* Urgency stripe */}
                <div className={`w-1 flex-shrink-0 ${s.days <= 1 ? 'bg-red-500' : s.days <= 3 ? 'bg-amber-400' : 'bg-slate-300'}`} />

                <div className="flex-1 p-4">
                  {/* Expiring item header */}
                  <div className="flex items-start gap-2 mb-3 pb-3 border-b border-slate-100">
                    <AlertTriangle size={14} className={`flex-shrink-0 mt-0.5 ${s.days <= 1 ? 'text-red-500' : 'text-amber-500'}`} />
                    <div className="flex-1">
                      <p className={`text-xs font-semibold ${s.days <= 1 ? 'text-red-700' : 'text-amber-700'}`}>
                        {s.item} · {s.qty} {s.unit}
                      </p>
                      <p className="text-xs text-slate-400">
                        {s.days === 1 ? 'Expires tomorrow' : `Expires in ${s.days} days`}
                      </p>
                    </div>
                    <Badge variant={s.days <= 1 ? 'red' : 'amber'}>
                      {daysLabel(s.days)}
                    </Badge>
                  </div>

                  {/* Suggestion */}
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Lightbulb size={13} className="text-emerald-600" />
                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Suggested Promotion</p>
                  </div>
                  <p className="text-base font-bold text-slate-900 mb-1">{s.promo}</p>
                  <p className="text-xs text-slate-500 mb-3 leading-relaxed">{s.description}</p>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-slate-50 rounded-xl p-2.5 text-center">
                      <p className="text-xs text-slate-400">Uses</p>
                      <p className="text-xs font-mono font-bold text-slate-700 mt-0.5">{s.uses}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-2.5 text-center">
                      <p className="text-xs text-emerald-600">Utilization</p>
                      <p className="text-sm font-mono font-bold text-emerald-700 mt-0.5">{s.utilization}%</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-2.5 text-center">
                      <p className="text-xs text-emerald-600">Est. Saved</p>
                      <p className="text-xs font-mono font-bold text-emerald-700 mt-0.5">{s.saved}</p>
                    </div>
                  </div>

                  {/* Utilization bar */}
                  <div className="mb-3">
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${s.utilization}%` }} />
                    </div>
                    <p className="text-xs text-slate-400 mt-1 text-right">{s.utilization}% of stock utilised</p>
                  </div>

                  <p className="text-xs text-slate-400 italic mb-3">System recommendation — actual results may vary</p>

                  {isUsed ? (
                    <div className="flex items-center justify-center gap-2 py-2.5 bg-emerald-50 rounded-xl text-emerald-700 text-sm font-semibold">
                      <Check size={16} /> Recommendation Used
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => navigate('recipe-detail', { recipeId: s.recipeId })}
                        className="flex-1 py-2.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 text-center">
                        View Recipe
                      </button>
                      <button onClick={() => setUsed(prev => new Set([...prev, s.id]))}
                        className="flex-1 py-2.5 bg-emerald-600 rounded-xl text-xs font-bold text-white shadow-sm text-center">
                        Use Suggestion
                      </button>
                      <button onClick={() => setDismissed(prev => new Set([...prev, s.id]))}
                        className="px-3 py-2.5 bg-slate-100 rounded-xl">
                        <X size={14} className="text-slate-400" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )
        })}

        {visible.length > 0 && (
          <div className="p-4 bg-blue-50 rounded-2xl">
            <p className="text-xs font-semibold text-blue-700 mb-1">About these recommendations</p>
            <p className="text-xs text-blue-600 leading-relaxed">
              Suggestions are calculated from your current expiring stock and active recipe mappings.
              Using a suggestion does not automatically update inventory — confirm actual usage through a stock count.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
