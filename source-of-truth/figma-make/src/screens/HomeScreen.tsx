import { useState } from 'react'
import {
  Bell, ChevronDown, AlertTriangle, ScanLine, PackageOpen,
  ShoppingCart, ClipboardList, CheckCircle, ChevronRight,
  TrendingUp, TrendingDown, Minus, X, Store, Calendar,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Card, KpiCard, Badge, SectionHeader, DonutChart, Sparkline, ProgressBar } from '../components/ui'
import type { Screen } from '../types'

// ─── Types ────────────────────────────────────────────────────────────────────

type Urgency = 'critical' | 'warning'

interface Task {
  icon: typeof ClipboardList
  label: string
  sub: string
  color: string
  bg: string
  done?: number
  total?: number
  badge?: string
  badgeVariant?: 'red' | 'amber' | 'blue' | 'green'
  screen: Screen
}

interface ExpiryItem {
  name: string
  qty: string
  exp: string
  days: number
  urgency: Urgency
  value: string
}

interface ActivityItem {
  icon: typeof ScanLine
  label: string
  sub: string
  time: string
  dotColor: string
}

// ─── Static data ──────────────────────────────────────────────────────────────

const STOCK_HEALTH = [
  { label: 'Healthy',   count: 52, pct: 52, color: '#059669', bg: 'bg-emerald-500' },
  { label: 'Low Stock', count: 28, pct: 28, color: '#f59e0b', bg: 'bg-amber-400'   },
  { label: 'Critical',  count: 12, pct: 12, color: '#ef4444', bg: 'bg-red-500'     },
  { label: 'Overstock', count:  8, pct:  8, color: '#3b82f6', bg: 'bg-blue-500'    },
]

const EXPIRY_ITEMS: ExpiryItem[] = [
  { name: 'Fresh Salmon',    qty: '4.2 kg', exp: 'Expires tomorrow',  days: 1, urgency: 'critical', value: '€68.04'  },
  { name: 'Romaine Lettuce', qty: '3.1 kg', exp: 'Expires in 2 days', days: 2, urgency: 'critical', value: '€6.82'   },
  { name: 'Whole Milk',      qty: '8 L',    exp: 'Expires in 3 days', days: 3, urgency: 'warning',  value: '€8.80'   },
  { name: 'Ground Beef',     qty: '18 kg',  exp: 'Expires in 3 days', days: 3, urgency: 'warning',  value: '€111.60' },
]

