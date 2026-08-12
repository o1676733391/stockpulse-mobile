import { useState } from 'react'
import { Download, Share2, Filter, ChevronDown, Lock, Search, CheckCircle2, FileText, BarChart2, X } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { TopBar } from '../../components/layout/TopBar'
import { Card, Badge, SectionHeader } from '../../components/ui'
import { auditLog } from '../../data/mockData'

// ─── Reports ─────────────────────────────────────────────────────────────────

const REPORT_TYPES = [
  { label: 'Daily Inventory Report',   icon: '📦', freq: 'Daily',     category: 'Inventory', lastGen: 'Today, 06:00'        },
  { label: 'Weekly Inventory Report',  icon: '📊', freq: 'Weekly',    category: 'Inventory', lastGen: '07 Mar 2026'         },
  { label: 'Monthly Inventory Report', icon: '📈', freq: 'Monthly',   category: 'Inventory', lastGen: '01 Mar 2026'         },
  { label: 'Annual Inventory Report',  icon: '🗓️', freq: 'Annual',    category: 'Inventory', lastGen: '01 Jan 2026'         },
  { label: 'Variance Report',          icon: '⚖️', freq: 'On demand', category: 'Variance',  lastGen: '08 Mar 2026'         },
  { label: 'Waste Report',             icon: '♻️', freq: 'On demand', category: 'Waste',     lastGen: '05 Mar 2026'         },
  { label: 'Goods Receipt Report',     icon: '🚚', freq: 'On demand', category: 'Receipts',  lastGen: '10 Mar 2026'         },
  { label: 'Purchase Report',          icon: '🛒', freq: 'On demand', category: 'Purchasing',lastGen: '03 Mar 2026'         },
  { label: 'Audit Report',             icon: '🔒', freq: 'On demand', category: 'Audit',     lastGen: '28 Feb 2026'         },
]

const FILTER_OPTIONS = {
  'Date Range': ['Today', 'Last 7 days', 'Last 30 days', 'Last 3 months', 'Custom'],
  'Store':      ['All Stores', 'Bella Cucina Restaurant'],
  'Category':   ['All Categories', 'Inventory', 'Variance', 'Waste', 'Receipts', 'Purchasing', 'Audit'],
  'Supplier':   ['All Suppliers', 'Metro Foods GmbH', 'FreshProduce GmbH', 'Alpine Dairy Co.'],
}

