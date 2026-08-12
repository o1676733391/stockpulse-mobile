import { Phone, Mail, Package, ShoppingCart, Clock, ChevronRight, TrendingUp, Truck, Calendar } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { TopBar } from '../../components/layout/TopBar'
import { Card, Badge, SectionHeader } from '../../components/ui'
import { suppliers, inventoryItems, purchaseOrders } from '../../data/mockData'

const SUPPLIER_STATS: Record<string, { ytdSpend: number; avgLeadDays: number; onTimeRate: number; totalOrders: number }> = {
  s1: { ytdSpend: 4820, avgLeadDays: 2, onTimeRate: 94, totalOrders: 18 },
  s2: { ytdSpend: 2140, avgLeadDays: 1, onTimeRate: 98, totalOrders: 12 },
  s3: { ytdSpend: 980,  avgLeadDays: 3, onTimeRate: 88, totalOrders: 7  },
}

const PURCHASE_HISTORY: Record<string, Array<{ id: string; date: string; items: number; total: number; status: string }>> = {
  s1: [
    { id: 'PO-0041', date: '08 Mar 2026', items: 5, total: 842.50, status: 'received' },
    { id: 'PO-0038', date: '01 Mar 2026', items: 4, total: 620.00, status: 'received' },
    { id: 'PO-0034', date: '22 Feb 2026', items: 6, total: 1104.40, status: 'received' },
    { id: 'PO-0030', date: '14 Feb 2026', items: 3, total: 480.00, status: 'received' },
  ],
  s2: [
    { id: 'PO-0040', date: '09 Mar 2026', items: 3, total: 389.60, status: 'received' },
    { id: 'PO-0036', date: '25 Feb 2026', items: 2, total: 245.00, status: 'received' },
    { id: 'PO-0033', date: '18 Feb 2026', items: 4, total: 512.00, status: 'received' },
  ],
  s3: [
    { id: 'PO-0039', date: '07 Mar 2026', items: 2, total: 196.00, status: 'received' },
    { id: 'PO-0035', date: '24 Feb 2026', items: 3, total: 312.00, status: 'received' },
  ],
}

