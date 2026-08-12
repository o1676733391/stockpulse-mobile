// StockPulse Design System Documentation

const COLORS = [
  { name: 'Emerald 600', hex: '#059669', token: 'brand-primary',   usage: 'Primary actions, success state, healthy stock' },
  { name: 'Emerald 50',  hex: '#ecfdf5', token: 'brand-subtle',    usage: 'Success backgrounds, active tab indicator' },
  { name: 'Amber 500',   hex: '#f59e0b', token: 'warning',         usage: 'Low stock, approaching expiration, attention' },
  { name: 'Amber 50',    hex: '#fffbeb', token: 'warning-subtle',  usage: 'Warning backgrounds, caution cards' },
  { name: 'Red 500',     hex: '#ef4444', token: 'critical',        usage: 'Expired stock, major variance, destructive' },
  { name: 'Red 50',      hex: '#fef2f2', token: 'critical-subtle', usage: 'Critical alert backgrounds' },
  { name: 'Blue 500',    hex: '#3b82f6', token: 'info',            usage: 'Processing, OCR activity, neutral actions' },
  { name: 'Blue 50',     hex: '#eff6ff', token: 'info-subtle',     usage: 'Information card backgrounds' },
  { name: 'Slate 900',   hex: '#0f172a', token: 'text-primary',    usage: 'Primary text, headings' },
  { name: 'Slate 500',   hex: '#64748b', token: 'text-secondary',  usage: 'Secondary text, labels, metadata' },
  { name: 'Slate 200',   hex: '#e2e8f0', token: 'border',          usage: 'Card borders, dividers, input borders' },
  { name: 'Slate 50',    hex: '#f8fafc', token: 'surface',         usage: 'Page background, card backgrounds' },
]

const TYPE_SCALE = [
  { name: 'Display',      size: '28px', weight: '700', font: 'DM Sans', usage: 'Splash, hero headings' },
  { name: 'Page Title',   size: '22px', weight: '700', font: 'DM Sans', usage: 'Screen titles (large TopBar)' },
  { name: 'Section',      size: '17px', weight: '700', font: 'DM Sans', usage: 'Card headings, section headers' },
  { name: 'Card Title',   size: '15px', weight: '600', font: 'DM Sans', usage: 'Item names, primary labels' },
  { name: 'Body',         size: '14px', weight: '400', font: 'DM Sans', usage: 'General content, descriptions' },
  { name: 'Label',        size: '13px', weight: '500', font: 'DM Sans', usage: 'Form labels, action labels' },
  { name: 'Caption',      size: '12px', weight: '400', font: 'DM Sans', usage: 'Timestamps, metadata, footnotes' },
  { name: 'Micro',        size: '11px', weight: '600', font: 'DM Sans', usage: 'Section headers (uppercase)' },
  { name: 'Numeric KPI',  size: '28px', weight: '700', font: 'JetBrains Mono', usage: 'Dashboard KPIs, large quantities' },
  { name: 'Data Value',   size: '15px', weight: '600', font: 'JetBrains Mono', usage: 'Stock quantities, prices, variance' },
  { name: 'Mono Caption', size: '12px', weight: '500', font: 'JetBrains Mono', usage: 'SKUs, batch IDs, timestamps' },
]

const SPACING = [4, 8, 12, 16, 24, 32, 48, 64]
const RADIUS = [
  { name: 'Card',    value: '16px / rounded-2xl', usage: 'Content cards, panels' },
  { name: 'Button',  value: '12px / rounded-xl',  usage: 'Primary and secondary buttons' },
  { name: 'Sheet',   value: '24px / rounded-3xl',  usage: 'Bottom sheets, modals' },
  { name: 'Badge',   value: '999px / rounded-full', usage: 'Status badges, chips' },
  { name: 'Input',   value: '10px / rounded-xl',   usage: 'Text fields, selects' },
  { name: 'Icon',    value: '8px / rounded-lg',    usage: 'Icon containers' },
]

