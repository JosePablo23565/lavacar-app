import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function RutaProtegida({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Cargando...</div>
  }

  if (!user) {
    return <Navigate to="/acceder" replace />
  }

  return <>{children}</>
}