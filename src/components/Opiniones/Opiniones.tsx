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
  const [focusedField, setFocusedField] = useState<string | null>(null)
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

  const renderRatingStars = () => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      const isActive = i <= formData.rating
      const isHovered = i <= hoveredStar
      stars.push(
        <button
          key={i}
          type="button"
          className={`rating-star ${isActive ? 'active' : ''} ${isHovered && !isActive ? 'hover' : ''}`}
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

  return (
    <>
      <style>{`

        .opiniones-root {
          min-height: calc(100vh - 80px);
                  background: #1a1a1a;
          padding: 2rem 1rem 4rem;
          font-family: 'Inter', sans-serif;
          position: relative;
          /* 'clip' recorta los adornos que se salen a los lados igual que
             'hidden', pero sin convertir esto en una segunda zona de scroll.
             Con 'hidden' el navegador vuelve el eje vertical desplazable y
             la pagina rebota al bajar y subir en el telefono. */
          overflow-x: hidden; /* respaldo para navegadores viejos */
          overflow-x: clip;
        }

        .opiniones-root::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -20%;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(224, 20, 44,0.06) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        .opiniones-root::after {
          content: '';
          position: absolute;
          bottom: -30%;
          left: -10%;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(224, 20, 44,0.04) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        .opiniones-container {
          max-width: 680px;
          margin: 0 auto;
          position: relative;
          z-index: 2;
        }





        .opiniones-icon svg {
          width: 40px;
          height: 40px;
          color: white;
        }






        .form-card-header p {
          font-size: 0.75rem;
          color: #e0142c;
          letter-spacing: 0.1em;
          font-weight: 600;
          text-transform: uppercase;
          margin: 0;
        }


        .input-group {
          margin-bottom: 1.75rem;
        }

        .input-label {
          display: block;
          font-size: 0.7rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 0.6rem;
          letter-spacing: 0.08em;
          line-height: 1.4;
          text-transform: uppercase;
          transition: all 0.2s ease;
        }

        .input-label.active {
          color: #e0142c;
        }

        .input-field {
          width: 100%;
          padding: 1rem 1.1rem;
          line-height: 1.5;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          color: #fff;
          font-size: 0.9rem;
          font-family: 'Inter', sans-serif;
          transition: all 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          outline: none;
        }

        .input-field:focus {
          border-color: rgba(224, 20, 44, 0.5);
          background: rgba(224, 20, 44, 0.05);
          box-shadow: 0 0 0 3px rgba(224, 20, 44, 0.1);
        }

        .input-field:active {
          transform: scale(1.01);
        }

        .input-field::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        .input-field:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          background: rgba(255, 255, 255, 0.02);
        }

        textarea.input-field {
          min-height: 100px;
          resize: vertical;
        }

        .char-counter {
          text-align: right;
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.4);
          margin-top: 0.5rem;
        }

        .char-counter.near-limit {
          color: #f59e0b;
        }

        .char-counter.limit {
          color: #f87171;
        }

        .rating-group {
          text-align: center;
        }

        .rating-stars {
          display: flex;
          justify-content: center;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .rating-star {
          background: none;
          border: none;
          font-size: 2.5rem;
          cursor: pointer;
          color: #444444;
          transition: all 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          padding: 0;
          line-height: 1;
        }

        .rating-star:hover {
          transform: translateY(-6px) scale(1.15);
          color: #f59e0b;
          text-shadow: 0 0 15px rgba(245, 158, 11, 0.5);
        }

        .rating-star:active {
          transform: scale(0.95);
        }

        .rating-star.hover {
          transform: translateY(-4px) scale(1.08);
          color: #f59e0b;
          text-shadow: 0 0 10px rgba(245, 158, 11, 0.3);
        }

        .rating-star.active {
          color: #f59e0b;
          text-shadow: 0 0 8px rgba(245, 158, 11, 0.4);
        }

        .rating-hint {
          font-size: 0.7rem;
          color: rgba(245, 158, 11, 0.6);
          text-align: center;
          margin-top: 0.5rem;
        }

        .submit-btn {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, #e0142c, #a10e1f);
          color: white;
          border: none;
          border-radius: 50px;
          font-size: 0.9rem;
          font-weight: 600;
          font-family: 'Sora', sans-serif;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          margin-top: 0.5rem;
          position: relative;
          overflow: hidden;
        }

        .submit-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s ease;
        }

        .submit-btn:hover::before {
          left: 100%;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 10px 30px rgba(224, 20, 44, 0.4);
        }

        .submit-btn:active {
          transform: scale(0.97);
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .message {
          padding: 0.85rem;
          border-radius: 16px;
          margin-bottom: 1.5rem;
          text-align: center;
          font-size: 0.85rem;
          animation: fadeIn 0.3s ease;
          backdrop-filter: blur(8px);
        }

        .message.success {
          background: rgba(16, 185, 129, 0.1);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .message.error {
          background: rgba(239, 68, 68, 0.1);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }



        .reviews-header p {
          font-size: 0.75rem;
          color: #e0142c;
          letter-spacing: 0.1em;
          font-weight: 600;
          text-transform: uppercase;
          margin: 0;
        }

        .reviews-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.25rem;
          padding: 1.5rem;
        }

        .review-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px;
          padding: 1.25rem;
          transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .review-card:hover {
          border-color: rgba(224, 20, 44, 0.3);
          transform: translateY(-4px);
          background: rgba(224, 20, 44, 0.02);
        }

        .review-card:active {
          transform: scale(0.98);
        }

        .review-stars {
          color: #f59e0b;
          font-size: 0.9rem;
          margin-bottom: 0.75rem;
          letter-spacing: 2px;
        }

        .review-text {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.85);
          line-height: 1.6;
          margin-bottom: 1rem;
          font-style: italic;
        }

        .review-author {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-top: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .review-avatar {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #e0142c, #a10e1f);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.85rem;
          color: #ffffff;
          transition: transform 0.3s ease;
        }

        .review-card:hover .review-avatar {
          transform: scale(1.05);
        }

        .review-info {
          flex: 1;
        }

        .review-name {
          font-weight: 600;
          font-size: 0.85rem;
          margin-bottom: 0.2rem;
          color: #ffffff;
        }

        .review-date {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.45);
        }

        .empty-state {
          text-align: center;
          padding: 3rem;
          color: rgba(255, 255, 255, 0.4);
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }








        .op-lista {
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
        }

        .op-item {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 18px;
          padding: 1.1rem;
        }

        .op-item-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.6rem;
        }

        .op-item-estrellas {
          color: #f59e0b;
          font-size: 1.05rem;
          letter-spacing: 2px;
        }

        .op-estado {
          font-size: 0.65rem;
          font-weight: 500;
          padding: 0.22rem 0.65rem;
          border-radius: 20px;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .op-estado.aprobada {
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #34d399;
        }

        .op-estado.pendiente {
          background: rgba(245, 158, 11, 0.15);
          border: 1px solid rgba(245, 158, 11, 0.3);
          color: #fbbf24;
        }

        .op-item-texto {
          font-size: 0.95rem;
          color: #fff;
          line-height: 1.55;
          font-style: italic;
          margin-bottom: 0.9rem;
        }

        .op-item-acciones {
          display: flex;
          gap: 0.6rem;
          justify-content: flex-end;
          margin-top: 0.75rem;
        }

        .op-item-acciones button {
          padding: 0.5rem 1.1rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .op-btn-editar {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: rgba(255, 255, 255, 0.85);
        }

        .op-btn-editar:hover { background: rgba(255, 255, 255, 0.16); }

        .op-btn-eliminar {
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #f87171;
        }

        .op-btn-eliminar:hover { background: rgba(239, 68, 68, 0.25); }

        .op-btn-cancelar {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: rgba(255, 255, 255, 0.7);
        }

        .op-btn-guardar {
          background: linear-gradient(135deg, #e0142c, #a10e1f);
          border: none;
          color: #fff;
          font-weight: 600;
        }

        .op-edit-estrellas {
          display: flex;
          gap: 0.4rem;
          margin-bottom: 0.75rem;
        }

        .op-edit-estrellas .rating-star {
          font-size: 1.6rem;
        }

        @media (max-width: 640px) {
          .opiniones-root {
            padding: 1.5rem 1rem 3rem;
          }
          .opiniones-icon svg {
            width: 32px;
            height: 32px;
          }
          .rating-star {
            font-size: 2rem;
          }
          .reviews-grid {
            grid-template-columns: 1fr;
            padding: 1rem;
          }
          .input-group {
            margin-bottom: 1.5rem;
          }
          .rating-stars {
            gap: 0.5rem;
          }
        }
      `}</style>

      <div className="opiniones-root">
        <div className="opiniones-container">
          <div className="af-tabs">
            <button className={`af-tab${vista === 'opinar' ? ' active' : ''}`} onClick={() => setVista('opinar')}>
              Dejar opinión
            </button>
            <button className={`af-tab${vista === 'mis' ? ' active' : ''}`} onClick={() => setVista('mis')}>
              Mis opiniones
            </button>
          </div>

          {vista === 'opinar' && (
          <div className="af-card">
            <div className="af-card-header">
              <h2>Dejar Opinión</h2>
              <p>Comparta su experiencia y ayude a otros clientes</p>
            </div>
            <div className="af-body">
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
                <div className={`message ${mensaje.includes('éxito') ? 'success' : 'error'}`}>
                  {mensaje}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="input-group">
                  <label className={`input-label ${focusedField === 'nombre' ? 'active' : ''}`}>
                    SU NOMBRE (NO EDITABLE)
                  </label>
                  <input
                    className="input-field"
                    type="text"
                    value={perfil.nombre || ''}
                    disabled
                    placeholder="Cargando..."
                  />
                </div>

                <div className="input-group">
                  <label className={`input-label ${focusedField === 'rating' ? 'active' : ''}`}>
                    CALIFICACIÓN
                  </label>
                  <div className="rating-group">
                    <div className="rating-stars">
                      {renderRatingStars()}
                    </div>
                    {formData.rating === 0 && (
                      <p className="rating-hint">Haga clic en las estrellas para calificar</p>
                    )}
                  </div>
                </div>

                <div className="input-group">
                  <label className={`input-label ${focusedField === 'comentario' ? 'active' : ''}`}>
                    SU COMENTARIO
                  </label>
                  <textarea
                    className="input-field"
                    value={formData.comentario}
                    onChange={handleComentarioChange}
                    onFocus={() => setFocusedField('comentario')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Cuéntenos su experiencia con nuestro servicio..."
                    maxLength={100}
                    required
                  />
                  <div className={`char-counter ${formData.comentario.length >= 90 ? (formData.comentario.length >= 100 ? 'limit' : 'near-limit') : ''}`}>
                    {formData.comentario.length}/100 caracteres
                  </div>
                </div>

                <button type="submit" className="submit-btn" disabled={enviando || alcanzoLimite}>
                  {enviando ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <svg className="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none">
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

          {vista === 'mis' && (
            <div className="af-card">
              <div className="af-card-header">
                <h2>Mis Opiniones</h2>
                <p>Estas son las opiniones que has dejado</p>
              </div>
              <div className="af-body">
                {buscando ? (
                  <div className="empty-state"><p>Cargando tus opiniones...</p></div>
                ) : misOpiniones.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">💬</div>
                    <p>Todavía no has dejado ninguna opinión</p>
                  </div>
                ) : (
                  <div className="op-lista">
                    {misOpiniones.map((op) => (
                      <div key={op.id} className="op-item">
                        {editandoId === op.id ? (
                          <>
                            <div className="op-edit-estrellas">
                              {[1, 2, 3, 4, 5].map((i) => (
                                <button
                                  key={i}
                                  type="button"
                                  className={`rating-star ${i <= editForm.rating ? 'active' : ''}`}
                                  onClick={() => setEditForm({ ...editForm, rating: i })}
                                >
                                  ★
                                </button>
                              ))}
                            </div>
                            <textarea
                              className="input-field"
                              value={editForm.comentario}
                              maxLength={100}
                              onChange={(e) => setEditForm({ ...editForm, comentario: e.target.value })}
                            />
                            <div className="op-item-acciones">
                              <button type="button" className="op-btn-cancelar" onClick={() => setEditandoId(null)}>
                                Cancelar
                              </button>
                              <button type="button" className="op-btn-guardar" onClick={() => guardarEdicion(op.id)}>
                                Guardar
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="op-item-top">
                              <span className="op-item-estrellas">{'★'.repeat(op.rating)}</span>
                              <span className={`op-estado ${op.is_approved ? 'aprobada' : 'pendiente'}`}>
                                {op.is_approved ? 'Publicada' : 'Pendiente'}
                              </span>
                            </div>
                            <p className="op-item-texto">"{op.comment}"</p>
                            <div className="op-item-acciones">
                              <button type="button" className="op-btn-editar" onClick={() => empezarEdicion(op)}>
                                Editar
                              </button>
                              <button type="button" className="op-btn-eliminar" onClick={() => eliminarOpinion(op)}>
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

          {vista === 'opinar' && (
          <div className="af-card" style={{ marginTop: '2rem' }}>
            <div className="af-card-header">
              <h2>Opiniones de nuestros clientes</h2>
              <p>Lo que dicen quienes ya nos visitaron</p>
            </div>
            <div className="reviews-grid">
              {loading ? (
                <div className="empty-state">
                  <div className="empty-icon">⏳</div>
                  <p>Cargando opiniones...</p>
                </div>
              ) : opiniones.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <p>No hay opiniones aún. ¡Sea el primero en opinar!</p>
                </div>
              ) : (
                opiniones.map((opinion) => (
                  <div key={opinion.id} className="review-card">
                    <div className="review-stars">{"★".repeat(opinion.rating)}</div>
                    <div className="review-text">{opinion.comment}</div>
                    <div className="review-author">
                      <div className="review-avatar">
                        {opinion.customer_name?.charAt(0).toUpperCase() || 'C'}
                      </div>
                      <div className="review-info">
                        <div className="review-name">{opinion.customer_name}</div>
                        <div className="review-date">{new Date(opinion.created_at).toLocaleDateString('es-CR')}</div>
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