const ACTIVITY_ITEMS: ActivityItem[] = [
  { icon: ScanLine,      label: 'POS scan completed',   sub: 'Report #2048 · 24 items · 94% conf.',  time: '2h ago',  dotColor: 'bg-blue-500'   },
  { icon: PackageOpen,   label: 'Goods received',        sub: 'Metro Foods GmbH · GR-20481',          time: '08 Mar',  dotColor: 'bg-emerald-500' },
  { icon: ClipboardList, label: 'Stock count completed', sub: 'Daily Count · 68 items counted',       time: '08 Mar',  dotColor: 'bg-violet-500'  },
  { icon: ShoppingCart,  label: 'Purchase order sent',   sub: 'Metro Foods GmbH · PO-4821 · €248.40', time: '06 Mar',  dotColor: 'bg-amber-500'   },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

// Trend indicator beside KPI values
function Trend({ dir, label }: { dir: 'up' | 'down' | 'flat'; label: string }) {
  const cfg = {
    up:   { Icon: TrendingUp,   cls: 'text-emerald-600 bg-emerald-50' },
    down: { Icon: TrendingDown, cls: 'text-red-600     bg-red-50'     },
    flat: { Icon: Minus,        cls: 'text-slate-500   bg-slate-100'  },
  }[dir]
  const Icon = cfg.Icon
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${cfg.cls}`}>
      <Icon size={10} strokeWidth={2.5} /> {label}
    </span>
  )
}

// Horizontal segmented stock-health bar
function StockBar() {
  const total = STOCK_HEALTH.reduce((s, h) => s + h.pct, 0)
  return (
    <div className="flex rounded-full overflow-hidden h-3 gap-0.5">
      {STOCK_HEALTH.map(h => (
        <div
          key={h.label}
          className={`${h.bg} transition-all`}
          style={{ width: `${(h.pct / total) * 100}%` }}
        />
      ))}
    </div>
  )
}

// Platform-aware store header ─ iOS compact / Android Material
function DashboardHeader({ ios, onNotif }: { ios: boolean; onNotif: () => void }) {
  if (ios) {
    return (
      <div className="flex-shrink-0 bg-white border-b border-slate-100">
        {/* iOS: store selector row */}
        <div className="flex items-center justify-between px-4 py-2.5">
          {/* Store selector */}
          <button className="flex flex-col items-start gap-0.5 active:opacity-60 transition-opacity">
            <span className="text-[11px] text-slate-400 font-medium leading-none">Current store</span>
            <span className="flex items-center gap-1 text-[17px] font-bold text-slate-900 leading-none">
              Bella Cucina
              <ChevronDown size={14} className="text-emerald-500 mt-px" strokeWidth={2.5} />
            </span>
          </button>

          {/* Right controls */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 mr-1">
              <Calendar size={12} className="text-slate-400" />
              <span className="text-[12px] text-slate-500 font-medium">10 Mar</span>
            </div>
            <button
              onClick={onNotif}
              className="relative w-9 h-9 rounded-full flex items-center justify-center active:bg-slate-100"
            >
              <Bell size={20} className="text-slate-700" strokeWidth={1.8} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
            </button>
            <button className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center shadow-sm">
              <span className="text-white text-[12px] font-bold">AS</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Android: Material top app bar — two rows
  return (
    <div className="flex-shrink-0 bg-white border-b border-slate-100">
      {/* Row 1: store + actions */}
      <div className="flex items-center justify-between px-3 pt-2 pb-1" style={{ minHeight: 56 }}>
        <button className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl active:bg-slate-100 transition-colors">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <Store size={16} className="text-emerald-700" />
          </div>
          <div className="text-left">
            <p className="text-[11px] text-slate-400 leading-none">Current store</p>
            <div className="flex items-center gap-1">
              <p className="text-[15px] font-semibold text-slate-900 leading-tight">Bella Cucina</p>
              <ChevronDown size={13} className="text-slate-400" />
            </div>
          </div>
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={onNotif}
            className="relative w-10 h-10 rounded-full flex items-center justify-center active:bg-slate-100"
          >
            <Bell size={22} className="text-slate-700" strokeWidth={1.8} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
          </button>
          <button className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center">
            <span className="text-white text-[12px] font-bold">AS</span>
          </button>
        </div>
      </div>

      {/* Row 2: headline + date for Material medium top app bar feel */}
      <div className="flex items-center justify-between px-4 pb-3">
        <h1 className="text-[22px] font-semibold text-slate-900 leading-tight">Dashboard</h1>
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5">
          <Calendar size={12} className="text-slate-400" />
          <span className="text-[12px] text-slate-500 font-medium">10 Mar 2026</span>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function HomeScreen() {
  const { navigate, platform, role } = useApp()
  const ios = platform === 'ios'
  const isAdmin = role === 'admin'
  const isStaff = role === 'staff'
  const [alertDismissed, setAlertDismissed] = useState(false)

  // KPIs — admin sees all 5; staff sees only operational ones
  const kpiGrid = isStaff ? [
    { label: 'Near Expiry',     value: '7',    sub: '2 expire tomorrow',    variant: 'red'   as const, trend: { dir: 'up'   as const, label: '+2 vs yesterday' } },
    { label: 'Low Stock',       value: '12',   sub: '4 critical',           variant: 'amber' as const, trend: { dir: 'flat' as const, label: 'Unchanged'       } },
  ] : [
    { label: 'Inventory Value', value: '€18,420', sub: '+€380 vs last week', variant: 'gray'  as const, trend: { dir: 'up'   as const, label: '+2.1%'           } },
    { label: 'Low Stock',       value: '12',      sub: '4 critical',         variant: 'amber' as const, trend: { dir: 'flat' as const, label: 'Unchanged'       } },
    { label: 'Near Expiry',     value: '7',       sub: '2 expire tomorrow',  variant: 'red'   as const, trend: { dir: 'up'   as const, label: '+2 items'        } },
    { label: 'Variance',        value: '−2.8%',   sub: 'This period',        variant: 'orange'as const, trend: { dir: 'down' as const, label: '−0.3% vs last'  } },
  ]

  const tasks: Task[] = [
    {
      icon: ClipboardList, label: 'Daily Stock Count',
      sub: 'In progress',
      color: 'text-amber-600', bg: 'bg-amber-100',
      done: 42, total: 68,
      badge: '26 remaining', badgeVariant: 'amber',
      screen: 'stock-count',
    },
    {
      icon: ScanLine, label: 'Review POS Scans',
      sub: 'Awaiting confirmation',
      color: 'text-blue-600', bg: 'bg-blue-100',
      badge: '3 waiting', badgeVariant: 'blue',
      screen: 'ocr-review',
    },
    {
      icon: AlertTriangle, label: 'Expiration Alerts',
      sub: '2 expire tomorrow',
      color: 'text-red-600', bg: 'bg-red-100',
      badge: '7 products', badgeVariant: 'red',
      screen: 'expiration',
    },
    ...(isAdmin || role === 'manager' ? [{
      icon: ShoppingCart, label: 'POQ Recommendations',
      sub: 'Review reorder quantities',
      color: 'text-emerald-600', bg: 'bg-emerald-100',
      badge: '4 items', badgeVariant: 'green' as const,
      screen: 'poq' as Screen,
    }] : []),
  ]

  const quickActions: { icon: typeof ClipboardList; label: string; iconColor: string; bg: string; screen: Screen }[] = [
    { icon: ClipboardList, label: 'Start Stock Count', iconColor: 'text-emerald-700', bg: 'bg-emerald-100', screen: 'active-count' },
    { icon: ScanLine,      label: 'Scan POS Report',   iconColor: 'text-blue-700',    bg: 'bg-blue-100',    screen: 'scan'         },
    { icon: PackageOpen,   label: 'Receive Goods',     iconColor: 'text-violet-700',  bg: 'bg-violet-100',  screen: 'new-receipt'  },
    ...(isAdmin || role === 'manager' ? [
      { icon: ShoppingCart, label: 'Create PO',         iconColor: 'text-amber-700',   bg: 'bg-amber-100',   screen: 'poq' as Screen },
    ] : []),
  ]

  const criticalCount = EXPIRY_ITEMS.filter(e => e.urgency === 'critical').length
  const totalValueAtRisk = EXPIRY_ITEMS.reduce((s, e) => s + parseFloat(e.value.replace('€', '').replace(',', '.')), 0)

  return (
    <div className="flex flex-col h-full bg-slate-50">

      {/* ── Platform-aware header ── */}
      <DashboardHeader ios={ios} onNotif={() => navigate('notifications')} />

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto scrollbar-hidden">
        <div className="flex flex-col gap-0">

          {/* ── Urgent alert banner ── */}
          {!alertDismissed && criticalCount > 0 && (
            <div className="mx-4 mt-4 flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
              <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-red-800">
                  {criticalCount} items expire within 24 hours
                </p>
                <p className="text-[12px] text-red-600 mt-0.5">
                  Fresh Salmon · Romaine Lettuce · €74.86 at risk
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => navigate('expiration')}
                  className="text-[12px] font-semibold text-red-600"
                >
                  View
                </button>
                <button onClick={() => setAlertDismissed(true)} className="text-red-300 active:text-red-500">
                  <X size={15} />
                </button>
              </div>
            </div>
          )}

          {/* ── KPI section ── */}
          <div className="px-4 pt-4 pb-0">
            <SectionHeader title="Overview" action={isAdmin ? 'Details' : undefined} onAction={() => navigate('inventory')} />
            <div className="grid grid-cols-2 gap-3">
              {kpiGrid.map(k => (
                <Card key={k.label} className="p-4">
                  <p className="text-[11px] text-slate-500 font-semibold leading-tight mb-2">{k.label}</p>
                  <p className={`text-[26px] font-bold font-mono leading-none mb-2
                    ${{ red: 'text-red-600', amber: 'text-amber-600', orange: 'text-orange-600', blue: 'text-blue-600', gray: 'text-slate-900', purple: 'text-violet-600', green: 'text-emerald-600' }[k.variant] ?? 'text-slate-900'}`}
                  >
                    {k.value}
                  </p>
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-[11px] text-slate-400 leading-tight">{k.sub}</p>
                    <Trend dir={k.trend.dir} label={k.trend.label} />
                  </div>
                </Card>
              ))}
            </div>

            {/* Pending orders — admin/manager only, full-width */}
            {!isStaff && (
              <div className="mt-3">
                <button
                  onClick={() => navigate('orders')}
                  className="w-full bg-white border border-slate-100 shadow-sm rounded-2xl px-4 py-3.5 flex items-center gap-3 active:bg-slate-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <ShoppingCart size={18} className="text-blue-700" strokeWidth={2} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-[13px] font-semibold text-slate-800">Pending Purchase Orders</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">€485.00 total outstanding</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-[13px] font-bold flex items-center justify-center">3</span>
                    <ChevronRight size={15} className="text-slate-300" />
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* ── Today's Tasks ── */}
          <div className="px-4 pt-5">
            <SectionHeader title="Today's Tasks" action="View all" />
            <div className="flex flex-col gap-2.5">
              {tasks.map(t => {
                const Icon = t.icon
                const hasProgress = t.done != null && t.total != null
                return (
                  <Card
                    key={t.label}
                    onClick={() => navigate(t.screen)}
                    className="px-4 py-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${t.bg}`}>
                        <Icon size={18} className={t.color} strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className="text-[14px] font-semibold text-slate-900 leading-tight">{t.label}</p>
                          {t.badge && (
                            <Badge variant={t.badgeVariant ?? 'gray'} className="flex-shrink-0">
                              {t.badge}
                            </Badge>
                          )}
                        </div>

                        {hasProgress ? (
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <p className="text-[12px] text-slate-500">{t.sub}</p>
                              <p className="text-[11px] font-semibold font-mono text-slate-600">
                                {t.done} / {t.total}
                              </p>
                            </div>
                            <ProgressBar
                              value={t.done!}
                              max={t.total!}
                              variant="green"
                              height={5}
                            />
                          </div>
                        ) : (
                          <p className="text-[12px] text-slate-500">{t.sub}</p>
                        )}
                      </div>
                      <ChevronRight size={15} className="text-slate-300 flex-shrink-0 ml-1" />
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* ── Quick Actions ── */}
          <div className="px-4 pt-5">
            <SectionHeader title="Quick Actions" />
            <div className={`grid gap-3 ${quickActions.length === 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {quickActions.map(a => {
                const Icon = a.icon
                return (
                  <button
                    key={a.label}
                    onClick={() => navigate(a.screen)}
                    className="flex flex-col items-center gap-2.5 p-4 bg-white rounded-2xl border border-slate-100
                      shadow-sm active:scale-[0.97] transition-all text-center"
                  >
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${a.bg}`}>
                      <Icon size={20} className={a.iconColor} strokeWidth={2} />
                    </div>
                    <span className="text-[12px] font-semibold text-slate-700 leading-tight">{a.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Stock Health ── */}
          <div className="px-4 pt-5">
            <SectionHeader title="Stock Health" action="View all" onAction={() => navigate('inventory')} />
            <Card className="p-4">
              {/* Donut + legend side by side */}
              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-shrink-0">
                  <DonutChart segments={STOCK_HEALTH.map(h => ({ label: h.label, value: h.count, color: h.color }))} size={80} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[17px] font-bold text-slate-900 leading-none">100</span>
                    <span className="text-[9px] text-slate-400 font-medium">items</span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col gap-2">
                  {STOCK_HEALTH.map(s => (
                    <div key={s.label} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: s.color }} />
                      <span className="text-[12px] text-slate-600 flex-1">{s.label}</span>
                      <span className="text-[12px] font-mono font-semibold text-slate-800">{s.count}</span>
                      <span className="text-[11px] text-slate-400 w-8 text-right">{s.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Horizontal segmented bar */}
              <StockBar />

              {/* Inventory value sparkline */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] text-slate-400 font-medium">Inventory value — 7 day trend</p>
                  <div className="flex items-center gap-1">
                    <TrendingUp size={11} className="text-emerald-500" />
                    <span className="text-[11px] text-emerald-600 font-semibold">+2.1%</span>
                  </div>
                </div>
                <Sparkline
                  data={[18200, 17900, 18100, 17800, 18250, 18350, 18420]}
                  width={296} height={40}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-slate-400">4 Mar</span>
                  <span className="text-[10px] text-slate-400">10 Mar</span>
                </div>
              </div>
            </Card>
          </div>

          {/* ── Expiration Alerts ── */}
          <div className="px-4 pt-5">
            <SectionHeader title="Expiration Alerts" action="View all" onAction={() => navigate('expiration')} />

            {/* Value-at-risk summary */}
            <div className="flex items-center gap-2 mb-3 px-1">
              <AlertTriangle size={12} className="text-red-500 flex-shrink-0" />
              <p className="text-[12px] text-red-600 font-medium">
                €{totalValueAtRisk.toFixed(2)} at risk across {EXPIRY_ITEMS.length} products
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {EXPIRY_ITEMS.map(e => (
                <Card
                  key={e.name}
                  onClick={() => navigate('expiration')}
                  className="flex overflow-hidden"
                  noPad
                >
                  {/* Urgency stripe */}
                  <div className={`w-1 flex-shrink-0 ${e.urgency === 'critical' ? 'bg-red-500' : 'bg-amber-400'}`} />

                  <div className="flex-1 flex items-center gap-3 px-3.5 py-3">
                    {/* Days pill */}
                    <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center flex-shrink-0 border
                      ${e.urgency === 'critical' ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}
                    >
                      <span className={`text-[17px] font-bold font-mono leading-none
                        ${e.urgency === 'critical' ? 'text-red-600' : 'text-amber-600'}`}>
                        {e.days}
                      </span>
                      <span className={`text-[9px] font-semibold
                        ${e.urgency === 'critical' ? 'text-red-400' : 'text-amber-400'}`}>
                        {e.days === 1 ? 'day' : 'days'}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-slate-900 leading-tight">{e.name}</p>
                      <p className="text-[12px] text-slate-500 mt-0.5">{e.qty} · {e.exp}</p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <Badge variant={e.urgency === 'critical' ? 'red' : 'amber'}>
                        {e.urgency === 'critical' ? 'Critical' : 'Warning'}
                      </Badge>
                      <p className="text-[11px] text-slate-400 font-mono mt-1">{e.value}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* ── Recent Activity ── */}
          <div className="px-4 pt-5 pb-6">
            <SectionHeader title="Recent Activity" />
            <Card noPad>
              {ACTIVITY_ITEMS.map((a, i) => {
                const Icon = a.icon
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 last:border-0"
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
                        <Icon size={15} className="text-slate-500" strokeWidth={2} />
                      </div>
                      <div className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${a.dotColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-slate-800 leading-tight">{a.label}</p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{a.sub}</p>
                    </div>
                    <span className="text-[11px] text-slate-400 flex-shrink-0 ml-2">{a.time}</span>
                  </div>
                )
              })}
            </Card>
          </div>

        </div>
      </div>
    </div>
  )
}
