import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Platform, UserRole, Screen } from '../types'

interface AppContextValue {
  platform: Platform
  setPlatform: (p: Platform) => void
  role: UserRole
  setRole: (r: UserRole) => void
  screen: Screen
  params: Record<string, unknown>
  navigate: (screen: Screen, params?: Record<string, unknown>) => void
  goBack: () => void
  canGoBack: boolean
  activeTab: string
  setActiveTab: (tab: string) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [platform, setPlatform] = useState<Platform>('ios')
  const [role, setRole] = useState<UserRole>('admin')
  const [screenStack, setScreenStack] = useState<Array<{ screen: Screen; params: Record<string, unknown> }>>([
    { screen: 'splash', params: {} }
  ])
  const [activeTab, setActiveTab] = useState('home')

  const current = screenStack[screenStack.length - 1]

  const navigate = (screen: Screen, params: Record<string, unknown> = {}) => {
    setScreenStack(prev => [...prev, { screen, params }])
    if (['home', 'inventory', 'scan', 'orders', 'more'].includes(screen)) {
      setActiveTab(screen)
    }
  }

  const goBack = () => {
    if (screenStack.length > 1) {
      setScreenStack(prev => prev.slice(0, -1))
    }
  }

  return (
    <AppContext.Provider value={{
      platform, setPlatform,
      role, setRole,
      screen: current.screen,
      params: current.params,
      navigate, goBack,
      canGoBack: screenStack.length > 1,
      activeTab, setActiveTab,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
