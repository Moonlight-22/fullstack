import { Loader2 } from 'lucide-react'
import AuthPanel from './components/auth/AuthPanel.jsx'
import { useAuth } from './context/AuthContext.jsx'
import AdminShell from './pages/AdminShell.jsx'
import ClientApp from './pages/ClientApp.jsx'
import WorkerApp from './pages/WorkerApp.jsx'

function App() {
  const { user, loading, logout } = useAuth()

  const signOut = async () => {
    await logout()
  }

  if (loading) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="app-shell min-h-screen">
        <AuthPanel />
      </div>
    )
  }

  if (user.role === 'client') {
    return <ClientApp onSignOut={signOut} />
  }

  if (user.role === 'worker') {
    return <WorkerApp onSignOut={signOut} />
  }

  return <AdminShell onSignOut={signOut} />
}

export default App
