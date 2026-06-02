import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

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

  // Función para validar solo letras en el nombre y máximo 40 caracteres
  const handleNombreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Solo permitir letras, espacios, acentos y ñ
    const onlyLetters = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')
    // Limitar a 40 caracteres
    if (onlyLetters.length <= 40) {
      setFormData({ ...formData, nombre: onlyLetters })
    }
  }

  // Función para validar máximo 100 caracteres en el comentario
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
    
    const { error } = await supabase.from('testimonials').insert([{
      customer_name: formData.nombre,
      comment: formData.comentario,
      rating: formData.rating,
      is_approved: false
    }])

    if (error) {
      setMensaje('Error al enviar: ' + error.message)
    } else {
      setMensaje('Opinión enviada con éxito. Quedará visible tras ser aprobada.')
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
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');

        .opiniones-root {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0e1a 0%, #0a1225 50%, #0a0e1a 100%);
          padding: 3rem 1.5rem;
          font-family: 'Inter', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        .opiniones-root::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -20%;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(14,184,208,0.06) 0%, transparent 70%);
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
          background: radial-gradient(circle, rgba(14,184,208,0.04) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        .opiniones-container {
          max-width: 1100px;
          margin: 0 auto;
          position: relative;
          z-index: 2;
        }

        /* Header */
        .opiniones-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .opiniones-icon {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #0eb8d0, #0a8ca0);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          box-shadow: 0 10px 25px rgba(14, 184, 208, 0.2);
          transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .opiniones-icon:hover {
          transform: scale(1.05);
          box-shadow: 0 15px 35px rgba(14, 184, 208, 0.3);
        }

        .opiniones-icon:active {
          transform: scale(0.95);
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

        /* Tarjeta de formulario - LIQUID GLASS */
        .form-card {
          background: rgba(15, 20, 35, 0.35);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 28px;
          overflow: hidden;
          margin-bottom: 2rem;
          transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .form-card:hover {
          transform: translateY(-4px);
          border-color: rgba(14, 184, 208, 0.3);
          box-shadow: 0 25px 45px rgba(0, 0, 0, 0.3);
        }

        .form-card-header {
          background: linear-gradient(135deg, rgba(14, 184, 208, 0.15), rgba(14, 184, 208, 0.05));
          padding: 1rem 1.5rem;
          text-align: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .form-card-header p {
          font-size: 0.75rem;
          color: #0eb8d0;
          letter-spacing: 0.1em;
          font-weight: 600;
          text-transform: uppercase;
          margin: 0;
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
          font-size: 0.7rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 0.5rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          transition: all 0.2s ease;
        }

        .input-label.active {
          color: #0eb8d0;
        }

        /* EFECTO BURBUJA EN INPUTS */
        .input-field {
          width: 100%;
          padding: 0.85rem 1rem;
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
          border-color: rgba(14, 184, 208, 0.5);
          background: rgba(14, 184, 208, 0.05);
          box-shadow: 0 0 0 3px rgba(14, 184, 208, 0.1);
        }

        .input-field:active {
          transform: scale(1.01);
        }

        .input-field::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        textarea.input-field {
          min-height: 100px;
          resize: vertical;
        }

        /* Contador de caracteres */
        .char-counter {
          text-align: right;
          font-size: 0.65rem;
          color: rgba(255, 255, 255, 0.4);
          margin-top: 0.3rem;
        }

        .char-counter.near-limit {
          color: #f59e0b;
        }

        .char-counter.limit {
          color: #f87171;
        }

        /* Rating stars - EFECTO BURBUJA */
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

        /* Botón enviar */
        .submit-btn {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, #0eb8d0, #0a8ca0);
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
          box-shadow: 0 10px 30px rgba(14, 184, 208, 0.4);
        }

        .submit-btn:active {
          transform: scale(0.97);
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Mensajes */
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

        /* Tarjeta de opiniones - LIQUID GLASS */
        .reviews-card {
          background: rgba(15, 20, 35, 0.35);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 28px;
          overflow: hidden;
        }

        .reviews-header {
          background: linear-gradient(135deg, rgba(14, 184, 208, 0.15), rgba(14, 184, 208, 0.05));
          padding: 1rem 1.5rem;
          text-align: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .reviews-header p {
          font-size: 0.75rem;
          color: #0eb8d0;
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
          border-color: rgba(14, 184, 208, 0.3);
          transform: translateY(-4px);
          background: rgba(14, 184, 208, 0.02);
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
          background: linear-gradient(135deg, #0eb8d0, #0a8ca0);
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

        /* Spinner */
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

        @media (max-width: 640px) {
          .opiniones-root {
            padding: 2rem 1rem;
          }
          .opiniones-title {
            font-size: 1.8rem;
          }
          .opiniones-icon {
            width: 65px;
            height: 65px;
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
            <p className="opiniones-sub">Comparta su experiencia y ayude a otros clientes</p>
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
                    SU NOMBRE
                  </label>
                  <input
                    className="input-field"
                    type="text"
                    value={formData.nombre}
                    onChange={handleNombreChange}
                    onFocus={() => setFocusedField('nombre')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Su nombre completo"
                    maxLength={40}
                    required
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
              <p>OPINIONES DE NUESTROS CLIENTES</p>
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
        </div>
      </div>
    </>
  )
}