const BADGE_VARIANTS = [
  { label: 'Healthy',    bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' },
  { label: 'Warning',    bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
  { label: 'Critical',   bg: '#fee2e2', text: '#991b1b', border: '#fecaca' },
  { label: 'Info',       bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe' },
  { label: 'Neutral',    bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' },
  { label: 'Purple',     bg: '#f3e8ff', text: '#6b21a8', border: '#e9d5ff' },
  { label: 'Orange',     bg: '#fff7ed', text: '#9a3412', border: '#fed7aa' },
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-16">
      <h2 className="text-2xl font-bold text-slate-900 mb-6 pb-3 border-b border-slate-200">{title}</h2>
      {children}
    </section>
  )
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h3 className="text-base font-bold text-slate-700 mb-4 uppercase tracking-wider text-sm">{title}</h3>
      {children}
    </div>
  )
}

function Swatch({ name, hex, token, usage }: { name: string; hex: string; token: string; usage: string }) {
  const isDark = parseInt(hex.slice(1, 3), 16) * 0.299 + parseInt(hex.slice(3, 5), 16) * 0.587 + parseInt(hex.slice(5, 7), 16) * 0.114 < 128
  return (
    <div className="flex flex-col rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
      <div style={{ background: hex, height: 80 }} className="flex items-end p-3">
        <span className="text-xs font-mono font-semibold" style={{ color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.6)' }}>
          {hex}
        </span>
      </div>
      <div className="p-3 bg-white">
        <p className="text-sm font-semibold text-slate-800">{name}</p>
        <p className="text-xs font-mono text-emerald-600 mt-0.5">{token}</p>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{usage}</p>
      </div>
    </div>
  )
}

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      {/* Header */}
      <header style={{ background: 'linear-gradient(145deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }} className="px-8 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-900/40">
              <span className="text-white font-bold text-base">SP</span>
            </div>
            <div>
              <p className="text-white font-bold text-base leading-none">StockPulse</p>
              <p className="text-slate-400 text-xs mt-0.5">Design System</p>
            </div>
          </div>
          <nav className="flex items-center gap-1">
            <a href="/app" className="px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              Mobile App
            </a>
            <a href="/prototype" className="px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              Prototype
            </a>
            <span className="px-4 py-2 text-sm text-white bg-white/10 rounded-lg border border-white/10">
              Design System
            </span>
          </nav>
        </div>
      </header>

      {/* Hero band */}
      <div className="bg-white border-b border-slate-100 px-8 py-10">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-3">StockPulse · F&B Inventory Intelligence</p>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Design System</h1>
          <p className="text-lg text-slate-500 max-w-2xl">
            A unified visual language for restaurant inventory operations. Built on an 8-point grid, semantic color tokens, and DM Sans for maximum readability in busy kitchen environments.
          </p>
          <div className="flex items-center gap-6 mt-6">
            {[
              { label: 'Grid', value: '8pt' },
              { label: 'Primary Font', value: 'DM Sans' },
              { label: 'Mono Font', value: 'JetBrains Mono' },
              { label: 'Mode', value: 'Light-first' },
              { label: 'Platforms', value: 'iOS + Android' },
            ].map(item => (
              <div key={item.label} className="text-center">
                <p className="text-sm font-bold text-slate-800">{item.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-8 py-12">

        {/* ── Foundations ── */}
        <Section title="Foundations">

          <SubSection title="Color Tokens">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {COLORS.map(c => <Swatch key={c.token} {...c} />)}
            </div>
          </SubSection>

          <SubSection title="Typography">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="grid grid-cols-5 bg-slate-50 px-5 py-3 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <span>Style</span>
                <span>Size</span>
                <span>Weight</span>
                <span>Font</span>
                <span>Usage</span>
              </div>
              {TYPE_SCALE.map(t => (
                <div key={t.name} className="grid grid-cols-5 px-5 py-4 border-b border-slate-50 last:border-0 items-center">
                  <div style={{ fontSize: Math.min(parseInt(t.size), 22), fontWeight: t.weight, fontFamily: t.font === 'JetBrains Mono' ? 'JetBrains Mono, monospace' : 'DM Sans, sans-serif' }} className="text-slate-900">
                    {t.name}
                  </div>
                  <span className="text-sm font-mono text-slate-500">{t.size}</span>
                  <span className="text-sm font-mono text-slate-500">{t.weight}</span>
                  <span className="text-xs text-emerald-600 font-medium">{t.font}</span>
                  <span className="text-xs text-slate-500">{t.usage}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">DM Sans — Operational Body</p>
                <p style={{ fontFamily: 'DM Sans', fontSize: 28, fontWeight: 700 }} className="text-slate-900 mb-1">Bella Cucina</p>
                <p style={{ fontFamily: 'DM Sans', fontSize: 17, fontWeight: 600 }} className="text-slate-700 mb-1">Stock Count · Daily</p>
                <p style={{ fontFamily: 'DM Sans', fontSize: 14 }} className="text-slate-600 mb-1">42 of 68 items counted — 62% complete</p>
                <p style={{ fontFamily: 'DM Sans', fontSize: 12 }} className="text-slate-400">Last updated 09:41 · Anna K.</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">JetBrains Mono — Numeric Data</p>
                <p style={{ fontFamily: 'JetBrains Mono', fontSize: 32, fontWeight: 700 }} className="text-emerald-700 mb-1">24.5 kg</p>
                <p style={{ fontFamily: 'JetBrains Mono', fontSize: 16, fontWeight: 600 }} className="text-slate-700 mb-1">−2.5 kg · −9.3%</p>
                <p style={{ fontFamily: 'JetBrains Mono', fontSize: 14 }} className="text-amber-600 mb-1">€1,840.00</p>
                <p style={{ fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 500 }} className="text-slate-400">SKU: CH-BRST-001 · PO-0041</p>
              </div>
            </div>
          </SubSection>

          <SubSection title="Spacing — 8pt Grid">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-end gap-4 flex-wrap">
                {SPACING.map(s => (
                  <div key={s} className="flex flex-col items-center gap-2">
                    <div
                      className="bg-emerald-100 border border-emerald-200 rounded flex items-center justify-center"
                      style={{ width: s, height: s }}
                    />
                    <span className="text-xs font-mono text-slate-500">{s}px</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                {[
                  { token: 'space-1', val: '4px', note: 'Icon gap, micro spacing' },
                  { token: 'space-2', val: '8px', note: 'Tight gap, icon padding' },
                  { token: 'space-3', val: '12px', note: 'Badge padding, label gap' },
                  { token: 'space-4', val: '16px', note: 'Card padding (default)' },
                  { token: 'space-6', val: '24px', note: 'Section spacing' },
                  { token: 'space-8', val: '32px', note: 'Large gaps, page margin' },
                ].map(sp => (
                  <div key={sp.token} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                    <p className="text-xs font-mono font-semibold text-emerald-700">{sp.token}</p>
                    <p className="text-xs font-mono text-slate-500">{sp.val}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{sp.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </SubSection>

          <SubSection title="Border Radius">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {RADIUS.map(r => (
                <div key={r.name} className="bg-white border border-slate-200 p-5 flex flex-col gap-3"
                  style={{ borderRadius: r.name === 'Sheet' ? 24 : r.name === 'Card' ? 16 : r.name === 'Button' ? 12 : 12 }}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-12 h-12 bg-emerald-100 border-2 border-emerald-300"
                      style={{ borderRadius: r.name === 'Sheet' ? 24 : r.name === 'Card' ? 16 : r.name === 'Badge' ? 999 : r.name === 'Button' ? 12 : r.name === 'Input' ? 10 : 8 }}
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{r.name}</p>
                      <p className="text-xs font-mono text-emerald-600">{r.value}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">{r.usage}</p>
                </div>
              ))}
            </div>
          </SubSection>

          <SubSection title="Elevation">
            <div className="flex flex-wrap gap-5">
              {[
                { name: 'Flat',     shadow: 'none',                                                  usage: 'Default cards' },
                { name: 'Low',      shadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)', usage: 'Raised cards, inputs' },
                { name: 'Medium',   shadow: '0 4px 16px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)', usage: 'Bottom sheets, active dropdowns' },
                { name: 'High',     shadow: '0 16px 48px rgba(0,0,0,0.14), 0 4px 8px rgba(0,0,0,0.06)', usage: 'Modals, dialogs' },
              ].map(e => (
                <div key={e.name} className="bg-white rounded-2xl p-5 flex flex-col gap-2 border border-slate-100" style={{ boxShadow: e.shadow }}>
                  <p className="text-sm font-semibold text-slate-800">{e.name}</p>
                  <p className="text-xs text-slate-500">{e.usage}</p>
                </div>
              ))}
            </div>
          </SubSection>
        </Section>

        {/* ── Components ── */}
        <Section title="Components">

          <SubSection title="Buttons">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-6">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Variants</p>
                <div className="flex flex-wrap gap-3">
                  <button className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl shadow-sm">Primary</button>
                  <button className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl">Secondary</button>
                  <button className="px-5 py-2.5 text-emerald-600 text-sm font-semibold rounded-xl">Tertiary</button>
                  <button className="px-5 py-2.5 bg-red-500 text-white text-sm font-semibold rounded-xl">Destructive</button>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">States</p>
                <div className="flex flex-wrap gap-3">
                  <button className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl shadow-sm">Default</button>
                  <button className="px-5 py-2.5 bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm">Pressed</button>
                  <button className="px-5 py-2.5 bg-slate-100 text-slate-400 text-sm font-semibold rounded-xl cursor-not-allowed">Disabled</button>
                  <button className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl shadow-sm flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Loading
                  </button>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Sizes</p>
                <div className="flex items-center flex-wrap gap-3">
                  <button className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg">Small</button>
                  <button className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl">Medium</button>
                  <button className="w-48 py-4 bg-emerald-600 text-white text-base font-bold rounded-2xl">Full-width CTA</button>
                </div>
              </div>
            </div>
          </SubSection>

          <SubSection title="Status Badges">
            <div className="flex flex-wrap gap-3">
              {BADGE_VARIANTS.map(b => (
                <div key={b.label} className="px-3 py-1 rounded-full text-xs font-semibold border"
                  style={{ background: b.bg, color: b.text, borderColor: b.border }}>
                  {b.label}
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {['Healthy', 'Low Stock', 'Critical', 'Processing', 'Scheduled', 'Received', 'Needs Review', 'Draft', 'Sent', 'Confirmed', 'Expired'].map(s => (
                <span key={s} className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">{s}</span>
              ))}
            </div>
          </SubSection>

          <SubSection title="Cards">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* KPI Card */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">KPI Card</p>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Total Stock Value</p>
                    <p style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: 28 }} className="text-slate-900">€12.4k</p>
                    <p className="text-xs text-emerald-600 font-medium mt-1">+3.2% vs yesterday</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <span className="text-emerald-600 text-lg">💰</span>
                  </div>
                </div>
              </div>

              {/* Inventory Card */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Inventory Card</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-slate-500">C</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">Chicken Breast</p>
                    <div className="flex gap-3 mt-1">
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 600 }} className="text-slate-700">24.5 kg</span>
                      <span className="text-xs text-red-500 font-medium">−2.5 kg</span>
                    </div>
                  </div>
                  <div className="px-2 py-1 rounded-full text-xs font-semibold" style={{ background: '#fef3c7', color: '#92400e' }}>Low</div>
                </div>
              </div>

              {/* Alert Card */}
              <div className="bg-white rounded-2xl border border-red-100 p-5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Alert Card</p>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-red-500 text-sm">⚠️</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">3 items expiring today</p>
                    <p className="text-xs text-slate-500 mt-0.5">Chicken Breast · Fresh Salmon · Milk</p>
                    <button className="mt-2 text-xs text-red-600 font-semibold">View Expiry →</button>
                  </div>
                </div>
              </div>

              {/* Supplier Card */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Supplier Card</p>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                    <span className="text-emerald-700 font-bold text-sm">MF</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Metro Foods</p>
                    <p className="text-xs text-slate-500">Hans Weber · 2d lead</p>
                  </div>
                  <div className="ml-auto text-xs text-emerald-600 font-semibold">94% on-time</div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-400">Last delivery: <span className="font-medium text-slate-600">08 Mar</span></p>
                  <p style={{ fontFamily: 'JetBrains Mono' }} className="text-xs font-bold text-slate-700">€4,820 YTD</p>
                </div>
              </div>

              {/* Recipe Card */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Recipe Card</p>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Grilled Salmon</p>
                    <p className="text-xs text-slate-500 mt-0.5">Main Course · 4 ingredients</p>
                  </div>
                  <div className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">Active</div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Cost per serving</span>
                  <span style={{ fontFamily: 'JetBrains Mono' }} className="text-sm font-bold text-slate-700">€4.20</span>
                </div>
              </div>

              {/* PO Card */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Purchase Order Card</p>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">PO-0041</p>
                    <p className="text-xs text-slate-500 mt-0.5">Metro Foods · 5 items</p>
                  </div>
                  <div className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">Sent</div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">10 Mar 2026</span>
                  <span style={{ fontFamily: 'JetBrains Mono' }} className="text-sm font-bold text-slate-800">€842.50</span>
                </div>
              </div>
            </div>
          </SubSection>

          <SubSection title="Inputs">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">Text Field</label>
                <input type="text" placeholder="Store name" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">Search</label>
                <div className="relative">
                  <input type="text" placeholder="Search inventory…" className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-200 focus:bg-white transition-all" />
                  <svg className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M16.65 10a6.65 6.65 0 11-13.3 0 6.65 6.65 0 0113.3 0z"/></svg>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">Numeric Field</label>
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
                  <button className="w-12 h-12 bg-slate-50 border-r border-slate-200 text-slate-600 text-lg font-bold flex items-center justify-center">−</button>
                  <input type="number" defaultValue="24.5" className="flex-1 py-3 text-center font-mono font-semibold text-slate-800 text-base outline-none" />
                  <button className="w-12 h-12 bg-slate-50 border-l border-slate-200 text-slate-600 text-lg font-bold flex items-center justify-center">+</button>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">Select</label>
                <select className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white outline-none focus:ring-2 focus:ring-emerald-200 transition-all appearance-none">
                  <option>Kilogram (kg)</option>
                  <option>Litre (L)</option>
                  <option>Pieces (pcs)</option>
                </select>
              </div>
            </div>
          </SubSection>

          <SubSection title="Navigation">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* iOS Bottom Nav */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">iOS Tab Bar</p>
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="h-16 bg-slate-100 flex items-center justify-center">
                    <span className="text-slate-400 text-sm">App content area</span>
                  </div>
                  <div className="flex border-t border-slate-100" style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)' }}>
                    {['Home', 'Inventory', 'Scan', 'Orders', 'More'].map((tab, i) => (
                      <div key={tab} className={`flex-1 flex flex-col items-center py-2 gap-0.5 ${i === 2 ? '' : ''}`}>
                        {i === 2 ? (
                          <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center -mt-6 shadow-lg">
                            <span className="text-white text-xs">●</span>
                          </div>
                        ) : (
                          <span className={`text-[20px] ${i === 0 ? 'text-emerald-600' : 'text-slate-400'}`}>●</span>
                        )}
                        <span className={`text-[10px] font-medium ${i === 0 ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>{tab}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Android Nav */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Android Navigation Bar (MD3)</p>
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="h-16 bg-slate-100 flex items-center justify-center">
                    <span className="text-slate-400 text-sm">App content area</span>
                  </div>
                  <div className="flex items-center border-t border-slate-200 h-16" style={{ background: '#fafafa' }}>
                    {['Home', 'Inventory', 'Scan', 'Orders', 'More'].map((tab, i) => (
                      <div key={tab} className="flex-1 flex flex-col items-center justify-center gap-1">
                        <div className={`w-14 h-8 rounded-full flex items-center justify-center ${i === 0 ? 'bg-emerald-100' : i === 2 ? 'bg-emerald-500' : ''}`}>
                          <span className={`text-[10px] font-bold ${i === 0 ? 'text-emerald-700' : i === 2 ? 'text-white' : 'text-slate-400'}`}>●</span>
                        </div>
                        <span className={`text-[10px] font-medium ${i === 0 ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>{tab}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </SubSection>

          <SubSection title="Feedback States">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Loading */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center gap-3">
                <svg className="w-8 h-8 animate-spin text-emerald-500" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <p className="text-sm font-semibold text-slate-700">Loading</p>
                <p className="text-xs text-slate-400 text-center">Processing POS report…</p>
              </div>

              {/* Empty State */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
                  <span className="text-2xl">📦</span>
                </div>
                <p className="text-sm font-semibold text-slate-700">Empty State</p>
                <p className="text-xs text-slate-400 text-center">No purchase orders yet</p>
                <button className="text-xs text-emerald-600 font-semibold">Create Order</button>
              </div>

              {/* Success */}
              <div className="bg-white rounded-2xl border border-emerald-100 p-6 flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
                  <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <p className="text-sm font-semibold text-emerald-700">Success</p>
                <p className="text-xs text-slate-400 text-center">Stock count saved</p>
              </div>

              {/* Error */}
              <div className="bg-white rounded-2xl border border-red-100 p-6 flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </div>
                <p className="text-sm font-semibold text-red-600">Error</p>
                <p className="text-xs text-slate-400 text-center">Could not read POS report</p>
                <button className="text-xs text-red-600 font-semibold">Retry</button>
              </div>
            </div>

            {/* Snackbar */}
            <div className="mt-4 flex flex-wrap gap-3">
              <div className="flex items-center gap-3 px-5 py-3 bg-slate-900 text-white rounded-2xl text-sm font-medium">
                <span>✓</span> Stock count saved successfully
              </div>
              <div className="flex items-center gap-3 px-5 py-3 bg-amber-500 text-white rounded-2xl text-sm font-medium">
                <span>⚠</span> 3 items need review
              </div>
              <div className="flex items-center gap-3 px-5 py-3 bg-red-500 text-white rounded-2xl text-sm font-medium">
                <span>✗</span> Upload failed — retry
              </div>
            </div>
          </SubSection>
        </Section>

        {/* ── Semantic Usage ── */}
        <Section title="Semantic Color Usage">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', title: 'Healthy / In Stock', desc: 'Physical stock meets or exceeds safety level. Positive operational outcomes. Completed actions.' },
              { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', title: 'Warning / Low Stock', desc: 'Stock approaching safety threshold. Items nearing expiration (7+ days). Attention required but not urgent.' },
              { color: '#ef4444', bg: '#fef2f2', border: '#fecaca', title: 'Critical / Expired', desc: 'Stock below safety level or depleted. Items expired or expiring within 3 days. Major variance detected.' },
              { color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', title: 'Info / Processing', desc: 'OCR scan in progress. Neutral system information. Non-urgent notifications. Pending actions.' },
              { color: '#94a3b8', bg: '#f8fafc', border: '#e2e8f0', title: 'Neutral / Inactive', desc: 'Archived records, completed historical entries. Inactive items. Secondary metadata. Disabled states.' },
              { color: '#8b5cf6', bg: '#f3e8ff', border: '#e9d5ff', title: 'Admin / Elevated', desc: 'Administrator role indicator. Elevated permission actions. Role-based access control UI elements.' },
            ].map(s => (
              <div key={s.title} className="rounded-2xl p-5 border" style={{ background: s.bg, borderColor: s.border }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: s.color }} />
                  <p className="text-sm font-bold" style={{ color: s.color }}>{s.title}</p>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Footer */}
        <footer className="text-center py-10 border-t border-slate-200 mt-8">
          <p className="text-sm font-semibold text-slate-500">StockPulse Design System · F&B Inventory Intelligence</p>
          <p className="text-xs text-slate-400 mt-1">DM Sans · JetBrains Mono · 8pt Grid · Emerald Brand</p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <a href="/app" className="text-sm text-emerald-600 font-semibold hover:text-emerald-700">Mobile App</a>
            <span className="text-slate-300">·</span>
            <a href="/prototype" className="text-sm text-emerald-600 font-semibold hover:text-emerald-700">Prototype Preview</a>
          </div>
        </footer>
      </main>
    </div>
  )
}
