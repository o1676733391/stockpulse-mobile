import { useState } from 'react'
import { ChevronRight, Info, Minus, Plus, Share2, Download, CheckCircle2, Clock, Send, Package, X, ArrowRight, Truck } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { TopBar } from '../../components/layout/TopBar'
import { Card, Badge, SectionHeader } from '../../components/ui'
import { purchaseOrders, inventoryItems, suppliers } from '../../data/mockData'
import type { OrderStatus } from '../../types'

function orderStatusBadge(status: OrderStatus) {
  const map = {
    draft:     { label: 'Draft',     variant: 'gray'   as const, icon: Clock },
    sent:      { label: 'Sent',      variant: 'blue'   as const, icon: Send },
    confirmed: { label: 'Confirmed', variant: 'amber'  as const, icon: CheckCircle2 },
    received:  { label: 'Received',  variant: 'green'  as const, icon: Package },
  }
  return map[status]
}

// ─── Orders List ──────────────────────────────────────────────────────────────

export function OrdersScreen() {
  const { navigate } = useApp()
  const [tab, setTab] = useState<'active' | 'history'>('active')

  const active = purchaseOrders.filter(p => p.status !== 'received')
  const history = purchaseOrders.filter(p => p.status === 'received')
  const displayed = tab === 'active' ? active : history

  const totalValue = active.reduce((s, p) => s + p.total, 0)
  const awaiting = active.filter(p => p.status === 'sent' || p.status === 'confirmed').length

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Purchase Orders" large right={
        <button onClick={() => navigate('poq')} className="px-3 py-1.5 bg-emerald-600 rounded-xl text-white text-xs font-semibold">
          + New
        </button>
      } />

      <div className="flex-shrink-0 bg-white border-b border-slate-100 px-4">
        <div className="flex gap-0">
          {(['active', 'history'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`py-3 px-5 text-sm font-semibold border-b-2 transition-colors capitalize
                ${tab === t ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500'}`}>
              {t === 'active' ? 'Active' : 'History'}
              {t === 'active' && active.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                  {active.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hidden bg-slate-50 p-4 flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Active Orders', value: `${active.length}`,    color: 'text-slate-900' },
            { label: 'Total Value',   value: `€${Math.round(totalValue)}`, color: 'text-emerald-700' },
            { label: 'Awaiting',      value: `${awaiting}`,         color: 'text-amber-700' },
          ].map(s => (
            <Card key={s.label} className="p-3 text-center">
              <p className={`text-xl font-bold font-mono ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </Card>
          ))}
        </div>

        {displayed.length === 0 && (
          <div className="flex flex-col items-center py-16 gap-3">
            <p className="text-slate-400 text-sm">{tab === 'active' ? 'No active orders' : 'No order history'}</p>
            {tab === 'active' && (
              <button onClick={() => navigate('poq')} className="text-emerald-600 text-sm font-semibold">
                + Create from POQ Recommendations
              </button>
            )}
          </div>
        )}

        {displayed.map(po => {
          const { label, variant } = orderStatusBadge(po.status)
          const stepIdx = ['draft','sent','confirmed','received'].indexOf(po.status)
          return (
            <Card key={po.id} onClick={() => navigate('purchase-order', { poId: po.id })} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{po.supplierName}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{po.id.toUpperCase()} · {po.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={variant}>{label}</Badge>
                  <ChevronRight size={14} className="text-slate-300" />
                </div>
              </div>

              {/* Status timeline */}
              <div className="flex items-center mb-3">
                {(['draft','sent','confirmed','received'] as OrderStatus[]).map((s, i) => {
                  const done = stepIdx >= i
                  return (
                    <div key={s} className="flex items-center flex-1">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 border-2 ${done ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-200'}`} />
                      {i < 3 && <div className={`flex-1 h-0.5 ${done && i < stepIdx ? 'bg-emerald-500' : 'bg-slate-200'}`} />}
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mb-3">
                {(['Draft','Sent','Confirmed','Received'] as const).map((s, i) => (
                  <span key={s} className={stepIdx === i ? 'text-emerald-600 font-bold' : ''}>{s}</span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-500">{po.items.length} items</p>
                <p className="font-mono font-bold text-slate-900">€{po.total.toFixed(2)}</p>
              </div>
            </Card>
          )
        })}

        {tab === 'active' && (
          <button onClick={() => navigate('poq')}
            className="flex items-center justify-center gap-2 py-4 border-2 border-dashed border-slate-200 rounded-2xl text-sm text-emerald-600 font-semibold">
            <Plus size={18} /> Create from POQ Recommendations
          </button>
        )}
      </div>
    </div>
  )
}

// ─── POQ Screen ───────────────────────────────────────────────────────────────

export function POQScreen() {
  const { navigate } = useApp()
  const [selected, setSelected] = useState<Set<string>>(new Set(['i1','i3','i2','i5','i8']))
  const [quantities, setQuantities] = useState<Record<string, number>>({
    i1: 15.5, i3: 30, i2: 6, i5: 40, i8: 8
  })
  const [showInfo, setShowInfo] = useState(false)

  const recs = [
    { supplierId: 's1', supplierName: 'Metro Foods GmbH', items: [
      { id: 'i1', name: 'Chicken Breast', unit: 'kg', physical: 24.5, target: 35, safety: 5,   recommended: 15.5, pricePerUnit: 4.80 },
      { id: 'i3', name: 'Potatoes',       unit: 'kg', physical: 48,   target: 80, safety: 10,  recommended: 42,   pricePerUnit: 0.90 },
      { id: 'i4', name: 'Cooking Oil',    unit: 'L',  physical: 6,    target: 20, safety: 3,   recommended: 17,   pricePerUnit: 2.40 },
    ]},
    { supplierId: 's2', supplierName: 'FreshProduce GmbH', items: [
      { id: 'i2', name: 'Fresh Salmon',    unit: 'kg', physical: 4.2, target: 10, safety: 2,   recommended: 7.8, pricePerUnit: 16.20 },
      { id: 'i7', name: 'Tomatoes',        unit: 'kg', physical: 12,  target: 20, safety: 3,   recommended: 11,  pricePerUnit: 1.80 },
      { id: 'i8', name: 'Romaine Lettuce', unit: 'kg', physical: 3.1, target: 8,  safety: 1.5, recommended: 6.4, pricePerUnit: 2.20 },
    ]},
    { supplierId: 's3', supplierName: 'Alpine Dairy Co.', items: [
      { id: 'i5', name: 'Whole Milk',  unit: 'L',  physical: 8,   target: 20, safety: 4, recommended: 16,  pricePerUnit: 1.10 },
      { id: 'i6', name: 'Gouda Cheese',unit: 'kg', physical: 6.8, target: 15, safety: 3, recommended: 11.2, pricePerUnit: 8.50 },
    ]},
  ]

  const allItems = recs.flatMap(g => g.items)
  const totalNeedReorder = allItems.length

  const toggle = (id: string) => setSelected(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const adj = (id: string, delta: number, unit: string) => {
    const step = unit === 'kg' || unit === 'L' ? 0.5 : 1
    setQuantities(prev => ({ ...prev, [id]: Math.max(0, parseFloat(((prev[id] ?? 0) + delta * step).toFixed(1))) }))
  }

  const totalValue = allItems
    .filter(i => selected.has(i.id))
    .reduce((s, i) => s + (quantities[i.id] ?? i.recommended) * i.pricePerUnit, 0)

  const supplierCount = recs.filter(g => g.items.some(i => selected.has(i.id))).length

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Reorder Recommendations" subtitle={`${selected.size} of ${totalNeedReorder} selected`} />

      <div className="flex-1 overflow-y-auto scrollbar-hidden bg-slate-50">
        {/* Hero stat */}
        <div className="mx-4 mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-4 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <p className="text-xl font-bold font-mono text-amber-700">{totalNeedReorder}</p>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800">Items need reordering</p>
            <p className="text-xs text-amber-600 mt-0.5">Based on target stock and safety stock levels</p>
          </div>
        </div>

        {/* Info banner */}
        <div className="mx-4 mb-2">
          <button onClick={() => setShowInfo(!showInfo)}
            className="w-full flex items-start gap-2.5 p-3.5 bg-blue-50 rounded-2xl border border-blue-100">
            <Info size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-left">
              <p className="text-xs font-semibold text-blue-800 mb-0.5">How is this calculated?</p>
              {showInfo ? (
                <div className="text-xs text-blue-700 leading-relaxed space-y-1">
                  <p>Recommended Order = Target Stock − Physical Stock + Safety Stock</p>
                  <p className="font-semibold">Example (Chicken Breast):</p>
                  <p>35 kg target − 24.5 kg physical + 5 kg safety = <strong>15.5 kg</strong></p>
                </div>
              ) : (
                <p className="text-xs text-blue-700">Tap to see formula explanation</p>
              )}
            </div>
          </button>
        </div>

        <div className="px-4 pb-4 flex flex-col gap-4">
          {recs.map(group => (
            <div key={group.supplierId}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-slate-700">{group.supplierName}</p>
                <Badge variant="gray">
                  {group.items.filter(i => selected.has(i.id)).length}/{group.items.length} selected
                </Badge>
              </div>
              <div className="flex flex-col gap-2.5">
                {group.items.map(item => {
                  const sel = selected.has(item.id)
                  const qty = quantities[item.id] ?? item.recommended
                  const pctFilled = Math.min(100, (item.physical / item.target) * 100)
                  return (
                    <Card key={item.id} className={`p-4 transition-all ${!sel ? 'opacity-55' : ''}`}>
                      <div className="flex items-start gap-3">
                        <button onClick={() => toggle(item.id)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors
                            ${sel ? 'bg-emerald-600 border-emerald-600' : 'border-slate-300 bg-white'}`}>
                          {sel && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                        </button>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900 mb-2">{item.name}</p>
                          {/* Stock level bar */}
                          <div className="mb-2">
                            <div className="flex justify-between text-xs text-slate-400 mb-1">
                              <span>Physical: <span className="font-mono font-semibold text-slate-600">{item.physical} {item.unit}</span></span>
                              <span>Target: <span className="font-mono font-semibold text-slate-600">{item.target} {item.unit}</span></span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pctFilled}%` }} />
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            {[
                              { l: 'Physical', v: `${item.physical} ${item.unit}` },
                              { l: 'Target',   v: `${item.target} ${item.unit}` },
                              { l: 'Safety',   v: `${item.safety} ${item.unit}` },
                            ].map(m => (
                              <div key={m.l}>
                                <p className="text-xs text-slate-400">{m.l}</p>
                                <p className="text-xs font-mono font-semibold text-slate-700">{m.v}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {sel && (
                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <div>
                            <p className="text-xs text-slate-400 mb-0.5">
                              Recommended: <span className="font-mono font-semibold text-slate-600">{item.recommended} {item.unit}</span>
                            </p>
                            <p className="text-xs text-slate-400">
                              ≈ <span className="font-mono font-semibold text-emerald-700">€{(qty * item.pricePerUnit).toFixed(2)}</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => adj(item.id, -1, item.unit)}
                              className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center active:bg-slate-200">
                              <Minus size={14} className="text-slate-600" />
                            </button>
                            <span className="font-mono font-bold text-slate-800 text-sm w-14 text-center">
                              {qty} {item.unit}
                            </span>
                            <button onClick={() => adj(item.id, 1, item.unit)}
                              className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center active:bg-slate-200">
                              <Plus size={14} className="text-slate-600" />
                            </button>
                          </div>
                        </div>
                      )}
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-shrink-0 p-4 pb-6 bg-white border-t border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-slate-500">
            {selected.size} items · {supplierCount} supplier{supplierCount !== 1 ? 's' : ''}
          </p>
          <p className="font-mono font-bold text-emerald-700 text-base">≈ €{totalValue.toFixed(2)}</p>
        </div>
        <button onClick={() => navigate('purchase-order')}
          disabled={selected.size === 0}
          className={`w-full py-3.5 rounded-2xl text-sm font-bold shadow-sm ${selected.size > 0 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
          Create Purchase Order{supplierCount > 1 ? 's' : ''}
        </button>
      </div>
    </div>
  )
}

// ─── Purchase Order Detail ────────────────────────────────────────────────────

const STATUS_STEPS: OrderStatus[] = ['draft', 'sent', 'confirmed', 'received']

export function PurchaseOrderScreen() {
  const { navigate, params } = useApp()
  const [showShare, setShowShare] = useState(false)
  const [status, setStatus] = useState<OrderStatus>(
    (purchaseOrders.find(p => p.id === params.poId) ?? purchaseOrders[0]).status
  )
  const [showReceiveFlow, setShowReceiveFlow] = useState(false)
  const [receiveStep, setReceiveStep] = useState(0) // 0=qty, 1=bbd, 2=confirm
  const [bbdEntries, setBbdEntries] = useState<Record<string, string>>({})
  const [stockUpdated, setStockUpdated] = useState(false)

  const po = purchaseOrders.find(p => p.id === params.poId) ?? purchaseOrders[0]
  const stepIdx = STATUS_STEPS.indexOf(status)
  const { label, variant } = orderStatusBadge(status)

  const advanceStatus = () => {
    if (status === 'draft') setStatus('sent')
    else if (status === 'sent') setStatus('confirmed')
    else if (status === 'confirmed') setShowReceiveFlow(true)
  }

  const confirmReceive = () => {
    setStatus('received')
    setShowReceiveFlow(false)
    setStockUpdated(true)
  }

  if (stockUpdated) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white gap-6 px-8">
        <div className="w-20 h-20 rounded-3xl bg-emerald-50 flex items-center justify-center">
          <CheckCircle2 size={40} className="text-emerald-500" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-1">Physical Stock Updated</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Received quantities from <strong>{po.supplierName}</strong> have been added to physical inventory with new BBD batches.
          </p>
        </div>
        <div className="w-full bg-emerald-50 rounded-2xl p-4 flex flex-col gap-2.5">
          {po.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">{item.itemName}</p>
                {bbdEntries[item.itemName] && (
                  <p className="text-xs text-slate-400">BBD: {bbdEntries[item.itemName]}</p>
                )}
              </div>
              <span className="font-mono font-semibold text-emerald-700">+{item.quantity} {item.unit}</span>
            </div>
          ))}
        </div>
        <button onClick={() => navigate('inventory')} className="w-full py-3.5 bg-emerald-600 rounded-2xl text-sm font-bold text-white shadow-sm">
          View Inventory
        </button>
        <button onClick={() => navigate('orders')} className="text-sm text-slate-500 font-medium">
          Back to Purchase Orders
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar title={`PO · ${po.supplierName}`} subtitle={po.id.toUpperCase()} right={
        <button onClick={() => setShowShare(true)} className="p-2 rounded-full active:bg-slate-100">
          <Share2 size={18} className="text-slate-600" />
        </button>
      } />

      <div className="flex-1 overflow-y-auto scrollbar-hidden bg-slate-50 p-4 flex flex-col gap-4">
        {/* Status card */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-slate-400 mb-1">Status</p>
              <Badge variant={variant}>{label}</Badge>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Date</p>
              <p className="text-sm font-semibold text-slate-800">{po.date}</p>
            </div>
          </div>

          {/* Timeline */}
          <div className="flex items-center">
            {STATUS_STEPS.map((s, i) => {
              const done = stepIdx >= i
              const active = stepIdx === i
              return (
                <div key={s} className="flex items-center flex-1">
                  <div className={`w-4 h-4 rounded-full flex-shrink-0 border-2 transition-all flex items-center justify-center
                    ${done ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-200'}`}>
                    {active && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  {i < 3 && <div className={`flex-1 h-0.5 ${done && i < stepIdx ? 'bg-emerald-500' : 'bg-slate-200'}`} />}
                </div>
              )
            })}
          </div>
          <div className="flex justify-between mt-1.5">
            {(['Draft','Sent','Confirmed','Received'] as const).map((s, i) => (
              <span key={s} className={`text-[10px] font-medium ${stepIdx === i ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>{s}</span>
            ))}
          </div>
        </Card>

        {/* Supplier */}
        <Card className="p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Supplier</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-slate-600">
                {po.supplierName.split(' ').map(w => w[0]).join('').slice(0,2)}
              </span>
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm">{po.supplierName}</p>
              <p className="text-xs text-slate-500">{suppliers.find(s => s.id === po.supplierId)?.phone}</p>
            </div>
          </div>
        </Card>

        {/* Items */}
        <Card className="p-4">
          <SectionHeader title="Order Items" />
          {po.items.map((item, i) => (
            <div key={i} className="flex items-center py-3 border-b border-slate-50 last:border-0">
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">{item.itemName}</p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{item.quantity} {item.unit} × €{item.pricePerUnit.toFixed(2)}/unit</p>
              </div>
              <p className="font-mono font-bold text-slate-800">€{(item.quantity * item.pricePerUnit).toFixed(2)}</p>
            </div>
          ))}
          <div className="pt-3 flex flex-col gap-1.5 border-t border-slate-100 mt-1">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Subtotal</span>
              <span className="font-mono">€{(po.total / 1.19).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>VAT (19%)</span>
              <span className="font-mono">€{(po.total - po.total / 1.19).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-1.5">
              <span>Total</span>
              <span className="font-mono text-emerald-700">€{po.total.toFixed(2)}</span>
            </div>
          </div>
        </Card>

        {/* Export */}
        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center gap-2 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-700">
            <Download size={16} /> Export PDF
          </button>
          <button className="flex items-center justify-center gap-2 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-700">
            <Download size={16} /> Export Excel
          </button>
        </div>
      </div>

      {/* Share bottom sheet */}
      {showShare && (
        <div className="absolute inset-0 bg-black/40 flex items-end z-50" onClick={() => setShowShare(false)}>
          <div className="w-full bg-white rounded-t-3xl p-5 pb-8" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
            <p className="text-base font-bold text-slate-900 mb-4">Share Purchase Order</p>
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'WhatsApp', color: 'bg-green-500', emoji: '💬' },
                { label: 'Telegram', color: 'bg-blue-500',  emoji: '✈️' },
                { label: 'Email',    color: 'bg-slate-600', emoji: '📧' },
                { label: 'Share',    color: 'bg-slate-400', emoji: '⬆️' },
              ].map(s => (
                <button key={s.label} onClick={() => setShowShare(false)} className="flex flex-col items-center gap-2">
                  <div className={`w-14 h-14 ${s.color} rounded-2xl flex items-center justify-center text-2xl`}>
                    {s.emoji}
                  </div>
                  <span className="text-xs text-slate-600 font-medium">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Receive goods flow */}
      {showReceiveFlow && (
        <div className="absolute inset-0 bg-black/40 flex items-end z-50">
          <div className="w-full bg-white rounded-t-3xl px-5 pt-5 pb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto" />
            </div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-base font-bold text-slate-900">
                {receiveStep === 0 ? 'Confirm Quantities' : receiveStep === 1 ? 'Enter BBD Dates' : 'Confirm Receipt'}
              </p>
              <button onClick={() => setShowReceiveFlow(false)}>
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            {/* Step indicators */}
            <div className="flex gap-2 mb-4">
              {['Quantities', 'BBD Dates', 'Confirm'].map((s, i) => (
                <div key={s} className={`flex-1 h-1 rounded-full ${receiveStep >= i ? 'bg-emerald-500' : 'bg-slate-200'}`} />
              ))}
            </div>

            {receiveStep === 0 && (
              <div className="flex flex-col gap-3 max-h-64 overflow-y-auto">
                {po.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{item.itemName}</p>
                      <p className="text-xs text-slate-400">Ordered: {item.quantity} {item.unit}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-800 text-sm">{item.quantity} {item.unit}</span>
                      <Badge variant="green">Received</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {receiveStep === 1 && (
              <div className="flex flex-col gap-3 max-h-64 overflow-y-auto">
                {po.items.map((item, i) => (
                  <div key={i}>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">{item.itemName} — Best Before Date</label>
                    <input
                      value={bbdEntries[item.itemName] ?? ''}
                      onChange={e => setBbdEntries(prev => ({ ...prev, [item.itemName]: e.target.value }))}
                      placeholder="e.g. 25 Mar 2026"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                ))}
              </div>
            )}

            {receiveStep === 2 && (
              <div className="flex flex-col gap-3">
                <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    <strong>Note:</strong> Confirmed quantities will be added to physical inventory and new batches created with the entered BBD dates.
                  </p>
                </div>
                {po.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-semibold text-slate-800">{item.itemName}</p>
                      {bbdEntries[item.itemName] && <p className="text-xs text-slate-400">BBD: {bbdEntries[item.itemName]}</p>}
                    </div>
                    <span className="font-mono font-semibold text-emerald-700">+{item.quantity} {item.unit}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 mt-5">
              {receiveStep > 0 && (
                <button onClick={() => setReceiveStep(s => s - 1)}
                  className="px-5 py-3.5 bg-slate-100 rounded-2xl text-sm font-semibold text-slate-700">
                  Back
                </button>
              )}
              <button
                onClick={() => receiveStep < 2 ? setReceiveStep(s => s + 1) : confirmReceive()}
                className="flex-1 py-3.5 bg-emerald-600 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2">
                {receiveStep === 2 ? (
                  <><Truck size={16} /> Confirm Goods Receipt</>
                ) : (
                  <>Continue <ArrowRight size={16} /></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {status !== 'received' && (
        <div className="flex-shrink-0 p-4 pb-6 bg-white border-t border-slate-100 flex gap-3">
          {status === 'draft' && (
            <button onClick={advanceStatus}
              className="flex-1 py-3.5 bg-emerald-600 rounded-2xl text-sm font-bold text-white shadow-sm flex items-center justify-center gap-2">
              <Send size={16} /> Send to Supplier
            </button>
          )}
          {status === 'sent' && (
            <button onClick={advanceStatus}
              className="flex-1 py-3.5 bg-blue-600 rounded-2xl text-sm font-bold text-white shadow-sm flex items-center justify-center gap-2">
              <CheckCircle2 size={16} /> Mark as Confirmed
            </button>
          )}
          {status === 'confirmed' && (
            <button onClick={advanceStatus}
              className="flex-1 py-3.5 bg-emerald-600 rounded-2xl text-sm font-bold text-white shadow-sm flex items-center justify-center gap-2">
              <Truck size={16} /> Receive Goods
            </button>
          )}
        </div>
      )}
    </div>
  )
}
