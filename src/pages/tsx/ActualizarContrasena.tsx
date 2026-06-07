import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import '../css/ClienteAuth.css'

export function ActualizarContrasena() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setMessage('Enlace inválido o expirado. Solicita un nuevo enlace de recuperación.')
      }
    }
    checkSession()
  }, [])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setMessage('Las contraseñas no coinciden')
      return
    }
    
    if (password.length < 6) {
      setMessage('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      setMessage('✅ Contraseña actualizada correctamente')
      setTimeout(() => {
        navigate('/acceder')
      }, 2000)
    }
    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="liquid-glass-card">
        <div className="form-container fade-in">
          <h1 className="auth-title">Actualizar Contraseña</h1>
          <p className="auth-subtitle">Ingresa tu nueva contraseña</p>
          
          {message && (
            <div className={`error-message ${message.includes('✅') ? 'success-message' : ''}`} style={message.includes('✅') ? { background: 'rgba(52, 211, 153, 0.1)', color: '#34d399' } : {}}>
              {message}
            </div>
          )}
          
          <form onSubmit={handleUpdatePassword}>
            <div className="input-group">
              <label>Nueva contraseña</label>
              <input
                type="password"
                placeholder="••••••••"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="input-group">
              <label>Confirmar contraseña</label>
              <input
                type="password"
                placeholder="••••••••"
                className="input-field"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? <div className="spinner" /> : 'Actualizar Contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}