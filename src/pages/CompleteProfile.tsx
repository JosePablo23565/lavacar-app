import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function CompleteProfile() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [userId, setUserId] = useState('')

  useEffect(() => {
    // Obtener el usuario actual
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        setEmail(user.email || '')
        // Si Google ya dio un nombre, lo usamos como sugerencia
        if (user.user_metadata?.nombre) {
          setNombre(user.user_metadata.nombre)
        }
        // Verificar si ya tiene perfil completo (usando maybeSingle)
        const { data: perfil } = await supabase
          .from('perfiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()
        
        if (perfil && perfil.nombre && perfil.telefono) {
          // Ya tiene todos los datos, redirigir al home
          navigate('/')
        }
      } else {
        navigate('/acceder')
      }
    }
    getUser()
  }, [navigate])

  // Validación de teléfono: solo números, máximo 8 dígitos
  const handleTelefonoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const onlyNumbers = value.replace(/[^0-9]/g, '')
    if (onlyNumbers.length <= 8) {
      setTelefono(onlyNumbers)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!nombre.trim()) {
      setError('El nombre es obligatorio')
      return
    }

    if (!telefono || telefono.length !== 8) {
      setError('El teléfono debe tener exactamente 8 dígitos')
      return
    }

    setLoading(true)

    try {
      // 1. Actualizar metadata del usuario en Auth
      const { error: updateError } = await supabase.auth.updateUser({
        data: { nombre, telefono }
      })

      if (updateError) throw updateError

      // 2. Verificar si ya existe perfil (usando maybeSingle)
      const { data: existingProfile, error: selectError } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (existingProfile) {
        // Actualizar perfil existente
        const { error: updateProfileError } = await supabase
          .from('perfiles')
          .update({ nombre, telefono, email })
          .eq('id', userId)
        
        if (updateProfileError) throw updateProfileError
      } else {
        // Crear nuevo perfil
        const { error: insertError } = await supabase
          .from('perfiles')
          .insert([{ id: userId, nombre, telefono, email }])
        
        if (insertError) throw insertError
      }

      navigate('/')
    } catch (err: any) {
      setError(err.message || 'Error al guardar los datos')
    } finally {
      setLoading(false)
    }
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
          padding: 1.8rem 1.4rem;
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

        .auth-title {
          font-size: 1.4rem;
          font-weight: 600;
          text-align: center;
          color: #fff;
          margin-bottom: 0.5rem;
          letter-spacing: -0.3px;
        }

        .auth-subtitle {
          text-align: center;
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.75rem;
          margin-bottom: 1rem;
        }

        .info-email {
          text-align: center;
          color: #0eb8d0;
          font-size: 0.8rem;
          margin-bottom: 1rem;
          background: rgba(14, 184, 208, 0.1);
          padding: 0.5rem;
          border-radius: 12px;
          word-break: break-all;
        }

        .input-group {
          margin-bottom: 1rem;
        }

        .input-group label {
          display: block;
          font-size: 0.7rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 0.3rem;
          letter-spacing: 0.3px;
        }

        .input-field {
          width: 100%;
          padding: 0.6rem 0.85rem;
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

        .error-message {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #f87171;
          padding: 0.45rem;
          border-radius: 12px;
          font-size: 0.7rem;
          text-align: center;
          margin-bottom: 1rem;
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

        .help-text {
          font-size: 0.6rem;
          color: rgba(255, 255, 255, 0.4);
          margin-top: 0.2rem;
        }

        @media (max-width: 480px) {
          .liquid-glass-card {
            max-width: 300px;
            padding: 1.4rem 1rem;
          }
          .auth-title {
            font-size: 1.2rem;
          }
        }
      `}</style>

      <div className="liquid-glass-card">
        <h1 className="auth-title">Completa tu perfil</h1>
        <p className="auth-subtitle">Solo necesitamos algunos datos adicionales</p>

        <div className="info-email">
          📧 {email}
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Nombre completo</label>
            <input
              type="text"
              placeholder="Tu nombre completo"
              className="input-field"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Teléfono</label>
            <input
              type="tel"
              placeholder="83606680"
              className="input-field"
              value={telefono}
              onChange={handleTelefonoChange}
              maxLength={8}
              required
            />
            <div className="help-text">Solo números, 8 dígitos</div>
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? <div className="spinner" /> : 'Continuar'}
          </button>
        </form>
      </div>
    </div>
  )
}