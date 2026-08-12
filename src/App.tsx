import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { Home } from './components/Home/Home'
import { AppointmentForm } from './components/AppointmentForm/AppointmentForm'
import { Contact } from './components/Contact/Contact'
import { Opiniones } from './components/Opiniones/Opiniones'
import { ClienteAuth } from './pages/ClienteAuth/ClienteAuth'
import { ActualizarContrasena } from './pages/ActualizarContrasena/ActualizarContrasena'
import { CompletarPerfil } from './pages/CompletarPerfil/CompletarPerfil'
import { RutaProtegida } from './components/RutaProtegida/RutaProtegida'
import { NavBar } from './components/NavBar/NavBar'
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary'

// Solo lo usa el administrador: se descarga al entrar a /admin
const AdminDashboard = lazy(() =>
  import('./pages/AdminDashboard/AdminDashboard').then(m => ({ default: m.AdminDashboard }))
)

// Cada pagina empieza desde arriba
function IrArriba() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
        <IrArriba />
        <div className="app-shell">
          <Routes>
            <Route
              path="/"
              element={
                <RutaProtegida>
                  <>
                    <NavBar />
                    <Home />
                  </>
                </RutaProtegida>
              }
            />
            <Route
              path="/agendar"
              element={
                <RutaProtegida>
                  <>
                    <NavBar />
                    <AppointmentForm />
                  </>
                </RutaProtegida>
              }
            />
            <Route
              path="/contacto"
              element={
                <RutaProtegida>
                  <>
                    <NavBar />
                    <Contact />
                  </>
                </RutaProtegida>
              }
            />
            <Route
              path="/opiniones"
              element={
                <RutaProtegida>
                  <>
                    <NavBar />
                    <Opiniones />
                  </>
                </RutaProtegida>
              }
            />
            <Route path="/acceder" element={<ClienteAuth />} />
            <Route path="/completar-perfil" element={<CompletarPerfil />} />
            <Route path="/actualizar-contrasena" element={<ActualizarContrasena />} />
            <Route
              path="/admin"
              element={
                <RutaProtegida>
                  <>
                    <NavBar />
                    <Suspense
                      fallback={
                        <div className="app-loading">
                          <div className="app-loading-spinner" />
                          <div className="app-loading-text">Cargando panel...</div>
                        </div>
                      }
                    >
                      <AdminDashboard />
                    </Suspense>
                  </>
                </RutaProtegida>
              }
            />
          </Routes>
        </div>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
