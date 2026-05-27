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
    rating: 5
  })
  const [enviando, setEnviando] = useState(false)
  const [mensaje, setMensaje] = useState('')

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
    if (!formData.nombre || !formData.comentario) {
      setMensaje('Por favor completa todos los campos')
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
      setFormData({ nombre: '', comentario: '', rating: 5 })
      fetchOpiniones()
      setTimeout(() => setMensaje(''), 3000)
    }
    setEnviando(false)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@500;600&family=DM+Sans:wght@400;500&display=swap');
        .op-root{min-height:100vh;background:linear-gradient(135deg,#0a0e1a 0%,#0f1e3a 60%,#0a0e1a 100%);padding:2rem 1rem 4rem;font-family:'DM Sans',sans-serif;color:#fff;}
        .op-container{max-width:800px;margin:0 auto;}
        .op-header{text-align:center;margin-bottom:2rem;}
        .op-icon{width:72px;height:72px;background:linear-gradient(135deg,#1a6fd4,#0eb8d0);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:2rem;margin:0 auto 1rem;}
        .op-title{font-family:'Sora',sans-serif;font-size:2rem;font-weight:600;margin-bottom:.5rem;}
        .op-sub{color:rgba(255,255,255,.45);font-size:.9rem;}
        .op-card{background:#111827;border:1px solid rgba(255,255,255,.08);border-radius:24px;overflow:hidden;margin-bottom:2rem;}
        .op-card-header{background:linear-gradient(135deg,#1a6fd4,#0eb8d0);padding:1rem 1.5rem;text-align:center;}
        .op-card-header p{font-size:.8rem;color:rgba(255,255,255,.85);letter-spacing:.06em;}
        .op-body{padding:1.5rem;}
        .op-label{display:block;font-size:.8rem;font-weight:500;color:rgba(255,255,255,.6);margin-bottom:.5rem;}
        .op-input{width:100%;padding:.75rem 1rem;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:12px;color:#fff;font-size:.9rem;font-family:inherit;transition:all .2s;outline:none;}
        .op-input:focus{border-color:#1a6fd4;background:rgba(26,111,212,.08);}
        .op-textarea{min-height:100px;resize:vertical;}
        .op-rating{display:flex;gap:.5rem;margin-bottom:1rem;}
        .op-star{cursor:pointer;font-size:1.5rem;transition:transform .2s;}
        .op-star:hover{transform:scale(1.1);}
        .op-btn{width:100%;padding:1rem;background:linear-gradient(135deg,#1a6fd4,#0eb8d0);color:#fff;border:none;border-radius:12px;font-size:1rem;font-weight:600;cursor:pointer;transition:all .25s;font-family:'Sora',sans-serif;}
        .op-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 24px rgba(26,111,212,.4);}
        .op-btn:disabled{opacity:.5;cursor:not-allowed;}
        .op-message{padding:.75rem;border-radius:12px;margin-bottom:1rem;text-align:center;}
        .op-message.success{background:rgba(16,185,129,.1);color:#34d399;border:1px solid rgba(16,185,129,.2);}
        .op-message.error{background:rgba(239,68,68,.1);color:#f87171;border:1px solid rgba(239,68,68,.2);}
        .op-reviews-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem;margin-top:1.5rem;}
        .op-review-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:1.25rem;transition:border-color .2s;}
        .op-review-card:hover{border-color:rgba(14,184,208,.3);}
        .op-review-stars{color:#f59e0b;font-size:.9rem;margin-bottom:.5rem;}
        .op-review-text{font-size:.85rem;color:rgba(255,255,255,.7);line-height:1.6;margin-bottom:.75rem;font-style:italic;}
        .op-review-name{font-weight:600;font-size:.85rem;}
        .op-review-date{font-size:.7rem;color:rgba(255,255,255,.35);margin-top:.2rem;}
        @media(max-width:480px){.op-body{padding:1rem;}}
      `}</style>

      <div className="op-root">
        <div className="op-container">
          <div className="op-header">
            <div className="op-icon">⭐</div>
            <h1 className="op-title">Opiniones</h1>
            <p className="op-sub">Cuéntanos tu experiencia</p>
          </div>

          {/* Formulario para opinar */}
          <div className="op-card">
            <div className="op-card-header">
              <p>TU OPINIÓN</p>
            </div>
            <div className="op-body">
              {mensaje && (
                <div className={`op-message ${mensaje.includes('éxito') ? 'success' : 'error'}`}>
                  {mensaje}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                  <label className="op-label">TU NOMBRE</label>
                  <input
                    className="op-input"
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: María González"
                    required
                  />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label className="op-label">CALIFICACIÓN</label>
                  <div className="op-rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className="op-star"
                        onClick={() => setFormData({ ...formData, rating: star })}
                        style={{ opacity: star <= formData.rating ? 1 : 0.3 }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="op-label">TU COMENTARIO</label>
                  <textarea
                    className="op-input op-textarea"
                    value={formData.comentario}
                    onChange={(e) => setFormData({ ...formData, comentario: e.target.value })}
                    placeholder="Cuéntanos tu experiencia..."
                    required
                  />
                </div>
                <button type="submit" className="op-btn" disabled={enviando}>
                  {enviando ? 'Enviando...' : '📝 Enviar Opinión'}
                </button>
              </form>
            </div>
          </div>

          {/* Lista de opiniones aprobadas */}
          <div className="op-card">
            <div className="op-card-header">
              <p>OPINIONES DE CLIENTES</p>
            </div>
            <div className="op-body">
              {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando opiniones...</div>
              ) : opiniones.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,.5)' }}>
                  No hay opiniones aún. ¡Sé el primero en opinar!
                </div>
              ) : (
                <div className="op-reviews-grid">
                  {opiniones.map((opinion) => (
                    <div key={opinion.id} className="op-review-card">
                      <div className="op-review-stars">{"★".repeat(opinion.rating)}</div>
                      <div className="op-review-text">"{opinion.comment}"</div>
                      <div className="op-review-name">{opinion.customer_name}</div>
                      <div className="op-review-date">{new Date(opinion.created_at).toLocaleDateString('es-CR')}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}