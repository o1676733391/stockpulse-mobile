import { ChefHat, Truck, PackageOpen, BarChart3, Archive, ClipboardList, Users, Settings, ChevronRight, LogOut, User, Bell, ShieldCheck, Clock } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { TopBar } from '../../components/layout/TopBar'
import type { Screen } from '../../types'

type SectionItem = {
  icon: typeof ChefHat
  label: string
  sub: string
  screen: Screen
  iconBg: string
  iconColor: string
  badge?: string
}

export function MoreScreen() {
  const { navigate, role, platform } = useApp()
  const ios = platform === 'ios'

  const sections: { title: string; items: SectionItem[] }[] = [
    {
      title: 'Operations',
      items: [
        { icon: ChefHat,       label: 'Recipes & BOM',    sub: '5 active recipes',          screen: 'recipes',        iconBg: 'bg-orange-100',  iconColor: 'text-orange-600' },
        { icon: Truck,         label: 'Suppliers',         sub: '3 suppliers',               screen: 'suppliers',      iconBg: 'bg-violet-100',  iconColor: 'text-violet-600' },
        { icon: PackageOpen,   label: 'Goods Receipts',    sub: 'Last: Metro Foods GmbH',    screen: 'goods-receipts', iconBg: 'bg-blue-100',    iconColor: 'text-blue-600'   },
        { icon: Clock,         label: 'Expiration Dates',  sub: '2 expiring this week',      screen: 'expiration',     iconBg: 'bg-red-100',     iconColor: 'text-red-600',  badge: '2' },
      ]
    },
    {
      title: 'Analytics',
      items: [
        { icon: BarChart3,     label: 'Reports',           sub: 'Generate & export',         screen: 'reports',        iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
        { icon: Archive,       label: 'Archive',           sub: '2024–2026 history',         screen: 'archive',        iconBg: 'bg-slate-200',   iconColor: 'text-slate-600'   },
        { icon: ClipboardList, label: 'Audit Log',         sub: 'All system events',         screen: 'audit-log',      iconBg: 'bg-amber-100',   iconColor: 'text-amber-700'   },
      ]
    },
    ...(role === 'admin' ? [{
      title: 'Administration',
      items: [
        { icon: Users,       label: 'Team & Roles',        sub: '5 members',                 screen: 'team' as Screen,    iconBg: 'bg-violet-100', iconColor: 'text-violet-600' },
        { icon: ShieldCheck, label: 'Security & Audit',    sub: 'Logs · Permissions',        screen: 'audit-log' as Screen, iconBg: 'bg-red-100',  iconColor: 'text-red-600'    },
        { icon: Settings,    label: 'Store Settings',      sub: 'Store · Inventory · Expiry',screen: 'settings' as Screen,  iconBg: 'bg-slate-200', iconColor: 'text-slate-600'  },
      ] as SectionItem[]
    }] : []),
    {
      title: 'Account',
      items: [
        { icon: User, label: 'My Profile',  sub: 'anna@restaurant.de',  screen: 'settings',      iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
        { icon: Bell, label: 'Notifications', sub: '4 unread',          screen: 'notifications', iconBg: 'bg-blue-100',    iconColor: 'text-blue-600', badge: '4' },
      ]
    }
  ]

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <TopBar title="More" large />

      <div className="flex-1 overflow-y-auto scrollbar-hidden">
        {/* Profile card */}
        <div className="px-4 pb-4">
          <button
            onClick={() => navigate('settings')}
            className="w-full bg-emerald-600 rounded-3xl p-4 flex items-center gap-4 active:opacity-90 transition-opacity"
          >
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
              AS
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-white font-bold text-[17px] leading-tight">Anna Schmidt</p>
              <p className="text-emerald-200 text-[13px] mt-0.5">Store Admin</p>
              <p className="text-emerald-300 text-[12px] truncate mt-0.5">Bella Cucina Restaurant</p>
            </div>
            <ChevronRight size={20} className="text-emerald-300 flex-shrink-0" />
          </button>
        </div>

        {/* Sections */}
        <div className="px-4 flex flex-col gap-5 pb-6">
          {sections.map(section => (
            <div key={section.title}>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.08em] mb-2 px-1">{section.title}</p>
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {section.items.map((item, i) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={i}
                      onClick={() => navigate(item.screen)}
                      className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left active:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${item.iconBg}`}>
                        <Icon size={18} className={item.iconColor} strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-semibold text-slate-900 leading-tight">{item.label}</p>
                        <p className="text-[12px] text-slate-400 mt-0.5 truncate">{item.sub}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {item.badge && (
                          <span className="min-w-[20px] h-5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center px-1.5">
                            {item.badge}
                          </span>
                        )}
                        <ChevronRight size={16} className={`text-slate-300 ${ios ? '' : 'hidden'}`} />
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Sign out */}
          <button
            onClick={() => navigate('welcome')}
            className="flex items-center justify-center gap-2.5 py-4 bg-white rounded-2xl border border-red-100 text-red-600 w-full active:bg-red-50 transition-colors"
          >
            <LogOut size={18} />
            <span className="text-[15px] font-semibold">Sign Out</span>
          </button>

          <p className="text-center text-[12px] text-slate-400 pb-2">
            StockPulse v2.4.1 · Bella Cucina Restaurant
          </p>
        </div>
      </div>
    </div>
  )
}
