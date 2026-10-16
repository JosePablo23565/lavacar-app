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
    if (value.length <= 100) {
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

  const getRatingLabel = (val: number) => {
    switch (val) {
      case 1: return '1 / 5 · Deficiente'
      case 2: return '2 / 5 · Regular'
      case 3: return '3 / 5 · Bueno'
      case 4: return '4 / 5 · Muy bueno'
      case 5: return '5 / 5 · Excelente'
      default: return 'Seleccione de 1 a 5 estrellas'
    }
  }

  const renderRatingStars = () => {
    const stars = []
    const currentRating = hoveredStar > 0 ? hoveredStar : formData.rating
    for (let i = 1; i <= 5; i++) {
      const isActive = i <= formData.rating
      const isHovered = i <= hoveredStar
      stars.push(
        <button
          key={i}
          type="button"
          className={`op-star-btn ${isActive ? 'active' : ''} ${isHovered ? 'hovered' : ''}`}
          onClick={() => setFormData({ ...formData, rating: i })}
          onMouseEnter={() => setHoveredStar(i)}
          onMouseLeave={() => setHoveredStar(0)}
          aria-label={`Calificar con ${i} estrellas`}
        >
          ★
        </button>
      )
    }
    return (
      <div className="op-stars-wrap">
        <div className="op-stars-row">{stars}</div>
        <div className="op-stars-hint">{getRatingLabel(currentRating)}</div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        /* Raíz limpia: fondo oscuro mate, sin degradados ni halos flotantes */
        .op-page-root {
          min-height: calc(100vh - 80px);
          background-color: #0d0d10;
          padding: 2.5rem 1rem 4rem;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #f4f4f5;
        }

        .op-container {
          max-width: 680px;
          margin: 0 auto;
        }

        /* Selector de pestañas elegante y formal */
        .op-nav-tabs {
          display: flex;
          background: #141417;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 4px;
          margin-bottom: 1.5rem;
          gap: 4px;
        }

        .op-tab-btn {
          flex: 1;
          background: transparent;
          border: none;
          color: #a1a1aa;
          padding: 0.65rem 1rem;
          font-size: 0.85rem;
          font-weight: 600;
          font-family: 'Sora', sans-serif;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.15s ease, color 0.15s ease;
          text-align: center;
        }

        .op-tab-btn:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.04);
        }

        .op-tab-btn.active {
          background: #e0142c;
          color: #ffffff;
        }

        /* Estructura de tarjeta: sobria, angular y limpia */
        .op-panel-card {
          background: #131316;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 2rem;
        }

        .op-panel-header {
          padding: 1.25rem 1.5rem;
          background: #17171c;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .op-panel-title {
          font-family: 'Sora', sans-serif;
          font-size: 1.2rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 0.25rem 0;
          letter-spacing: -0.01em;
        }

        .op-panel-subtitle {
          font-size: 0.82rem;
          color: #8b8b94;
          margin: 0;
          line-height: 1.4;
        }

        .op-panel-body {
          padding: 1.5rem;
        }

        /* Grupos de formularios sobrios */
        .op-form-group {
          margin-bottom: 1.25rem;
        }

        .op-label {
          display: block;
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #9ca3af;
          margin-bottom: 0.45rem;
        }

        .op-input,
        .op-textarea {
          width: 100%;
          background: #0a0a0c;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          color: #ffffff;
          font-family: 'Inter', sans-serif;
          font-size: 0.88rem;
          padding: 0.75rem 0.9rem;
          line-height: 1.5;
          outline: none;
          transition: border-color 0.15s ease, background 0.15s ease;
          box-sizing: border-box;
        }

        .op-input:focus,
        .op-textarea:focus {
          border-color: #e0142c;
          background: #0e0e12;
        }

        .op-input:disabled {
          background: #101014;
          color: #71717a;
          border-color: rgba(255, 255, 255, 0.05);
          cursor: not-allowed;
        }

        .op-textarea {
          min-height: 95px;
          resize: vertical;
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .op-char-bar {
          display: flex;
          justify-content: flex-end;
          margin-top: 0.4rem;
          font-size: 0.72rem;
          color: #71717a;
        }

        .op-char-bar.near-limit {
          color: #f59e0b;
        }

        .op-char-bar.limit {
          color: #ef4444;
          font-weight: 600;
        }

        /* Selector de estrellas sobrio y limpio */
        .op-stars-wrap {
          background: #0a0a0c;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 1rem 0.75rem;
          text-align: center;
        }

        .op-stars-row {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
        }

        .op-star-btn {
          background: none;
          border: none;
          font-size: 1.85rem;
          cursor: pointer;
          color: #3f3f46;
          padding: 0 0.15rem;
          line-height: 1;
          transition: color 0.15s ease;
        }

        .op-star-btn.active,
        .op-star-btn.hovered {
          color: #f59e0b;
        }

        .op-stars-hint {
          font-size: 0.75rem;
          color: #a1a1aa;
          margin-top: 0.5rem;
          font-weight: 500;
        }

        /* Botón de envío directo y formal */
        .op-btn-primary {
          width: 100%;
          background: #e0142c;
          color: #ffffff;
          border: none;
          border-radius: 6px;
          padding: 0.8rem 1rem;
          font-family: 'Sora', sans-serif;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .op-btn-primary:hover:not(:disabled) {
          background: #c81024;
        }

        .op-btn-primary:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        /* Alertas limpias */
        .op-alert {
          padding: 0.75rem 1rem;
          border-radius: 6px;
          font-size: 0.82rem;
          margin-bottom: 1.25rem;
          text-align: center;
          line-height: 1.4;
        }

        .op-alert-success {
          background: rgba(16, 185, 129, 0.1);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.25);
        }

        .op-alert-error {
          background: rgba(239, 68, 68, 0.1);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.25);
        }

        /* Lista de opiniones públicas (Muro) */
        .op-reviews-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
          gap: 1rem;
          padding: 1.25rem;
        }

        .op-review-item {
          background: #0d0d10;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 1.1rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .op-review-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .op-review-stars {
          color: #f59e0b;
          font-size: 0.92rem;
          letter-spacing: 2px;
        }

        .op-review-date {
          font-size: 0.72rem;
          color: #71717a;
        }

        .op-review-text {
          font-size: 0.85rem;
          color: #d4d4d8;
          line-height: 1.55;
          margin: 0 0 1rem 0;
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .op-review-author {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          padding-top: 0.75rem;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .op-avatar-badge {
          width: 30px;
          height: 30px;
          border-radius: 6px;
          background: #1c1c22;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #e0142c;
          font-weight: 700;
          font-size: 0.82rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .op-author-name {
          font-size: 0.82rem;
          font-weight: 600;
          color: #ffffff;
        }

        .op-author-verified {
          font-size: 0.68rem;
          color: #10b981;
          margin-top: 1px;
        }

        /* Mis opiniones */
        .op-my-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .op-my-item {
          background: #0a0a0c;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 1.1rem;
        }

        .op-my-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.6rem;
        }

        .op-status-tag {
          font-size: 0.65rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.2rem 0.6rem;
          border-radius: 4px;
        }

        .op-status-tag.approved {
          background: rgba(16, 185, 129, 0.12);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.25);
        }

        .op-status-tag.pending {
          background: rgba(245, 158, 11, 0.12);
          color: #fbbf24;
          border: 1px solid rgba(245, 158, 11, 0.25);
        }

        .op-my-comment {
          font-size: 0.88rem;
          color: #e4e4e7;
          line-height: 1.5;
          margin-bottom: 0.9rem;
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .op-actions-row {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
        }

        .op-btn-action {
          padding: 0.4rem 0.85rem;
          border-radius: 5px;
          font-size: 0.78rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.15s ease, border-color 0.15s ease;
        }

        .op-btn-edit {
          background: #18181c;
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #e4e4e7;
        }

        .op-btn-edit:hover {
          background: #222228;
          border-color: rgba(255, 255, 255, 0.2);
        }

        .op-btn-delete {
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.25);
          color: #f87171;
        }

        .op-btn-delete:hover {
          background: rgba(239, 68, 68, 0.18);
        }

        .op-btn-cancel {
          background: #18181c;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #a1a1aa;
        }

        .op-btn-save {
          background: #e0142c;
          border: none;
          color: #ffffff;
          font-weight: 600;
        }

        .op-btn-save:hover {
          background: #c81024;
        }

        .op-edit-stars-row {
          display: flex;
          gap: 0.35rem;
          margin-bottom: 0.65rem;
        }

        .op-edit-stars-row .op-star-btn {
          font-size: 1.4rem;
        }

        /* Estados vacíos */
        .op-empty-view {
          text-align: center;
          padding: 2.5rem 1rem;
          color: #71717a;
          font-size: 0.85rem;
        }

        .op-empty-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
          opacity: 0.6;
        }

        /* Spinner */
        .op-spinner {
          animation: opSpin 0.9s linear infinite;
        }

        @keyframes opSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 640px) {
          .op-page-root {
            padding: 1.25rem 0.75rem 3rem;
          }
          .op-panel-body {
            padding: 1.15rem 1rem;
          }
          .op-reviews-grid {
            grid-template-columns: 1fr;
            padding: 1rem 0.85rem;
          }
          .op-star-btn {
            font-size: 1.65rem;
          }
        }
      `}</style>

      <div className="op-page-root">
        <div className="op-container">

          {/* Selector de pestañas */}
          <div className="op-nav-tabs">
            <button
              type="button"
              className={`op-tab-btn ${vista === 'opinar' ? 'active' : ''}`}
              onClick={() => setVista('opinar')}
            >
              Dejar opinión
            </button>
            <button
              type="button"
              className={`op-tab-btn ${vista === 'mis' ? 'active' : ''}`}
              onClick={() => setVista('mis')}
            >
              Mis opiniones
            </button>
          </div>

          {/* VISTA 1: DEJAR OPINIÓN */}
          {vista === 'opinar' && (
            <div className="op-panel-card">
              <div className="op-panel-header">
                <h2 className="op-panel-title">Comparta su Experiencia</h2>
                <p className="op-panel-subtitle">Su testimonio nos ayuda a mejorar y guía a futuros clientes</p>
              </div>

              <div className="op-panel-body">
                {alcanzoLimite && (
                  <AvisoLimite
                    titulo="Límite de opiniones alcanzado"
                    destacado={{
                      etiqueta: 'Opiniones registradas',
                      valor: `${misOpiniones.length} de ${MAX_OPINIONES}`,
                    }}
                    nota="Cada cliente puede registrar hasta 2 opiniones. Si desea escribir una nueva, primero elimine una anterior en Mis Opiniones."
                  >
                    <button type="button" className="op-btn-primary" style={{ maxWidth: '200px', margin: '0 auto' }} onClick={() => setVista('mis')}>
                      Gestionar mis opiniones
                    </button>
                  </AvisoLimite>
                )}

                {mensaje && (
                  <div className={`op-alert ${mensaje.includes('éxito') ? 'op-alert-success' : 'op-alert-error'}`}>
                    {mensaje}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  {/* Nombre del cliente */}
                  <div className="op-form-group">
                    <label className="op-label">Nombre del Cliente</label>
                    <input
                      className="op-input"
                      type="text"
                      value={perfil.nombre || ''}
                      disabled
                      placeholder="Cargando perfil..."
                    />
                  </div>

                  {/* Calificación */}
                  <div className="op-form-group">
                    <label className="op-label">Calificación del Servicio</label>
                    {renderRatingStars()}
                  </div>

                  {/* Comentario */}
                  <div className="op-form-group">
                    <label className="op-label">Comentario o Reseña</label>
                    <textarea
                      className="op-textarea"
                      value={formData.comentario}
                      onChange={handleComentarioChange}
                      placeholder="Describa brevemente la atención, el acabado de su vehículo y su satisfacción..."
                      maxLength={100}
                      required
                    />
                    <div className={`op-char-bar ${formData.comentario.length >= 90 ? (formData.comentario.length >= 100 ? 'limit' : 'near-limit') : ''}`}>
                      {formData.comentario.length} / 100 caracteres
                    </div>
                  </div>

                  {/* Botón de envío */}
                  <button type="submit" className="op-btn-primary" disabled={enviando || alcanzoLimite}>
                    {enviando ? (
                      <>
                        <svg className="op-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeDasharray="31" strokeDashoffset="10" />
                        </svg>
                        <span>Procesando...</span>
                      </>
                    ) : (
                      'Publicar Opinión'
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* VISTA 2: MIS OPINIONES */}
          {vista === 'mis' && (
            <div className="op-panel-card">
              <div className="op-panel-header">
                <h2 className="op-panel-title">Mis Opiniones Registradas</h2>
                <p className="op-panel-subtitle">Historial de calificaciones emitidas con su cuenta</p>
              </div>

              <div className="op-panel-body">
                {buscando ? (
                  <div className="op-empty-view">
                    <p>Cargando opiniones...</p>
                  </div>
                ) : misOpiniones.length === 0 ? (
                  <div className="op-empty-view">
                    <div className="op-empty-icon">💬</div>
                    <p>Aún no ha dejado ninguna opinión registrada en el sistema.</p>
                  </div>
                ) : (
                  <div className="op-my-list">
                    {misOpiniones.map((op) => (
                      <div key={op.id} className="op-my-item">
                        {editandoId === op.id ? (
                          <>
                            <div className="op-edit-stars-row">
                              {[1, 2, 3, 4, 5].map((i) => (
                                <button
                                  key={i}
                                  type="button"
                                  className={`op-star-btn ${i <= editForm.rating ? 'active' : ''}`}
                                  onClick={() => setEditForm({ ...editForm, rating: i })}
                                >
                                  ★
                                </button>
                              ))}
                            </div>
                            <textarea
                              className="op-textarea"
                              value={editForm.comentario}
                              maxLength={100}
                              onChange={(e) => setEditForm({ ...editForm, comentario: e.target.value })}
                            />
                            <div className="op-actions-row" style={{ marginTop: '0.75rem' }}>
                              <button type="button" className="op-btn-action op-btn-cancel" onClick={() => setEditandoId(null)}>
                                Cancelar
                              </button>
                              <button type="button" className="op-btn-action op-btn-save" onClick={() => guardarEdicion(op.id)}>
                                Guardar cambios
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="op-my-top">
                              <span style={{ color: '#f59e0b', fontSize: '1rem', letterSpacing: '2px' }}>
                                {'★'.repeat(op.rating)}
                              </span>
                              <span className={`op-status-tag ${op.is_approved ? 'approved' : 'pending'}`}>
                                {op.is_approved ? 'Publicada' : 'En revisión'}
                              </span>
                            </div>
                            <p className="op-my-comment">"{op.comment}"</p>
                            <div className="op-actions-row">
                              <button type="button" className="op-btn-action op-btn-edit" onClick={() => empezarEdicion(op)}>
                                Editar
                              </button>
                              <button type="button" className="op-btn-action op-btn-delete" onClick={() => eliminarOpinion(op)}>
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

          {/* MURO DE OPINIONES DE CLIENTES */}
          {vista === 'opinar' && (
            <div className="op-panel-card">
              <div className="op-panel-header">
                <h2 className="op-panel-title">Opiniones de Nuestros Clientes</h2>
                <p className="op-panel-subtitle">Comentarios recientes verificados por el taller</p>
              </div>

              <div className="op-reviews-grid">
                {loading ? (
                  <div className="op-empty-view" style={{ gridColumn: '1 / -1' }}>
                    <p>Cargando testimonios...</p>
                  </div>
                ) : opiniones.length === 0 ? (
                  <div className="op-empty-view" style={{ gridColumn: '1 / -1' }}>
                    <p>No hay opiniones públicas registradas actualmente.</p>
                  </div>
                ) : (
                  opiniones.map((opinion) => (
                    <div key={opinion.id} className="op-review-item">
                      <div>
                        <div className="op-review-top">
                          <span className="op-review-stars">{'★'.repeat(opinion.rating)}</span>
                          <span className="op-review-date">{new Date(opinion.created_at).toLocaleDateString('es-CR')}</span>
                        </div>
                        <p className="op-review-text">"{opinion.comment}"</p>
                      </div>
                      <div className="op-review-author">
                        <div className="op-avatar-badge">
                          {opinion.customer_name?.charAt(0).toUpperCase() || 'C'}
                        </div>
                        <div>
                          <div className="op-author-name">{opinion.customer_name}</div>
                          <div className="op-author-verified">✓ Cliente verificado</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}