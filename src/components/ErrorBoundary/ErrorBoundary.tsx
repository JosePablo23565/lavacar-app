import { Component, type ReactNode } from 'react'
import { whatsappNegocioUrl } from '../../lib/ubicacion'
import './ErrorBoundary.css'

type Props = { children: ReactNode }
type State = { fallo: boolean }

// Si algo falla al pintar, evita que el cliente quede con la pantalla en blanco
export class ErrorBoundary extends Component<Props, State> {
  state: State = { fallo: false }

  static getDerivedStateFromError(): State {
    return { fallo: true }
  }

  render() {
    if (!this.state.fallo) return this.props.children

    return (
      <div className="eb-page">
        <div className="eb-card">
          <div className="eb-icono">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          <h1>Algo salió mal</h1>
          <p>
            Tuvimos un problema al mostrar esta página. Tu información está a salvo
            y ninguna cita se perdió.
          </p>

          <div className="eb-acciones">
            <button className="eb-btn" onClick={() => window.location.reload()}>
              Volver a intentar
            </button>
            <button className="eb-btn eb-btn-suave" onClick={() => { window.location.href = '/' }}>
              Ir al inicio
            </button>
          </div>

          <a
            className="eb-wa"
            href={whatsappNegocioUrl('Hola, tuve un problema al usar la página de Autolavado Camaro Fraterno.')}
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.5 3.45 1.44 4.94L2 22l5.25-1.42c1.45.85 3.1 1.31 4.79 1.31 5.46 0 9.91-4.45 9.91-9.91 0-2.66-1.04-5.16-2.92-7.04A9.91 9.91 0 0 0 12.04 2zm.04 18.22c-1.49 0-2.97-.4-4.26-1.16l-.31-.18-3.11.84.85-3.03-.2-.33a8.02 8.02 0 0 1-1.22-4.27c0-4.47 3.64-8.1 8.11-8.1 2.16 0 4.19.84 5.72 2.37a8.04 8.04 0 0 1 2.38 5.72c-.01 4.47-3.64 8.11-8.11 8.11z" />
            </svg>
            Avisarnos por WhatsApp
          </a>
        </div>
      </div>
    )
  }
}
