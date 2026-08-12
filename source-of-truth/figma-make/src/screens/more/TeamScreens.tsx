import { useState } from 'react'
import {
  Check, X, ChevronRight, Plus, Mail, Search,
  Shield, ShieldCheck, MoreHorizontal,
  CheckCircle2, Clock,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { TopBar } from '../../components/layout/TopBar'
import { Card, Badge, SectionHeader, Button, InfoBanner } from '../../components/ui'
import { team } from '../../data/mockData'
import type { TeamMember } from '../../types'

// ─── Role configuration ────────────────────────────────────────────────────────

type RoleKey = 'owner' | 'manager' | 'staff'

interface RoleDef {
  label: string
  description: string
  badgeVariant: 'purple' | 'blue' | 'gray'
  color: string
  bg: string
  iconColor: string
}

const ROLES: Record<RoleKey, RoleDef> = {
  owner:   { label: 'Owner / Admin', description: 'Full access to all features', badgeVariant: 'purple', color: 'text-violet-700', bg: 'bg-violet-50', iconColor: 'text-violet-600' },
  manager: { label: 'Manager',       description: 'Operational management',      badgeVariant: 'blue',   color: 'text-blue-700',   bg: 'bg-blue-50',   iconColor: 'text-blue-600'   },
  staff:   { label: 'Staff',         description: 'Basic operational access',    badgeVariant: 'gray',   color: 'text-slate-700',  bg: 'bg-slate-100', iconColor: 'text-slate-500'  },
}

// ─── Permission matrix ─────────────────────────────────────────────────────────

interface Permission {
  module: string
  owner: 'full' | 'view' | 'none'
  manager: 'full' | 'view' | 'none'
  staff: 'full' | 'view' | 'none'
}

const PERMISSIONS: Permission[] = [
  { module: 'Dashboard',           owner: 'full', manager: 'full', staff: 'full' },
  { module: 'Inventory View',      owner: 'full', manager: 'full', staff: 'full' },
  { module: 'Stock Count',         owner: 'full', manager: 'full', staff: 'full' },
  { module: 'POS Scanning (OCR)',  owner: 'full', manager: 'full', staff: 'full' },
  { module: 'OCR Review & Edit',   owner: 'full', manager: 'full', staff: 'none' },
  { module: 'Goods Receipts',      owner: 'full', manager: 'full', staff: 'full' },
  { module: 'View Costs & Prices', owner: 'full', manager: 'view', staff: 'none' },
  { module: 'Recipes & BOM',       owner: 'full', manager: 'view', staff: 'none' },
  { module: 'Suppliers',           owner: 'full', manager: 'full', staff: 'none' },
  { module: 'POQ Recommendations', owner: 'full', manager: 'full', staff: 'none' },
  { module: 'Purchase Orders',     owner: 'full', manager: 'view', staff: 'none' },
  { module: 'Reports',             owner: 'full', manager: 'view', staff: 'none' },
  { module: 'Archive',             owner: 'full', manager: 'view', staff: 'none' },
  { module: 'Audit Log',           owner: 'full', manager: 'none', staff: 'none' },
  { module: 'Team Management',     owner: 'full', manager: 'none', staff: 'none' },
  { module: 'Store Settings',      owner: 'full', manager: 'none', staff: 'none' },
]

function PermCell({ value }: { value: 'full' | 'view' | 'none' }) {
  if (value === 'full') return (
    <div className="flex justify-center">
      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
        <Check size={11} className="text-emerald-600" strokeWidth={3} />
      </div>
    </div>
  )
  if (value === 'view') return (
    <div className="flex justify-center">
      <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">View</span>
    </div>
  )
  return (
    <div className="flex justify-center">
      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
        <X size={10} className="text-slate-400" strokeWidth={2.5} />
      </div>
    </div>
  )
}

// ─── Team Screen (list) ────────────────────────────────────────────────────────

export function TeamScreen() {
  const { navigate, role } = useApp()
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<'members' | 'roles'>('members')

  const filtered = team.filter(m =>
    m.name.toLowerCase().includes(query.toLowerCase()) ||
    m.email.toLowerCase().includes(query.toLowerCase())
  )

  const activeCount   = team.filter(m => m.status === 'active').length
  const pendingCount  = 0
  const roleGroups: [RoleKey, TeamMember[]][] = [
    ['owner',   team.filter(m => m.role === 'owner')],
    ['manager', team.filter(m => m.role === 'manager')],
    ['staff',   team.filter(m => m.role === 'staff')],
  ]

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <TopBar
        title="Team & Roles"
        large
        right={role === 'admin' ? (
          <button
            onClick={() => navigate('add-member')}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 rounded-xl text-white text-[13px] font-semibold shadow-sm active:bg-emerald-700 transition-colors"
          >
            <Plus size={15} /> Invite
          </button>
        ) : undefined}
      />

      {/* Tab switcher */}
      <div className="flex-shrink-0 bg-white border-b border-slate-100 px-4 pb-3">
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          {(['members', 'roles'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-[13px] font-semibold transition-all
                ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              {t === 'members' ? `Members (${team.length})` : 'Role Guide'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hidden">
        {tab === 'members' && (
          <div className="px-4 py-4 flex flex-col gap-3">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { label: 'Total',   value: team.length,  color: 'text-slate-800' },
                { label: 'Active',  value: activeCount,  color: 'text-emerald-600' },
                { label: 'Pending', value: pendingCount, color: 'text-amber-600' },
              ].map(s => (
                <Card key={s.label} className="py-3 flex flex-col items-center gap-1">
                  <p className={`text-[22px] font-bold font-mono ${s.color}`}>{s.value}</p>
                  <p className="text-[11px] text-slate-400 font-medium">{s.label}</p>
                </Card>
              ))}
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 h-10">
              <Search size={15} className="text-slate-400 flex-shrink-0" />
              <input
                value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Search members…"
                className="bg-transparent text-[14px] text-slate-800 outline-none flex-1 placeholder:text-slate-400"
              />
            </div>

            {/* Member list grouped by role */}
            {roleGroups.map(([roleKey, members]) => {
              const visibleMembers = members.filter(m => filtered.includes(m))
              if (visibleMembers.length === 0) return null
              const roleDef = ROLES[roleKey]
              return (
                <div key={roleKey}>
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <Badge variant={roleDef.badgeVariant}>{roleDef.label}</Badge>
                    <span className="text-[12px] text-slate-400">{visibleMembers.length}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {visibleMembers.map(m => (
                      <Card
                        key={m.id}
                        onClick={() => navigate('member-detail', { memberId: m.id })}
                        className="px-4 py-3.5"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-[14px] flex-shrink-0
                            ${m.status === 'active' ? `${roleDef.bg} ${roleDef.color}` : 'bg-slate-100 text-slate-400'}`}>
                            {m.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[15px] font-semibold text-slate-900 leading-tight">{m.name}</p>
                            <p className="text-[12px] text-slate-400 truncate mt-0.5">{m.email}</p>
                          </div>
                          <div className="text-right flex-shrink-0 flex flex-col items-end gap-1.5">
                            <div className="flex items-center gap-1.5">
                              <div className={`w-1.5 h-1.5 rounded-full ${m.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                              <span className={`text-[11px] font-medium ${m.status === 'active' ? 'text-emerald-600' : 'text-slate-400'}`}>
                                {m.status === 'active' ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400">{m.lastActive}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )
            })}

            {filtered.length === 0 && (
              <div className="flex flex-col items-center py-12 gap-3 text-center">
                <Search size={24} className="text-slate-300" />
                <p className="text-[15px] font-semibold text-slate-500">No members found</p>
              </div>
            )}

            {role === 'admin' && (
              <button
                onClick={() => navigate('add-member')}
                className="flex items-center justify-center gap-2.5 py-4 border-2 border-dashed border-slate-200 rounded-2xl text-[14px] text-emerald-600 font-semibold active:bg-emerald-50 transition-colors"
              >
                <Plus size={18} /> Invite Team Member
              </button>
            )}
          </div>
        )}

        {tab === 'roles' && (
          <div className="px-4 py-4 flex flex-col gap-4">
            {/* Role cards */}
            {(Object.entries(ROLES) as [RoleKey, RoleDef][]).map(([key, def]) => {
              const perms = PERMISSIONS.filter(p => p[key] !== 'none')
              const blocked = PERMISSIONS.filter(p => p[key] === 'none')
              return (
                <Card key={key} className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${def.bg}`}>
                      <Shield size={18} className={def.iconColor} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[15px] font-bold text-slate-900">{def.label}</p>
                        <Badge variant={def.badgeVariant}>{def.label}</Badge>
                      </div>
                      <p className="text-[12px] text-slate-500">{def.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 mb-3">
                    {perms.slice(0, 4).map(p => (
                      <div key={p.module} className="flex items-center gap-2">
                        <Check size={12} className="text-emerald-500 flex-shrink-0" />
                        <p className="text-[12px] text-slate-700">
                          {p.module}
                          {p[key] === 'view' && <span className="text-amber-600 ml-1">(view only)</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                  {blocked.length > 0 && (
                    <div className="flex flex-col gap-1.5 pt-3 border-t border-slate-100">
                      {blocked.slice(0, 2).map(p => (
                        <div key={p.module} className="flex items-center gap-2">
                          <X size={12} className="text-red-400 flex-shrink-0" />
                          <p className="text-[12px] text-slate-400">{p.module}</p>
                        </div>
                      ))}
                      {blocked.length > 2 && (
                        <p className="text-[12px] text-slate-400 ml-4">+{blocked.length - 2} more restrictions</p>
                      )}
                    </div>
                  )}
                  {role === 'admin' && (
                    <button
                      onClick={() => navigate('role-editor', { roleKey: key })}
                      className="mt-3 w-full py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-600 flex items-center justify-center gap-1.5 active:bg-slate-100 transition-colors"
                    >
                      Edit permissions <ChevronRight size={14} />
                    </button>
                  )}
                </Card>
              )
            })}

            {/* Full matrix */}
            <Card className="p-4">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.08em] mb-3">Permission Matrix</p>
              {/* Header */}
              <div className="grid grid-cols-[1fr,52px,52px,52px] gap-2 mb-2 pb-2 border-b border-slate-100">
                <p className="text-[11px] font-semibold text-slate-400">Module</p>
                {(['owner', 'manager', 'staff'] as RoleKey[]).map(r => (
                  <p key={r} className="text-[10px] font-bold text-center uppercase tracking-wide text-slate-400">
                    {r === 'owner' ? 'Own' : r === 'manager' ? 'Mgr' : 'Stf'}
                  </p>
                ))}
              </div>
              {PERMISSIONS.map(p => (
                <div key={p.module} className="grid grid-cols-[1fr,52px,52px,52px] gap-2 py-2 border-b border-slate-50 last:border-0 items-center">
                  <p className="text-[12px] text-slate-700">{p.module}</p>
                  <PermCell value={p.owner} />
                  <PermCell value={p.manager} />
                  <PermCell value={p.staff} />
                </div>
              ))}
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Add Member ────────────────────────────────────────────────────────────────

export function AddMemberScreen() {
  const { navigate } = useApp()
  const [name,  setName]  = useState('')
  const [email, setEmail] = useState('')
  const [selectedRole, setSelectedRole] = useState<RoleKey>('staff')
  const [sent, setSent] = useState(false)

  const handleInvite = () => {
    setTimeout(() => setSent(true), 600)
  }

  if (sent) {
    return (
      <div className="flex flex-col h-full bg-white">
        <TopBar title="Invite Member" />
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8">
          <div className="w-24 h-24 rounded-3xl bg-emerald-50 flex items-center justify-center">
            <Mail size={42} className="text-emerald-500" strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <h2 className="text-[24px] font-bold text-slate-900 mb-3">Invitation sent!</h2>
            <p className="text-[14px] text-slate-500 leading-relaxed">
              An invitation email has been sent to
            </p>
            <p className="text-[15px] font-semibold text-slate-800 mt-1">{email}</p>
            <div className="mt-3">
              <Badge variant={ROLES[selectedRole].badgeVariant}>{ROLES[selectedRole].label}</Badge>
            </div>
          </div>
          <div className="w-full flex flex-col gap-3">
            <Button onClick={() => navigate('add-member')} variant="secondary" fullWidth>
              Invite Another Member
            </Button>
            <Button onClick={() => navigate('team')} fullWidth>
              Back to Team
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <TopBar title="Invite Member" />

      <div className="flex-1 overflow-y-auto scrollbar-hidden">
        <div className="px-4 py-4 flex flex-col gap-5">

          {/* Personal info */}
          <Card className="p-4">
            <SectionHeader title="Member Details" />
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] mb-1.5 block">Full name</label>
                <input
                  value={name} onChange={e => setName(e.target.value)}
                  placeholder="e.g. Marco Bauer"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 h-[48px] text-[15px] text-slate-800
                    outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition-all"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] mb-1.5 block">Work email</label>
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 h-[48px]
                  focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-400 transition-all">
                  <Mail size={16} className="text-slate-400 flex-shrink-0" />
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="marco@restaurant.de"
                    className="flex-1 bg-transparent text-[15px] text-slate-800 outline-none"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Role selection */}
          <Card className="p-4">
            <SectionHeader title="Access Role" />
            <div className="flex flex-col gap-3">
              {(Object.entries(ROLES) as [RoleKey, RoleDef][]).filter(([k]) => k !== 'owner').map(([key, def]) => {
                const active = selectedRole === key
                const permsForRole = PERMISSIONS.filter(p => p[key] !== 'none')
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedRole(key)}
                    className={`flex items-start gap-3.5 p-4 rounded-2xl border-2 text-left transition-all
                      ${active ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white active:bg-slate-50'}`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5
                      ${active ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`}>
                      {active && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[15px] font-bold text-slate-900">{def.label}</p>
                        <Badge variant={def.badgeVariant}>{def.label}</Badge>
                      </div>
                      <p className="text-[12px] text-slate-500 mb-2">{def.description}</p>
                      <div className="flex flex-col gap-1">
                        {permsForRole.slice(0, 3).map(p => (
                          <p key={p.module} className="text-[12px] text-slate-600 flex items-center gap-1.5">
                            <Check size={10} className="text-emerald-500 flex-shrink-0" />
                            {p.module}
                            {p[key] === 'view' && <span className="text-amber-600">(view only)</span>}
                          </p>
                        ))}
                        {permsForRole.length > 3 && (
                          <p className="text-[12px] text-slate-400 ml-3.5">+{permsForRole.length - 3} more modules</p>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </Card>

          <InfoBanner variant="blue">
            The team member will receive an email to set their password and access the store.
          </InfoBanner>
        </div>
      </div>

      <div className="flex-shrink-0 px-4 pb-8 pt-3">
        <Button
          onClick={handleInvite}
          disabled={!name.trim() || !email.trim()}
          fullWidth size="lg"
        >
          <Mail size={18} /> Send Invitation
        </Button>
      </div>
    </div>
  )
}

// ─── Member Detail ─────────────────────────────────────────────────────────────

export function MemberDetailScreen() {
  const { navigate, params, role: currentUserRole } = useApp()
  const memberId = params.memberId as string
  const member = team.find(m => m.id === memberId) ?? team[0]
  const roleDef = ROLES[(member.role === 'owner' ? 'owner' : member.role) as RoleKey] ?? ROLES.staff
  const roleKey = (member.role === 'owner' ? 'owner' : member.role) as RoleKey

  const perms = PERMISSIONS.filter(p => p[roleKey] !== 'none')
  const blocked = PERMISSIONS.filter(p => p[roleKey] === 'none')

  const recentActivity = [
    { action: 'Completed daily stock count',  time: 'Today 08:30',    icon: CheckCircle2, color: 'text-emerald-500' },
    { action: 'Scanned POS report #2048',      time: 'Today 07:15',    icon: CheckCircle2, color: 'text-blue-500'    },
    { action: 'Received goods from Metro',     time: 'Yesterday',      icon: CheckCircle2, color: 'text-violet-500'  },
    { action: 'Submitted count summary',       time: '2 days ago',     icon: CheckCircle2, color: 'text-emerald-500' },
  ]

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <TopBar
        title="Member Detail"
        right={currentUserRole === 'admin' && member.role !== 'owner' ? (
          <button className="w-9 h-9 rounded-full flex items-center justify-center active:bg-slate-100">
            <MoreHorizontal size={20} className="text-slate-600" />
          </button>
        ) : undefined}
      />

      <div className="flex-1 overflow-y-auto scrollbar-hidden">
        <div className="px-4 py-4 flex flex-col gap-4">

          {/* Profile card */}
          <Card className="p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-[20px] flex-shrink-0
                ${member.status === 'active' ? `${roleDef.bg} ${roleDef.color}` : 'bg-slate-100 text-slate-400'}`}>
                {member.avatar}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[18px] font-bold text-slate-900">{member.name}</p>
                </div>
                <Badge variant={roleDef.badgeVariant}>{roleDef.label}</Badge>
                <p className="text-[12px] text-slate-500 mt-1">{member.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
              <div className="bg-slate-50 rounded-xl px-3 py-2.5">
                <p className="text-[10px] text-slate-400 font-semibold mb-0.5">Status</p>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${member.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <p className="text-[13px] font-semibold text-slate-700 capitalize">{member.status}</p>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl px-3 py-2.5">
                <p className="text-[10px] text-slate-400 font-semibold mb-0.5">Last Active</p>
                <div className="flex items-center gap-1.5">
                  <Clock size={12} className="text-slate-400" />
                  <p className="text-[13px] font-semibold text-slate-700">{member.lastActive}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Permissions */}
          <Card className="p-4">
            <SectionHeader title="Access & Permissions" />
            <div className="flex flex-col gap-1.5 mb-4">
              {perms.map(p => (
                <div key={p.module} className="flex items-center gap-2.5 py-1">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0
                    ${p[roleKey] === 'view' ? 'bg-amber-100' : 'bg-emerald-100'}`}>
                    {p[roleKey] === 'view'
                      ? <span className="text-[9px] font-bold text-amber-600">V</span>
                      : <Check size={10} className="text-emerald-600" strokeWidth={3} />
                    }
                  </div>
                  <p className="text-[13px] text-slate-700">
                    {p.module}
                    {p[roleKey] === 'view' && <span className="text-amber-600 text-[12px] ml-1">(view only)</span>}
                  </p>
                </div>
              ))}
            </div>

            {blocked.length > 0 && (
              <>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.08em] mb-2">No access</p>
                <div className="flex flex-col gap-1.5">
                  {blocked.map(p => (
                    <div key={p.module} className="flex items-center gap-2.5 py-1">
                      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <X size={10} className="text-slate-400" strokeWidth={2.5} />
                      </div>
                      <p className="text-[13px] text-slate-400">{p.module}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>

          {/* Recent activity */}
          <Card className="p-4">
            <SectionHeader title="Recent Activity" />
            {recentActivity.map((a, i) => {
              const Icon = a.icon
              return (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
                  <div className={`w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0`}>
                    <Icon size={13} className={a.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-slate-700 font-medium leading-tight">{a.action}</p>
                  </div>
                  <p className="text-[11px] text-slate-400 flex-shrink-0">{a.time}</p>
                </div>
              )
            })}
          </Card>

          {/* Admin actions */}
          {currentUserRole === 'admin' && member.role !== 'owner' && (
            <div className="flex flex-col gap-2.5 pb-4">
              <Button
                onClick={() => navigate('role-editor', { memberId: member.id, roleKey })}
                variant="secondary" fullWidth size="md"
              >
                <Shield size={16} /> Change Role
              </Button>
              <button className="flex items-center justify-center gap-2 py-3.5 border border-red-200 rounded-2xl text-[14px] font-semibold text-red-600 bg-white active:bg-red-50 transition-colors">
                <X size={16} /> Revoke Access
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Role Editor ───────────────────────────────────────────────────────────────

export function RoleEditorScreen() {
  const { navigate, params } = useApp()
  const targetRole = (params.roleKey ?? 'manager') as RoleKey
  const roleDef    = ROLES[targetRole]

  // Local permission state — toggles per module
  const [perms, setPerms] = useState<Record<string, 'full' | 'view' | 'none'>>(() =>
    Object.fromEntries(PERMISSIONS.map(p => [p.module, p[targetRole]]))
  )

  const toggle = (module: string) => {
    setPerms(prev => {
      const cur = prev[module]
      const next: 'full' | 'view' | 'none' = cur === 'full' ? 'view' : cur === 'view' ? 'none' : 'full'
      return { ...prev, [module]: next }
    })
  }

  const moduleGroups: { group: string; modules: string[] }[] = [
    { group: 'Operations',   modules: ['Dashboard', 'Inventory View', 'Stock Count', 'POS Scanning (OCR)', 'OCR Review & Edit', 'Goods Receipts'] },
    { group: 'Purchasing',   modules: ['Suppliers', 'POQ Recommendations', 'Purchase Orders'] },
    { group: 'Analytics',    modules: ['View Costs & Prices', 'Recipes & BOM', 'Reports', 'Archive'] },
    { group: 'Admin',        modules: ['Audit Log', 'Team Management', 'Store Settings'] },
  ]

  const AccessToggle = ({ module }: { module: string }) => {
    const val = perms[module] ?? 'none'
    const options: ('full' | 'view' | 'none')[] = ['full', 'view', 'none']
    return (
      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 flex-shrink-0">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => setPerms(p => ({ ...p, [module]: opt }))}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all
              ${val === opt
                ? opt === 'full' ? 'bg-emerald-500 text-white'
                  : opt === 'view' ? 'bg-amber-400 text-white'
                  : 'bg-red-400 text-white'
                : 'text-slate-400'}`}
          >
            {opt === 'full' ? '✓' : opt === 'view' ? 'V' : '✕'}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <TopBar title="Edit Permissions" />

      <div className="flex-1 overflow-y-auto scrollbar-hidden">
        <div className="px-4 py-4 flex flex-col gap-4">

          {/* Role info */}
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${roleDef.bg}`}>
                <ShieldCheck size={20} className={roleDef.iconColor} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[16px] font-bold text-slate-900">{roleDef.label}</p>
                  <Badge variant={roleDef.badgeVariant}>{roleDef.label}</Badge>
                </div>
                <p className="text-[12px] text-slate-500">{roleDef.description}</p>
              </div>
            </div>
          </Card>

          <InfoBanner variant="amber">
            Changes apply to all team members with this role. Individual overrides are not supported.
          </InfoBanner>

          {/* Legend */}
          <div className="flex items-center gap-4 px-1">
            {[
              { label: 'Full access', color: 'bg-emerald-500' },
              { label: 'View only',   color: 'bg-amber-400'   },
              { label: 'No access',   color: 'bg-red-400'     },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-full ${l.color}`} />
                <p className="text-[11px] text-slate-500">{l.label}</p>
              </div>
            ))}
          </div>

          {/* Permission groups */}
          {moduleGroups.map(group => (
            <Card key={group.group} className="p-4">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.08em] mb-3">{group.group}</p>
              <div className="flex flex-col gap-0.5">
                {group.modules.map((module, i) => (
                  <div
                    key={module}
                    className={`flex items-center justify-between py-3 gap-3
                      ${i < group.modules.length - 1 ? 'border-b border-slate-50' : ''}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium text-slate-800">{module}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {perms[module] === 'full' ? 'Can view and edit'
                          : perms[module] === 'view' ? 'Can view, cannot edit'
                          : 'Hidden from this role'}
                      </p>
                    </div>
                    <AccessToggle module={module} />
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex-shrink-0 px-4 pb-8 pt-3 flex gap-3">
        <Button onClick={() => navigate('team')} variant="secondary" size="md" className="flex-1">
          Cancel
        </Button>
        <Button onClick={() => navigate('team')} size="md" className="flex-1">
          Save Changes
        </Button>
      </div>
    </div>
  )
}
