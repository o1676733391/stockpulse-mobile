import { useState } from 'react'
import { AlertTriangle, Package, TrendingDown, ClipboardList, ScanLine, ShoppingCart, CheckCircle2, Bell, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { TopBar } from '../components/layout/TopBar'
import { Card, Badge } from '../components/ui'
import { notifications } from '../data/mockData'

const TYPE_CONFIG = {
  expiry:            { icon: AlertTriangle, color: 'text-red-500 bg-red-50',       badge: 'red'     as const, label: 'Expiry Alert'     },
  low_stock:         { icon: Package,       color: 'text-amber-500 bg-amber-50',   badge: 'amber'   as const, label: 'Low Stock'         },
  variance:          { icon: TrendingDown,  color: 'text-orange-500 bg-orange-50', badge: 'orange'  as const, label: 'Major Variance'    },
  count_due:         { icon: ClipboardList, color: 'text-violet-500 bg-violet-50', badge: 'purple'  as const, label: 'Count Due'         },
  ocr_complete:      { icon: ScanLine,      color: 'text-blue-500 bg-blue-50',     badge: 'blue'    as const, label: 'OCR Complete'      },
  po_recommendation: { icon: ShoppingCart,  color: 'text-emerald-500 bg-emerald-50', badge: 'green' as const, label: 'POQ Ready'         },
  goods_received:    { icon: CheckCircle2,  color: 'text-emerald-500 bg-emerald-50', badge: 'green' as const, label: 'Goods Received'    },
}

// Group notifications by day
function groupByDay(notifs: typeof notifications) {
  const groups: Record<string, typeof notifications> = {}
  notifs.forEach(n => {
    const key = n.time.includes('min') || n.time.includes('hour') ? 'Today'
      : n.time.includes('Yesterday') ? 'Yesterday'
      : 'Earlier'
    groups[key] = [...(groups[key] ?? []), n]
  })
  return groups
}

export function NotificationsScreen() {
  const { navigate } = useApp()
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [readState, setReadState] = useState<Set<string>>(new Set())

  const visible = notifications.filter(n => !dismissed.has(n.id))
  const unread = visible.filter(n => !n.read && !readState.has(n.id)).length
  const grouped = groupByDay(visible)
  const dayOrder = ['Today', 'Yesterday', 'Earlier']

  const markAllRead = () => {
    setReadState(new Set(notifications.map(n => n.id)))
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Notifications" right={
        unread > 0 ? (
          <button onClick={markAllRead} className="text-xs text-emerald-600 font-semibold px-1">
            Mark all read
          </button>
        ) : undefined
      } />

      {unread > 0 && (
        <div className="flex-shrink-0 bg-white border-b border-slate-100 px-4 py-2.5 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
          <p className="text-xs font-semibold text-slate-700">{unread} unread notification{unread > 1 ? 's' : ''}</p>
          <button onClick={markAllRead} className="ml-auto text-xs text-slate-400 underline">Dismiss all</button>
        </div>
      )}

      {visible.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-slate-50">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
            <Bell size={24} className="text-slate-400" />
          </div>
          <p className="text-slate-500 text-sm font-medium">No notifications</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto scrollbar-hidden bg-slate-50">
          <div className="p-4 flex flex-col gap-1">
            {dayOrder.map(day => {
              const items = grouped[day]
              if (!items?.length) return null
              return (
                <div key={day} className="mb-3">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">{day}</p>
                  <div className="flex flex-col gap-2">
                    {items.map(n => {
                      const cfg = TYPE_CONFIG[n.type as keyof typeof TYPE_CONFIG]
                      if (!cfg) return null
                      const Icon = cfg.icon
                      const isUnread = !n.read && !readState.has(n.id)
                      return (
                        <Card key={n.id} className={`p-4 relative ${isUnread ? 'ring-1 ring-slate-200 bg-white' : 'bg-white'}`}>
                          {/* Dismiss */}
                          <button onClick={() => setDismissed(prev => new Set([...prev, n.id]))}
                            className="absolute top-3 right-3 p-1 rounded-full text-slate-300 active:text-slate-500">
                            <X size={13} />
                          </button>

                          <div className="flex items-start gap-3 pr-6">
                            {isUnread && <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 mt-1.5" />}
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${!isUnread ? 'ml-5' : ''} ${cfg.color}`}>
                              <Icon size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                                  <Badge variant={cfg.badge}>{cfg.label}</Badge>
                                </div>
                              </div>
                              <p className="text-xs text-slate-500 leading-relaxed">{n.body}</p>
                              <p className="text-xs text-slate-400 mt-1">{n.time}</p>

                              {/* Type-specific actions */}
                              <div className="flex gap-2 mt-2.5">
                                {n.type === 'expiry' && (
                                  <>
                                    <button onClick={() => navigate('expiration')}
                                      className="px-3 py-1.5 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-100">
                                      View Expiry →
                                    </button>
                                    <button onClick={() => navigate('waste-reduction')}
                                      className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-100">
                                      Suggestions
                                    </button>
                                  </>
                                )}
                                {n.type === 'low_stock' && (
                                  <button onClick={() => navigate('inventory')}
                                    className="px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-semibold rounded-lg border border-amber-100">
                                    View Inventory →
                                  </button>
                                )}
                                {n.type === 'variance' && (
                                  <button onClick={() => navigate('count-summary')}
                                    className="px-3 py-1.5 bg-orange-50 text-orange-700 text-xs font-semibold rounded-lg border border-orange-100">
                                    Review Variance →
                                  </button>
                                )}
                                {n.type === 'count_due' && (
                                  <button onClick={() => navigate('stock-count')}
                                    className="px-3 py-1.5 bg-violet-50 text-violet-700 text-xs font-semibold rounded-lg border border-violet-100">
                                    Start Count →
                                  </button>
                                )}
                                {n.type === 'ocr_complete' && (
                                  <button onClick={() => navigate('ocr-review')}
                                    className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg border border-blue-100">
                                    Review Scan →
                                  </button>
                                )}
                                {n.type === 'po_recommendation' && (
                                  <button onClick={() => navigate('poq')}
                                    className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-100">
                                    View POQ →
                                  </button>
                                )}
                                {n.type === 'goods_received' && (
                                  <button onClick={() => navigate('goods-receipts')}
                                    className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-100">
                                    View Receipt →
                                  </button>
                                )}
                                {isUnread && (
                                  <button onClick={() => setReadState(prev => new Set([...prev, n.id]))}
                                    className="ml-auto text-xs text-slate-400 font-medium">
                                    Mark read
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
