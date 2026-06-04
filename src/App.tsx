import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { Home } from './components/tsx/Home'
import { AppointmentForm } from './components/tsx/AppointmentForm'
import { AdminDashboard } from './pages/tsx/AdminDashboard'
import { Contact } from './components/tsx/Contact'
import { Opiniones } from './components/tsx/Opiniones'
import { ClienteAuth } from './pages/tsx/ClienteAuth'
import { useState, useEffect } from 'react'
import { useAuth } from './context/AuthContext'
import { CompletarPerfil } from './pages/tsx/CompletarPerfil'
import { supabase } from './lib/supabase'
import './App.navbar.css'

// Componente de notificación personalizada (centro de pantalla)
function ToastNotification({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsClosing(true)
      setTimeout(() => {
        onClose()
      }, 300)
    }, 2700)

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={`toast-notification-center ${type} ${isClosing ? 'closing' : ''}`}>
      <div className="toast-icon-center">
        {type === 'success' ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        )}
      </div>
      <div className="toast-message-center">{message}</div>
      <button className="toast-close-center" onClick={() => {
        setIsClosing(true)
        setTimeout(() => onClose(), 300)
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  )
}

// Componente para el modal de configurar perfil (con animación suave)
function ConfigurarPerfilModal({ onClose }: { onClose: () => void }) {
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' })
  const [isClosing, setIsClosing] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    cargarPerfil()
  }, [])

  const cargarPerfil = async () => {
    if (!user) return
    const { data } = await supabase
      .from('perfiles')
      .select('nombre, telefono')
      .eq('id', user.id)
      .single()
    
    if (data) {
      setNombre(data.nombre || '')
      setTelefono(data.telefono || '')
    }
  }

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
    }, 300)
  }

  // Función para validar nombre (solo letras y espacios, máximo 30 caracteres)
  const validarNombre = (nombre: string): { valido: boolean; mensaje: string } => {
    if (!nombre.trim()) {
      return { valido: false, mensaje: 'El nombre es obligatorio' }
    }
    
    if (nombre.length > 30) {
      return { valido: false, mensaje: 'El nombre no puede tener más de 30 caracteres' }
    }
    
    // Solo letras (incluyendo acentos y ñ) y espacios
    const soloLetrasYEspacios = /^[a-zA-ZáéíóúñÑüÜ\s]+$/
    if (!soloLetrasYEspacios.test(nombre)) {
      return { valido: false, mensaje: 'El nombre solo puede contener letras y espacios' }
    }
    
    return { valido: true, mensaje: '' }
  }

  // Función para validar teléfono (exactamente 8 números)
  const validarTelefono = (telefono: string): { valido: boolean; mensaje: string } => {
    if (!telefono.trim()) {
      return { valido: false, mensaje: 'El teléfono es obligatorio' }
    }
    
    const soloNumeros = /^\d+$/
    if (!soloNumeros.test(telefono)) {
      return { valido: false, mensaje: 'El teléfono solo puede contener números' }
    }
    
    if (telefono.length !== 8) {
      return { valido: false, mensaje: 'El teléfono debe tener exactamente 8 dígitos' }
    }
    
    return { valido: true, mensaje: '' }
  }

  const guardarPerfil = async () => {
    // Validar nombre
    const nombreValidation = validarNombre(nombre)
    if (!nombreValidation.valido) {
      setToast({ show: true, message: nombreValidation.mensaje, type: 'error' })
      return
    }
    
    // Validar teléfono
    const telefonoValidation = validarTelefono(telefono)
    if (!telefonoValidation.valido) {
      setToast({ show: true, message: telefonoValidation.mensaje, type: 'error' })
      return
    }
    
    setLoading(true)
    
    const { error } = await supabase
      .from('perfiles')
      .update({
        nombre: nombre.trim(),
        telefono: telefono.trim()
      })
      .eq('id', user?.id)
    
    if (error) {
      setToast({ show: true, message: 'Error: ' + error.message, type: 'error' })
    } else {
      setToast({ show: true, message: 'Perfil actualizado correctamente', type: 'success' })
      setTimeout(() => {
        handleClose()
      }, 1500)
    }
    
    setLoading(false)
  }

  return (
    <>
      <div className={`profile-modal-overlay ${isClosing ? 'closing' : ''}`} onClick={handleClose}>
        <div className={`profile-modal-container ${isClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
          <div className="profile-modal-header">
            <h2>Configurar perfil</h2>
            <p>Actualiza tu información personal</p>
          </div>
          
          <div className="profile-modal-body">
            <div className="profile-field">
              <label>Nombre completo</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => {
                  const value = e.target.value
                  const soloLetras = /^[a-zA-ZáéíóúñÑüÜ\s]*$/
                  if (soloLetras.test(value) && value.length <= 40) {
                    setNombre(value)
                  }
                }}
                placeholder="Tu nombre completo"
                maxLength={40}
                required
              />
              <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
                Máximo 40 caracteres, solo letras y espacios.
              </p>
            </div>
            
            <div className="profile-field">
              <label>Teléfono</label>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => {
                  const onlyNumbers = e.target.value.replace(/[^0-9]/g, '')
                  if (onlyNumbers.length <= 8) {
                    setTelefono(onlyNumbers)
                  }
                }}
                placeholder="8 dígitos"
                maxLength={8}
                required
              />
              <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
                8 dígitos, solo números.
              </p>
            </div>
          </div>
          
          <div className="profile-modal-footer">
            <button className="profile-btn-cancel" onClick={handleClose}>
              Cancelar
            </button>
            <button className="profile-btn-save" onClick={guardarPerfil} disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
      
      {toast.show && (
        <ToastNotification 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast({ show: false, message: '', type: 'success' })} 
        />
      )}
    </>
  )
}

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
  const [showPerfilModal, setShowPerfilModal] = useState(false)
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
  const userNombre = perfil?.nombre || userEmail.split('@')[0]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=DM+Sans:wght@400;500&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
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
          gap: 0.75rem;
          cursor: pointer;
          text-decoration: none;
          position: relative;
          z-index: 101;
        }

        .navbar-logo img {
          height: 50px;
          width: auto;
          transition: transform 0.2s ease;
        }

        .navbar-logo img:hover {
          transform: scale(1.02);
        }

        .navbar-logo-text {
          font-family: 'Sora', sans-serif;
          font-size: 1.5rem;
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

        .user-name {
          font-size: 0.9rem;
          font-weight: 600;
          color: white;
          margin-bottom: 2px;
        }

        .user-email {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.6);
          word-break: break-all;
        }

        .user-badge {
          font-size: 0.65rem;
          color: #0eb8d0;
          margin-top: 4px;
        }

        .config-profile-btn {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: rgba(255, 255, 255, 0.7);
          transition: all 0.2s;
        }

        .config-profile-btn:hover {
          background: rgba(14, 184, 208, 0.2);
          color: #0eb8d0;
          border-color: rgba(14, 184, 208, 0.4);
          transform: scale(1.02);
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
          cursor: pointer;
          background: none;
          width: 100%;
          text-align: left;
          border: none;
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

        /* Modal styles con animación suave */
        .profile-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.3s ease;
        }

        .profile-modal-overlay.closing {
          animation: fadeOut 0.3s ease forwards;
        }

        .profile-modal-container {
          background: rgba(25, 30, 45, 0.65);
          backdrop-filter: blur(20px) saturate(180%);
          border-radius: 32px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 25px 45px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);
          width: 90%;
          max-width: 450px;
          animation: scaleIn 0.3s cubic-bezier(0.34, 1.2, 0.64, 1);
        }

        .profile-modal-container.closing {
          animation: scaleOut 0.3s ease forwards;
        }

        .profile-modal-header {
          padding: 28px 28px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .profile-modal-header h2 {
          color: white;
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 6px;
          font-family: 'Sora', sans-serif;
        }

        .profile-modal-header p {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.85rem;
        }

        .profile-modal-body {
          padding: 24px 28px;
        }

        .profile-field {
          margin-bottom: 20px;
        }

        .profile-field label {
          display: block;
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.75rem;
          font-weight: 500;
          margin-bottom: 8px;
          letter-spacing: 0.5px;
        }

        .profile-field input {
          width: 100%;
          padding: 14px 16px;
          background: rgba(10, 14, 26, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          color: white;
          font-size: 0.95rem;
          transition: all 0.2s;
        }

        .profile-field input:focus {
          outline: none;
          border-color: #0eb8d0;
          background: rgba(10, 14, 26, 0.8);
          box-shadow: 0 0 0 3px rgba(14, 184, 208, 0.2);
        }

        .profile-field input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        .profile-modal-footer {
          padding: 16px 28px 28px;
          display: flex;
          gap: 12px;
        }

        .profile-btn-cancel {
          flex: 1;
          padding: 12px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .profile-btn-cancel:hover {
          background: rgba(255, 255, 255, 0.15);
          color: white;
        }

        .profile-btn-save {
          flex: 1;
          padding: 12px;
          background: linear-gradient(135deg, #0eb8d0, #0a8ca0);
          border: none;
          border-radius: 16px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .profile-btn-save:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(14, 184, 208, 0.3);
        }

        .profile-btn-save:disabled {
          opacity: 0.6;
          transform: none;
        }

        /* Toast Notification - Centro de pantalla */
        .toast-notification-center {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 24px;
          background: rgba(30, 35, 50, 0.98);
          backdrop-filter: blur(20px);
          border-radius: 60px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          z-index: 1100;
          animation: toastCenterIn 0.3s cubic-bezier(0.34, 1.2, 0.64, 1);
        }

        .toast-notification-center.closing {
          animation: toastCenterOut 0.3s ease forwards;
        }

        .toast-notification-center.success {
          border-left: 4px solid #10b981;
        }

        .toast-notification-center.error {
          border-left: 4px solid #ef4444;
        }

        .toast-icon-center {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .toast-notification-center.success .toast-icon-center {
          color: #10b981;
        }

        .toast-notification-center.error .toast-icon-center {
          color: #ef4444;
        }

        .toast-message-center {
          color: white;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .toast-close-center {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: rgba(255, 255, 255, 0.6);
          transition: all 0.2s;
          margin-left: 8px;
        }

        .toast-close-center:hover {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }

        /* Animaciones */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes scaleOut {
          from {
            opacity: 1;
            transform: scale(1);
          }
          to {
            opacity: 0;
            transform: scale(0.9);
          }
        }

        @keyframes toastCenterIn {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }

        @keyframes toastCenterOut {
          from {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          to {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
          }
        }

        @media (max-width: 768px) {
          .navbar-modern {
            padding: 0.5rem 1rem;
          }
          .navbar-logo-text {
            font-size: 1.1rem;
          }
          .navbar-logo img {
            height: 38px;
          }
          .nav-menu {
            top: 68px;
            right: 12px;
            width: 300px;
          }
          .profile-modal-container {
            width: 95%;
            margin: 16px;
          }
          .toast-notification-center {
            padding: 12px 20px;
            width: 90%;
            max-width: 320px;
          }
          .toast-message-center {
            font-size: 0.8rem;
          }
        }

        @media (max-width: 480px) {
          .navbar-logo-text {
            font-size: 0.98rem;
            display: inline-block;
          }
          .navbar-logo img {
            height: 32px;
          }
        }
      `}</style>

      <nav className={`navbar-modern ${scrolling ? 'scrolled' : ''}`}>
        <div className="navbar-container">
          <Link to="/" className="navbar-logo" onClick={cerrarMenu}>
            <img src="/lavacarlogo.png" alt="Camaro Fraterno" />
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
            <div className="user-name">{userNombre}</div>
            <div className="user-email">{userEmail}</div>
            {isAdmin && <div className="user-badge">Administrador</div>}
          </div>
          <button 
            className="config-profile-btn"
            onClick={() => {
              cerrarMenu()
              setShowPerfilModal(true)
            }}
            title="Configurar perfil"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
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
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>

      <div className="navbar-spacer"></div>

      {showPerfilModal && (
        <ConfigurarPerfilModal onClose={() => setShowPerfilModal(false)} />
      )}
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
            <Route path="/acceder" element={<ClienteAuth />} />
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