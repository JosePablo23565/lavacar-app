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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=DM+Sans:wght@400;500&display=swap');

        .navbar-modern {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          padding: 0.75rem 2rem;
          transition: all 0.3s ease;
          font-family: 'DM Sans', sans-serif;
          background: rgba(10, 14, 26, 0.3);
          backdrop-filter: blur(12px);
        }

        .navbar-modern.scrolled {
          background: rgba(10, 14, 26, 0.85);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(14, 184, 208, 0.3);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
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

        .navbar-logo-text {
          font-family: 'Sora', sans-serif;
          font-size: 1.3rem;
          font-weight: 700;
          background: linear-gradient(135deg, #fff, #0eb8d0);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .menu-btn {
          width: 48px;
          height: 48px;
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.15);
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
          background: rgba(14, 184, 208, 0.25);
          border-color: rgba(14, 184, 208, 0.5);
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
          background: rgba(0, 0, 0, 0.05);
          backdrop-filter: blur(2px);
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
          top: 75px;
          right: 24px;
          width: 320px;
          background: rgba(15, 20, 35, 0.35);
          backdrop-filter: blur(24px) saturate(180%);
          border-radius: 32px;
          z-index: 99;
          opacity: 0;
          visibility: hidden;
          transform: scale(0.3) translateY(-50px);
          transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 30px 50px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1);
          overflow: hidden;
        }

        .nav-menu.open {
          opacity: 1;
          visibility: visible;
          transform: scale(1) translateY(0);
        }

        .nav-menu::before {
          content: '';
          position: absolute;
          top: -10px;
          right: 24px;
          width: 20px;
          height: 20px;
          background: rgba(15, 20, 35, 0.35);
          backdrop-filter: blur(24px) saturate(180%);
          transform: rotate(45deg);
          border-left: 1px solid rgba(255, 255, 255, 0.2);
          border-top: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          z-index: -1;
        }

        .nav-menu::after {
          content: '';
          position: absolute;
          top: -10px;
          right: 24px;
          width: 20px;
          height: 20px;
          background: rgba(0, 0, 0, 0.15);
          filter: blur(8px);
          transform: rotate(45deg);
          z-index: -2;
        }

        .menu-user-profile {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 20px 20px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.02);
        }

        .user-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0eb8d0, #0a8ca0);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          font-weight: 600;
          color: white;
          box-shadow: 0 4px 12px rgba(14, 184, 208, 0.3);
        }

        .user-info {
          flex: 1;
        }

        .user-email {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.8);
          word-break: break-all;
        }

        .user-badge {
          font-size: 0.65rem;
          color: #0eb8d0;
          margin-top: 4px;
        }

        .nav-links {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 12px 14px 16px;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 14px;
          color: rgba(255, 255, 255, 0.8);
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.25s ease;
          position: relative;
          overflow: hidden;
        }

        .nav-link::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(14, 184, 208, 0.2), transparent);
          transition: left 0.5s ease;
        }

        .nav-link:hover::before {
          left: 100%;
        }

        .nav-link:hover {
          background: rgba(14, 184, 208, 0.15);
          color: #0eb8d0;
          transform: translateX(4px);
        }

        .nav-link.active {
          background: rgba(14, 184, 208, 0.2);
          color: #0eb8d0;
          border: 1px solid rgba(14, 184, 208, 0.3);
        }

        .logout-btn {
          width: 100%;
          text-align: left;
          background: none;
          border: none;
          cursor: pointer;
          margin-top: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding-top: 14px;
          border-radius: 0;
        }

        .logout-btn:hover {
          background: rgba(255, 77, 79, 0.15);
          color: #ff6b6b;
          transform: translateX(4px);
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
          .nav-menu {
            top: 68px;
            right: 12px;
            width: 300px;
          }
          .nav-menu::before {
            right: 18px;
            width: 18px;
            height: 18px;
            top: -9px;
          }
          .nav-menu::after {
            right: 18px;
            width: 18px;
            height: 18px;
            top: -9px;
          }
          .user-avatar {
            width: 42px;
            height: 42px;
            font-size: 1rem;
          }
          .user-email {
            font-size: 0.7rem;
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