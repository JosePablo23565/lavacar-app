import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import '../css/ClienteRegistro.css'

export function ClienteRegistro() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isFalling, setIsFalling] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (formData.telefono.length < 8) {
      setError('El teléfono debe tener al menos 8 dígitos')
      return
    }

    setIsFalling(true)
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          nombre: formData.nombre,
          telefono: formData.telefono
        }
      }
    })

    if (error) {
      setError(error.message)
      setIsFalling(false)
      setLoading(false)
    } else if (data.user) {
      await supabase.from('perfiles').upsert([
        { id: data.user.id, nombre: formData.nombre, telefono: formData.telefono, email: formData.email }
      ])
      setTimeout(() => {
        navigate('/')
      }, 400)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/completar-perfil`
        }
      })
      if (error) {
        setError('❌ Error al iniciar con Google: ' + error.message)
      }
    } catch (err) {
      setError('❌ Error al iniciar con Google')
    }
  }

  return (
    <div className="register-page">

      <div className={`liquid-glass-card ${isFalling ? 'falling' : ''}`}>
        <Link to="/acceder" className="back-link">
          ← Volver
        </Link>

        <h1 className="register-title">Crear cuenta</h1>
        <p className="register-subtitle">Regístrate para comenzar</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Nombre completo</label>
            <input
              type="text"
              placeholder="Tu nombre"
              className="input-field"
              value={formData.nombre}
              onChange={(e) => {
                const onlyLetters = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')
                setFormData({ ...formData, nombre: onlyLetters })
              }}
              required
            />
            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.2rem' }}>
              Solo letras, espacios y acentos
            </div>
          </div>

          <div className="input-group">
            <label>Correo electrónico</label>
            <input
              type="email"
              placeholder="cliente@email.com"
              className="input-field"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="input-group">
            <label>Teléfono</label>
            <input
              type="tel"
              placeholder="Ej: 88888888"
              className="input-field"
              value={formData.telefono}
              onChange={(e) => {
                const onlyNumbers = e.target.value.replace(/[^0-9]/g, '')
                if (onlyNumbers.length <= 8) {
                  setFormData({ ...formData, telefono: onlyNumbers })
                }
              }}
              required
              maxLength={8}
            />
            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.2rem' }}>
              8 dígitos, solo números
            </div>
          </div>

          <div className="input-group">
            <label>Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              className="input-field"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <div className="input-group">
            <label>Confirmar contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              className="input-field"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
            />
          </div>

          <button type="submit" className="register-btn" disabled={loading}>
            {loading ? <div className="spinner" /> : 'Registrarse'}
          </button>

          <div className="divider">
            <span>o</span>
          </div>

          <button type="button" className="google-btn" onClick={handleGoogleSignIn}>
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continuar con Google
          </button>

          <div className="login-link">
            ¿Ya tienes cuenta? <Link to="/acceder">Iniciar sesión</Link>
          </div>
        </form>
      </div>
    </div>
  )
}