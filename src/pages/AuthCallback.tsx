import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function AuthCallback() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          navigate('/acceder')
          return
        }

        const userId = session.user.id
        const userEmail = session.user.email || ''
        const userNombre = session.user.user_metadata?.nombre || 
                          session.user.user_metadata?.full_name || 
                          session.user.email?.split('@')[0] || ''

        // Verificar si ya existe un perfil
        let { data: perfil, error } = await supabase
          .from('perfiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle()  // ← usa maybeSingle en lugar de single

        // Si no existe perfil, crearlo
        if (!perfil) {
          const { error: insertError } = await supabase
            .from('perfiles')
            .insert([
              { 
                id: userId, 
                nombre: userNombre, 
                telefono: '', 
                email: userEmail 
              }
            ])
          
          if (insertError) {
            console.error('Error al crear perfil:', insertError)
          }
          
          // Redirigir a completar perfil (falta teléfono)
          navigate('/completar-perfil')
          return
        }

        // Si el perfil existe pero falta teléfono, redirigir a completar
        if (!perfil.telefono) {
          navigate('/completar-perfil')
          return
        }

        // Si todo está completo, ir al home
        navigate('/')
      } catch (err) {
        console.error('Error en callback:', err)
        navigate('/acceder')
      } finally {
        setLoading(false)
      }
    }

    handleCallback()
  }, [navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0f1e3a] to-[#0a0e1a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-[#0eb8d0]/30 border-t-[#0eb8d0] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">Completando autenticación...</p>
        </div>
      </div>
    )
  }

  return null
}