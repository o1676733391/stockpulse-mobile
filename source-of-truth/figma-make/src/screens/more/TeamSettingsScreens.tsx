import { useState } from 'react'
import { Plus, Check, X, ChevronRight, Bell, Shield, User, Store, Package, Clock, AlertTriangle, TrendingDown, ScanLine, ShoppingCart, ClipboardList } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { TopBar } from '../../components/layout/TopBar'
import { Card, Badge, SectionHeader } from '../../components/ui'
import { team } from '../../data/mockData'

// ─── Shared Toggle ────────────────────────────────────────────────────────────

function Toggle({ on, set }: { on: boolean; set: (v: boolean) => void }) {
  return (
    <button onClick={() => set(!on)}
      className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${on ? 'bg-emerald-500' : 'bg-slate-200'}`}>
      <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
        style={{ left: on ? '22px' : '2px' }} />
    </button>
  )
}

// ─── Team Screen (legacy — replaced by TeamScreens.tsx for RBAC module) ──────

const ROLE_PERMISSIONS: Record<string, { can: string[]; cannot: string[] }> = {
  owner: {
    can: ['Full access to all features', 'Manage team & roles', 'View financial data', 'Edit recipes & BOM', 'Generate all reports'],
    cannot: [],
  },
  manager: {
    can: ['Inventory counts', 'POS scans & variance review', 'Goods receipts', 'BBD alerts', 'POQ recommendations', 'View reports'],
    cannot: ['Manage users', 'View billing', 'Delete records'],
  },
  staff: {
    can: ['Perform stock counts', 'Scan POS reports', 'Record goods receipts', 'View BBD alerts'],
    cannot: ['Edit recipes', 'View financial reports', 'Manage users', 'Create purchase orders'],
  },
}

const ROLE_LABELS: Record<string, string> = { owner: 'Owner', manager: 'Manager', staff: 'Staff' }
const ROLE_BADGE: Record<string, 'purple' | 'blue' | 'gray'> = { owner: 'purple', manager: 'blue', staff: 'gray' }

export function TeamScreen() {
  const { navigate } = useApp()
  const [selectedMember, setSelectedMember] = useState<string | null>(null)
  const member = team.find(m => m.id === selectedMember)
  const perms = member ? ROLE_PERMISSIONS[member.role] : null

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Team & Roles" large right={
        <button className="px-3 py-1.5 bg-emerald-600 rounded-xl text-white text-xs font-semibold">+ Invite</button>
      } />
      <div className="flex-1 overflow-y-auto scrollbar-hidden bg-slate-50 p-4 flex flex-col gap-3">
        <Card className="p-4">
          <SectionHeader title="Roles" />
          <div className="flex flex-col gap-3">
            {Object.entries(ROLE_LABELS).map(([role, label]) => {
              const p = ROLE_PERMISSIONS[role]
              return (
                <div key={role} className="flex gap-3">
                  <Badge variant={ROLE_BADGE[role]}>{label}</Badge>
                  <div className="flex-1">
                    {p.can.slice(0, 2).map(c => (
                      <p key={c} className="text-xs text-slate-600 flex items-center gap-1.5 mb-1">
                        <Check size={11} className="text-emerald-500 flex-shrink-0" /> {c}
                      </p>
                    ))}
                    {p.cannot.slice(0, 1).map(c => (
                      <p key={c} className="text-xs text-slate-400 flex items-center gap-1.5">
                        <X size={11} className="text-red-400 flex-shrink-0" /> {c}
                      </p>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">Team Members</p>
        {team.map(m => (
          <Card key={m.id} onClick={() => setSelectedMember(selectedMember === m.id ? null : m.id)} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0
                ${m.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                {m.avatar}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">{m.name}</p>
                  <Badge variant={ROLE_BADGE[m.role]}>{ROLE_LABELS[m.role]}</Badge>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{m.email}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className={`text-xs ${m.status === 'active' ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {m.status === 'active' ? '● Active' : '○ Inactive'}
                </span>
                <p className="text-xs text-slate-400 mt-0.5">{m.lastActive}</p>
              </div>
            </div>
            {selectedMember === m.id && perms && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Permissions</p>
                <div className="flex flex-col gap-1.5">
                  {perms.can.map(c => (
                    <p key={c} className="text-xs text-slate-700 flex items-center gap-2">
                      <Check size={12} className="text-emerald-500 flex-shrink-0" /> {c}
                    </p>
                  ))}
                  {perms.cannot.map(c => (
                    <p key={c} className="text-xs text-slate-400 flex items-center gap-2">
                      <X size={12} className="text-red-400 flex-shrink-0" /> {c}
                    </p>
                  ))}
                </div>
                {m.role !== 'owner' && (
                  <button className="mt-3 w-full py-2 bg-slate-100 rounded-xl text-xs font-semibold text-slate-600">
                    Change Role
                  </button>
                )}
              </div>
            )}
          </Card>
        ))}

        <button className="flex items-center justify-center gap-2 py-4 border-2 border-dashed border-slate-200 rounded-2xl text-sm text-emerald-600 font-semibold">
          <Plus size={18} /> Invite Team Member
        </button>
      </div>
    </div>
  )
}

