import { useState } from 'react'
import { Plus, Camera, Upload, Trash2, ChevronRight, CheckCircle2, PackageOpen } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { TopBar } from '../../components/layout/TopBar'
import { Card, Badge, SectionHeader } from '../../components/ui'
import { goodsReceipts } from '../../data/mockData'

export function GoodsReceiptsScreen() {
  const { navigate } = useApp()
  return (
    <div className="flex flex-col h-full">
      <TopBar title="Goods Receipts" large right={
        <button onClick={() => navigate('new-receipt')} className="px-3 py-1.5 bg-emerald-600 rounded-xl text-white text-xs font-semibold">+ New</button>
      } />
      <div className="flex-1 overflow-y-auto scrollbar-hidden bg-slate-50 p-4 flex flex-col gap-3">
        {goodsReceipts.map(gr => (
          <Card key={gr.id} onClick={() => navigate('new-receipt', { grId: gr.id })} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">{gr.supplierName}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{gr.invoiceNumber} · {gr.date}</p>
              </div>
              <Badge variant={gr.status === 'received' ? 'green' : 'amber'}>
                {gr.status === 'received' ? 'Received' : 'Pending'}
              </Badge>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-500">{gr.items.length} items</p>
              <p className="font-mono font-bold text-slate-900">€{gr.total.toFixed(2)}</p>
            </div>
          </Card>
        ))}
        <button onClick={() => navigate('new-receipt')}
          className="flex items-center justify-center gap-2 py-4 border-2 border-dashed border-slate-200 rounded-2xl text-sm text-emerald-600 font-semibold">
          <Plus size={18} /> New Goods Receipt
        </button>
      </div>
    </div>
  )
}

const SUPPLIERS = ['Metro Foods GmbH', 'FreshProduce GmbH', 'Alpine Dairy Co.']
const INIT_ITEMS = [
  { name: 'Chicken Breast', qty: '20', unit: 'kg', price: '4.80', bbd: '18 Mar 2026' },
  { name: 'Potatoes',       qty: '50', unit: 'kg', price: '0.90', bbd: '30 Mar 2026' },
]

