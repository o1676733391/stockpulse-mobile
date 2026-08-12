import { useState, useEffect } from 'react'
import { Zap, Image, CheckCircle2, AlertTriangle, Pencil, Trash2, Plus, ChevronLeft, X } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { TopBar } from '../../components/layout/TopBar'
import { Card, Badge, ConfidenceBar, SectionHeader } from '../../components/ui'
import { ocrItems } from '../../data/mockData'

// ─── Camera / Scan Screen ─────────────────────────────────────────────────────

export function ScanScreen() {
  const { navigate, platform } = useApp()
  const [flash, setFlash] = useState(false)

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Camera viewfinder */}
      <div className="flex-1 relative overflow-hidden">
        {/* Simulated camera background */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900" />

        {/* Document frame overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="relative w-64 h-48">
            {/* Corner marks */}
            {[['top-0 left-0', 'border-t-2 border-l-2'],
              ['top-0 right-0', 'border-t-2 border-r-2'],
              ['bottom-0 left-0', 'border-b-2 border-l-2'],
              ['bottom-0 right-0', 'border-b-2 border-r-2']].map(([pos, border]) => (
              <div key={pos} className={`absolute ${pos} w-7 h-7 border-emerald-400 ${border}`} />
            ))}
            {/* Grid lines */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-1/3 left-0 right-0 h-px bg-emerald-400" />
              <div className="absolute top-2/3 left-0 right-0 h-px bg-emerald-400" />
              <div className="absolute left-1/3 top-0 bottom-0 w-px bg-emerald-400" />
              <div className="absolute left-2/3 top-0 bottom-0 w-px bg-emerald-400" />
            </div>
          </div>
          <p className="mt-4 text-white/80 text-xs text-center px-8 leading-relaxed">
            Position the entire POS report inside the frame
          </p>
        </div>

        {/* Status bar at top */}
        <div className="absolute top-0 left-0 right-0 px-4 pt-12 pb-4 bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate('home')} className="flex items-center gap-1 text-white text-sm font-medium">
              <ChevronLeft size={18} /> Cancel
            </button>
            <p className="text-white font-semibold text-sm">Scan POS Report</p>
            <button onClick={() => setFlash(!flash)} className={`p-2 rounded-full ${flash ? 'bg-yellow-400' : 'bg-white/20'}`}>
              <Zap size={18} className={flash ? 'text-slate-900' : 'text-white'} />
            </button>
          </div>
        </div>

        {/* Receipt document simulacra */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-40 bg-white/10 rounded border border-white/20 opacity-40 flex items-start justify-start p-2">
          <div className="space-y-1 w-full">
            {[70,100,85,90,75,60].map((w,i) => (
              <div key={i} className="h-1.5 bg-white/60 rounded" style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="flex-shrink-0 bg-black/90 px-6 py-6">
        <div className="flex items-center justify-between">
          <button className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center active:bg-white/20">
              <Image size={22} className="text-white" />
            </div>
            <span className="text-xs text-white/60">Gallery</span>
          </button>

          {/* Shutter */}
          <button
            onClick={() => navigate('ocr-processing')}
            className="w-18 h-18 rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 rounded-full bg-white" />
          </button>

          <div className="w-12 flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-xl bg-emerald-600/30 border border-emerald-500/50 flex items-center justify-center">
              <span className="text-xs text-emerald-300 font-bold">AI</span>
            </div>
            <span className="text-xs text-white/60">OCR</span>
          </div>
        </div>
        <p className="text-center text-white/40 text-xs mt-4">Supports multi-column · Low-light · Rotated documents</p>
      </div>
    </div>
  )
}

// ─── OCR Processing ───────────────────────────────────────────────────────────

export function OCRProcessingScreen() {
  const { navigate } = useApp()
  const [step, setStep] = useState(0)

  const steps = [
    'Uploading image',
    'Reading document',
    'Detecting items',
    'Calculating sales',
    'Mapping recipes',
  ]

  useEffect(() => {
    const t = setInterval(() => {
      setStep(s => {
        if (s >= steps.length - 1) { clearInterval(t); setTimeout(() => navigate('ocr-review'), 600); return s }
        return s + 1
      })
    }, 700)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center h-full bg-white px-8 gap-8">
      {/* Pulsing icon */}
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-emerald-400 animate-pulse-ring" />
        <div className="w-20 h-20 rounded-full bg-emerald-600 flex items-center justify-center relative z-10">
          <span className="text-white font-bold text-lg">AI</span>
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Processing POS Report...</h2>
        <p className="text-sm text-slate-500">Please wait while we analyse your document</p>
      </div>

      <div className="w-full flex flex-col gap-3">
        {steps.map((s, i) => {
          const done = i < step
          const active = i === step
          return (
            <div key={s} className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all
                ${done ? 'bg-emerald-500' : active ? 'bg-emerald-100 border-2 border-emerald-500' : 'bg-slate-100'}`}>
                {done
                  ? <CheckCircle2 size={14} className="text-white" />
                  : active
                    ? <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 spinner" />
                    : <div className="w-2 h-2 rounded-full bg-slate-300" />
                }
              </div>
              <span className={`text-sm font-medium transition-colors
                ${done ? 'text-emerald-600' : active ? 'text-slate-900' : 'text-slate-400'}`}>
                {s}
              </span>
              {done && <CheckCircle2 size={14} className="text-emerald-500 ml-auto" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── OCR Review ───────────────────────────────────────────────────────────────

export function OCRReviewScreen() {
  const { navigate } = useApp()
  const [items, setItems] = useState(ocrItems.map(i => ({ ...i, editing: false, removed: false })))

  const updateQty = (idx: number, val: string) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, qty: parseInt(val) || 0 } : it))
  }
  const remove = (idx: number) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, removed: true } : it))
  }

  const active = items.filter(i => !i.removed)
  const lowConf = active.filter(i => i.confidence < 90).length
  const avgConf = Math.round(active.reduce((s, i) => s + i.confidence, 0) / active.length)

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Review POS Scan" subtitle="10 Mar 2026 · Report #2048" />

      <div className="flex-1 overflow-y-auto scrollbar-hidden bg-slate-50">
        {/* Summary card */}
        <div className="bg-white border-b border-slate-100 px-4 py-4">
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="text-center p-3 bg-emerald-50 rounded-xl">
              <p className="text-xl font-bold font-mono text-emerald-700">{active.length}</p>
              <p className="text-xs text-emerald-600 font-medium">Detected Items</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-xl">
              <p className="text-xl font-bold font-mono text-blue-700">{avgConf}%</p>
              <p className="text-xs text-blue-600 font-medium">Avg Confidence</p>
            </div>
            <div className="text-center p-3 bg-amber-50 rounded-xl">
              <p className="text-xl font-bold font-mono text-amber-700">{lowConf}</p>
              <p className="text-xs text-amber-600 font-medium">Review Needed</p>
            </div>
          </div>

          {/* Receipt thumbnail */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <div className="w-12 h-16 bg-white border border-slate-200 rounded-lg flex items-center justify-center">
              <div className="space-y-1 px-1">
                {[80,100,70,90].map((w,i) => (
                  <div key={i} className="h-0.5 bg-slate-300 rounded" style={{ width: `${w}%` }} />
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">POS Report · 10 Mar 2026</p>
              <p className="text-xs text-slate-500">Bella Cucina Restaurant · Lunch shift</p>
              <p className="text-xs text-slate-400 mt-0.5">Report Date: 10 Mar 2026 · 49 portions total</p>
            </div>
          </div>
        </div>

        {/* Items table */}
        <div className="px-4 py-3">
          {lowConf > 0 && (
            <div className="flex items-center gap-2 mb-3 px-3 py-2.5 bg-amber-50 rounded-xl border border-amber-200">
              <AlertTriangle size={15} className="text-amber-600 flex-shrink-0" />
              <p className="text-xs text-amber-800 font-medium">{lowConf} item{lowConf > 1 ? 's' : ''} with low confidence — please verify</p>
            </div>
          )}

          {/* Header row */}
          <div className="grid grid-cols-12 gap-2 px-3 py-2 mb-1">
            <span className="col-span-1 text-xs text-slate-400 font-semibold">#</span>
            <span className="col-span-5 text-xs text-slate-400 font-semibold">Item</span>
            <span className="col-span-2 text-xs text-slate-400 font-semibold text-center">Qty</span>
            <span className="col-span-4 text-xs text-slate-400 font-semibold text-right">Confidence</span>
          </div>

          <div className="flex flex-col gap-2">
            {items.filter(i => !i.removed).map((item, i) => {
              const lowC = item.confidence < 90
              return (
                <Card key={i} className={`px-3 py-3 ${lowC ? 'ring-1 ring-amber-200' : ''}`}>
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <span className="col-span-1 text-xs font-mono text-slate-400">{item.artNr}</span>
                    <div className="col-span-5">
                      <p className="text-xs font-semibold text-slate-800 leading-tight">{item.item}</p>
                      {lowC && <Badge variant="amber" className="mt-0.5">Review</Badge>}
                    </div>
                    <div className="col-span-2 text-center">
                      <input
                        type="number"
                        value={item.qty}
                        onChange={e => updateQty(items.indexOf(item), e.target.value)}
                        className="w-full text-center font-mono font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg py-1 text-sm outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="col-span-3 flex justify-end">
                      <ConfidenceBar value={item.confidence} />
                    </div>
                    <button onClick={() => remove(items.indexOf(item))} className="col-span-1 flex justify-end">
                      <X size={14} className="text-slate-300 active:text-red-400" />
                    </button>
                  </div>
                </Card>
              )
            })}

            <button className="flex items-center gap-2 py-3 px-3 border-2 border-dashed border-slate-200 rounded-2xl text-sm text-slate-500 font-medium">
              <Plus size={16} /> Add missing item
            </button>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="flex-shrink-0 p-4 pb-6 bg-white border-t border-slate-100 flex flex-col gap-2.5">
        <div className="px-3 py-2 bg-blue-50 rounded-xl">
          <p className="text-xs text-blue-700">
            <strong>Note:</strong> This will update theoretical inventory using recipe/BOM mappings. Physical stock is not affected.
          </p>
        </div>
        <button onClick={() => navigate('ocr-result')}
          className="w-full py-3.5 bg-emerald-600 rounded-2xl text-sm font-bold text-white shadow-sm">
          Confirm & Deduct Stock
        </button>
        <button onClick={() => navigate('scan')}
          className="w-full py-3 text-sm font-semibold text-slate-500 text-center">
          Retake Photo
        </button>
      </div>
    </div>
  )
}

// ─── OCR Result ───────────────────────────────────────────────────────────────

export function OCRResultScreen() {
  const { navigate } = useApp()

  const deductions = [
    { name: 'Chicken Breast', delta: -12.4, unit: 'kg', cost: '€59.52' },
    { name: 'Potatoes',       delta: -8.2,  unit: 'kg', cost: '€7.38'  },
    { name: 'Cooking Oil',    delta: -1.8,  unit: 'L',  cost: '€4.32'  },
    { name: 'Gouda Cheese',   delta: -4.1,  unit: 'kg', cost: '€34.85' },
    { name: 'Ground Beef',    delta: -6.25, unit: 'kg', cost: '€38.75' },
  ]

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 bg-white border-b border-slate-100 px-4 py-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 size={20} className="text-emerald-500" />
              <h1 className="text-lg font-bold text-slate-900">POS Report Processed</h1>
            </div>
            <p className="text-xs text-slate-500">10 Mar 2026 · Report #2048 · Lunch shift</p>
          </div>
          <Badge variant="green">Complete</Badge>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-emerald-50 rounded-xl p-3 text-center">
            <p className="text-xl font-bold font-mono text-emerald-700">24</p>
            <p className="text-xs text-emerald-600 font-medium">Menu items detected</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-3 text-center">
            <p className="text-xl font-bold font-mono text-blue-700">49</p>
            <p className="text-xs text-blue-600 font-medium">Total portions sold</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hidden bg-slate-50 p-4">
        <SectionHeader title="Ingredients Deducted from Theoretical Stock" />
        <div className="flex flex-col gap-2">
          {deductions.map(d => (
            <Card key={d.name} className="px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                <span className="text-red-600 font-bold text-xs">↓</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">{d.name}</p>
                <p className="text-xs text-slate-400">Recipe BOM deduction</p>
              </div>
              <div className="text-right">
                <p className="font-mono font-bold text-red-600 text-sm">{d.delta} {d.unit}</p>
                <p className="text-xs text-slate-400">{d.cost}</p>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-4 p-4 bg-emerald-50 rounded-2xl">
          <p className="text-xs font-semibold text-emerald-700 mb-1">Theoretical inventory updated</p>
          <p className="text-xs text-emerald-600 leading-relaxed">
            5 ingredient stocks have been automatically updated based on recipe/BOM mappings.
            Physical stock is unchanged until your next stock count.
          </p>
        </div>
      </div>

      <div className="flex-shrink-0 p-4 pb-6 bg-white border-t border-slate-100 flex flex-col gap-2.5">
        <button onClick={() => navigate('inventory')}
          className="w-full py-3.5 bg-emerald-600 rounded-2xl text-sm font-bold text-white shadow-sm">
          View Inventory Impact
        </button>
        <button onClick={() => navigate('scan')}
          className="w-full py-3 text-sm font-semibold text-slate-500 text-center">
          Scan Another Report
        </button>
      </div>
    </div>
  )
}
