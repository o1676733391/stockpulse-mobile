import MobileApp from './pages/MobileApp'
import PrototypePage from './pages/PrototypePage'
import DesignSystemPage from './pages/DesignSystemPage'

const path = window.location.pathname

export default function App() {
  if (path.startsWith('/design-system')) return <DesignSystemPage />
  if (path.startsWith('/app'))           return <MobileApp />
  // Default: /prototype or /
  return <PrototypePage />
}
