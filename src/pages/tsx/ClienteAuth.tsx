import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import '../css/ClienteAuth.css'

export function ClienteAuth() {
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [isFlipping, setIsFlipping] = useState(false)

  // Login state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Registro state
  const [regNombre, setRegNombre] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regTelefono, setRegTelefono] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirmPassword, setRegConfirmPassword] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword
    })

    if (error) {
      setError('❌ Correo o contraseña incorrectos')
    } else {
      navigate('/')
    }
    setLoading(false)
  }

  const handleTelefonoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const onlyNumbers = value.replace(/[^0-9]/g, '')
    if (onlyNumbers.length <= 8) {
      setRegTelefono(onlyNumbers)
    }
  }

  const handleNombreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const onlyLetters = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')
    setRegNombre(onlyLetters)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(regNombre)) {
      setError('El nombre solo puede contener letras y espacios')
      return
    }

    if (regPassword !== regConfirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (regPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (regTelefono && regTelefono.length !== 8) {
      setError('El teléfono debe tener exactamente 8 dígitos')
      return
    }

    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email: regEmail,
      password: regPassword,
      options: {
        data: {
          nombre: regNombre,
          telefono: regTelefono
        }
      }
    })

    if (error) {
      setError(error.message)
    } else if (data.user) {
      await supabase.from('perfiles').upsert([
        { id: data.user.id, nombre: regNombre, telefono: regTelefono, email: regEmail }
      ])
      navigate('/')
    }
    setLoading(false)
  }

  // Función para iniciar sesión con Google - REDIRIGE A completar-perfil
  const signInWithGoogle = async () => {
    setError('')
    setGoogleLoading(true)
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/completar-perfil`
      }
    })
    
    if (error) {
      setError('Error al iniciar sesión con Google. Intenta de nuevo.')
      setGoogleLoading(false)
    }
  }

  const switchMode = () => {
    setIsFlipping(true)
    setTimeout(() => {
      setIsLogin(!isLogin)
      setError('')
      setIsFlipping(false)
    }, 200)
  }

  return (
    <div className="auth-page">
      <div className="liquid-glass-card">
        <div className={`form-container ${isFlipping ? 'fade-out' : 'fade-in'}`}>
          {isLogin ? (
            <>
              <h1 className="auth-title">Bienvenido</h1>
              <p className="auth-subtitle">Acceso para clientes registrados</p>

              {error && <div className="error-message">{error}</div>}

              <form onSubmit={handleLogin}>
                <div className="input-group">
                  <label>Gmail</label>
                  <input
                    type="email"
                    placeholder="tucorreo@gmail.com"
                    className="input-field"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Contraseña</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="input-field"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>

                <a href="#" className="forgot-link">¿Olvidaste tu contraseña?</a>

                <button type="submit" className="auth-btn" disabled={loading}>
                  {loading ? <div className="spinner" /> : 'Iniciar Sesión'}
                </button>

                <div className="divider">
                  <span>o</span>
                </div>

                <button 
                  type="button" 
                  className="google-btn" 
                  onClick={signInWithGoogle}
                  disabled={googleLoading}
                >
                  {googleLoading ? (
                    <div className="spinner" />
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      Continuar con Google
                    </>
                  )}
                </button>

                <div className="switch-link">
                  ¿No tienes una cuenta?{' '}
                  <button type="button" onClick={switchMode}>Registrarse</button>
                </div>
              </form>
            </>
          ) : (
            <>
              <h1 className="auth-title">Crear cuenta</h1>
              <p className="auth-subtitle">Regístrate para comenzar</p>

              {error && <div className="error-message">{error}</div>}

              <form onSubmit={handleRegister}>
                <div className="input-group">
                  <label>Nombre completo</label>
                  <input
                    type="text"
                    placeholder="Ej: Carlos Pérez"
                    className="input-field"
                    value={regNombre}
                    onChange={handleNombreChange}
                    required
                  />
                  <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.2rem' }}>
                    Solo letras, espacios y acentos
                  </div>
                </div>

                <div className="input-group">
                  <label>Gmail</label>
                  <input
                    type="email"
                    placeholder="tucorreo@gmail.com"
                    className="input-field"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Teléfono</label>
                  <input
                    type="tel"
                    placeholder="Ej: 83606680"
                    className="input-field"
                    value={regTelefono}
                    onChange={handleTelefonoChange}
                    maxLength={8}
                  />
                  <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.2rem' }}>
                    Solo números, 8 dígitos (opcional)
                  </div>
                </div>

                <div className="input-group">
                  <label>Contraseña</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="input-field"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Confirmar contraseña</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="input-field"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="auth-btn" disabled={loading}>
                  {loading ? <div className="spinner" /> : 'Registrarse'}
                </button>

                <div className="switch-link">
                  ¿Ya tienes cuenta?{' '}
                  <button type="button" onClick={switchMode}>Iniciar sesión</button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}