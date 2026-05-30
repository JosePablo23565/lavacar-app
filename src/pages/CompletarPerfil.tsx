import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function CompletarPerfil() {
  const navigate = useNavigate()
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userEmail, setUserEmail] = useState('')
z
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/acceder')
        return
      }
      
      // Verificar si ya tiene perfil completo
      const { data: perfil } = await supabase
        .from('perfiles')
        .select('nombre, telefono')
        .eq('id', user.id)
        .single()
      
      if (perfil?.nombre && perfil?.telefono && perfil.nombre !== '' && perfil.telefono !== '') {
        // Ya tiene perfil completo, redirigir al home
        navigate('/')
        return
      }
      
      setUserEmail(user.email || '')
    }
    
    getUser()
  }, [navigate])

  const handleTelefonoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const onlyNumbers = value.replace(/[^0-9]/g, '')
    if (onlyNumbers.length <= 8) {
      setTelefono(onlyNumbers)
    }
  }

  const handleNombreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const onlyLetters = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')
    if (onlyLetters.length <= 40) {
      setNombre(onlyLetters)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!nombre.trim()) {
      setError('Por favor ingrese su nombre completo')
      return
    }
    
    if (telefono.length !== 8) {
      setError('El teléfono debe tener exactamente 8 dígitos')
      return
    }
    
    setLoading(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { error: upsertError } = await supabase
        .from('perfiles')
        .upsert({
          id: user.id,
          nombre: nombre,
          telefono: telefono,
          email: user.email,
          updated_at: new Date()
        })
      
      if (upsertError) {
        setError('Error al guardar los datos. Intente de nuevo.')
        console.error(upsertError)
      } else {
        navigate('/')
      }
    }
    
    setLoading(false)
  }

  return (
    <div className="completar-perfil-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .completar-perfil-page {
          min-height: 100vh;
          width: 100%;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', sans-serif;
          overflow: hidden;
        }

        .completar-perfil-page::before {
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

        .completar-perfil-page::after {
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
          max-width: 360px;
          margin: 1.5rem;
          padding: 1.8rem 1.6rem;
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

        .title {
          font-size: 1.4rem;
          font-weight: 600;
          text-align: center;
          color: #fff;
          margin-bottom: 0.3rem;
          letter-spacing: -0.3px;
        }

        .subtitle {
          text-align: center;
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .email-info {
          text-align: center;
          margin-bottom: 1.5rem;
          padding: 0.5rem;
          background: rgba(14, 184, 208, 0.1);
          border-radius: 12px;
          font-size: 0.8rem;
          color: #0eb8d0;
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
          padding: 0.7rem 1rem;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 14px;
          color: #fff;
          font-size: 0.9rem;
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
        }

        .submit-btn {
          width: 100%;
          padding: 0.8rem;
          background: linear-gradient(135deg, #0eb8d0, #0a8ca0);
          color: #fff;
          border: none;
          border-radius: 40px;
          font-size: 0.9rem;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 0.5rem;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(14, 184, 208, 0.35);
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .error-message {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #f87171;
          padding: 0.6rem;
          border-radius: 12px;
          font-size: 0.75rem;
          text-align: center;
          margin-bottom: 1rem;
        }

        .hint {
          font-size: 0.6rem;
          color: rgba(255, 255, 255, 0.4);
          margin-top: 0.3rem;
        }

        @media (max-width: 480px) {
          .liquid-glass-card {
            max-width: 300px;
            padding: 1.4rem 1.2rem;
          }
          .title {
            font-size: 1.2rem;
          }
        }
      `}</style>

      <div className="liquid-glass-card">
        <h1 className="title">Completa tu perfil</h1>
        <p className="subtitle">Necesitamos algunos datos para continuar</p>
        
        <div className="email-info">
          📧 {userEmail}
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>NOMBRE COMPLETO</label>
            <input
              type="text"
              placeholder="Ej: Carlos Pérez"
              className="input-field"
              value={nombre}
              onChange={handleNombreChange}
              maxLength={40}
              required
            />
          </div>

          <div className="input-group">
            <label>TELÉFONO</label>
            <input
              type="tel"
              placeholder="Ej: 83606680"
              className="input-field"
              value={telefono}
              onChange={handleTelefonoChange}
              maxLength={8}
              required
            />
            <div className="hint">8 dígitos, solo números</div>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar y continuar'}
          </button>
        </form>
      </div>
    </div>
  )
}