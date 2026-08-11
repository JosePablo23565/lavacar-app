import { useState, useEffect } from 'react'

// Componente de notificación personalizada (centro de pantalla)
export function ToastNotification({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
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
