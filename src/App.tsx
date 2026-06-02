import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { Home } from './components/tsx/Home'
import { AppointmentForm } from './components/tsx/AppointmentForm'
import { AdminDashboard } from './pages/tsx/AdminDashboard'
import { Contact } from './components/tsx/Contact'
import { Opiniones } from './components/tsx/Opiniones'
import { ClienteLogin } from './pages/tsx/ClienteLogin'
import { ClienteRegistro } from './pages/tsx/ClienteRegistro'
import { useState, useEffect } from 'react'
import { useAuth } from './context/AuthContext'
import { CompletarPerfil } from './pages/tsx/CompletarPerfil'
import './App.navbar.css'

// Componente para rutas protegidas
function RutaProtegida({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Cargando...</div>
  }

  if (!user) {
    return <Navigate to="/acceder" replace />
  }

  return <>{children}</>
}

function NavBar() {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [scrolling, setScrolling] = useState(false)
  const location = useLocation()
  const { user, perfil, signOut } = useAuth()

  useEffect(() => {
    const handleScroll = () => {
      setScrolling(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuAbierto ? 'hidden' : 'auto'
    return () => { document.body.style.overflow = 'auto' }
  }, [menuAbierto])

  const cerrarMenu = () => setMenuAbierto(false)

  const handleLogout = async () => {
    await signOut()
    cerrarMenu()
  }

  const navLinks = [
    { path: '/', name: 'Inicio' },
    { path: '/agendar', name: 'Agendar' },
    { path: '/contacto', name: 'Contacto' },
    { path: '/opiniones', name: 'Opiniones' },
  ]

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true
    if (path !== '/' && location.pathname.startsWith(path)) return true
    return false
  }

  const isAdmin = perfil?.is_admin === true
  const userEmail = user?.email || 'usuario'
  const userInitial = userEmail.charAt(0).toUpperCase()

  return (
    <>

      <nav className={`navbar-modern ${scrolling ? 'scrolled' : ''}`}>
        <div className="navbar-container">
          <Link to="/" className="navbar-logo" onClick={cerrarMenu}>
            <div className="navbar-logo-text">
              Autolavado Camaro Fraterno
            </div>
          </Link>

          <button 
            className="menu-btn" 
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setMenuAbierto(!menuAbierto)
            }}
          >
            <div className={`menu-icon ${menuAbierto ? 'open' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </button>
        </div>
      </nav>

      <div className={`menu-overlay ${menuAbierto ? 'open' : ''}`} onClick={cerrarMenu} />

      <div className={`nav-menu ${menuAbierto ? 'open' : ''}`}>
        <div className="menu-user-profile">
          <div className="user-avatar">
            {userInitial}
          </div>
          <div className="user-info">
            <div className="user-email">{userEmail}</div>
            {isAdmin && <div className="user-badge">Administrador</div>}
          </div>
        </div>

        <div className="nav-links">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
              onClick={cerrarMenu}
            >
              <span>{link.name}</span>
            </Link>
          ))}

          {isAdmin && (
            <Link 
              to="/admin" 
              className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}
              onClick={cerrarMenu}
            >
              <span>Admin</span>
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="nav-link logout-btn"
          >
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      <div className="navbar-spacer"></div>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen">
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

            <Route path="/acceder" element={<ClienteLogin />} />
            <Route path="/registro" element={<ClienteRegistro />} />
            <Route path="/completar-perfil" element={<CompletarPerfil />} />

            <Route
              path="/admin"
              element={
                <RutaProtegida>
                  <>
                    <NavBar />
                    <AdminDashboard />
                  </>
                </RutaProtegida>
              }
            />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App