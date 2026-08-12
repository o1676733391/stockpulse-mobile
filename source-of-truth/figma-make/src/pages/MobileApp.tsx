import { useEffect } from 'react'
import { AppProvider, useApp } from '../context/AppContext'
import { BottomNav } from '../components/layout/BottomNav'
import { ScreenContent, AUTH_SCREENS, FULLBLEED_SCREENS } from '../components/ScreenContent'

function MobileLayout() {
  const { screen, setPlatform } = useApp()

  // Auto-detect platform from user agent once on mount
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase()
    setPlatform(/android/.test(ua) ? 'android' : 'ios')
  }, [setPlatform])

  const isAuth = AUTH_SCREENS.includes(screen)
  const noNav  = FULLBLEED_SCREENS.includes(screen) || isAuth

  return (
    /*
     * Outer shell — background fills to physical screen edges (behind status bar
     * and home indicator) thanks to viewport-fit=cover in index.html.
     * Safe-area padding pushes the app chrome into the visible area.
     */
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        /* 100dvh = full viewport including area behind Dynamic Island / notch */
        height: '100dvh',
        width: '100%',
        /* Caps at 430px on desktop, fills 100% on any real phone */
        maxWidth: 430,
        margin: '0 auto',
        /* White extends edge-to-edge behind the status bar */
        background: '#ffffff',
        /* Push content below the status bar / Dynamic Island */
        paddingTop: 'env(safe-area-inset-top)',
        /* Landscape: keep content out of notch zones */
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
        /* BottomNav handles its own bottom inset — no container padding needed */
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {noNav ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <ScreenContent />
        </div>
      ) : (
        <>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <ScreenContent />
          </div>
          <BottomNav />
        </>
      )}
    </div>
  )
}

export default function MobileApp() {
  return (
    <AppProvider>
      {/*
       * Outer wrapper sets the page background visible on desktop (when the
       * 430px column is centered). On a real phone this div fills behind the
       * column so the safe-area sides match.
       */}
      <div style={{ minHeight: '100dvh', background: '#f8fafc' }}>
        <MobileLayout />
      </div>
    </AppProvider>
  )
}
