import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import '../css/CompletarPerfil.css'

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

  useEffect(() => {
    const getUser = async () => {
      console.log('🔍 1. Obteniendo usuario de Supabase...')
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
      console.log('🔍 2. Cargando perfil existente...')
      const { data: perfil, error: perfilError } = await supabase
        .from('perfiles')
        .select('nombre, telefono')
        .eq('id', user.id)
        .single()
      
      if (perfilError) {
        console.error('❌ Error al cargar perfil:', perfilError)
      }
      
      if (perfil) {
        console.log('📝 Perfil cargado:', perfil)
        setFormData({
          nombre: perfil.nombre || '',
          telefono: perfil.telefono || ''
        })
      } else {
        console.log('📝 No hay perfil existente, usando valores vacíos')
      }
    }
    
    getUser()
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    console.log('📝 3. Enviando formulario...')
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
    
    console.log('💾 4. Guardando en Supabase...')
    const { data, error: dbError } = await supabase
      .from('perfiles')
      .upsert({
        id: userId,
        nombre: formData.nombre.trim(),
        telefono: formData.telefono,
        email: userEmail
      })
    
    console.log('📡 Respuesta de Supabase:', { data, error: dbError })
    
    if (dbError) {
      console.error('❌ Error al guardar:', dbError)
      setError('Error al guardar: ' + dbError.message)
      setLoading(false)
    } else {
      console.log('✅ Guardado exitoso! Redirigiendo...')
      // Verificar que se guardó
      const { data: verify } = await supabase
        .from('perfiles')
        .select('nombre, telefono')
        .eq('id', userId)
        .single()
      console.log('🔍 Verificación después de guardar:', verify)
      
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full border border-gray-700">
        <h1 className="text-2xl font-bold text-white text-center mb-2">Completa tu perfil</h1>
        <p className="text-gray-400 text-center mb-6">Necesitamos algunos datos para continuar</p>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}
        
        <div className="bg-gray-700/50 rounded-lg p-3 mb-6 text-center">
          <span className="text-gray-400 text-sm">📧 </span>
          <span className="text-cyan-400 text-sm">{userEmail || 'Cargando...'}</span>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">NOMBRE COMPLETO</label>
            <input
              type="text"
              placeholder="Ej: Juan Pérez"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">TELÉFONO</label>
            <input
              type="tel"
              placeholder="Ej: 88888888"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition"
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
            <p className="text-gray-500 text-xs mt-1">8 dígitos, solo números</p>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:from-cyan-600 hover:to-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Guardando...' : 'CONTINUAR'}
          </button>
        </form>
      </div>
    </div>
  )
}