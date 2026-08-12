import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function RutaProtegida({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading-spinner" />
        <div className="app-loading-text">Cargando...</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/acceder" replace />
  }

  return <>{children}</>
}
