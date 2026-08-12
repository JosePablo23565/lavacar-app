import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import './CompletarPerfil.css'

export function CompletarPerfil() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: ''
  })
  const [userEmail, setUserEmail] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        navigate('/acceder')
        return
      }

      setUserId(user.id)
      setUserEmail(user.email || '')

      const { data: perfil } = await supabase
        .from('perfiles')
        .select('nombre, telefono')
        .eq('id', user.id)
        .single()

      if (perfil) {
        const tieneNombre = perfil.nombre && perfil.nombre.trim() !== ''
        const tieneTelefono = perfil.telefono && perfil.telefono.trim() !== ''

        // Si ya lo tiene completo no hay nada que pedirle
        if (tieneNombre && tieneTelefono) {
          navigate('/', { replace: true })
          return
        }

        setFormData({
          nombre: perfil.nombre || '',
          telefono: perfil.telefono || ''
        })
      }

      setChecking(false)
    }
    
    getUser()
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.nombre.trim()) {
      setError('El nombre es obligatorio')
      return
    }
    
    if (!formData.telefono.trim()) {
      setError('El teléfono es obligatorio')
      return
    }
    
    if (formData.telefono.length < 8) {
      setError('El teléfono debe tener al menos 8 dígitos')
      return
    }
    
    if (!userId) {
      setError('Error: Usuario no identificado')
      return
    }
    
    setLoading(true)
    
    const { error: dbError } = await supabase
      .from('perfiles')
      .upsert({
        id: userId,
        nombre: formData.nombre.trim(),
        telefono: formData.telefono,
        email: userEmail
      })

    if (dbError) {
      setError('Error al guardar: ' + dbError.message)
      setLoading(false)
      return
    }

    // Recarga completa para que el menu tome el nombre nuevo
    window.location.href = '/'
  }

  if (checking) {
    return (
      <div className="app-loading">
        <div className="app-loading-spinner" />
        <div className="app-loading-text">Verificando...</div>
      </div>
    )
  }

  return (
    <div className="cp-page">
      <div className="cp-card">
        <div className="cp-header">
          <h2>Completa tu perfil</h2>
          <p>Necesitamos algunos datos para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="cp-body">
          {error && <div className="cp-error">{error}</div>}

          <div className="cp-correo">
            <span className="cp-correo-label">Correo</span>
            <span className="cp-correo-valor">{userEmail || 'Cargando...'}</span>
          </div>

          <div className="cp-field">
            <label>Nombre completo</label>
            <input
              type="text"
              placeholder="Tu nombre completo"
              value={formData.nombre}
              onChange={(e) => {
                const value = e.target.value
                const soloLetras = /^[a-zA-ZáéíóúñÑüÜ\s]*$/
                if (soloLetras.test(value) && value.length <= 40) {
                  setFormData({ ...formData, nombre: value })
                }
              }}
              maxLength={40}
              required
            />
            <p className="cp-hint">Máximo 40 caracteres, solo letras y espacios.</p>
          </div>

          <div className="cp-field">
            <label>Teléfono</label>
            <input
              type="tel"
              placeholder="8 dígitos"
              value={formData.telefono}
              onChange={(e) => {
                const onlyNumbers = e.target.value.replace(/[^0-9]/g, '')
                if (onlyNumbers.length <= 8) {
                  setFormData({ ...formData, telefono: onlyNumbers })
                }
              }}
              maxLength={8}
              required
            />
            <p className="cp-hint">8 dígitos, solo números.</p>
          </div>

          <div className="cp-footer">
            <button type="submit" className="cp-btn-save" disabled={loading}>
              {loading ? 'Guardando...' : 'Continuar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}