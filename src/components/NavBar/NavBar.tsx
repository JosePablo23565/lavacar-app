import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { ConfigurarPerfilModal } from '../ConfigurarPerfilModal/ConfigurarPerfilModal'
import { supabase } from '../../lib/supabase'
import './NavBar.css'

function resizeAndCropImage(file: File, size = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas error'))
          return
        }

        const minDim = Math.min(img.width, img.height)
        const startX = (img.width - minDim) / 2
        const startY = (img.height - minDim) / 2

        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.onerror = () => reject(new Error('Image error'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('Reader error'))
    reader.readAsDataURL(file)
  })
}

export function NavBar() {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [scrolling, setScrolling] = useState(false)
  const [showPerfilModal, setShowPerfilModal] = useState(false)
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [avatarLocal, setAvatarLocal] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const location = useLocation()
  const { user, perfil, signOut, refetchPerfil } = useAuth()

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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido')
      return
    }

    try {
      setSubiendoFoto(true)
      const dataUrl = await resizeAndCropImage(file, 256)
      setAvatarLocal(dataUrl)

      if (user?.id) {
        const { error } = await supabase
          .from('perfiles')
          .update({ avatar_url: dataUrl })
          .eq('id', user.id)

        if (error) {
          console.error('Error al guardar foto:', error)
          alert('No se pudo guardar la foto de perfil')
        } else {
          await refetchPerfil()
        }
      }
    } catch (err) {
      console.error('Error procesando imagen:', err)
      alert('No se pudo procesar la imagen seleccionada')
    } finally {
      setSubiendoFoto(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
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
  const userInitial = (perfil?.nombre || userEmail).charAt(0).toUpperCase()
  const userNombre = perfil?.nombre || userEmail.split('@')[0]
  const avatarUrl = avatarLocal || perfil?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null

  return (
    <>
      <style>{`

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
          background: rgba(18, 18, 18, 0.3);
          backdrop-filter: blur(12px);
        }

        .navbar-modern.scrolled {
          background: rgba(18, 18, 18, 0.85);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(224, 20, 44, 0.3);
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
          background: linear-gradient(135deg, #fff, #e0142c);
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
          background: rgba(224, 20, 44, 0.25);
          border-color: rgba(224, 20, 44, 0.5);
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
          background: rgba(25, 25, 25, 0.35);
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
          background: rgba(25, 25, 25, 0.35);
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
          position: relative;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 18px 48px 16px 18px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.02);
        }

        .user-avatar-wrapper {
          position: relative;
          width: 50px;
          height: 50px;
          flex-shrink: 0;
        }

        .user-avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: #202024;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          font-weight: 600;
          color: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
          overflow: hidden;
          border: 1.5px solid rgba(255, 255, 255, 0.15);
        }

        .user-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
          display: block;
        }

        .user-avatar-initial {
          user-select: none;
          color: #f0f0f0;
        }

        .avatar-edit-btn {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #1c1c1e;
          border: 1.5px solid rgba(255, 255, 255, 0.35);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
          transition: all 0.2s ease;
          padding: 0;
          z-index: 2;
        }

        .avatar-edit-btn:hover {
          background: #2e2e33;
          border-color: rgba(255, 255, 255, 0.6);
          transform: scale(1.12);
        }

        .avatar-loading-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #e0142c;
          animation: avatarPulse 0.8s infinite alternate;
        }

        @keyframes avatarPulse {
          from { opacity: 0.3; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1.2); }
        }

        .user-info {
          flex: 1;
          min-width: 0;
        }

        .user-name {
          font-size: 0.92rem;
          font-weight: 600;
          color: white;
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-email {
          font-size: 0.74rem;
          color: rgba(255, 255, 255, 0.65);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.3;
        }

        .user-badge {
          display: inline-block;
          font-size: 0.65rem;
          font-weight: 600;
          color: #ff334b;
          margin-top: 4px;
          letter-spacing: 0.3px;
        }

        .config-profile-btn {
          position: absolute;
          top: 14px;
          right: 14px;
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: rgba(255, 255, 255, 0.75);
          transition: all 0.2s;
        }

        .config-profile-btn:hover {
          background: rgba(224, 20, 44, 0.2);
          color: #e0142c;
          border-color: rgba(224, 20, 44, 0.4);
          transform: scale(1.06);
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
          background: linear-gradient(90deg, transparent, rgba(224, 20, 44, 0.2), transparent);
          transition: left 0.5s ease;
        }

        .nav-link:hover::before {
          left: 100%;
        }

        .nav-link:hover {
          background: rgba(224, 20, 44, 0.15);
          color: #e0142c;
          transform: translateX(4px);
        }

        .nav-link.active {
          background: rgba(224, 20, 44, 0.2);
          color: #e0142c;
          border: 1px solid rgba(224, 20, 44, 0.3);
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
          background: rgba(35, 35, 35, 0.65);
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
          background: rgba(18, 18, 18, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          color: white;
          font-size: 0.95rem;
          transition: all 0.2s;
        }

        .profile-field input:focus {
          outline: none;
          border-color: #e0142c;
          background: rgba(18, 18, 18, 0.8);
          box-shadow: 0 0 0 3px rgba(224, 20, 44, 0.2);
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
          background: linear-gradient(135deg, #e0142c, #a10e1f);
          border: none;
          border-radius: 16px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .profile-btn-save:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(224, 20, 44, 0.3);
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
          background: rgba(40, 40, 40, 0.98);
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
            <img src="/lavacarlogo.png" alt="Camaro Fraterno" width="40" height="40" decoding="async" />
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
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleAvatarChange}
          />

          <div className="user-avatar-wrapper">
            <div className="user-avatar">
              {avatarUrl ? (
                <img src={avatarUrl} alt={userNombre} className="user-avatar-img" loading="lazy" decoding="async" />
              ) : (
                <span className="user-avatar-initial">{userInitial}</span>
              )}
            </div>
            <button
              type="button"
              className="avatar-edit-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Cambiar foto de perfil"
              disabled={subiendoFoto}
            >
              {subiendoFoto ? (
                <span className="avatar-loading-dot"></span>
              ) : (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                </svg>
              )}
            </button>
          </div>

          <div className="user-info">
            <div className="user-name" title={userNombre}>{userNombre}</div>
            <div className="user-email" title={userEmail}>{userEmail}</div>
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