export function NewReceiptScreen() {
  const { navigate } = useApp()
  const [step, setStep] = useState(0)
  const [supplier, setSupplier] = useState('Metro Foods GmbH')
  const [invoice, setInvoice] = useState('INV-20481')
  const [date, setDate] = useState('10 Mar 2026')
  const [items, setItems] = useState(INIT_ITEMS)
  const [confirmed, setConfirmed] = useState(false)

  const subtotal = items.reduce((s, i) => s + parseFloat(i.qty || '0') * parseFloat(i.price || '0'), 0)
  const tax = subtotal * 0.19
  const total = subtotal + tax

  if (confirmed) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white gap-6 px-8">
        <div className="w-20 h-20 rounded-3xl bg-emerald-50 flex items-center justify-center">
          <CheckCircle2 size={40} className="text-emerald-500" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Goods Receipt Confirmed</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Received quantities from <strong>{supplier}</strong> have been added to physical inventory.
          </p>
        </div>
        <div className="w-full bg-emerald-50 rounded-2xl p-4 flex flex-col gap-2">
          {items.map((it, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-slate-700 font-medium">{it.name}</span>
              <span className="font-mono font-semibold text-emerald-700">+{it.qty} {it.unit}</span>
            </div>
          ))}
        </div>
        <button onClick={() => navigate('inventory')} className="w-full py-3.5 bg-emerald-600 rounded-2xl text-sm font-bold text-white shadow-sm">
          View Inventory
        </button>
        <button onClick={() => navigate('goods-receipts')} className="text-sm text-slate-500 font-medium">Back to Receipts</button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar title="New Goods Receipt" />
      <div className="flex-shrink-0 bg-white border-b border-slate-100 px-4 pb-3">
        <div className="flex gap-0">
          {['Details', 'Items', 'Confirm'].map((s, i) => (
            <button key={s} onClick={() => setStep(i)}
              className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition-colors
                ${step === i ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hidden bg-slate-50 p-4">
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Supplier</label>
              <div className="flex flex-col gap-2">
                {SUPPLIERS.map(s => (
                  <button key={s} onClick={() => setSupplier(s)}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-colors
                      ${supplier === s ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0
                      ${supplier === s ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`}>
                      {supplier === s && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <span className="text-sm font-semibold text-slate-800">{s}</span>
                  </button>
                ))}
              </div>
            </div>
            {[
              { label: 'Invoice Number', val: invoice, set: setInvoice },
              { label: 'Delivery Date',  val: date,    set: setDate },
            ].map(f => (
              <div key={f.label}>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">{f.label}</label>
                <input value={f.val} onChange={e => f.set(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            ))}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Invoice Photo</label>
              <div className="flex gap-3">
                <button className="flex-1 flex flex-col items-center gap-2 py-4 bg-white border-2 border-dashed border-slate-200 rounded-xl text-slate-500">
                  <Camera size={20} /><span className="text-xs font-medium">Take Photo</span>
                </button>
                <button className="flex-1 flex flex-col items-center gap-2 py-4 bg-white border-2 border-dashed border-slate-200 rounded-xl text-slate-500">
                  <Upload size={20} /><span className="text-xs font-medium">Upload</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-3">
            <SectionHeader title="Received Items" action="+ Add Item" />
            {items.map((item, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-slate-800 text-sm">{item.name}</p>
                  <button onClick={() => setItems(prev => prev.filter((_, j) => j !== i))}>
                    <Trash2 size={15} className="text-slate-300 active:text-red-400" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Quantity', val: item.qty, suffix: item.unit },
                    { label: 'Price/unit', val: item.price, suffix: '€' },
                  ].map(f => (
                    <div key={f.label}>
                      <label className="text-xs text-slate-400 mb-1 block">{f.label}</label>
                      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
                        <input value={f.val} onChange={e => {
                          const updated = [...items]
                          if (f.label === 'Quantity') updated[i] = { ...updated[i], qty: e.target.value }
                          else updated[i] = { ...updated[i], price: e.target.value }
                          setItems(updated)
                        }}
                          className="flex-1 px-2.5 py-2 bg-transparent text-sm font-mono text-slate-800 outline-none" />
                        <span className="pr-2.5 text-xs text-slate-500">{f.suffix}</span>
                      </div>
                    </div>
                  ))}
                  <div className="col-span-2">
                    <label className="text-xs text-slate-400 mb-1 block">Best Before Date</label>
                    <input value={item.bbd} onChange={e => {
                      const updated = [...items]; updated[i] = { ...updated[i], bbd: e.target.value }; setItems(updated)
                    }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-sm text-slate-800 outline-none" />
                  </div>
                </div>
              </Card>
            ))}
            <button onClick={() => setItems(prev => [...prev, { name: 'New Item', qty: '0', unit: 'kg', price: '0.00', bbd: '' }])}
              className="flex items-center justify-center gap-2 py-4 border-2 border-dashed border-slate-200 rounded-2xl text-sm text-emerald-600 font-semibold">
              <Plus size={18} /> Add Item
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <Card className="p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Summary</p>
              <div className="flex flex-col gap-1.5 mb-3">
                <div className="flex justify-between text-sm text-slate-600"><span>Supplier</span><span className="font-semibold text-slate-800">{supplier}</span></div>
                <div className="flex justify-between text-sm text-slate-600"><span>Invoice</span><span className="font-mono font-semibold text-slate-800">{invoice}</span></div>
                <div className="flex justify-between text-sm text-slate-600"><span>Date</span><span className="font-semibold text-slate-800">{date}</span></div>
                <div className="flex justify-between text-sm text-slate-600"><span>Items</span><span className="font-semibold text-slate-800">{items.length}</span></div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex flex-col gap-1">
                <div className="flex justify-between text-xs text-slate-400"><span>Subtotal</span><span className="font-mono">€{subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-xs text-slate-400"><span>VAT (19%)</span><span className="font-mono">€{tax.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-1"><span>Total</span><span className="font-mono text-emerald-700">€{total.toFixed(2)}</span></div>
              </div>
            </Card>
            <div className="p-3.5 bg-blue-50 rounded-xl">
              <p className="text-xs text-blue-800 leading-relaxed">
                <strong>Note:</strong> Confirmed quantities will be added to physical inventory and new batches will be created with the specified BBD dates.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex-shrink-0 p-4 pb-6 bg-white border-t border-slate-100 flex gap-3">
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)}
            className="px-5 py-3.5 bg-slate-100 rounded-2xl text-sm font-semibold text-slate-700">
            Back
          </button>
        )}
        <button onClick={() => step < 2 ? setStep(s => s + 1) : setConfirmed(true)}
          className="flex-1 py-3.5 bg-emerald-600 rounded-2xl text-sm font-bold text-white shadow-sm">
          {step === 2 ? 'Confirm Goods Receipt' : 'Continue'}
        </button>
      </div>
    </div>
  )
}