// ─── Settings ─────────────────────────────────────────────────────────────────

const NOTIF_TYPES = [
  { key: 'expiry',    label: 'Expiring Stock',    icon: AlertTriangle, color: 'text-red-500 bg-red-50'       },
  { key: 'lowStock',  label: 'Low Stock',          icon: Package,       color: 'text-amber-500 bg-amber-50'   },
  { key: 'variance',  label: 'Major Variance',     icon: TrendingDown,  color: 'text-orange-500 bg-orange-50' },
  { key: 'countDue',  label: 'Count Due',          icon: ClipboardList, color: 'text-violet-500 bg-violet-50' },
  { key: 'ocr',       label: 'OCR Completed',      icon: ScanLine,      color: 'text-blue-500 bg-blue-50'     },
  { key: 'ocrReview', label: 'OCR Requires Review',icon: ScanLine,      color: 'text-amber-500 bg-amber-50'   },
  { key: 'poq',       label: 'PO Recommendation',  icon: ShoppingCart,  color: 'text-emerald-500 bg-emerald-50'},
  { key: 'goods',     label: 'Goods Received',     icon: Check,         color: 'text-emerald-500 bg-emerald-50'},
]

export function SettingsScreen() {
  const { platform, navigate } = useApp()
  const [biometric, setBiometric] = useState(true)
  const [pushNotif, setPushNotif] = useState(true)
  const [emailAlerts, setEmailAlerts] = useState(false)
  const [bbd, setBbd] = useState('7')
  const [showNotifDetail, setShowNotifDetail] = useState(false)
  const [notifToggles, setNotifToggles] = useState<Record<string, { push: boolean; email: boolean }>>(
    Object.fromEntries(NOTIF_TYPES.map(t => [t.key, { push: true, email: t.key === 'expiry' || t.key === 'variance' }]))
  )

  const toggleNotif = (key: string, channel: 'push' | 'email') => {
    setNotifToggles(prev => ({
      ...prev,
      [key]: { ...prev[key], [channel]: !prev[key][channel] }
    }))
  }

  const sections: Array<{
    title: string
    icon: React.ElementType
    items: Array<{
      label: string
      type: 'nav' | 'toggle' | 'stepper' | 'notif-detail'
      val?: string
      on?: boolean
      set?: (v: boolean) => void
      screen?: 'team' | 'audit-log'
      min?: number
      max?: number
      val2?: string
    }>
  }> = [
    {
      title: 'Store', icon: Store, items: [
        { label: 'Store Name',  val: 'Bella Cucina Restaurant', type: 'nav' },
        { label: 'Currency',    val: 'EUR (€)',                  type: 'nav' },
        { label: 'Language',    val: 'English',                  type: 'nav' },
        { label: 'Time Zone',   val: 'Europe/Berlin',            type: 'nav' },
      ]
    },
    {
      title: 'Inventory', icon: Package, items: [
        { label: 'Count Schedule',  val: 'Daily',    type: 'nav' },
        { label: 'Default Units',   val: 'kg / L',   type: 'nav' },
        { label: 'Categories',      val: '8 active', type: 'nav' },
        { label: 'Safety Stock',    val: 'Default',  type: 'nav' },
      ]
    },
    {
      title: 'Expiration', icon: Clock, items: [
        { label: 'BBD Alert Threshold', type: 'stepper', min: 1, max: 30, val2: bbd, set: (v: boolean) => {} },
      ]
    },
    {
      title: 'Notifications', icon: Bell, items: [
        { label: 'Push Notifications', type: 'toggle', on: pushNotif, set: setPushNotif },
        { label: 'Email Alerts',        type: 'toggle', on: emailAlerts, set: setEmailAlerts },
        { label: 'Notification Types',  type: 'notif-detail', val: `${Object.values(notifToggles).filter(v => v.push).length} push enabled` },
      ]
    },
    {
      title: 'Account', icon: User, items: [
        { label: 'My Profile',      val: 'anna@restaurant.de', type: 'nav' },
        { label: 'Change Password', val: '',                    type: 'nav' },
        { label: `${platform === 'ios' ? 'Face ID' : 'Fingerprint'} Login`, type: 'toggle', on: biometric, set: setBiometric },
      ]
    },
    {
      title: 'Administration', icon: Shield, items: [
        { label: 'Team & Roles', val: `${team.length} members`, type: 'nav', screen: 'team' },
        { label: 'Audit Log',    val: '',                        type: 'nav', screen: 'audit-log' },
      ]
    },
  ]

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Settings" large />
      <div className="flex-1 overflow-y-auto scrollbar-hidden bg-slate-50 p-4 flex flex-col gap-4">

        {/* Notification detail panel */}
        {showNotifDetail && (
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-sm font-bold text-slate-800">Notification Preferences</p>
              <button onClick={() => setShowNotifDetail(false)} className="text-xs text-slate-400 font-medium">Done</button>
            </div>
            <Card className="overflow-hidden">
              <div className="flex items-center px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-500 flex-1">Alert Type</p>
                <p className="text-xs font-semibold text-slate-500 w-12 text-center">Push</p>
                <p className="text-xs font-semibold text-slate-500 w-12 text-center">Email</p>
              </div>
              {NOTIF_TYPES.map((t, i) => {
                const Icon = t.icon
                const state = notifToggles[t.key]
                return (
                  <div key={t.key} className={`flex items-center px-4 py-3.5 ${i < NOTIF_TYPES.length - 1 ? 'border-b border-slate-50' : ''}`}>
                    <div className="flex items-center gap-2.5 flex-1">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${t.color}`}>
                        <Icon size={13} />
                      </div>
                      <p className="text-sm font-medium text-slate-800">{t.label}</p>
                    </div>
                    <div className="w-12 flex justify-center">
                      <Toggle on={state.push} set={() => toggleNotif(t.key, 'push')} />
                    </div>
                    <div className="w-12 flex justify-center">
                      <Toggle on={state.email} set={() => toggleNotif(t.key, 'email')} />
                    </div>
                  </div>
                )
              })}
            </Card>
          </div>
        )}

        {!showNotifDetail && sections.map(section => {
          const Icon = section.icon
          return (
            <div key={section.title}>
              <div className="flex items-center gap-2 mb-2 px-1">
                <Icon size={13} className="text-slate-400" />
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{section.title}</p>
              </div>
              <Card className="divide-y divide-slate-50">
                {section.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3.5">
                    <p className="text-sm font-medium text-slate-800">{item.label}</p>

                    {item.type === 'nav' && (
                      <button onClick={() => item.screen ? navigate(item.screen) : undefined}
                        className="flex items-center gap-1 text-slate-400">
                        {item.val && <span className="text-xs text-slate-400">{item.val}</span>}
                        <ChevronRight size={15} />
                      </button>
                    )}

                    {item.type === 'toggle' && item.set && (
                      <Toggle on={item.on!} set={item.set} />
                    )}

                    {item.type === 'stepper' && (
                      <div className="flex items-center gap-2">
                        <button onClick={() => setBbd(String(Math.max(1, parseInt(bbd) - 1)))}
                          className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm">−</button>
                        <span className="font-mono font-semibold text-slate-800 w-8 text-center">{bbd}d</span>
                        <button onClick={() => setBbd(String(Math.min(30, parseInt(bbd) + 1)))}
                          className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm">+</button>
                      </div>
                    )}

                    {item.type === 'notif-detail' && (
                      <button onClick={() => setShowNotifDetail(true)} className="flex items-center gap-1">
                        <span className="text-xs text-slate-400">{item.val}</span>
                        <ChevronRight size={15} className="text-slate-400" />
                      </button>
                    )}
                  </div>
                ))}
              </Card>
            </div>
          )
        })}

        <div className="pb-4" />
      </div>
    </div>
  )
}
