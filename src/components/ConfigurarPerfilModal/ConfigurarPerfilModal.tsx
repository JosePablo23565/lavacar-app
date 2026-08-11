import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { ToastNotification } from '../ToastNotification/ToastNotification'

// Componente para el modal de configurar perfil (con animación suave)
export function ConfigurarPerfilModal({ onClose }: { onClose: () => void }) {
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' })
  const [isClosing, setIsClosing] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    cargarPerfil()
  }, [])

  const cargarPerfil = async () => {
    if (!user) return
    const { data } = await supabase
      .from('perfiles')
      .select('nombre, telefono')
      .eq('id', user.id)
      .single()

    if (data) {
      setNombre(data.nombre || '')
      setTelefono(data.telefono || '')
    }
  }

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
    }, 300)
  }

  // Función para validar nombre (solo letras y espacios, máximo 30 caracteres)
  const validarNombre = (nombre: string): { valido: boolean; mensaje: string } => {
    if (!nombre.trim()) {
      return { valido: false, mensaje: 'El nombre es obligatorio' }
    }

    if (nombre.length > 30) {
      return { valido: false, mensaje: 'El nombre no puede tener más de 30 caracteres' }
    }

    // Solo letras (incluyendo acentos y ñ) y espacios
    const soloLetrasYEspacios = /^[a-zA-ZáéíóúñÑüÜ\s]+$/
    if (!soloLetrasYEspacios.test(nombre)) {
      return { valido: false, mensaje: 'El nombre solo puede contener letras y espacios' }
    }

    return { valido: true, mensaje: '' }
  }

  // Función para validar teléfono (exactamente 8 números)
  const validarTelefono = (telefono: string): { valido: boolean; mensaje: string } => {
    if (!telefono.trim()) {
      return { valido: false, mensaje: 'El teléfono es obligatorio' }
    }

    const soloNumeros = /^\d+$/
    if (!soloNumeros.test(telefono)) {
      return { valido: false, mensaje: 'El teléfono solo puede contener números' }
    }

    if (telefono.length !== 8) {
      return { valido: false, mensaje: 'El teléfono debe tener exactamente 8 dígitos' }
    }

    return { valido: true, mensaje: '' }
  }

  const guardarPerfil = async () => {
    // Validar nombre
    const nombreValidation = validarNombre(nombre)
    if (!nombreValidation.valido) {
      setToast({ show: true, message: nombreValidation.mensaje, type: 'error' })
      return
    }

    // Validar teléfono
    const telefonoValidation = validarTelefono(telefono)
    if (!telefonoValidation.valido) {
      setToast({ show: true, message: telefonoValidation.mensaje, type: 'error' })
      return
    }

    setLoading(true)

    const { error } = await supabase
      .from('perfiles')
      .update({
        nombre: nombre.trim(),
        telefono: telefono.trim()
      })
      .eq('id', user?.id)

    if (error) {
      setToast({ show: true, message: 'Error: ' + error.message, type: 'error' })
    } else {
      setToast({ show: true, message: 'Perfil actualizado correctamente', type: 'success' })
      setTimeout(() => {
        handleClose()
      }, 1500)
    }

    setLoading(false)
  }

  return (
    <>
      <div className={`profile-modal-overlay ${isClosing ? 'closing' : ''}`} onClick={handleClose}>
        <div className={`profile-modal-container ${isClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
          <div className="profile-modal-header">
            <h2>Configurar perfil</h2>
            <p>Actualiza tu información personal</p>
          </div>

          <div className="profile-modal-body">
            <div className="profile-field">
              <label>Nombre completo</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => {
                  const value = e.target.value
                  const soloLetras = /^[a-zA-ZáéíóúñÑüÜ\s]*$/
                  if (soloLetras.test(value) && value.length <= 40) {
                    setNombre(value)
                  }
                }}
                placeholder="Tu nombre completo"
                maxLength={40}
                required
              />
              <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
                Máximo 40 caracteres, solo letras y espacios.
              </p>
            </div>

            <div className="profile-field">
              <label>Teléfono</label>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => {
                  const onlyNumbers = e.target.value.replace(/[^0-9]/g, '')
                  if (onlyNumbers.length <= 8) {
                    setTelefono(onlyNumbers)
                  }
                }}
                placeholder="8 dígitos"
                maxLength={8}
                required
              />
              <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
                8 dígitos, solo números.
              </p>
            </div>
          </div>

          <div className="profile-modal-footer">
            <button className="profile-btn-cancel" onClick={handleClose}>
              Cancelar
            </button>
            <button className="profile-btn-save" onClick={guardarPerfil} disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>

      {toast.show && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: '', type: 'success' })}
        />
      )}
    </>
  )
}
