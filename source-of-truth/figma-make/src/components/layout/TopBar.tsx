import { ChevronLeft, ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { useApp } from '../../context/AppContext'

interface TopBarProps {
  title: string
  subtitle?: string
  onBack?: () => void
  right?: ReactNode
  large?: boolean           // iOS large title / Android expanded header
  transparent?: boolean     // overlay mode (over camera etc.)
}

export function TopBar({ title, subtitle, onBack, right, large = false, transparent = false }: TopBarProps) {
  const { platform, goBack, canGoBack } = useApp()
  const ios = platform === 'ios'
  const handleBack = onBack ?? (canGoBack ? goBack : undefined)

  const bg = transparent ? 'bg-transparent' : 'bg-white'
  const border = transparent ? '' : 'border-b border-slate-100'

  if (ios) {
    // ─── iOS Navigation Bar ────────────────────────────────────────────────
    return (
      <div className={`flex-shrink-0 ${bg} ${border}`}>
        {/* Standard bar row — relative so the absolute title is clipped within it */}
        <div className="relative flex items-center justify-between px-4 py-2 min-h-[44px]">
          {/* Leading — back button */}
          <div className="min-w-[64px] flex items-center z-10">
            {handleBack ? (
              <button
                onClick={handleBack}
                className="flex items-center gap-0.5 text-emerald-600 font-medium active:opacity-60 transition-opacity"
              >
                <ChevronLeft size={20} strokeWidth={2.5} />
                <span className="text-[17px] leading-none">Back</span>
              </button>
            ) : null}
          </div>

          {/* Center title — absolutely centred but bounded by leading/trailing slots */}
          {!large && (
            <h1
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{ paddingLeft: 80, paddingRight: 80 }}
            >
              <span className="text-[17px] font-semibold text-slate-900 leading-none truncate">
                {title}
              </span>
            </h1>
          )}

          {/* Trailing */}
          <div className="min-w-[64px] flex items-center justify-end gap-1 z-10">
            {right}
          </div>
        </div>

        {/* Large title — sits below bar row */}
        {large && (
          <div className="px-4 pb-3">
            <h1 className="text-[34px] font-bold text-slate-900 leading-tight tracking-tight">{title}</h1>
            {subtitle && <p className="text-[15px] text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
        )}
      </div>
    )
  }

  // ─── Android Material Top App Bar ─────────────────────────────────────────
  // Compact: 64 dp  |  Medium (large): 112 dp
  return (
    <div className={`flex-shrink-0 ${bg} ${border}`}>
      {large ? (
        // Medium top app bar — two-row
        <div>
          <div className="flex items-center justify-between px-2 pt-2" style={{ minHeight: 64 }}>
            <div className="flex items-center">
              {handleBack && (
                <button onClick={handleBack} className="w-10 h-10 rounded-full flex items-center justify-center active:bg-slate-100 mr-1">
                  <ArrowLeft size={24} className="text-slate-700" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-1 pr-2">{right}</div>
          </div>
          <div className="px-4 pb-4">
            <h1 className="text-[28px] font-semibold text-slate-900 leading-tight tracking-tight">{title}</h1>
            {subtitle && <p className="text-[14px] text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
      ) : (
        // Small top app bar — single row
        <div className="flex items-center gap-2 px-2" style={{ minHeight: 64 }}>
          {handleBack && (
            <button onClick={handleBack} className="w-10 h-10 rounded-full flex items-center justify-center active:bg-slate-100 flex-shrink-0">
              <ArrowLeft size={24} className="text-slate-700" />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-[22px] font-semibold text-slate-900 leading-tight truncate">{title}</h1>
            {subtitle && <p className="text-[12px] text-slate-500 truncate">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">{right}</div>
        </div>
      )}
    </div>
  )
}
