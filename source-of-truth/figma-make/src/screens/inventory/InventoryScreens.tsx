import { useState } from 'react'
import {
  Search, Filter, Plus, Pencil, History, AlertTriangle,
  CheckCircle, TrendingDown, ArrowUpDown, Clock, Play,
  ChevronRight, Package, ShoppingCart,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { TopBar } from '../../components/layout/TopBar'
import {
  Card, Badge, VariancePill, SectionHeader, LineChart,
  ChipRow, SegmentedControl, ProgressBar, InfoBanner,
} from '../../components/ui'
import { inventoryItems, stockTrend } from '../../data/mockData'
import type { InventoryItem } from '../../types'

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<InventoryItem['status'], { label: string; variant: 'green'|'amber'|'red'|'blue' }> = {
  healthy:   { label: 'Healthy',   variant: 'green' },
  low:       { label: 'Low Stock', variant: 'amber' },
  critical:  { label: 'Critical',  variant: 'red'   },
  overstock: { label: 'Overstock', variant: 'blue'  },
}

const CATEGORIES  = ['All', 'Meat & Poultry', 'Fish & Seafood', 'Vegetables', 'Dairy', 'Dry Goods']
const STATUS_FILTERS = ['All', 'Low Stock', 'Expiring', 'Overstock', 'Variance', 'Supplier']
const SORT_OPTIONS   = ['Name', 'Physical ↓', 'Variance ↓', 'Expiry ↑']

// ─── Inventory List ───────────────────────────────────────────────────────────

export function InventoryListScreen() {
  const { navigate, role } = useApp()
  const [query, setQuery]         = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [category, setCategory]   = useState('All')
  const [sort, setSort]           = useState('Name')
  const [showSort, setShowSort]   = useState(false)

  const filtered = inventoryItems
    .filter(item => {
      const q = item.name.toLowerCase().includes(query.toLowerCase()) ||
                item.sku.toLowerCase().includes(query.toLowerCase())
      const s = statusFilter === 'All'      ? true
        : statusFilter === 'Low Stock'      ? (item.status === 'low' || item.status === 'critical')
        : statusFilter === 'Expiring'       ? item.batches.some(b => b.daysRemaining <= 7)
        : statusFilter === 'Overstock'      ? item.status === 'overstock'
        : statusFilter === 'Variance'       ? Math.abs((item.physicalStock - item.theoreticalStock) / item.theoreticalStock) > 0.05
        : statusFilter === 'Supplier'       ? item.supplierId === 's1'
        : true
      const c = category === 'All' ? true : item.category === category
      return q && s && c
    })
    .sort((a, b) => {
      if (sort === 'Physical ↓') return b.physicalStock - a.physicalStock
      if (sort === 'Variance ↓') return Math.abs(b.physicalStock - b.theoreticalStock) - Math.abs(a.physicalStock - a.theoreticalStock)
      if (sort === 'Expiry ↑')   return Math.min(...a.batches.map(x => x.daysRemaining)) - Math.min(...b.batches.map(x => x.daysRemaining))
      return a.name.localeCompare(b.name)
    })

  const totalValue  = inventoryItems.reduce((s, i) => s + i.physicalStock * i.costPerUnit, 0)
  const alertCount  = inventoryItems.filter(i => i.status === 'critical' || i.status === 'low').length

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <TopBar
        title="Inventory"
        large
        right={role === 'admin' ? (
          <button className="w-9 h-9 rounded-full flex items-center justify-center active:bg-slate-100">
            <Plus size={22} className="text-slate-700" strokeWidth={2.2} />
          </button>
        ) : undefined}
      />

      {/* ── Sticky filter bar ── */}
      <div className="flex-shrink-0 bg-white border-b border-slate-100 px-4 pb-3 flex flex-col gap-2.5">
        <div className="flex gap-2">
          {/* Search */}
          <div className="flex-1 flex items-center gap-2 bg-slate-100 rounded-xl px-3 h-10">
            <Search size={15} className="text-slate-400 flex-shrink-0" />
            <input
              value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search ingredients, SKU…"
              className="bg-transparent text-[14px] text-slate-800 outline-none flex-1 placeholder:text-slate-400"
            />
          </div>
          {/* Sort */}
          <div className="relative">
            <button
              onClick={() => setShowSort(!showSort)}
              className={`w-10 h-10 flex items-center justify-center rounded-xl active:bg-slate-200 transition-colors
                ${showSort ? 'bg-emerald-100' : 'bg-slate-100'}`}
            >
              <ArrowUpDown size={16} className={showSort ? 'text-emerald-600' : 'text-slate-600'} />
            </button>
            {showSort && (
              <div className="absolute right-0 top-12 z-10 bg-white rounded-2xl shadow-xl border border-slate-100 py-1 min-w-[140px]">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    onClick={() => { setSort(opt); setShowSort(false) }}
                    className={`w-full text-left px-4 py-2.5 text-[13px] font-medium transition-colors
                      ${sort === opt ? 'text-emerald-600 font-semibold bg-emerald-50' : 'text-slate-700 active:bg-slate-50'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Filter */}
          <button className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-xl active:bg-slate-200">
            <Filter size={16} className="text-slate-600" />
          </button>
        </div>
        <ChipRow options={CATEGORIES}     value={category}     onChange={setCategory} />
        <ChipRow options={STATUS_FILTERS} value={statusFilter} onChange={setStatusFilter} />
      </div>

      {/* ── Summary bar ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 bg-white border-b border-slate-100">
        <div className="flex items-center gap-3">
          <p className="text-[12px] text-slate-500">
            <span className="font-semibold text-slate-800">{filtered.length}</span> items
          </p>
          {alertCount > 0 && (
            <div className="flex items-center gap-1">
              <AlertTriangle size={11} className="text-amber-500" />
              <p className="text-[12px] text-amber-700 font-medium">{alertCount} need attention</p>
            </div>
          )}
        </div>
        <p className="text-[12px] text-slate-500">
          Value{' '}
          <span className="font-mono font-semibold text-slate-700">€{totalValue.toFixed(0)}</span>
        </p>
      </div>

      {/* ── List ── */}
      <div className="flex-1 overflow-y-auto scrollbar-hidden">
        <div className="px-4 py-3 flex flex-col gap-3">
          {filtered.map(item => {
            const variance    = item.physicalStock - item.theoreticalStock
            const variancePct = (variance / item.theoreticalStock) * 100
            const { label, variant } = STATUS_BADGE[item.status]
            const needsReview = Math.abs(variancePct) > 5
            const nearExpiry  = item.batches.some(b => b.daysRemaining <= 7)
            const minDays     = nearExpiry ? Math.min(...item.batches.map(b => b.daysRemaining)) : 99

            return (
              <Card
                key={item.id}
                onClick={() => navigate('inventory-detail', { itemId: item.id })}
                className="overflow-hidden"
                noPad
              >
                {/* Left urgency stripe */}
                <div className="flex">
                  <div className={`w-1 flex-shrink-0
                    ${item.status === 'critical' ? 'bg-red-500'
                      : item.status === 'low'  ? 'bg-amber-400'
                      : nearExpiry             ? 'bg-orange-400'
                      : 'bg-transparent'}`}
                  />

                  <div className="flex-1 p-4">
                    {/* Row 1: name + SKU + badge */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-[15px] font-bold text-slate-900 truncate">{item.name}</h3>
                          {nearExpiry && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full">
                              <Clock size={9} /> {minDays}d
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{item.sku} · {item.category}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <Badge variant={variant}>{label}</Badge>
                        {needsReview && <Badge variant="orange">Needs Review</Badge>}
                      </div>
                    </div>

                    {/* Row 2: Physical | Theoretical | Variance — the core comparison */}
                    <div className="grid grid-cols-3 gap-2">
                      {/* Physical (Is) — green = actual reality */}
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-2.5 py-2.5">
                        <div className="flex items-center gap-1 mb-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                          <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wide leading-none">Is</p>
                        </div>
                        <p className="text-[18px] font-bold font-mono text-emerald-700 leading-none">{item.physicalStock}</p>
                        <p className="text-[10px] text-emerald-500 mt-0.5 font-medium">{item.unit}</p>
                      </div>

                      {/* Theoretical (Should) — slate = expected */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2.5">
                        <div className="flex items-center gap-1 mb-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide leading-none">Should</p>
                        </div>
                        <p className="text-[18px] font-bold font-mono text-slate-500 leading-none">{item.theoreticalStock}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{item.unit}</p>
                      </div>

                      {/* Variance */}
                      <div className={`rounded-xl px-2.5 py-2.5 border
                        ${Math.abs(variancePct) > 10 ? 'bg-red-50 border-red-100'
                          : Math.abs(variancePct) > 5 ? 'bg-amber-50 border-amber-100'
                          : variance !== 0 ? 'bg-amber-50/50 border-slate-100'
                          : 'bg-slate-50 border-slate-100'}`}
                      >
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide leading-none mb-1">Diff</p>
                        <p className={`text-[18px] font-bold font-mono leading-none
                          ${variance < 0 ? 'text-red-600' : variance > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {variance === 0 ? '—' : `${variance > 0 ? '+' : ''}${variance.toFixed(1)}`}
                        </p>
                        <div className="mt-0.5">
                          <VariancePill value={variance} pct={variancePct} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center">
                <Package size={28} className="text-slate-400" />
              </div>
              <div>
                <p className="text-[15px] font-semibold text-slate-700">No items found</p>
                <p className="text-[13px] text-slate-400 mt-1">Try adjusting filters or search terms</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Inventory Detail ─────────────────────────────────────────────────────────

export function InventoryDetailScreen() {
  const { params, navigate, role } = useApp()
  const [range, setRange]     = useState('7D')
  const item = inventoryItems.find(i => i.id === (params.itemId as string)) ?? inventoryItems[0]

  const variance    = item.physicalStock - item.theoreticalStock
  const variancePct = (variance / item.theoreticalStock) * 100
  const recommended = item.targetStock - item.physicalStock + item.safetyStock

  const TX_ICON: Record<string, { icon: typeof CheckCircle; bg: string; cls: string; label: string }> = {
    pos_deduction: { icon: TrendingDown, bg: 'bg-blue-50',    cls: 'text-blue-500',    label: 'POS Deduction' },
    manual_count:  { icon: CheckCircle,  bg: 'bg-emerald-50', cls: 'text-emerald-500', label: 'Manual Count'  },
    goods_receipt: { icon: Plus,         bg: 'bg-violet-50',  cls: 'text-violet-500',  label: 'Goods Receipt' },
    adjustment:    { icon: Pencil,       bg: 'bg-amber-50',   cls: 'text-amber-500',   label: 'Adjustment'    },
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <TopBar
        title={item.name}
        subtitle={`${item.sku} · ${item.category}`}
        right={role === 'admin' ? (
          <button className="w-9 h-9 rounded-full flex items-center justify-center active:bg-slate-100">
            <Pencil size={17} className="text-slate-600" />
          </button>
        ) : undefined}
      />

      <div className="flex-1 overflow-y-auto scrollbar-hidden">
        <div className="px-4 py-4 flex flex-col gap-4">

          {/* ── Should vs Is comparison ── */}
          <Card className="p-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.08em] mb-3">Stock Comparison</p>

            {/* Big two-column comparison */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide">Physical / Is</p>
                </div>
                <p className="text-[32px] font-bold font-mono text-emerald-700 leading-none">{item.physicalStock}</p>
                <p className="text-[13px] text-emerald-500 mt-1.5 font-medium">{item.unit} on hand</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-2 h-2 rounded-full bg-slate-400" />
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Theory / Should</p>
                </div>
                <p className="text-[32px] font-bold font-mono text-slate-500 leading-none">{item.theoreticalStock}</p>
                <p className="text-[13px] text-slate-400 mt-1.5 font-medium">{item.unit} expected</p>
              </div>
            </div>

            {/* Variance row */}
            <div className={`flex items-center justify-between rounded-2xl px-4 py-3 border mb-3
              ${variance < 0 ? 'bg-red-50 border-red-100' : variance > 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
              <div>
                <p className="text-[11px] font-semibold text-slate-500">Variance (Is − Should)</p>
                <p className={`text-[24px] font-bold font-mono leading-tight mt-0.5
                  ${variance < 0 ? 'text-red-700' : variance > 0 ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {variance > 0 ? '+' : ''}{variance.toFixed(1)} {item.unit}
                </p>
              </div>
              <VariancePill value={variance} pct={variancePct} />
            </div>

            {/* Target / Safety / Rec. Order */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Target',     val: `${item.targetStock}`,    unit: item.unit, dim: false },
                { label: 'Safety',     val: `${item.safetyStock}`,    unit: item.unit, dim: true  },
                { label: 'Rec. Order', val: `${recommended.toFixed(1)}`, unit: item.unit, dim: false, highlight: true },
              ].map(m => (
                <div
                  key={m.label}
                  className={`rounded-xl p-2.5 text-center
                    ${m.highlight && recommended > 0 ? 'bg-blue-50 border border-blue-100' : 'bg-slate-50 border border-slate-100'}`}
                >
                  <p className="text-[10px] text-slate-400 font-semibold leading-tight mb-1">{m.label}</p>
                  <p className={`text-[14px] font-bold font-mono
                    ${m.highlight && recommended > 0 ? 'text-blue-700' : m.dim ? 'text-slate-400' : 'text-slate-700'}`}>
                    {m.val}
                  </p>
                  <p className="text-[10px] text-slate-400">{m.unit}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* ── Active Count Progress (schedule card) ── */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.08em]">Count Schedule</p>
              <Badge variant="amber">In Progress</Badge>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-[14px] font-bold text-slate-900">Daily Stock Count</p>
                  <p className="text-[12px] text-slate-500 mt-0.5">Today, 10 March 2026</p>
                </div>
                <div className="text-right">
                  <p className="text-[20px] font-bold font-mono text-amber-700 leading-none">42</p>
                  <p className="text-[11px] text-amber-600">of 68</p>
                </div>
              </div>
              <ProgressBar value={42} max={68} variant="green" height={6} />
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-[11px] text-slate-500">26 items remaining</p>
                <p className="text-[11px] font-semibold text-emerald-600">62%</p>
              </div>
            </div>

            <button
              onClick={() => navigate('active-count')}
              className="w-full py-3 bg-emerald-600 rounded-xl text-[14px] font-semibold text-white
                flex items-center justify-center gap-2 shadow-sm active:bg-emerald-700 transition-colors"
            >
              <Play size={15} className="fill-white" />
              Continue Count
            </button>

            {/* Other schedules */}
            <div className="mt-3 flex flex-col gap-1">
              {[
                { label: 'Weekly Count',      due: 'Due 14 Mar', status: 'scheduled' },
                { label: 'Monthly Inventory', due: 'Due 31 Mar', status: 'scheduled' },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between py-2 border-t border-slate-50">
                  <p className="text-[13px] text-slate-600">{s.label}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] text-slate-400">{s.due}</p>
                    <Badge variant="gray">Scheduled</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* ── Trend Chart ── */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.08em]">Stock Trend</p>
              <SegmentedControl options={['7D', '30D', '3M']} value={range} onChange={setRange} />
            </div>
            <LineChart physical={stockTrend.physical} theoretical={stockTrend.theoretical} labels={stockTrend.labels} width={310} />
            <div className="flex items-center gap-5 mt-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-emerald-500 rounded-full" />
                <span className="text-[11px] text-slate-500">Physical (Is)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 rounded" style={{ height: 2, background: 'repeating-linear-gradient(90deg,#94a3b8 0,#94a3b8 3px,transparent 3px,transparent 6px)' }} />
                <span className="text-[11px] text-slate-500">Theoretical (Should)</span>
              </div>
            </div>
          </Card>

          {/* ── Batches ── */}
          <Card className="p-4">
            <SectionHeader title="Batches & Expiration" />
            {item.batches.map(b => {
              const urgent = b.daysRemaining <= 3
              const soon   = b.daysRemaining <= 7
              return (
                <div key={b.id} className={`py-3 border-b border-slate-50 last:border-0`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-[14px] font-semibold text-slate-800">Batch #{b.id}</p>
                      <p className="text-[12px] text-slate-500">{b.quantity} {item.unit} · BBD {b.expiryDate}</p>
                    </div>
                    <Badge variant={urgent ? 'red' : soon ? 'amber' : 'green'}>
                      {b.daysRemaining === 1 ? 'Tomorrow' : `${b.daysRemaining}d left`}
                    </Badge>
                  </div>
                  {/* BBD progress bar — days remaining vs 30 day window */}
                  <div className="flex items-center gap-2">
                    <ProgressBar
                      value={Math.max(0, 30 - b.daysRemaining)}
                      max={30}
                      variant={urgent ? 'red' : soon ? 'amber' : 'green'}
                      height={4}
                    />
                    <span className="text-[10px] text-slate-400 flex-shrink-0">{b.daysRemaining}d</span>
                  </div>
                </div>
              )
            })}
          </Card>

          {/* ── Transactions ── */}
          <Card className="p-4">
            <SectionHeader title="Recent Transactions" action="View History" />
            {item.transactions.slice(0, 4).map(tx => {
              const s = TX_ICON[tx.type]
              const Icon = s.icon
              return (
                <div key={tx.id} className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${s.bg}`}>
                    <Icon size={14} className={s.cls} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-slate-700">{s.label}</p>
                    <p className="text-[11px] text-slate-400 truncate">{tx.user} · {tx.date}</p>
                  </div>
                  <span className={`font-mono text-[13px] font-semibold flex-shrink-0
                    ${tx.delta < 0 ? 'text-red-600' : tx.delta > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {tx.delta === 0 ? '—' : `${tx.delta > 0 ? '+' : ''}${tx.delta} ${item.unit}`}
                  </span>
                </div>
              )
            })}
          </Card>

          {/* ── Actions ── */}
          <div className="grid grid-cols-3 gap-2.5 pb-4">
            <button
              onClick={() => navigate('active-count')}
              className="flex flex-col items-center gap-2 py-4 rounded-2xl text-[12px] font-semibold bg-emerald-600 text-white shadow-sm active:bg-emerald-700 transition-colors"
            >
              <CheckCircle size={18} />Count Item
            </button>
            {role === 'admin' && (
              <button className="flex flex-col items-center gap-2 py-4 rounded-2xl text-[12px] font-semibold bg-white border border-slate-200 text-slate-700 active:bg-slate-50 transition-colors">
                <Pencil size={18} />Adjust Stock
              </button>
            )}
            {(role === 'admin' || role === 'manager') && (item.status === 'low' || item.status === 'critical') ? (
              <button
                onClick={() => navigate('poq')}
                className="flex flex-col items-center gap-2 py-4 rounded-2xl text-[12px] font-semibold bg-amber-50 border border-amber-200 text-amber-700 active:bg-amber-100 transition-colors"
              >
                <ShoppingCart size={18} />Reorder
              </button>
            ) : (
              <button className="flex flex-col items-center gap-2 py-4 rounded-2xl text-[12px] font-semibold bg-white border border-slate-200 text-slate-700 active:bg-slate-50 transition-colors">
                <History size={18} />History
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