export function ReportsScreen() {
  const [generating, setGenerating] = useState<string | null>(null)
  const [generated, setGenerated] = useState<Set<string>>(new Set())
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    'Date Range': 'Last 30 days',
    'Store': 'All Stores',
    'Category': 'All Categories',
    'Supplier': 'All Suppliers',
  })

  const generate = (label: string) => {
    setGenerating(label)
    setTimeout(() => {
      setGenerating(null)
      setGenerated(prev => new Set([...prev, label]))
    }, 2000)
  }

  const filteredReports = REPORT_TYPES.filter(r =>
    filterValues['Category'] === 'All Categories' || r.category === filterValues['Category']
  )

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Reports" large />

      {/* Filter row */}
      <div className="flex-shrink-0 bg-white border-b border-slate-100 px-4 pb-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-hidden">
          {Object.keys(FILTER_OPTIONS).map(f => {
            const isDefault = filterValues[f] === Object.values(FILTER_OPTIONS)[Object.keys(FILTER_OPTIONS).indexOf(f)][0]
            return (
              <button key={f} onClick={() => setActiveFilter(activeFilter === f ? null : f)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors
                  ${!isDefault ? 'bg-emerald-600 text-white' : activeFilter === f ? 'bg-slate-200 text-slate-800' : 'bg-slate-100 text-slate-600'}`}>
                {f} {!isDefault && <X size={10} onClick={e => { e.stopPropagation(); setFilterValues(prev => ({ ...prev, [f]: Object.values(FILTER_OPTIONS)[Object.keys(FILTER_OPTIONS).indexOf(f)][0] })) }} />}
                {isDefault && <ChevronDown size={11} />}
              </button>
            )
          })}
        </div>

        {/* Filter dropdown */}
        {activeFilter && (
          <div className="mt-2 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            {FILTER_OPTIONS[activeFilter as keyof typeof FILTER_OPTIONS].map(opt => (
              <button key={opt} onClick={() => { setFilterValues(prev => ({ ...prev, [activeFilter]: opt })); setActiveFilter(null) }}
                className={`w-full text-left px-4 py-2.5 text-sm border-b border-slate-50 last:border-0 flex items-center justify-between
                  ${filterValues[activeFilter] === opt ? 'text-emerald-600 font-semibold bg-emerald-50' : 'text-slate-700'}`}>
                {opt}
                {filterValues[activeFilter] === opt && <CheckCircle2 size={14} className="text-emerald-500" />}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hidden bg-slate-50 p-4 flex flex-col gap-2.5">
        {filteredReports.map(r => {
          const isGenerating = generating === r.label
          const isDone = generated.has(r.label)
          return (
            <Card key={r.label} className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 text-xl">
                  {r.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">{r.label}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="gray">{r.freq}</Badge>
                    <p className="text-xs text-slate-400">Last: {r.lastGen}</p>
                  </div>
                </div>
              </div>

              {isDone && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-xl">
                    <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                    <p className="text-xs font-semibold text-emerald-700">Generated · {filterValues['Date Range']}</p>
                  </div>
                  <button className="p-2 rounded-xl bg-red-50 active:bg-red-100">
                    <FileText size={15} className="text-red-600" />
                  </button>
                  <button className="p-2 rounded-xl bg-emerald-50 active:bg-emerald-100">
                    <BarChart2 size={15} className="text-emerald-600" />
                  </button>
                  <button className="p-2 rounded-xl bg-slate-100">
                    <Share2 size={15} className="text-slate-500" />
                  </button>
                </div>
              )}

              {!isDone && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
                  {isGenerating ? (
                    <div className="flex-1 py-2.5 flex items-center justify-center gap-2 bg-emerald-50 rounded-xl">
                      <div className="w-3 h-3 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                      <span className="text-xs font-semibold text-emerald-600">Generating...</span>
                    </div>
                  ) : (
                    <>
                      <button onClick={() => generate(r.label)}
                        className="flex-1 py-2.5 flex items-center justify-center gap-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold">
                        <Download size={13} /> Generate PDF
                      </button>
                      <button onClick={() => generate(r.label)}
                        className="px-3 py-2.5 bg-slate-100 rounded-xl flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                        <BarChart2 size={13} /> Excel
                      </button>
                      <button className="p-2.5 bg-slate-100 rounded-xl">
                        <Share2 size={14} className="text-slate-500" />
                      </button>
                    </>
                  )}
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// ─── Archive ─────────────────────────────────────────────────────────────────

const ARCHIVE_DATA: Record<string, Array<{ month: string; reports: Array<{ name: string; size: string }> }>> = {
  '2026': [
    { month: 'March',    reports: [
      { name: 'Monthly Inventory Report', size: '2.4 MB' },
      { name: 'Variance Report',          size: '840 KB' },
      { name: 'Waste Report',             size: '512 KB' },
      { name: 'Goods Receipt Report',     size: '1.1 MB' },
    ]},
    { month: 'February', reports: [
      { name: 'Monthly Inventory Report', size: '2.2 MB' },
      { name: 'Variance Report',          size: '720 KB' },
      { name: 'Purchase Report',          size: '980 KB' },
    ]},
    { month: 'January',  reports: [
      { name: 'Monthly Inventory Report', size: '2.1 MB' },
      { name: 'Annual Inventory Report',  size: '8.4 MB' },
      { name: 'Variance Report',          size: '690 KB' },
      { name: 'Audit Report',             size: '1.8 MB' },
    ]},
  ],
  '2025': [
    { month: 'December', reports: [
      { name: 'Monthly Inventory Report', size: '2.3 MB' },
      { name: 'Annual Inventory Report',  size: '7.9 MB' },
      { name: 'Audit Report',             size: '1.6 MB' },
    ]},
    { month: 'November', reports: [
      { name: 'Monthly Inventory Report', size: '2.0 MB' },
      { name: 'Variance Report',          size: '680 KB' },
    ]},
    { month: 'October',  reports: [
      { name: 'Monthly Inventory Report', size: '1.9 MB' },
      { name: 'Waste Report',             size: '490 KB' },
    ]},
    { month: 'September', reports: [
      { name: 'Monthly Inventory Report', size: '2.1 MB' },
      { name: 'Variance Report',          size: '710 KB' },
    ]},
  ],
}

const ARCHIVE_FILTER_YEARS = ['All Years', '2026', '2025']
const ARCHIVE_FILTER_TYPES = ['All Types', 'Monthly Inventory Report', 'Variance Report', 'Waste Report', 'Annual Inventory Report', 'Audit Report', 'Purchase Report']

export function ArchiveScreen() {
  const [openYear, setOpenYear] = useState<string | null>('2026')
  const [search, setSearch] = useState('')
  const [yearFilter, setYearFilter] = useState('All Years')
  const [typeFilter, setTypeFilter] = useState('All Types')
  const [showYearPicker, setShowYearPicker] = useState(false)
  const [showTypePicker, setShowTypePicker] = useState(false)

  const totalReports = Object.values(ARCHIVE_DATA).flatMap(months => months.flatMap(m => m.reports)).length

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Archive" large subtitle={`${totalReports} reports stored`} />

      <div className="flex-shrink-0 bg-white border-b border-slate-100 px-4 pb-3 flex flex-col gap-2">
        <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2.5">
          <Search size={16} className="text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search reports..." className="bg-transparent text-sm outline-none flex-1 placeholder:text-slate-400" />
          {search && <button onClick={() => setSearch('')}><X size={14} className="text-slate-400" /></button>}
        </div>

        {/* Filter chips */}
        <div className="flex gap-2">
          <button onClick={() => { setShowYearPicker(!showYearPicker); setShowTypePicker(false) }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors
              ${yearFilter !== 'All Years' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            Year: {yearFilter === 'All Years' ? 'All' : yearFilter} <ChevronDown size={11} />
          </button>
          <button onClick={() => { setShowTypePicker(!showTypePicker); setShowYearPicker(false) }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors
              ${typeFilter !== 'All Types' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            Type: {typeFilter === 'All Types' ? 'All' : typeFilter.split(' ')[0]} <ChevronDown size={11} />
          </button>
        </div>

        {showYearPicker && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            {ARCHIVE_FILTER_YEARS.map(y => (
              <button key={y} onClick={() => { setYearFilter(y); setShowYearPicker(false) }}
                className={`w-full text-left px-4 py-2.5 text-sm border-b border-slate-50 last:border-0 flex items-center justify-between
                  ${yearFilter === y ? 'text-emerald-600 font-semibold bg-emerald-50' : 'text-slate-700'}`}>
                {y} {yearFilter === y && <CheckCircle2 size={14} className="text-emerald-500" />}
              </button>
            ))}
          </div>
        )}
        {showTypePicker && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm max-h-52 overflow-y-auto">
            {ARCHIVE_FILTER_TYPES.map(t => (
              <button key={t} onClick={() => { setTypeFilter(t); setShowTypePicker(false) }}
                className={`w-full text-left px-4 py-2.5 text-sm border-b border-slate-50 last:border-0 flex items-center justify-between
                  ${typeFilter === t ? 'text-emerald-600 font-semibold bg-emerald-50' : 'text-slate-700'}`}>
                {t} {typeFilter === t && <CheckCircle2 size={14} className="text-emerald-500" />}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hidden bg-slate-50 p-4 flex flex-col gap-3">
        {Object.entries(ARCHIVE_DATA)
          .filter(([year]) => yearFilter === 'All Years' || year === yearFilter)
          .map(([year, months]) => {
            const filteredMonths = months.map(m => ({
              ...m,
              reports: m.reports.filter(r => {
                const matchesSearch = !search || r.name.toLowerCase().includes(search.toLowerCase())
                const matchesType = typeFilter === 'All Types' || r.name === typeFilter
                return matchesSearch && matchesType
              })
            })).filter(m => m.reports.length > 0)

            if (filteredMonths.length === 0) return null

            const yearTotal = filteredMonths.reduce((s, m) => s + m.reports.length, 0)
            return (
              <div key={year}>
                <button onClick={() => setOpenYear(openYear === year ? null : year)}
                  className="flex items-center justify-between w-full py-2 px-1 mb-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-800">{year}</h2>
                    <span className="text-xs font-semibold text-slate-400">{yearTotal} reports</span>
                  </div>
                  <ChevronDown size={18} className={`text-slate-400 transition-transform ${openYear === year ? 'rotate-180' : ''}`} />
                </button>

                {openYear === year && (
                  <div className="flex flex-col gap-3">
                    {filteredMonths.map(m => (
                      <Card key={m.month} className="overflow-hidden">
                        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                          <p className="text-sm font-bold text-slate-800">{m.month} {year}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{m.reports.length} reports</p>
                        </div>
                        <div className="px-4">
                          {m.reports.map((r, i) => (
                            <div key={r.name} className={`flex items-center justify-between py-3 ${i < m.reports.length - 1 ? 'border-b border-slate-50' : ''}`}>
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                                  <FileText size={13} className="text-slate-500" />
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-slate-700">{r.name}</p>
                                  <p className="text-xs text-slate-400">{r.size}</p>
                                </div>
                              </div>
                              <div className="flex gap-1.5">
                                <button className="px-2.5 py-1.5 bg-red-50 rounded-lg text-xs font-bold text-red-600">PDF</button>
                                <button className="px-2.5 py-1.5 bg-emerald-50 rounded-lg text-xs font-bold text-emerald-700">Excel</button>
                                <button className="p-1.5 bg-slate-100 rounded-lg">
                                  <Share2 size={12} className="text-slate-500" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
      </div>
    </div>
  )
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

const ACTION_META: Record<string, { color: string; dot: string }> = {
  'Stock Adjustment':        { color: 'bg-amber-50 text-amber-700 border border-amber-100',   dot: 'bg-amber-500' },
  'POS Deduction':           { color: 'bg-blue-50 text-blue-700 border border-blue-100',       dot: 'bg-blue-500'  },
  'Goods Receipt':           { color: 'bg-emerald-50 text-emerald-700 border border-emerald-100', dot: 'bg-emerald-500' },
  'Stock Count Completed':   { color: 'bg-violet-50 text-violet-700 border border-violet-100', dot: 'bg-violet-500' },
  'Recipe Updated':          { color: 'bg-slate-100 text-slate-600',                           dot: 'bg-slate-400' },
  'Purchase Order Created':  { color: 'bg-orange-50 text-orange-700 border border-orange-100', dot: 'bg-orange-500' },
  'User Invited':            { color: 'bg-indigo-50 text-indigo-700 border border-indigo-100', dot: 'bg-indigo-500' },
  'Expiry Alert Triggered':  { color: 'bg-red-50 text-red-700 border border-red-100',          dot: 'bg-red-500' },
}

const AUDIT_FILTER_USERS    = ['All Users', 'Anna Schmidt', 'Marco Bauer', 'Lena Fischer', 'System (OCR)', 'System (Auto)']
const AUDIT_FILTER_ACTIONS  = ['All Actions', 'Stock Adjustment', 'POS Deduction', 'Goods Receipt', 'Stock Count Completed', 'Recipe Updated', 'Purchase Order Created']

export function AuditLogScreen() {
  const [query, setQuery] = useState('')
  const [userFilter, setUserFilter] = useState('All Users')
  const [actionFilter, setActionFilter] = useState('All Actions')
  const [showUserPicker, setShowUserPicker] = useState(false)
  const [showActionPicker, setShowActionPicker] = useState(false)

  const filtered = auditLog.filter(e => {
    const matchesQuery = !query ||
      e.user.toLowerCase().includes(query.toLowerCase()) ||
      e.action.toLowerCase().includes(query.toLowerCase()) ||
      e.item.toLowerCase().includes(query.toLowerCase())
    const matchesUser = userFilter === 'All Users' || e.user === userFilter
    const matchesAction = actionFilter === 'All Actions' || e.action === actionFilter
    return matchesQuery && matchesUser && matchesAction
  })

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Audit Log" large />

      <div className="flex-shrink-0 bg-white border-b border-slate-100 px-4 pb-3 flex flex-col gap-2">
        <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2.5">
          <Search size={16} className="text-slate-400" />
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search user, action or item..." className="bg-transparent text-sm outline-none flex-1 placeholder:text-slate-400" />
          {query && <button onClick={() => setQuery('')}><X size={14} className="text-slate-400" /></button>}
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hidden">
          <button onClick={() => { setShowUserPicker(!showUserPicker); setShowActionPicker(false) }}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors
              ${userFilter !== 'All Users' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            <Filter size={11} /> User {userFilter !== 'All Users' ? `· ${userFilter.split(' ')[0]}` : ''} <ChevronDown size={10} />
          </button>
          <button onClick={() => { setShowActionPicker(!showActionPicker); setShowUserPicker(false) }}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors
              ${actionFilter !== 'All Actions' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            <Filter size={11} /> Action {actionFilter !== 'All Actions' ? `· ${actionFilter.split(' ').slice(0,2).join(' ')}` : ''} <ChevronDown size={10} />
          </button>
          {(userFilter !== 'All Users' || actionFilter !== 'All Actions') && (
            <button onClick={() => { setUserFilter('All Users'); setActionFilter('All Actions') }}
              className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 bg-slate-200 rounded-xl text-xs font-medium text-slate-600">
              <X size={10} /> Clear
            </button>
          )}
        </div>

        {showUserPicker && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            {AUDIT_FILTER_USERS.map(u => (
              <button key={u} onClick={() => { setUserFilter(u); setShowUserPicker(false) }}
                className={`w-full text-left px-4 py-2.5 text-sm border-b border-slate-50 last:border-0 flex items-center justify-between
                  ${userFilter === u ? 'text-emerald-600 font-semibold bg-emerald-50' : 'text-slate-700'}`}>
                {u} {userFilter === u && <CheckCircle2 size={14} className="text-emerald-500" />}
              </button>
            ))}
          </div>
        )}
        {showActionPicker && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            {AUDIT_FILTER_ACTIONS.map(a => (
              <button key={a} onClick={() => { setActionFilter(a); setShowActionPicker(false) }}
                className={`w-full text-left px-4 py-2.5 text-sm border-b border-slate-50 last:border-0 flex items-center justify-between
                  ${actionFilter === a ? 'text-emerald-600 font-semibold bg-emerald-50' : 'text-slate-700'}`}>
                {a} {actionFilter === a && <CheckCircle2 size={14} className="text-emerald-500" />}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hidden bg-slate-50 p-4 flex flex-col gap-2.5">
        {/* Immutable notice */}
        <div className="flex items-center gap-2.5 px-4 py-3 bg-slate-800 rounded-2xl">
          <Lock size={14} className="text-slate-300 flex-shrink-0" />
          <p className="text-xs text-slate-300 font-medium">
            Audit records are immutable, read-only, and cannot be edited or deleted.
          </p>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">No matching audit records</div>
        )}

        {filtered.map((event, idx) => {
          const meta = ACTION_META[event.action] ?? { color: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' }
          const isLast = idx === filtered.length - 1
          return (
            <div key={event.id} className="flex gap-3">
              {/* Timeline spine */}
              <div className="flex flex-col items-center flex-shrink-0 w-5">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-4 ${meta.dot}`} />
                {!isLast && <div className="w-px flex-1 bg-slate-200 mt-1 min-h-[16px]" />}
              </div>

              {/* Entry card */}
              <div className="flex-1 mb-1">
                <Card className="p-3.5 relative">
                  {/* Immutable lock badge */}
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 rounded-md">
                    <Lock size={9} className="text-slate-400" />
                    <span className="text-[10px] text-slate-400 font-medium">Read-only</span>
                  </div>

                  <div className="flex items-start gap-2 pr-16 mb-2">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">{event.user}</p>
                      <p className="text-xs font-mono text-slate-400 mt-0.5">{event.timestamp}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-1 rounded-lg font-semibold ${meta.color}`}>
                      {event.action}
                    </span>
                    <span className="text-xs text-slate-600">→</span>
                    <span className="text-xs font-medium text-slate-700">{event.item}</span>
                    {event.delta !== '—' && (
                      <span className={`text-xs font-mono font-bold ml-auto ${
                        event.delta.startsWith('-') ? 'text-red-600' :
                        event.delta.startsWith('+') ? 'text-emerald-600' : 'text-slate-500'
                      }`}>
                        {event.delta}
                      </span>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
