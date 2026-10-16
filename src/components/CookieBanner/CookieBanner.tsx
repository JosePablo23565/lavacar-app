import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './CookieBanner.css'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const consent = localStorage.getItem('camaro_cookies_consent')
    if (!consent) {
      // Pequeño retardo para no interrumpir la carga inicial
      const timer = setTimeout(() => {
        setVisible(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAcceptAll = () => {
    localStorage.setItem('camaro_cookies_consent', 'all')
    setVisible(false)
  }

  const handleAcceptNecessary = () => {
    localStorage.setItem('camaro_cookies_consent', 'necessary')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="cookie-banner-wrapper" role="dialog" aria-label="Aviso de cookies">
      <div className="cookie-banner-card">
        <div className="cookie-icon" aria-hidden="true">
          🍪
        </div>
        <div className="cookie-text">
          <strong>Tu privacidad es importante</strong>
          <span>
            Utilizamos cookies técnicas para mantener tu sesión segura y ofrecerte la mejor experiencia al agendar tus citas. Consulta nuestra{' '}
            <button
              className="cookie-link"
              onClick={() => {
                navigate('/privacidad')
              }}
            >
              política de cookies
            </button>.
          </span>
        </div>
        <div className="cookie-actions">
          <button className="cookie-btn-secondary" onClick={handleAcceptNecessary}>
            Solo necesarias
          </button>
          <button className="cookie-btn-primary" onClick={handleAcceptAll}>
            Aceptar todas
          </button>
        </div>
      </div>
    </div>
  )
}
