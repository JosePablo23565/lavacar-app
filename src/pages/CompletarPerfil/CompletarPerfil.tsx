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
      console.log('1. Obteniendo usuario de Supabase...')
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('❌ Error al obtener usuario:', userError)
      }
      
      if (!user) {
        console.log('❌ No hay usuario, redirigiendo a /acceder')
        navigate('/acceder')
        return
      }
      
      console.log('✅ Usuario encontrado:', user.id, user.email)
      setUserId(user.id)
      setUserEmail(user.email || '')
      
      // Cargar datos existentes del perfil
      console.log('2. Cargando perfil existente...')
      const { data: perfil, error: perfilError } = await supabase
        .from('perfiles')
        .select('nombre, telefono')
        .eq('id', user.id)
        .single()
      
      if (perfilError) {
        console.error('❌ Error al cargar perfil:', perfilError)
      }
      
      if (perfil) {
        console.log('Perfil cargado:', perfil)
        
        // 🔥 NUEVO: Verificar si el perfil ya está completo
        const tieneNombre = perfil.nombre && perfil.nombre.trim() !== ''
        const tieneTelefono = perfil.telefono && perfil.telefono.trim() !== ''
        
        if (tieneNombre && tieneTelefono) {
          console.log('✅ Perfil ya completo, redirigiendo a home')
          window.location.href = '/'
          return
        }
        
        setFormData({
          nombre: perfil.nombre || '',
          telefono: perfil.telefono || ''
        })
      } else {
        console.log('No hay perfil existente, usando valores vacíos')
      }
      
      setChecking(false)
    }
    
    getUser()
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    console.log('3. Enviando formulario...')
    console.log('   userId:', userId)
    console.log('   userEmail:', userEmail)
    console.log('   nombre:', formData.nombre)
    console.log('   telefono:', formData.telefono)
    
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
    
    console.log('4. Guardando en Supabase...')
    const { data, error: dbError } = await supabase
      .from('perfiles')
      .upsert({
        id: userId,
        nombre: formData.nombre.trim(),
        telefono: formData.telefono,
        email: userEmail
      })
    
    console.log('Respuesta de Supabase:', { data, error: dbError })
    
    if (dbError) {
      console.error('❌ Error al guardar:', dbError)
      setError('Error al guardar: ' + dbError.message)
      setLoading(false)
    } else {
      console.log('✅ Guardado exitoso! Redirigiendo...')
      window.location.href = '/'
    }
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