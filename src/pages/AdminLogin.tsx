import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError('❌ Credenciales incorrectas')
      setLoading(false)
      return
    }

    // Verificar si el usuario es administrador
    const { data: perfil, error: perfilError } = await supabase
      .from('perfiles')
      .select('is_admin')
      .eq('id', data.user.id)
      .single()

    if (perfilError || !perfil?.is_admin) {
      setError('❌ No tienes permisos de administrador')
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    navigate('/admin')
    setLoading(false)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=DM+Sans:wght@400;500&display=swap');
        
        .login-root {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0e1a 0%, #0f1e3a 60%, #0a0e1a 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow: hidden;
        }
        
        .login-root::before {
          content: '';
          position: absolute;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(14,184,208,0.08) 0%, transparent 70%);
          border-radius: 50%;
          top: -200px;
          right: -150px;
          animation: float 8s ease-in-out infinite;
        }
        
        .login-root::after {
          content: '';
          position: absolute;
          width: 350px;
          height: 350px;
          background: radial-gradient(circle, rgba(26,111,212,0.06) 0%, transparent 70%);
          border-radius: 50%;
          bottom: -150px;
          left: -100px;
          animation: float 10s ease-in-out infinite reverse;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        .login-card {
          background: rgba(17, 24, 39, 0.98);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 32px;
          padding: 2.5rem;
          width: 100%;
          max-width: 440px;
          position: relative;
          z-index: 10;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          transition: all 0.3s ease;
        }
        
        .login-card:hover {
          transform: translateY(-5px);
          border-color: rgba(14, 184, 208, 0.2);
          box-shadow: 0 30px 60px -15px rgba(14, 184, 208, 0.15);
        }
        
        .back-btn {
          position: fixed;
          top: 2rem;
          left: 2rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(17, 24, 39, 0.8);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 40px;
          padding: 0.6rem 1.2rem;
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.3s ease;
          z-index: 20;
          font-family: 'DM Sans', sans-serif;
        }
        
        .back-btn:hover {
          background: rgba(26, 111, 212, 0.3);
          border-color: rgba(14, 184, 208, 0.4);
          color: #fff;
          transform: translateX(-3px);
        }
        
        .login-icon {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #1a6fd4, #0eb8d0);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          box-shadow: 0 10px 25px -5px rgba(14, 184, 208, 0.3);
          transition: all 0.3s ease;
        }
        
        .login-icon:hover {
          transform: scale(1.05);
          box-shadow: 0 15px 35px -5px rgba(14, 184, 208, 0.4);
        }
        
        .login-icon svg {
          width: 40px;
          height: 40px;
          color: white;
        }
        
        .login-title {
          font-family: 'Sora', sans-serif;
          font-size: 1.8rem;
          font-weight: 700;
          text-align: center;
          background: linear-gradient(135deg, #fff, #0eb8d0);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.5rem;
        }
        
        .login-sub {
          text-align: center;
          color: rgba(255, 255, 255, 0.45);
          font-size: 0.85rem;
          margin-bottom: 2rem;
        }
        
        .input-group {
          margin-bottom: 1.5rem;
        }
        
        .input-label {
          display: block;
          font-size: 0.7rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 0.5rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          transition: color 0.2s ease;
        }
        
        .input-label.active {
          color: #0eb8d0;
        }
        
        .input-field {
          width: 100%;
          padding: 0.9rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          color: #fff;
          font-size: 0.9rem;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.2s ease;
          outline: none;
        }
        
        .input-field:focus {
          border-color: #0eb8d0;
          background: rgba(14, 184, 208, 0.08);
          box-shadow: 0 0 0 3px rgba(14, 184, 208, 0.15);
        }
        
        .input-field::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }
        
        .login-btn {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, #1a6fd4, #0eb8d0);
          color: #fff;
          border: none;
          border-radius: 16px;
          font-size: 1rem;
          font-weight: 600;
          font-family: 'Sora', sans-serif;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 0.5rem;
          position: relative;
          overflow: hidden;
        }
        
        .login-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s ease;
        }
        
        .login-btn:hover:not(:disabled)::before {
          left: 100%;
        }
        
        .login-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(14, 184, 208, 0.4);
        }
        
        .login-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .error-message {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #f87171;
          padding: 0.85rem;
          border-radius: 14px;
          font-size: 0.85rem;
          text-align: center;
          margin-bottom: 1.5rem;
          animation: shake 0.3s ease;
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .login-car {
          position: absolute;
          bottom: 30px;
          right: 30px;
          font-size: 100px;
          opacity: 0.05;
          pointer-events: none;
          animation: floatCar 6s ease-in-out infinite;
          filter: drop-shadow(0 0 10px rgba(14,184,208,0.3));
        }
        
        @keyframes floatCar {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(3deg); }
        }
        
        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @media (max-width: 480px) {
          .login-card {
            padding: 1.8rem;
          }
          .back-btn {
            top: 1rem;
            left: 1rem;
            padding: 0.5rem 1rem;
            font-size: 0.75rem;
          }
          .login-title {
            font-size: 1.5rem;
          }
          .login-icon {
            width: 65px;
            height: 65px;
          }
          .login-icon svg {
            width: 32px;
            height: 32px;
          }
          .login-car {
            font-size: 70px;
            bottom: 15px;
            right: 15px;
          }
        }
      `}</style>

      <div className="login-root">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Volver al inicio
        </button>
        
        <div className="login-car">🚗</div>

        <div className="login-card">
          <div className="login-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          
          <h1 className="login-title">Panel Admin</h1>
          <p className="login-sub">Acceso exclusivo para administradores</p>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label className={`input-label ${focusedField === 'email' ? 'active' : ''}`}>
                CORREO ELECTRÓNICO
              </label>
              <input
                type="email"
                placeholder="admin@lavacar.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                className="input-field"
                required
              />
            </div>
            
            <div className="input-group">
              <label className={`input-label ${focusedField === 'password' ? 'active' : ''}`}>
                CONTRASEÑA
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                className="input-field"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="login-btn"
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                  <div className="spinner" />
                  Ingresando...
                </span>
              ) : (
                '🔐 Ingresar'
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}