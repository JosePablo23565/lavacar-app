import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
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

  // Función para iniciar sesión con Google - SIMPLE, sin redirección a completar perfil
  const signInWithGoogle = async () => {
    setError('')
    setGoogleLoading(true)
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`
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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .auth-page {
          min-height: 100vh;
          width: 100%;
          height: 100vh;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', sans-serif;
          overflow: hidden;
        }

        .auth-page::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: url('/fondo-login.jpg');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          z-index: 0;
        }

        .auth-page::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.35);
          z-index: 0;
        }

        .liquid-glass-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 340px;
          margin: 1rem;
          padding: 1.4rem 1.2rem;
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(10px);
          border-radius: 28px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.08);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .liquid-glass-card:hover {
          transform: translateY(-3px);
          border-color: rgba(14, 184, 208, 0.3);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
        }

        .form-container {
          transition: opacity 0.2s ease, transform 0.2s ease;
        }

        .form-container.fade-out {
          opacity: 0;
          transform: translateY(10px);
        }

        .form-container.fade-in {
          opacity: 1;
          transform: translateY(0);
        }

        .auth-title {
          font-size: 1.4rem;
          font-weight: 600;
          text-align: center;
          color: #fff;
          margin-bottom: 0.2rem;
          letter-spacing: -0.3px;
        }

        .auth-subtitle {
          text-align: center;
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.7rem;
          margin-bottom: 1rem;
        }

        .input-group {
          margin-bottom: 0.7rem;
        }

        .input-group label {
          display: block;
          font-size: 0.7rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 0.2rem;
          letter-spacing: 0.3px;
        }

        .input-field {
          width: 100%;
          padding: 0.55rem 0.85rem;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 14px;
          color: #fff;
          font-size: 0.85rem;
          font-family: 'Inter', sans-serif;
          transition: all 0.2s ease;
          outline: none;
        }

        .input-field:focus {
          border-color: #0eb8d0;
          background: rgba(14, 184, 208, 0.12);
          box-shadow: 0 0 0 2px rgba(14, 184, 208, 0.15);
        }

        .input-field::placeholder {
          color: rgba(255, 255, 255, 0.3);
          font-size: 0.8rem;
        }

        .auth-btn {
          width: 100%;
          padding: 0.7rem;
          background: rgba(14, 184, 208, 0.15);
          backdrop-filter: blur(8px);
          color: #fff;
          border: 1px solid rgba(14, 184, 208, 0.4);
          border-radius: 40px;
          font-size: 0.85rem;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 0.5rem;
          margin-bottom: 0.8rem;
          box-shadow: 0 4px 12px rgba(14, 184, 208, 0.1);
        }

        .auth-btn:hover:not(:disabled) {
          background: rgba(14, 184, 208, 0.25);
          border-color: rgba(14, 184, 208, 0.6);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(14, 184, 208, 0.25);
        }

        .auth-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .forgot-link {
          display: block;
          text-align: right;
          font-size: 0.65rem;
          color: rgba(255, 255, 255, 0.5);
          text-decoration: none;
          margin-bottom: 0.5rem;
          transition: color 0.2s;
        }

        .forgot-link:hover {
          color: #0eb8d0;
        }

        .divider {
          display: flex;
          align-items: center;
          margin: 0.6rem 0;
          color: rgba(255, 255, 255, 0.35);
          font-size: 0.65rem;
        }

        .divider::before,
        .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(255, 255, 255, 0.12);
        }

        .divider span {
          padding: 0 0.8rem;
        }

        .google-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 40px;
          padding: 0.6rem;
          cursor: pointer;
          transition: all 0.3s ease;
          color: rgba(255, 255, 255, 0.85);
          font-size: 0.75rem;
          font-weight: 500;
        }

        .google-btn:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.35);
          transform: translateY(-1px);
        }

        .switch-link {
          text-align: center;
          margin-top: 0.6rem;
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.55);
        }

        .switch-link button {
          background: none;
          border: none;
          color: #0eb8d0;
          cursor: pointer;
          font-weight: 500;
          font-size: 0.7rem;
          transition: color 0.2s;
        }

        .switch-link button:hover {
          color: #fff;
          text-decoration: underline;
        }

        .error-message {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #f87171;
          padding: 0.45rem;
          border-radius: 12px;
          font-size: 0.7rem;
          text-align: center;
          margin-bottom: 0.8rem;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #0eb8d0;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          display: inline-block;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 480px) {
          .liquid-glass-card {
            max-width: 300px;
            padding: 1.2rem 1rem;
            margin: 0.8rem;
          }
          .auth-title {
            font-size: 1.2rem;
          }
          .input-field {
            padding: 0.5rem 0.75rem;
            font-size: 0.8rem;
          }
          .auth-btn {
            padding: 0.6rem;
            font-size: 0.8rem;
          }
        }
      `}</style>

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
                    placeholder="Tu nombre"
                    className="input-field"
                    value={regNombre}
                    onChange={(e) => setRegNombre(e.target.value)}
                    required
                  />
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