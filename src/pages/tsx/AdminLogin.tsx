import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'
import '../css/AdminLogin.css'

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