export function SuppliersScreen() {
  const { navigate } = useApp()

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Suppliers" large right={
        <button className="px-3 py-1.5 bg-emerald-600 rounded-xl text-white text-xs font-semibold">+ Add</button>
      } />

      <div className="flex-1 overflow-y-auto scrollbar-hidden bg-slate-50">
        {/* Summary */}
        <div className="px-4 pt-4 pb-2 grid grid-cols-3 gap-3">
          {[
            { label: 'Suppliers',     value: `${suppliers.length}`, color: 'text-slate-900' },
            { label: 'Open Orders',   value: `${suppliers.reduce((s, x) => s + x.openOrders, 0)}`, color: 'text-amber-700' },
            { label: 'YTD Spend',     value: '€7.9k', color: 'text-emerald-700' },
          ].map(s => (
            <Card key={s.label} className="p-3 text-center">
              <p className={`text-lg font-bold font-mono ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </Card>
          ))}
        </div>

        <div className="px-4 pb-4 flex flex-col gap-3">
          {suppliers.map(s => {
            const stats = SUPPLIER_STATS[s.id]
            return (
              <Card key={s.id} onClick={() => navigate('supplier-detail', { supplierId: s.id })} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-700 font-bold text-sm">
                      {s.name.split(' ').map(w => w[0]).join('').slice(0,2)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 text-sm">{s.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{s.contact}</p>
                    <div className="flex flex-wrap gap-3 mt-2.5">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Package size={11} /> {s.ingredientCount} items
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock size={11} /> {stats?.avgLeadDays}d lead
                      </span>
                      <span className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
                        <TrendingUp size={11} /> {stats?.onTimeRate}% on-time
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    {s.openOrders > 0 && <Badge variant="blue">{s.openOrders} open</Badge>}
                    <ChevronRight size={14} className="text-slate-300" />
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <p className="text-xs text-slate-400">
                    Last delivery: <span className="font-medium text-slate-600">{s.lastDelivery}</span>
                  </p>
                  <p className="text-xs font-mono font-bold text-slate-700">€{stats?.ytdSpend.toLocaleString()} YTD</p>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function SupplierDetailScreen() {
  const { navigate, params } = useApp()
  const supplier = suppliers.find(s => s.id === params.supplierId) ?? suppliers[0]
  const suppliedItems = inventoryItems.filter(i => i.supplierId === supplier.id)
  const supplierOrders = purchaseOrders.filter(p => p.supplierId === supplier.id)
  const history = PURCHASE_HISTORY[supplier.id] ?? []
  const stats = SUPPLIER_STATS[supplier.id]

  return (
    <div className="flex flex-col h-full">
      <TopBar title={supplier.name} right={
        <button onClick={() => navigate('purchase-order')} className="px-3 py-1.5 bg-emerald-600 rounded-xl text-white text-xs font-semibold">
          + Order
        </button>
      } />

      <div className="flex-1 overflow-y-auto scrollbar-hidden bg-slate-50 p-4 flex flex-col gap-4">
        {/* Supplier hero */}
        <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
            <span className="text-emerald-700 font-bold text-xl">
              {supplier.name.split(' ').map(w => w[0]).join('').slice(0,2)}
            </span>
          </div>
          <div>
            <h2 className="font-bold text-slate-900">{supplier.name}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{supplier.contact}</p>
            <div className="flex gap-2 mt-2">
              {supplier.openOrders > 0 && <Badge variant="blue">{supplier.openOrders} open order{supplier.openOrders > 1 ? 's' : ''}</Badge>}
              <Badge variant="gray">{suppliedItems.length} items</Badge>
            </div>
          </div>
        </div>

        {/* Performance stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3 text-center">
            <p className="text-xl font-bold font-mono text-emerald-700">€{stats.ytdSpend.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-0.5">YTD Spend</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-xl font-bold font-mono text-slate-800">{stats.totalOrders}</p>
            <p className="text-xs text-slate-500 mt-0.5">Total Orders</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-xl font-bold font-mono text-amber-700">{stats.avgLeadDays}d</p>
            <p className="text-xs text-slate-500 mt-0.5">Avg Lead Time</p>
          </Card>
          <Card className="p-3 text-center">
            <p className={`text-xl font-bold font-mono ${stats.onTimeRate >= 95 ? 'text-emerald-700' : stats.onTimeRate >= 85 ? 'text-amber-700' : 'text-red-600'}`}>
              {stats.onTimeRate}%
            </p>
            <p className="text-xs text-slate-500 mt-0.5">On-Time Rate</p>
          </Card>
        </div>

        {/* Contact */}
        <Card className="p-4">
          <SectionHeader title="Contact" />
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Phone size={15} className="text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Phone</p>
                <p className="text-sm font-semibold text-slate-800">{supplier.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Mail size={15} className="text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Email</p>
                <p className="text-sm font-semibold text-slate-800">{supplier.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Truck size={15} className="text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Last Delivery</p>
                <p className="text-sm font-semibold text-slate-800">{supplier.lastDelivery}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Supplied items */}
        <Card className="p-4">
          <SectionHeader title={`Supplied Items (${suppliedItems.length})`} />
          {suppliedItems.map(item => (
            <div key={item.id} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-slate-500">{item.name[0]}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{item.name}</p>
                  <p className="text-xs text-slate-400">{item.sku} · {item.unit}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-mono font-semibold text-slate-700">€{item.costPerUnit.toFixed(2)}/{item.unit}</p>
                <Badge variant={item.status === 'healthy' ? 'green' : item.status === 'low' ? 'amber' : 'red'}>
                  {item.status}
                </Badge>
              </div>
            </div>
          ))}
        </Card>

        {/* Open orders */}
        {supplierOrders.length > 0 && (
          <Card className="p-4">
            <SectionHeader title="Open Orders" action="View All" />
            {supplierOrders.map(po => (
              <button key={po.id} onClick={() => navigate('purchase-order', { poId: po.id })}
                className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0 w-full text-left">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{po.id.toUpperCase()}</p>
                  <p className="text-xs text-slate-400">{po.date} · {po.items.length} items</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="font-mono font-semibold text-slate-800 text-sm">€{po.total.toFixed(2)}</p>
                    <Badge variant={po.status === 'received' ? 'green' : po.status === 'confirmed' ? 'amber' : 'blue'}>
                      {po.status}
                    </Badge>
                  </div>
                  <ChevronRight size={14} className="text-slate-300" />
                </div>
              </button>
            ))}
          </Card>
        )}

        {/* Purchase history */}
        <Card className="p-4">
          <SectionHeader title="Purchase History" />
          <div className="flex flex-col gap-0">
            {history.map((h, i) => (
              <div key={h.id} className="flex items-start gap-3 pb-4 last:pb-0">
                {/* Timeline */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                    <Calendar size={12} className="text-emerald-600" />
                  </div>
                  {i < history.length - 1 && <div className="w-px flex-1 bg-slate-100 min-h-[20px] mt-1" />}
                </div>
                <div className="flex-1 pt-0.5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-800">{h.id}</p>
                    <p className="font-mono font-bold text-slate-800 text-sm">€{h.total.toFixed(2)}</p>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{h.date} · {h.items} items</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="pb-4">
          <button onClick={() => navigate('purchase-order')}
            className="w-full py-3.5 bg-emerald-600 rounded-2xl text-sm font-bold text-white shadow-sm">
            Create New Purchase Order
          </button>
        </div>
      </div>
    </div>
  )
}
