import { AppProvider, useApp } from '../context/AppContext'
import { BottomNav } from '../components/layout/BottomNav'
import { ScreenContent, AUTH_SCREENS, FULLBLEED_SCREENS } from '../components/ScreenContent'
import type { Platform, UserRole, Screen } from '../types'

// ─── Phone Frame ──────────────────────────────────────────────────────────────

function PhoneFrame({ platform, w, h }: { platform: Platform; w: number; h: number }) {
  const { screen } = useApp()
  const ios     = platform === 'ios'
  const isAuth  = AUTH_SCREENS.includes(screen)
  const noNav   = FULLBLEED_SCREENS.includes(screen) || isAuth
  const statusH = ios ? 54 : 36

  return (
    <div
      style={{
        width: w + 20,
        height: h + 44,
        background: '#18181b',
        borderRadius: 56,
        padding: 10,
        boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 32px 64px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)',
        flexShrink: 0,
        position: 'relative',
      }}
    >
      {/* Side buttons */}
      <div style={{ position:'absolute', left: 6, top: 120, width: 3, height: 32, background:'#3f3f46', borderRadius: 2 }} />
      <div style={{ position:'absolute', left: 6, top: 172, width: 3, height: 48, background:'#3f3f46', borderRadius: 2 }} />
      <div style={{ position:'absolute', left: 6, top: 232, width: 3, height: 48, background:'#3f3f46', borderRadius: 2 }} />
      <div style={{ position:'absolute', right: 6, top: 152, width: 3, height: 64, background:'#3f3f46', borderRadius: 2 }} />

      {/* Screen */}
      <div style={{ width: w, height: h, borderRadius: 48, overflow: 'hidden', background:'#fff', display:'flex', flexDirection:'column' }}>

        {/* Status Bar */}
        <div style={{ flexShrink: 0, height: statusH, background:'white', display:'flex', alignItems:'flex-end', justifyContent:'space-between', paddingLeft: 20, paddingRight: 20, paddingBottom: 6 }}>
          {ios ? (
            <>
              <div style={{ position:'absolute', top: 24, left:'50%', transform:'translateX(-50%)', width: 120, height: 34, background:'#000', borderRadius: 24 }} />
              <span style={{ fontSize: 15, fontWeight: 600, color:'#1a1a1a', fontFamily:'DM Sans' }}>9:41</span>
              <div style={{ display:'flex', alignItems:'center', gap: 6 }}>
                <svg width="18" height="12" viewBox="0 0 18 12"><rect x="0" y="4" width="3" height="8" rx="1" fill="#1a1a1a"/><rect x="5" y="2.5" width="3" height="9.5" rx="1" fill="#1a1a1a"/><rect x="10" y="0" width="3" height="12" rx="1" fill="#1a1a1a"/><rect x="15" y="0" width="3" height="12" rx="1" fill="#d1d5db"/></svg>
                <svg width="16" height="12" viewBox="0 0 16 12"><path d="M8 3C5.4 3 3.1 4 1.4 5.7l1.4 1.4C4 5.9 5.9 5 8 5s4 .9 5.2 2.1l1.4-1.4C12.9 4 10.6 3 8 3zm0 3.6c-1.7 0-3.2.7-4.3 1.8l1.4 1.4c.8-.8 1.8-1.2 2.9-1.2s2.1.4 2.9 1.2l1.4-1.4C11.2 7.3 9.7 6.6 8 6.6zm0 3.6c-.8 0-1.5.3-2 .8L8 13l2-.8c-.5-.5-1.2-.8-2-.8z" fill="#1a1a1a"/></svg>
                <svg width="26" height="13" viewBox="0 0 26 13"><rect x=".5" y=".5" width="22" height="12" rx="3.5" stroke="#1a1a1a" strokeOpacity=".35"/><rect x="2" y="2" width="18" height="9" rx="2" fill="#1a1a1a"/><path d="M24 4.5v4a2 2 0 000-4z" fill="#1a1a1a" fillOpacity=".4"/></svg>
              </div>
            </>
          ) : (
            <>
              <span style={{ fontSize: 13, fontWeight: 600, color:'#1a1a1a', fontFamily:'DM Sans' }}>9:41</span>
              <div style={{ display:'flex', alignItems:'center', gap: 5 }}>
                <svg width="14" height="10" viewBox="0 0 14 10"><rect x="0" y="2" width="2.5" height="8" rx="0.8" fill="#1a1a1a"/><rect x="3.5" y="1" width="2.5" height="9" rx="0.8" fill="#1a1a1a"/><rect x="7" y="0" width="2.5" height="10" rx="0.8" fill="#1a1a1a"/><rect x="10.5" y="0" width="2.5" height="10" rx="0.8" fill="#d1d5db"/></svg>
                <svg width="13" height="10" viewBox="0 0 13 10"><path d="M6.5 2C4.3 2 2.3 2.9.8 4.3l1.2 1.2C3.1 4.3 4.7 3.6 6.5 3.6s3.4.7 4.5 1.9l1.2-1.2C10.7 2.9 8.7 2 6.5 2zm0 3.2c-1.5 0-2.9.6-3.9 1.6l1.2 1.2c.7-.7 1.7-1.2 2.7-1.2s2 .5 2.7 1.2l1.2-1.2c-1-.9-2.4-1.6-3.9-1.6zm0 3.2c-.7 0-1.3.3-1.7.7L6.5 11l1.7-.9c-.4-.4-1-.7-1.7-.7z" fill="#1a1a1a"/></svg>
                <svg width="22" height="10" viewBox="0 0 22 10"><rect x=".5" y=".5" width="18" height="9" rx="2.5" stroke="#1a1a1a" strokeOpacity=".35"/><rect x="2" y="1.5" width="14" height="7" rx="1.5" fill="#1a1a1a"/><path d="M20 3.5v3a1.5 1.5 0 000-3z" fill="#1a1a1a" fillOpacity=".4"/></svg>
              </div>
            </>
          )}
        </div>

        {/* App content */}
        <div style={{ flex: 1, display:'flex', flexDirection:'column', minHeight: 0 }}>
          {noNav ? (
            <ScreenContent />
          ) : (
            <>
              <div style={{ flex: 1, minHeight: 0 }}>
                <ScreenContent />
              </div>
              <BottomNav />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Nav Pill ─────────────────────────────────────────────────────────────────

function NavPill({ label, screen: s, active }: { label: string; screen: Screen; active: boolean }) {
  const { navigate } = useApp()
  return (
    <button
      onClick={() => navigate(s)}
      className={`w-full text-left px-3 py-2 rounded-xl text-[12px] font-medium transition-all
        ${active
          ? 'bg-emerald-500/15 text-emerald-300 font-semibold'
          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
        }`}
    >
      {label}
    </button>
  )
}

// ─── Prototype Shell ──────────────────────────────────────────────────────────

function ProtoShell() {
  const { platform, setPlatform, role, setRole, screen } = useApp()
  const ios = platform === 'ios'
  const W = ios ? 393 : 412
  const H = ios ? 812 : 850

  const mainNav: [Screen, string][] = [
    ['home',         '🏠 Dashboard'],
    ['inventory',    '📦 Inventory'],
    ['active-count', '✅ Stock Count'],
    ['scan',         '📷 POS Camera'],
    ['ocr-review',   '🔍 OCR Review'],
    ['orders',       '🛒 Orders'],
    ['poq',          '📊 POQ'],
    ['expiration',   '⏰ Expiry Alerts'],
    ['more',         '⋯  More'],
    ['recipes',      '👨‍🍳 Recipes'],
    ['suppliers',    '🚚 Suppliers'],
    ['reports',      '📈 Reports'],
    ['team',         '👥 Team'],
    ['settings',     '⚙️  Settings'],
  ]

  const subNav: [Screen, string][] = [
    ['splash',           '💫 Splash'],
    ['welcome',          '👋 Welcome'],
    ['login',            '🔑 Login'],
    ['forgot-password',  '🔒 Forgot PW'],
    ['onboarding',       '🏪 Onboarding'],
    ['inventory-detail', '📋 Item Detail'],
    ['count-summary',    '📝 Count Summary'],
    ['ocr-processing',   '⚙️  OCR Processing'],
    ['ocr-result',       '✅ OCR Result'],
    ['purchase-order',   '📄 PO Detail'],
    ['waste-reduction',  '♻️  Waste Reduction'],
    ['expiration-item',  '⏰ Expiry Detail'],
    ['new-receipt',      '📥 New Receipt'],
    ['goods-receipts',   '🚚 Receipts'],
    ['supplier-detail',  '🏭 Supplier Detail'],
    ['archive',          '🗃️  Archive'],
    ['audit-log',        '🔒 Audit Log'],
    ['notifications',    '🔔 Notifications'],
    ['add-member',       '➕ Add Member'],
    ['member-detail',    '👤 Member Detail'],
    ['role-editor',      '🛡️  Role Editor'],
    ['recipe-detail',    '🍽️  Recipe Detail'],
    ['create-recipe',    '➕ Create Recipe'],
    ['edit-recipe',      '✏️  Edit Recipe'],
  ]

  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{ background: 'linear-gradient(145deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}
    >
      {/* Top bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 border-b border-white/5">
        <div className="flex items-center gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-900/40">
              <span className="text-white font-bold text-[15px]">SP</span>
            </div>
            <div>
              <p className="text-white font-bold text-[15px] leading-none">StockPulse</p>
              <p className="text-slate-400 text-[11px] mt-0.5">Prototype Preview</p>
            </div>
          </div>
          {/* Page links */}
          <div className="flex items-center gap-1 ml-4">
            <a href="/app" className="px-3 py-1.5 text-[12px] text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              Mobile App
            </a>
            <span className="text-white/20 text-[12px] font-semibold px-1 py-1.5 rounded-lg bg-white/5 border border-white/10">
              Prototype
            </span>
            <a href="/design-system" className="px-3 py-1.5 text-[12px] text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              Design System
            </a>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-0.5 bg-white/8 rounded-xl p-1 border border-white/8">
            {(['ios', 'android'] as Platform[]).map(p => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className={`px-4 py-1.5 rounded-lg text-[12px] font-semibold transition-all
                  ${platform === p
                    ? 'bg-white text-slate-900 shadow'
                    : 'text-white/50 hover:text-white/80'}`}
              >
                {p === 'ios' ? '🍎 iOS' : '🤖 Android'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-0.5 bg-white/8 rounded-xl p-1 border border-white/8">
            {(['admin', 'manager', 'staff'] as UserRole[]).map(r => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all capitalize
                  ${role === r
                    ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-900/40'
                    : 'text-white/50 hover:text-white/80'}`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-start justify-center gap-6 px-6 py-6 overflow-auto">

        {/* Left nav */}
        <div className="flex-shrink-0 w-44 flex flex-col gap-0.5 pt-2">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.1em] px-3 mb-1">Main Screens</p>
          {mainNav.map(([s, label]) => (
            <NavPill key={s} screen={s} label={label} active={screen === s} />
          ))}
          <div className="h-px bg-white/5 my-2" />
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.1em] px-3 mb-1">Sub-screens</p>
          {subNav.map(([s, label]) => (
            <NavPill key={s} screen={s} label={label} active={screen === s} />
          ))}
        </div>

        {/* Phone preview */}
        <div className="flex-shrink-0 flex flex-col items-center gap-4">
          <PhoneFrame platform={platform} w={W} h={H} />
          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span className="font-mono">{W} × {H}</span>
            <span className="w-1 h-1 rounded-full bg-slate-600" />
            <span>{ios ? 'iPhone 15 Pro · iOS 17' : 'Pixel 8 · Android 14'}</span>
            <span className="w-1 h-1 rounded-full bg-slate-600" />
            <span className="capitalize text-emerald-400 font-semibold">{role}</span>
          </div>
        </div>

        {/* Right inspector */}
        <div className="flex-shrink-0 w-44 flex flex-col gap-4 pt-2">
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.1em] px-1 mb-2">Active Screen</p>
            <div className="bg-white/5 rounded-2xl px-4 py-3 border border-white/8">
              <p className="text-[13px] font-mono text-emerald-300 font-semibold">{screen}</p>
              <p className="text-[11px] text-slate-500 mt-1">{ios ? 'iOS · HIG' : 'Android · MD3'}</p>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.1em] px-1 mb-2">Design System</p>
            <div className="bg-white/5 rounded-2xl px-4 py-3 border border-white/8 flex flex-col gap-2">
              {[
                { label: 'Type',    val: 'DM Sans' },
                { label: 'Mono',    val: 'JetBrains Mono' },
                { label: 'Grid',    val: '8pt' },
                { label: 'Primary', val: 'Emerald-600' },
                { label: 'Mode',    val: 'Light' },
              ].map(r => (
                <div key={r.label} className="flex justify-between">
                  <span className="text-[11px] text-slate-500">{r.label}</span>
                  <span className="text-[11px] text-slate-300 font-medium">{r.val}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.1em] px-1 mb-2">Semantic Colors</p>
            <div className="flex flex-col gap-1.5">
              {[
                { label: 'Healthy / In Stock',  color: '#059669' },
                { label: 'Warning / Low Stock', color: '#f59e0b' },
                { label: 'Critical / Expired',  color: '#ef4444' },
                { label: 'Info / Processing',   color: '#3b82f6' },
                { label: 'Neutral / Inactive',  color: '#94a3b8' },
              ].map(c => (
                <div key={c.label} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: c.color }} />
                  <span className="text-[11px] text-slate-400">{c.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-2 pt-4 border-t border-white/5">
            <a href="/design-system"
              className="block w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-center text-[12px] text-slate-300 hover:bg-white/10 transition-colors">
              View Design System →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PrototypePage() {
  return (
    <AppProvider>
      <ProtoShell />
    </AppProvider>
  )
}
