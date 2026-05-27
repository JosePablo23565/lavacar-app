import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

type Opinion = {
  id: number
  customer_name: string
  comment: string
  rating: number
  created_at: string
  is_approved: boolean
}

export function Opiniones() {
  const [opiniones, setOpiniones] = useState<Opinion[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    nombre: '',
    comentario: '',
    rating: 0
  })
  const [enviando, setEnviando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [hoveredStar, setHoveredStar] = useState(0)

  // Cargar opiniones aprobadas
  useEffect(() => {
    fetchOpiniones()
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nombre.trim()) {
      setMensaje('Por favor ingresa tu nombre')
      return
    }
    if (!formData.comentario.trim()) {
      setMensaje('Por favor escribe tu comentario')
      return
    }
    if (formData.rating === 0) {
      setMensaje('Por favor selecciona una calificación (1-5 estrellas)')
      return
    }
    
    setEnviando(true)
    
    const { error } = await supabase.from('testimonials').insert([{
      customer_name: formData.nombre,
      comment: formData.comentario,
      rating: formData.rating,
      is_approved: false
    }])

    if (error) {
      setMensaje('Error al enviar: ' + error.message)
    } else {
      setMensaje('¡Opinión enviada con éxito! Quedará visible tras ser aprobada.')
      setFormData({ nombre: '', comentario: '', rating: 0 })
      fetchOpiniones()
      setTimeout(() => setMensaje(''), 3000)
    }
    setEnviando(false)
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
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=DM+Sans:wght@400;500&display=swap');

        .opiniones-root {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0e1a 0%, #0f1e3a 60%, #0a0e1a 100%);
          padding: 3rem 1.5rem;
          font-family: 'DM Sans', sans-serif;
        }

        .opiniones-container {
          max-width: 1100px;
          margin: 0 auto;
        }

        /* Header */
        .opiniones-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .opiniones-icon {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #1a6fd4, #0eb8d0);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          box-shadow: 0 10px 25px -5px rgba(14, 184, 208, 0.3);
          transition: transform 0.3s ease;
        }

        .opiniones-icon:hover {
          transform: scale(1.05);
        }

        .opiniones-icon svg {
          width: 40px;
          height: 40px;
          color: white;
        }

        .opiniones-title {
          font-family: 'Sora', sans-serif;
          font-size: 2.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #fff, #0eb8d0);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.5rem;
        }

        .opiniones-sub {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.95rem;
        }

        /* Tarjeta de formulario */
        .form-card {
          background: #111827;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          overflow: hidden;
          margin-bottom: 2rem;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .form-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.4);
        }

        .form-card-header {
          background: linear-gradient(135deg, #1a6fd4, #0eb8d0);
          padding: 1rem 1.5rem;
          text-align: center;
        }

        .form-card-header p {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.9);
          letter-spacing: 0.08em;
          font-weight: 600;
        }

        .form-body {
          padding: 2rem;
        }

        /* Campos de formulario */
        .input-group {
          margin-bottom: 1.5rem;
        }

        .input-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 0.5rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          transition: color 0.2s ease;
        }

        .input-label.active {
          color: #0eb8d0;
        }

        .input-field {
          width: 100%;
          padding: 0.85rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          color: #fff;
          font-size: 0.9rem;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.2s ease;
          outline: none;
        }

        .input-field:focus {
          border-color: #0eb8d0;
          background: rgba(14, 184, 208, 0.08);
          box-shadow: 0 0 0 3px rgba(14, 184, 208, 0.15);
        }

        .input-field::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        textarea.input-field {
          min-height: 100px;
          resize: vertical;
        }

        /* Rating stars - CON EFECTO DE ELEVACIÓN */
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
          color: #374151;
          transition: all 0.2s ease;
          padding: 0;
          line-height: 1;
          transform: translateY(0);
        }

        /* Efecto de elevación al hacer hover */
        .rating-star:hover {
          transform: translateY(-6px) scale(1.15);
          color: #fbbf24;
          text-shadow: 0 0 15px rgba(245, 158, 11, 0.6);
        }

        /* Efecto de elevación en hover sin selección */
        .rating-star.hover {
          transform: translateY(-4px) scale(1.1);
          color: #fbbf24;
          text-shadow: 0 0 10px rgba(245, 158, 11, 0.4);
        }

        .rating-star.active {
          color: #f59e0b;
          text-shadow: 0 0 8px rgba(245, 158, 11, 0.5);
          transform: translateY(0);
        }

        .rating-hint {
          font-size: 0.7rem;
          color: rgba(245, 158, 11, 0.7);
          text-align: center;
          margin-top: 0.5rem;
        }

        /* Botón enviar */
        .submit-btn {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, #1a6fd4, #0eb8d0);
          color: white;
          border: none;
          border-radius: 14px;
          font-size: 1rem;
          font-weight: 600;
          font-family: 'Sora', sans-serif;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 0.5rem;
          position: relative;
          overflow: hidden;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(14, 184, 208, 0.4);
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Mensajes */
        .message {
          padding: 0.85rem;
          border-radius: 14px;
          margin-bottom: 1.5rem;
          text-align: center;
          font-size: 0.85rem;
          animation: fadeIn 0.3s ease;
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

        /* Tarjeta de opiniones */
        .reviews-card {
          background: #111827;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          overflow: hidden;
        }

        .reviews-header {
          background: linear-gradient(135deg, #1a6fd4, #0eb8d0);
          padding: 1rem 1.5rem;
          text-align: center;
        }

        .reviews-header p {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.9);
          letter-spacing: 0.08em;
          font-weight: 600;
        }

        .reviews-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.25rem;
          padding: 1.5rem;
        }

        .review-card {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          padding: 1.25rem;
          transition: all 0.3s ease;
        }

        .review-card:hover {
          border-color: rgba(14, 184, 208, 0.4);
          transform: translateY(-3px);
        }

        .review-stars {
          color: #f59e0b;
          font-size: 0.9rem;
          margin-bottom: 0.75rem;
          letter-spacing: 2px;
        }

        .review-text {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.8);
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
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .review-avatar {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #1a6fd4, #0eb8d0);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.85rem;
          color: #ffffff;
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
          color: rgba(255, 255, 255, 0.5);
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

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 640px) {
          .opiniones-root {
            padding: 1.5rem 1rem;
          }
          .opiniones-title {
            font-size: 1.8rem;
          }
          .rating-star {
            font-size: 2rem;
          }
          .reviews-grid {
            grid-template-columns: 1fr;
            padding: 1rem;
          }
          .form-body {
            padding: 1.5rem;
          }
        }
      `}</style>

      <div className="opiniones-root">
        <div className="opiniones-container">
          {/* Header */}
          <div className="opiniones-header">
            <div className="opiniones-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <h1 className="opiniones-title">Opiniones</h1>
            <p className="opiniones-sub">Cuéntanos tu experiencia y ayuda a otros clientes</p>
          </div>

          {/* Formulario */}
          <div className="form-card">
            <div className="form-card-header">
              <p>COMPARTE TU EXPERIENCIA</p>
            </div>
            <div className="form-body">
              {mensaje && (
                <div className={`message ${mensaje.includes('éxito') ? 'success' : 'error'}`}>
                  {mensaje}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="input-group">
                  <label className={`input-label ${focusedField === 'nombre' ? 'active' : ''}`}>
                    TU NOMBRE <span style={{ color: '#f87171' }}>*</span>
                  </label>
                  <input
                    className="input-field"
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    onFocus={() => setFocusedField('nombre')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Ej: Franklin Molina"
                    required
                  />
                </div>

                <div className="input-group">
                  <label className={`input-label ${focusedField === 'rating' ? 'active' : ''}`}>
                    CALIFICACIÓN <span style={{ color: '#f87171' }}>*</span>
                  </label>
                  <div className="rating-group">
                    <div className="rating-stars">
                      {renderRatingStars()}
                    </div>
                    {formData.rating === 0 && (
                      <p className="rating-hint">💡 Haz clic en las estrellas para calificar</p>
                    )}
                  </div>
                </div>

                <div className="input-group">
                  <label className={`input-label ${focusedField === 'comentario' ? 'active' : ''}`}>
                    TU COMENTARIO <span style={{ color: '#f87171' }}>*</span>
                  </label>
                  <textarea
                    className="input-field"
                    value={formData.comentario}
                    onChange={(e) => setFormData({ ...formData, comentario: e.target.value })}
                    onFocus={() => setFocusedField('comentario')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Cuéntanos tu experiencia con nuestro servicio..."
                    required
                  />
                </div>

                <button type="submit" className="submit-btn" disabled={enviando}>
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

          {/* Lista de opiniones */}
          <div className="reviews-card">
            <div className="reviews-header">
              <p>⭐ OPINIONES DE NUESTROS CLIENTES</p>
            </div>
            <div className="reviews-grid">
              {loading ? (
                <div className="empty-state">
                  <div className="empty-icon">⏳</div>
                  <p>Cargando opiniones...</p>
                </div>
              ) : opiniones.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📭</div>
                  <p>No hay opiniones aún. ¡Sé el primero en opinar!</p>
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

          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            .spinner {
              animation: spin 1s linear infinite;
            }
          `}</style>
        </div>
      </div>
    </>
  )
}