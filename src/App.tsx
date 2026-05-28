import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { Home } from './components/Home'
import { AppointmentForm } from './components/AppointmentForm'
import { AdminDashboard } from './pages/AdminDashboard'
import { Contact } from './components/Contact'
import { Opiniones } from './components/Opiniones'
import { ClienteLogin } from './pages/ClienteLogin'
import { ClienteRegistro } from './pages/ClienteRegistro'
import { useState, useEffect } from 'react'
import { useAuth } from './context/AuthContext'

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
      if (window.scrollY > 10) {
        setScrolling(true)
      } else {
        setScrolling(false)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (menuAbierto) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [menuAbierto])

  const cerrarMenu = () => {
    setMenuAbierto(false)
  }

  const handleLogout = async () => {
    await signOut()
    cerrarMenu()
  }

  // Links base (siempre visibles)
  const navLinks = [
    { path: '/', name: 'Inicio', icon: '🏠' },
    { path: '/agendar', name: 'Agendar', icon: '📅' },
    { path: '/contacto', name: 'Contacto', icon: '📞' },
    { path: '/opiniones', name: 'Opiniones', icon: '⭐' },
  ]

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true
    if (path !== '/' && location.pathname.startsWith(path)) return true
    return false
  }

  // Verificar si el usuario es admin
  const isAdmin = perfil?.is_admin === true

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=DM+Sans:wght@400;500&display=swap');

        header:not(.navbar-modern), 
        nav:not(.navbar-modern),
        .old-navbar {
          display: none !important;
        }

        .navbar-modern {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          padding: 0.75rem 2rem;
          transition: all 0.3s ease;
          font-family: 'DM Sans', sans-serif;
        }

        .navbar-modern.scrolled {
          background: rgba(10, 14, 26, 0.95);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(14, 184, 208, 0.2);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }

        .navbar-modern:not(.scrolled) {
          background: transparent;
        }

        .navbar-container {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .navbar-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          text-decoration: none;
          position: relative;
          z-index: 101;
        }

        .navbar-logo-icon {
          font-size: 2rem;
          transition: transform 0.3s ease;
        }

        .navbar-logo:hover .navbar-logo-icon {
          transform: scale(1.1) rotate(-5deg);
        }

        .navbar-logo-text {
          font-family: 'Sora', sans-serif;
          font-size: 1.3rem;
          font-weight: 700;
          background: linear-gradient(135deg, #fff, #0eb8d0);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .navbar-logo-dot {
          width: 8px;
          height: 8px;
          background: #0eb8d0;
          border-radius: 50%;
          display: inline-block;
          margin-left: 2px;
          animation: pulseDot 2s infinite;
        }

        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }

        .menu-btn {
          width: 48px;
          height: 48px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          position: relative;
          z-index: 101;
        }

        .menu-btn:hover {
          background: rgba(14, 184, 208, 0.2);
          border-color: rgba(14, 184, 208, 0.4);
          transform: scale(1.02);
        }

        .menu-icon {
          position: relative;
          width: 24px;
          height: 24px;
        }

        .menu-icon span {
          position: absolute;
          width: 24px;
          height: 2px;
          background: white;
          border-radius: 2px;
          transition: all 0.3s ease;
        }

        .menu-icon span:nth-child(1) { top: 4px; }
        .menu-icon span:nth-child(2) { top: 11px; }
        .menu-icon span:nth-child(3) { top: 18px; }

        .menu-icon.open span:nth-child(1) {
          transform: rotate(45deg);
          top: 11px;
        }

        .menu-icon.open span:nth-child(2) {
          opacity: 0;
          transform: translateX(-10px);
        }

        .menu-icon.open span:nth-child(3) {
          transform: rotate(-45deg);
          top: 11px;
        }

        .menu-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(8px);
          z-index: 98;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
        }

        .menu-overlay.open {
          opacity: 1;
          visibility: visible;
        }

        .nav-menu {
          position: fixed;
          top: 0;
          right: 0;
          width: 100%;
          max-width: 300px;
          height: 100vh;
          background: linear-gradient(135deg, #0f1e3a, #0a0e1a);
          z-index: 99;
          transform: translateX(100%);
          transition: transform 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1);
          padding: 2rem 1.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          border-left: 1px solid rgba(14, 184, 208, 0.2);
          box-shadow: -10px 0 30px rgba(0, 0, 0, 0.5);
        }

        .nav-menu.open {
          transform: translateX(0);
        }

        .nav-links {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.9rem 1.2rem;
          border-radius: 14px;
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          font-size: 1rem;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .nav-link:hover {
          background: rgba(14, 184, 208, 0.1);
          color: #fff;
          transform: translateX(-5px);
        }

        .nav-link.active {
          background: rgba(14, 184, 208, 0.15);
          border: 1px solid rgba(14, 184, 208, 0.3);
          color: #0eb8d0;
        }

        .nav-link-icon {
          font-size: 1.2rem;
          width: 28px;
        }

        .navbar-spacer {
          height: 80px;
        }

        @media (max-width: 768px) {
          .navbar-modern {
            padding: 0.5rem 1rem;
          }
          .navbar-logo-text {
            font-size: 1rem;
          }
          .navbar-logo-icon {
            font-size: 1.6rem;
          }
          .nav-menu {
            max-width: 280px;
            padding: 1.5rem;
          }
        }
      `}</style>

      <nav className={`navbar-modern ${scrolling ? 'scrolled' : ''}`}>
        <div className="navbar-container">
          <Link to="/" className="navbar-logo" onClick={cerrarMenu}>
            <div className="navbar-logo-text">
              Autolavado Camaro Fraterno
            </div>
          </Link>

          <button className="menu-btn" onClick={() => setMenuAbierto(!menuAbierto)}>
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
        <div className="nav-links">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
              onClick={cerrarMenu}
            >
              <span className="nav-link-icon">{link.icon}</span>
              <span>{link.name}</span>
            </Link>
          ))}

          {/* Links condicionales según autenticación */}
          {!user ? (
            <>
              <Link to="/acceder" className="nav-link" onClick={cerrarMenu}>
                <span className="nav-link-icon">🔐</span>
                <span>Acceder</span>
              </Link>
              <Link to="/registro" className="nav-link" onClick={cerrarMenu}>
                <span className="nav-link-icon">📝</span>
                <span>Registrarse</span>
              </Link>
            </>
          ) : (
            <>
              <div className="nav-link" style={{ cursor: 'default', background: 'rgba(14,184,208,0.1)' }}>
                <span className="nav-link-icon">👤</span>
                <span>Hola, {perfil?.nombre || user.email?.split('@')[0]}</span>
              </div>
              {/* Solo mostrar Admin si el usuario tiene permisos */}
              {isAdmin && (
                <Link to="/admin" className="nav-link" onClick={cerrarMenu}>
                  <span className="nav-link-icon">👑</span>
                  <span>Admin</span>
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="nav-link"
                style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <span className="nav-link-icon">🚪</span>
                <span>Cerrar Sesión</span>
              </button>
            </>
          )}
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
            {/* Rutas protegidas (requieren login) */}
            <Route path="/" element={
              <RutaProtegida>
                <>
                  <NavBar />
                  <Home />
                </>
              </RutaProtegida>
            } />
            
            <Route path="/agendar" element={
              <RutaProtegida>
                <>
                  <NavBar />
                  <AppointmentForm />
                </>
              </RutaProtegida>
            } />
            
            <Route path="/contacto" element={
              <RutaProtegida>
                <>
                  <NavBar />
                  <Contact />
                </>
              </RutaProtegida>
            } />
            
            <Route path="/opiniones" element={
              <RutaProtegida>
                <>
                  <NavBar />
                  <Opiniones />
                </>
              </RutaProtegida>
            } />
            
            {/* Rutas públicas */}
            <Route path="/acceder" element={<ClienteLogin />} />
            <Route path="/registro" element={<ClienteRegistro />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App