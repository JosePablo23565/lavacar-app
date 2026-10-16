import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { swalConfirm, swalSuccess, swalError, swalAviso } from '../../utils/swalConfig'
import { AvisoLimite } from '../AvisoLimite/AvisoLimite'

type Opinion = {
  id: number
  customer_name: string
  email: string
  comment: string
  rating: number
  created_at: string
  is_approved: boolean
}

export function Opiniones() {
  const [opiniones, setOpiniones] = useState<Opinion[]>([])
  const [loading, setLoading] = useState(true)
  const [perfil, setPerfil] = useState({ nombre: '', telefono: '', email: '' })
  const [formData, setFormData] = useState({
    nombre: '',
    comentario: '',
    rating: 0
  })
  const [enviando, setEnviando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [hoveredStar, setHoveredStar] = useState(0)

  const [vista, setVista] = useState<'opinar' | 'mis'>('opinar')
  const [misOpiniones, setMisOpiniones] = useState<Opinion[]>([])
  const [buscando, setBuscando] = useState(false)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ comentario: '', rating: 0 })

  const MAX_OPINIONES = 2
  const MAX_CARACTERES = 50
  const alcanzoLimite = misOpiniones.length >= MAX_OPINIONES

  useEffect(() => {
    fetchOpiniones()
    cargarPerfil()
    cargarMisOpiniones()
  }, [])

  const fetchOpiniones = async () => {
    const { data } = await supabase
      .from('testimonials')
      .select('*')
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
    
    setOpiniones(data || [])
    setLoading(false)
  }

  const cargarPerfil = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data } = await supabase
        .from('perfiles')
        .select('nombre, telefono, email')
        .eq('id', user.id)
        .single()
      
      if (data) {
        setPerfil(data)
        setFormData(prev => ({ ...prev, nombre: data.nombre || '' }))
      }
    }
  }

  const handleComentarioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    if (value.length <= MAX_CARACTERES) {
      setFormData({ ...formData, comentario: value })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nombre.trim()) {
      setMensaje('Por favor ingrese su nombre')
      return
    }
    if (!formData.comentario.trim()) {
      setMensaje('Por favor escriba su comentario')
      return
    }
    if (formData.rating === 0) {
      setMensaje('Por favor seleccione una calificación (1-5 estrellas)')
      return
    }
    
    setEnviando(true)
    
    // El tope lo controla la base de datos
    const { error } = await supabase.rpc('crear_opinion', {
      p_comment: formData.comentario,
      p_rating: formData.rating,
    })

    if (error) {
      const motivo = error.message || ''
      if (motivo.includes('LIMITE_OPINIONES')) {
        await swalAviso(
          'Ya dejaste tus opiniones',
          `Cada cliente puede dejar ${MAX_OPINIONES} opiniones. Si querés escribir otra, entrá a "Mis opiniones" y eliminá una de las que ya tenés.`
        )
        await cargarMisOpiniones()
      } else if (motivo.includes('NO_AUTORIZADO')) {
        await swalError('Tu sesión expiró', 'Iniciá sesión de nuevo para dejar tu opinión.')
      } else {
        await swalError('No se pudo enviar', motivo)
      }
    } else {
      setMensaje('Opinión enviada con éxito. Quedará visible tras ser aprobada.')
      setFormData({ ...formData, comentario: '', rating: 0 })
      fetchOpiniones()
      await cargarMisOpiniones()
      setTimeout(() => setMensaje(''), 3000)
    }
    setEnviando(false)
  }

  const cargarMisOpiniones = async () => {
    setBuscando(true)
    const { data } = await supabase.rpc('mis_opiniones')
    setMisOpiniones((data || []) as Opinion[])
    setBuscando(false)
  }

  const empezarEdicion = (op: Opinion) => {
    setEditandoId(op.id)
    setEditForm({ comentario: op.comment, rating: op.rating })
  }

  const guardarEdicion = async (id: number) => {
    if (!editForm.comentario.trim()) {
      await swalAviso('Falta el comentario', 'Escribí tu opinión antes de guardar.')
      return
    }
    if (editForm.rating === 0) {
      await swalAviso('Falta la calificación', 'Elegí de 1 a 5 estrellas.')
      return
    }

    // Al editarla vuelve a quedar pendiente de aprobacion
    const { data: actualizadas, error } = await supabase
      .from('testimonials')
      .update({ comment: editForm.comentario.trim(), rating: editForm.rating, is_approved: false })
      .eq('id', id)
      .select()

    if (error) {
      await swalError('No se pudo guardar', error.message)
      return
    }

    if (!actualizadas || actualizadas.length === 0) {
      await swalError('No se pudo guardar', 'Esa opinión no es tuya, así que no podés modificarla.')
      return
    }

    setEditandoId(null)
    await swalSuccess('Opinión actualizada', 'Quedará visible de nuevo tras ser aprobada.')
    await cargarMisOpiniones()
    fetchOpiniones()
  }

  const eliminarOpinion = async (op: Opinion) => {
    const r = await swalConfirm('¿Eliminar esta opinión?', 'Esta acción no se puede deshacer.')
    if (!r.isConfirmed) return

    const { data: borradas, error } = await supabase
      .from('testimonials')
      .delete()
      .eq('id', op.id)
      .select()

    if (error) {
      await swalError('No se pudo eliminar', error.message)
      return
    }

    if (!borradas || borradas.length === 0) {
      await swalError('No se pudo eliminar', 'Esa opinión no es tuya, así que no podés eliminarla.')
      return
    }

    await swalSuccess('Opinión eliminada', 'Ya podés escribir una nueva.')
    await cargarMisOpiniones()
    fetchOpiniones()
  }

  const renderRatingStars = () => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      const isActive = i <= formData.rating
      const isHovered = i <= hoveredStar
      stars.push(
        <button
          key={i}
          type="button"
          className={`op-rating-star ${isActive ? 'active' : ''} ${isHovered && !isActive ? 'hover' : ''}`}
          onClick={() => setFormData({ ...formData, rating: i })}
          onMouseEnter={() => setHoveredStar(i)}
          onMouseLeave={() => setHoveredStar(0)}
          aria-label={`Calificar con ${i} estrellas`}
        >
          ★
        </button>
      )
    }
    return stars
  }

  // Separación en dos columnas (mampostería / masonry)
  const colIzquierda = opiniones.filter((_, idx) => idx % 2 === 0)
  const colDerecha = opiniones.filter((_, idx) => idx % 2 !== 0)

  return (
    <>
      <style>{`
        /* ============================================================
           FUSIÓN: ESTRUCTURA ORIGINAL + ESTÉTICA PURA ADMIN
           Fondo oscuro mate sin halos ni adornos flotantes.
           ============================================================ */

        .op-fusion-root {
          min-height: calc(100vh - 72px);
          background-color: #080808;
          padding: 1.5rem 1rem 4rem;
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #d4d4d4;
          box-sizing: border-box;
        }

        .op-fusion-container {
          max-width: 680px;
          margin: 0 auto;
        }

        /* Pestañas flotantes y fijas al hacer scroll */
        .op-fusion-tabs {
          display: flex;
          background: rgba(20, 20, 20, 0.94);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          padding: 0.35rem;
          border-radius: 50px;
          max-width: 360px;
          margin: 0 auto 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.12);
          gap: 0.25rem;
          position: sticky;
          top: 75px;
          z-index: 30;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        }

        .op-fusion-tab {
          flex: 1;
          padding: 0.65rem 1.1rem;
          border: none;
          background: transparent;
          color: #888888;
          font-size: 0.86rem;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
        }

        .op-fusion-tab:hover {
          color: #ffffff;
        }

        .op-fusion-tab.active {
          background: #e0142c;
          color: #ffffff;
          font-weight: 600;
          box-shadow: 0 4px 14px rgba(224, 20, 44, 0.35);
        }

        /* Tarjeta principal */
        .op-fusion-card {
          background: #121212;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
        }

        .op-fusion-card-header {
          background: linear-gradient(135deg, rgba(224, 20, 44, 0.12), rgba(224, 20, 44, 0.02));
          padding: 1.5rem 1.75rem;
          text-align: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .op-fusion-card-header h2 {
          font-family: 'Sora', sans-serif;
          font-size: 1.35rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 0.35rem 0;
          letter-spacing: -0.01em;
        }

        .op-fusion-card-header p {
          font-size: 0.82rem;
          color: #888888;
          margin: 0;
        }

        .op-fusion-body {
          padding: 1.75rem;
        }

        /* Grupos de inputs */
        .op-input-group {
          margin-bottom: 1.5rem;
        }

        .op-input-label {
          display: block;
          font-size: 0.72rem;
          font-weight: 600;
          color: #888888;
          margin-bottom: 0.5rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .op-input-control {
          width: 100%;
          padding: 0.85rem 1.1rem;
          line-height: 1.5;
          background: #181818;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: #ffffff;
          font-size: 0.9rem;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          box-sizing: border-box;
        }

        .op-input-control:focus {
          border-color: #e0142c;
          box-shadow: 0 0 0 2px rgba(224, 20, 44, 0.2);
        }

        .op-input-control:disabled {
          opacity: 0.75;
          cursor: not-allowed;
          background: #141414;
          color: #777777;
        }

        textarea.op-input-control {
          min-height: 85px;
          resize: vertical;
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .op-char-counter {
          text-align: right;
          font-size: 0.72rem;
          color: #666666;
          margin-top: 0.45rem;
          font-family: 'JetBrains Mono', monospace;
        }

        .op-char-counter.near-limit {
          color: #f59e0b;
        }

        .op-char-counter.limit {
          color: #ef4444;
          font-weight: 600;
        }

        /* Calificación por estrellas limpia: sin marco ni cuadro de fondo */
        .op-rating-group {
          text-align: center;
          padding: 0.35rem 0;
          background: transparent;
          border: none;
        }

        .op-rating-stars {
          display: flex;
          justify-content: center;
          gap: 0.6rem;
        }

        .op-rating-star {
          background: none;
          border: none;
          font-size: 2.2rem;
          cursor: pointer;
          color: #333333;
          padding: 0;
          line-height: 1;
          transition: color 0.15s ease, text-shadow 0.15s ease;
        }

        .op-rating-star:hover,
        .op-rating-star.hover {
          color: #f59e0b;
          text-shadow: 0 0 10px rgba(245, 158, 11, 0.4);
        }

        .op-rating-star.active {
          color: #f59e0b;
          text-shadow: 0 0 8px rgba(245, 158, 11, 0.35);
        }

        .op-rating-hint {
          font-size: 0.75rem;
          color: #888888;
          text-align: center;
          margin-top: 0.5rem;
          margin-bottom: 0;
        }

        /* Botón de envío */
        .op-fusion-submit-btn {
          width: 100%;
          padding: 0.9rem;
          background: linear-gradient(135deg, #e0142c, #a10e1f);
          color: white;
          border: none;
          border-radius: 50px;
          font-size: 0.92rem;
          font-weight: 600;
          font-family: 'Sora', sans-serif;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
          margin-top: 0.5rem;
          box-shadow: 0 4px 15px rgba(224, 20, 44, 0.3);
        }

        .op-fusion-submit-btn:hover:not(:disabled) {
          box-shadow: 0 6px 20px rgba(224, 20, 44, 0.45);
        }

        .op-fusion-submit-btn:active {
          transform: scale(0.99);
        }

        .op-fusion-submit-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          box-shadow: none;
        }

        /* Mensajes de notificación */
        .op-fusion-msg {
          padding: 0.8rem;
          border-radius: 10px;
          margin-bottom: 1.25rem;
          text-align: center;
          font-size: 0.84rem;
        }

        .op-fusion-msg.success {
          background: rgba(34, 197, 94, 0.1);
          color: #4ade80;
          border: 1px solid rgba(34, 197, 94, 0.25);
        }

        .op-fusion-msg.error {
          background: rgba(239, 68, 68, 0.1);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.25);
        }

        /* ============================================================
           MURO DE TESTIMONIOS: 2 COLUMNAS (ESTILO MASONRY SIN HUECOS)
           Se ven dos a la par en teléfonos y en computadoras.
           Cada columna fluye hacia abajo adaptándose a su contenido.
           ============================================================ */
        .op-fusion-masonry {
          display: flex;
          gap: 0.65rem;
          padding: 1.25rem 1rem;
          align-items: flex-start;
          width: 100%;
          box-sizing: border-box;
        }

        .op-masonry-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
          min-width: 0;
        }

        .op-fusion-review-card {
          background: #141414;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 0.75rem 0.65rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-sizing: border-box;
        }

        .op-fusion-review-stars {
          color: #f59e0b;
          font-size: 0.78rem;
          margin-bottom: 0.4rem;
          letter-spacing: 1.5px;
          text-shadow: 0 0 6px rgba(245, 158, 11, 0.3);
        }

        .op-fusion-review-text {
          font-size: 0.78rem;
          color: #d4d4d4;
          line-height: 1.4;
          margin-bottom: 0.6rem;
          font-style: italic;
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .op-fusion-review-author {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          padding-top: 0.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .op-fusion-review-avatar {
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, #e0142c, #800a16);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.68rem;
          color: #ffffff;
          flex-shrink: 0;
        }

        .op-fusion-review-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
          gap: 0.08rem;
          overflow: hidden;
        }

        .op-fusion-review-name {
          font-weight: 700;
          font-size: 0.74rem;
          color: #ffffff;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .op-fusion-review-date {
          font-size: 0.64rem;
          color: #777777;
          font-family: 'JetBrains Mono', monospace;
        }

        /* Mis opiniones */
        .op-fusion-lista {
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
        }

        .op-fusion-item {
          background: #161616;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 1.15rem;
        }

        .op-fusion-item-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.6rem;
        }

        .op-fusion-item-estrellas {
          color: #f59e0b;
          font-size: 1rem;
          letter-spacing: 2px;
          text-shadow: 0 0 6px rgba(245, 158, 11, 0.3);
        }

        .op-fusion-estado {
          font-size: 0.65rem;
          font-weight: 600;
          padding: 0.2rem 0.65rem;
          border-radius: 20px;
          text-transform: uppercase;
          white-space: nowrap;
          letter-spacing: 0.05em;
        }

        .op-fusion-estado.aprobada {
          background: rgba(34, 197, 94, 0.12);
          border: 1px solid rgba(34, 197, 94, 0.3);
          color: #4ade80;
        }

        .op-fusion-estado.pendiente {
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.3);
          color: #fbbf24;
        }

        .op-fusion-item-texto {
          font-size: 0.88rem;
          color: #d4d4d4;
          line-height: 1.55;
          font-style: italic;
          margin-bottom: 0.9rem;
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .op-fusion-item-acciones {
          display: flex;
          gap: 0.6rem;
          justify-content: flex-end;
          margin-top: 0.75rem;
        }

        .op-fusion-item-acciones button {
          padding: 0.45rem 1rem;
          border-radius: 20px;
          font-size: 0.78rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .op-fusion-btn-editar {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #d4d4d4;
        }

        .op-fusion-btn-editar:hover {
          background: rgba(255, 255, 255, 0.16);
          color: #ffffff;
        }

        .op-fusion-btn-eliminar {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #f87171;
        }

        .op-fusion-btn-eliminar:hover {
          background: rgba(239, 68, 68, 0.22);
        }

        .op-fusion-btn-cancelar {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #888888;
        }

        .op-fusion-btn-guardar {
          background: linear-gradient(135deg, #e0142c, #a10e1f);
          border: none;
          color: #ffffff;
          font-weight: 600;
        }

        .op-fusion-edit-estrellas {
          display: flex;
          gap: 0.4rem;
          margin-bottom: 0.75rem;
        }

        .op-fusion-edit-estrellas .op-rating-star {
          font-size: 1.6rem;
        }

        /* Estados vacíos */
        .op-fusion-empty {
          text-align: center;
          padding: 2.5rem 1rem;
          color: #666666;
          font-size: 0.88rem;
        }

        .op-fusion-empty-icon {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
          opacity: 0.5;
        }

        .op-fusion-spinner {
          animation: opSpin 0.75s linear infinite;
        }

        @keyframes opSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 640px) {
          .op-fusion-root {
            padding: 1rem 0.65rem 3rem;
          }
          .op-fusion-tabs {
            top: 68px;
            max-width: 310px;
            margin-bottom: 1.25rem;
          }
          .op-fusion-body {
            padding: 1.25rem 0.9rem;
          }
          .op-fusion-masonry {
            padding: 1rem 0.6rem;
            gap: 0.5rem;
          }
          .op-masonry-col {
            gap: 0.5rem;
          }
          .op-rating-star {
            font-size: 1.85rem;
          }
        }
      `}</style>

      <div className="op-fusion-root">
        <div className="op-fusion-container">

          {/* Selector de pestañas: flotante fijo arriba */}
          <div className="op-fusion-tabs">
            <button
              type="button"
              className={`op-fusion-tab ${vista === 'opinar' ? 'active' : ''}`}
              onClick={() => setVista('opinar')}
            >
              Dejar opinión
            </button>
            <button
              type="button"
              className={`op-fusion-tab ${vista === 'mis' ? 'active' : ''}`}
              onClick={() => setVista('mis')}
            >
              Mis opiniones
            </button>
          </div>

          {/* VISTA 1: DEJAR OPINIÓN */}
          {vista === 'opinar' && (
            <div className="op-fusion-card">
              <div className="op-fusion-card-header">
                <h2>Dejar Opinión</h2>
                <p>Comparta su experiencia y ayude a otros clientes</p>
              </div>

              <div className="op-fusion-body">
                {alcanzoLimite && (
                  <AvisoLimite
                    titulo="Ya dejaste todas tus opiniones"
                    destacado={{
                      etiqueta: 'Opiniones usadas',
                      valor: `${misOpiniones.length} de ${MAX_OPINIONES}`,
                    }}
                    nota="Si querés escribir otra, primero eliminá una de las que ya tenés."
                  >
                    <button type="button" className="avl-btn avl-btn-rojo" onClick={() => setVista('mis')}>
                      Ver mis opiniones
                    </button>
                  </AvisoLimite>
                )}

                {mensaje && (
                  <div className={`op-fusion-msg ${mensaje.includes('éxito') ? 'success' : 'error'}`}>
                    {mensaje}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  {/* Nombre (no editable) */}
                  <div className="op-input-group">
                    <label className="op-input-label">
                      SU NOMBRE (NO EDITABLE)
                    </label>
                    <input
                      className="op-input-control"
                      type="text"
                      value={perfil.nombre || ''}
                      disabled
                      placeholder="Cargando..."
                    />
                  </div>

                  {/* Calificación: estrellas limpias sin marco de fondo */}
                  <div className="op-input-group">
                    <label className="op-input-label">
                      CALIFICACIÓN
                    </label>
                    <div className="op-rating-group">
                      <div className="op-rating-stars">
                        {renderRatingStars()}
                      </div>
                      <p className="op-rating-hint">
                        Haga clic en las estrellas para seleccionar
                      </p>
                    </div>
                  </div>

                  {/* Comentario (máximo 50 caracteres) */}
                  <div className="op-input-group">
                    <label className="op-input-label">
                      SU COMENTARIO
                    </label>
                    <textarea
                      className="op-input-control"
                      value={formData.comentario}
                      onChange={handleComentarioChange}
                      placeholder="Cuéntenos su experiencia con nuestro servicio..."
                      maxLength={MAX_CARACTERES}
                      required
                    />
                    <div className={`op-char-counter ${formData.comentario.length >= 45 ? (formData.comentario.length >= 50 ? 'limit' : 'near-limit') : ''}`}>
                      {formData.comentario.length}/{MAX_CARACTERES} caracteres
                    </div>
                  </div>

                  {/* Botón enviar */}
                  <button type="submit" className="op-fusion-submit-btn" disabled={enviando || alcanzoLimite}>
                    {enviando ? (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <svg className="op-fusion-spinner" width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeDasharray="31" strokeDashoffset="10" />
                        </svg>
                        Enviando...
                      </span>
                    ) : (
                      'Enviar Opinión'
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* VISTA 2: MIS OPINIONES */}
          {vista === 'mis' && (
            <div className="op-fusion-card">
              <div className="op-fusion-card-header">
                <h2>Mis Opiniones</h2>
                <p>Estas son las opiniones que has dejado</p>
              </div>

              <div className="op-fusion-body">
                {buscando ? (
                  <div className="op-fusion-empty"><p>Cargando tus opiniones...</p></div>
                ) : misOpiniones.length === 0 ? (
                  <div className="op-fusion-empty">
                    <div className="op-fusion-empty-icon">💬</div>
                    <p>Todavía no has dejado ninguna opinión</p>
                  </div>
                ) : (
                  <div className="op-fusion-lista">
                    {misOpiniones.map((op) => (
                      <div key={op.id} className="op-fusion-item">
                        {editandoId === op.id ? (
                          <>
                            <div className="op-fusion-edit-estrellas">
                              {[1, 2, 3, 4, 5].map((i) => (
                                <button
                                  key={i}
                                  type="button"
                                  className={`op-rating-star ${i <= editForm.rating ? 'active' : ''}`}
                                  onClick={() => setEditForm({ ...editForm, rating: i })}
                                >
                                  ★
                                </button>
                              ))}
                            </div>
                            <textarea
                              className="op-input-control"
                              value={editForm.comentario}
                              maxLength={MAX_CARACTERES}
                              onChange={(e) => {
                                if (e.target.value.length <= MAX_CARACTERES) {
                                  setEditForm({ ...editForm, comentario: e.target.value })
                                }
                              }}
                            />
                            <div className="op-fusion-item-acciones">
                              <button type="button" className="op-fusion-btn-cancelar" onClick={() => setEditandoId(null)}>
                                Cancelar
                              </button>
                              <button type="button" className="op-fusion-btn-guardar" onClick={() => guardarEdicion(op.id)}>
                                Guardar
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="op-fusion-item-top">
                              <span className="op-fusion-item-estrellas">{'★'.repeat(op.rating)}</span>
                              <span className={`op-fusion-estado ${op.is_approved ? 'aprobada' : 'pendiente'}`}>
                                {op.is_approved ? 'Publicada' : 'Pendiente'}
                              </span>
                            </div>
                            <p className="op-fusion-item-texto">"{op.comment}"</p>
                            <div className="op-fusion-item-acciones">
                              <button type="button" className="op-fusion-btn-editar" onClick={() => empezarEdicion(op)}>
                                Editar
                              </button>
                              <button type="button" className="op-fusion-btn-eliminar" onClick={() => eliminarOpinion(op)}>
                                Eliminar
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VISTA 1 CONTINUACIÓN: OPINIONES EN 2 COLUMNAS (MASONRY) */}
          {vista === 'opinar' && (
            <div className="op-fusion-card" style={{ marginTop: '2rem' }}>
              <div className="op-fusion-card-header">
                <h2>Opiniones de nuestros clientes</h2>
                <p>Lo que dicen quienes ya nos visitaron</p>
              </div>

              {loading ? (
                <div className="op-fusion-empty">
                  <div className="op-fusion-empty-icon">⏳</div>
                  <p>Cargando opiniones...</p>
                </div>
              ) : opiniones.length === 0 ? (
                <div className="op-fusion-empty">
                  <div className="op-fusion-empty-icon">📋</div>
                  <p>No hay opiniones aún. ¡Sea el primero en opinar!</p>
                </div>
              ) : (
                <div className="op-fusion-masonry">
                  {/* Columna Izquierda */}
                  <div className="op-masonry-col">
                    {colIzquierda.map((opinion) => (
                      <div key={opinion.id} className="op-fusion-review-card">
                        <div>
                          <div className="op-fusion-review-stars">{"★".repeat(opinion.rating)}</div>
                          <div className="op-fusion-review-text">"{opinion.comment}"</div>
                        </div>
                        <div className="op-fusion-review-author">
                          <div className="op-fusion-review-avatar">
                            {opinion.customer_name?.charAt(0).toUpperCase() || 'C'}
                          </div>
                          <div className="op-fusion-review-info">
                            <div className="op-fusion-review-name">{opinion.customer_name}</div>
                            <div className="op-fusion-review-date">
                              {new Date(opinion.created_at).toLocaleDateString('es-CR')}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Columna Derecha */}
                  <div className="op-masonry-col">
                    {colDerecha.map((opinion) => (
                      <div key={opinion.id} className="op-fusion-review-card">
                        <div>
                          <div className="op-fusion-review-stars">{"★".repeat(opinion.rating)}</div>
                          <div className="op-fusion-review-text">"{opinion.comment}"</div>
                        </div>
                        <div className="op-fusion-review-author">
                          <div className="op-fusion-review-avatar">
                            {opinion.customer_name?.charAt(0).toUpperCase() || 'C'}
                          </div>
                          <div className="op-fusion-review-info">
                            <div className="op-fusion-review-name">{opinion.customer_name}</div>
                            <div className="op-fusion-review-date">
                              {new Date(opinion.created_at).toLocaleDateString('es-CR')}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  )
}