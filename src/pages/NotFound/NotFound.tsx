import { useNavigate } from 'react-router-dom'
import './NotFound.css'

export function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="nf-page">
      <div className="nf-glow" aria-hidden="true" />
      <div className="nf-card">
        <div className="nf-badge">Error de navegación</div>
        <div className="nf-code">404</div>
        <h1 className="nf-title">Página no encontrada</h1>
        <p className="nf-desc">
          La ruta a la que intentas ingresar no existe, fue movida o el enlace es incorrecto. 
          Regresa al inicio para agendar tu cita o ver nuestros servicios.
        </p>
        <button className="nf-btn" onClick={() => navigate('/')}>
          ← Volver al Inicio
        </button>
      </div>
    </div>
  )
}
