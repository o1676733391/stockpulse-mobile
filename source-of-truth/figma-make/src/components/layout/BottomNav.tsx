import { Home, Package, ScanLine, ShoppingCart, MoreHorizontal } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import type { Screen } from '../../types'

const TABS = [
  { id: 'home',      label: 'Home',      Icon: Home,          screen: 'home'      as Screen },
  { id: 'inventory', label: 'Inventory', Icon: Package,       screen: 'inventory' as Screen },
  { id: 'scan',      label: 'Scan',      Icon: ScanLine,      screen: 'scan'      as Screen },
  { id: 'orders',    label: 'Orders',    Icon: ShoppingCart,  screen: 'orders'    as Screen },
  { id: 'more',      label: 'More',      Icon: MoreHorizontal,screen: 'more'      as Screen },
]

export function BottomNav() {
  const { platform, activeTab, navigate, setActiveTab } = useApp()
  const ios = platform === 'ios'

  const go = (tab: typeof TABS[0]) => {
    setActiveTab(tab.id)
    navigate(tab.screen)
  }

  if (ios) {
    // iOS tab bar — translucent background, labels below icons
    return (
      <div
        className="flex-shrink-0 flex border-t"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderColor: 'rgba(0,0,0,0.1)',
          // env() returns the real home-indicator inset on device; max() keeps at least 20px in prototype/desktop
          paddingBottom: 'max(env(safe-area-inset-bottom), 20px)',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
        }}
      >
        {TABS.map(tab => {
          const active = activeTab === tab.id
          const isScan = tab.id === 'scan'
          return (
            <button
              key={tab.id}
              onClick={() => go(tab)}
              className="flex-1 flex flex-col items-center pt-2 gap-0.5"
            >
              {isScan ? (
                // Elevated scan button for iOS
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center -mt-6 shadow-lg transition-colors
                  ${active ? 'bg-emerald-700' : 'bg-emerald-600'}`}>
                  <tab.Icon size={22} color="white" strokeWidth={2} />
                </div>
              ) : (
                <tab.Icon
                  size={24}
                  strokeWidth={active ? 2.5 : 1.8}
                  className={active ? 'text-emerald-600' : 'text-slate-400'}
                />
              )}
              <span className={`text-[10px] leading-none font-medium ${
                isScan ? (active ? 'text-emerald-600' : 'text-slate-400') :
                active ? 'text-emerald-600 font-semibold' : 'text-slate-400'
              }`}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    )
  }

  // Android — Material Design 3 Navigation Bar
  return (
    <div
      className="flex-shrink-0 flex items-center border-t"
      style={{
        background: '#fafafa',
        borderColor: '#e2e8f0',
        // env() covers gesture-nav bar inset; max() keeps min height in prototype/desktop
        paddingTop: 8,
        paddingBottom: 'max(env(safe-area-inset-bottom), 12px)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      {TABS.map(tab => {
        const active = activeTab === tab.id
        const isScan = tab.id === 'scan'
        return (
          <button
            key={tab.id}
            onClick={() => go(tab)}
            className="flex-1 flex flex-col items-center justify-center gap-1 h-full"
          >
            {/* MD3 indicator pill on active */}
            <div className={`flex items-center justify-center rounded-full transition-all duration-200 ${
              isScan
                ? `w-14 h-8 ${active ? 'bg-emerald-600' : 'bg-emerald-500'} shadow-md`
                : `w-14 h-8 ${active ? 'bg-emerald-100' : 'bg-transparent'}`
            }`}>
              <tab.Icon
                size={20}
                strokeWidth={active ? 2.5 : 1.8}
                className={
                  isScan ? 'text-white' :
                  active ? 'text-emerald-700' : 'text-slate-500'
                }
              />
            </div>
            <span className={`text-[10px] leading-none font-medium ${
              active ? 'text-emerald-700 font-semibold' : 'text-slate-500'
            }`}>
              {tab.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
