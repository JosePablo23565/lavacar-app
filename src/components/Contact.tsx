export function Contact() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=DM+Sans:wght@400;500&display=swap');

        .ct-root {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0e1a 0%, #0f1e3a 60%, #0a0e1a 100%);
          padding: 3rem 1.5rem;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        .ct-root::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -20%;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(14,184,208,0.08) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        .ct-root::after {
          content: '';
          position: absolute;
          bottom: -30%;
          left: -10%;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(26,111,212,0.06) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        .ct-inner {
          max-width: 1100px;
          margin: 0 auto;
          position: relative;
          z-index: 2;
        }

        /* Header */
        .ct-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .ct-icon-circle {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #1a6fd4, #0eb8d0);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.2rem;
          box-shadow: 0 10px 25px -5px rgba(14, 184, 208, 0.3);
          transition: transform 0.3s ease;
        }

        .ct-icon-circle:hover {
          transform: scale(1.05);
        }

        .ct-icon-circle svg {
          width: 40px;
          height: 40px;
          color: white;
        }

        .ct-title {
          font-family: 'Sora', sans-serif;
          font-size: 2.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #fff, #0eb8d0);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.5rem;
        }

        .ct-sub {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.95rem;
        }

        /* Grid */
        .ct-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        /* Tarjetas */
        .ct-card {
          background: #111827;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .ct-card:hover {
          transform: translateY(-4px);
          border-color: rgba(14, 184, 208, 0.3);
          box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.4);
        }

        .ct-card-header {
          background: linear-gradient(135deg, #1a6fd4, #0eb8d0);
          padding: 1rem 1.5rem;
          text-align: center;
        }

        .ct-card-header p {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.9);
          letter-spacing: 0.08em;
          font-weight: 600;
          text-transform: uppercase;
        }

        .ct-items {
          padding: 1.5rem;
        }

        /* Items de contacto */
        .ct-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 16px;
          padding: 1rem;
          margin-bottom: 1rem;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .ct-item:hover {
          background: rgba(14, 184, 208, 0.08);
          border-color: rgba(14, 184, 208, 0.3);
          transform: translateX(5px);
        }

        .ct-item-icon {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.3rem;
          flex-shrink: 0;
          transition: all 0.3s ease;
        }

        .ct-item:hover .ct-item-icon {
          background: rgba(14, 184, 208, 0.2);
          transform: scale(1.05);
        }

        .ct-item-label {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 0.2rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .ct-item-value {
          font-size: 0.9rem;
          font-weight: 500;
          color: #ffffff;
        }

        .ct-wa-btn {
          color: #25d366;
          text-decoration: none;
          transition: opacity 0.2s;
        }

        .ct-wa-btn:hover {
          opacity: 0.8;
        }

        .ct-badge {
          background: rgba(37, 211, 102, 0.15);
          color: #25d366;
          border: 1px solid rgba(37, 211, 102, 0.3);
          padding: 0.2rem 0.6rem;
          border-radius: 20px;
          font-size: 0.65rem;
          margin-left: 0.5rem;
        }

        /* Mapa */
        .ct-iframe {
          border-radius: 16px;
          overflow: hidden;
          margin-bottom: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        iframe {
          display: block;
          width: 100%;
          height: 200px;
          border: 0;
        }

        /* Botón Maps */
        .ct-maps-btn {
          width: 100%;
          background: rgba(14, 184, 208, 0.15);
          color: #0eb8d0;
          border: 1px solid rgba(14, 184, 208, 0.3);
          padding: 0.85rem;
          border-radius: 14px;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.2s ease;
        }

        .ct-maps-btn:hover {
          background: rgba(14, 184, 208, 0.25);
          color: #fff;
          transform: translateY(-2px);
        }

        /* CTA simplificado - fondo oscuro */
        .ct-cta-card {
          background: #0a0e1a;
          border: 1px solid rgba(14, 184, 208, 0.15);
          border-radius: 24px;
          padding: 2rem;
          text-align: center;
          transition: all 0.3s ease;
          margin-top: 1.5rem;
        }

        .ct-cta-card:hover {
          transform: translateY(-4px);
          border-color: rgba(14, 184, 208, 0.3);
          box-shadow: 0 20px 40px -10px rgba(14, 184, 208, 0.1);
        }

        .ct-cta-title {
          font-family: 'Sora', sans-serif;
          font-size: 1.3rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: #fff;
        }

        .ct-cta-button {
          background: linear-gradient(135deg, #1a6fd4, #0eb8d0);
          color: #fff;
          border: none;
          padding: 0.8rem 2rem;
          border-radius: 14px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .ct-cta-button:hover {
          transform: scale(1.02);
          box-shadow: 0 8px 25px rgba(14, 184, 208, 0.4);
        }

        @media (max-width: 768px) {
          .ct-grid {
            grid-template-columns: 1fr;
          }
          .ct-title {
            font-size: 1.8rem;
          }
          .ct-icon-circle {
            width: 65px;
            height: 65px;
          }
          .ct-cta-title {
            font-size: 1.1rem;
          }
        }
      `}</style>

      <div className="ct-root">
        <div className="ct-inner">
          {/* Header */}
          <div className="ct-header">
            <div className="ct-icon-circle">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <h1 className="ct-title">Contacto</h1>
            <p className="ct-sub">Estamos aquí para ayudarte</p>
          </div>

          <div className="ct-grid">
            {/* Columna izquierda - Información de contacto */}
            <div className="ct-card">
              <div className="ct-card-header">
                <p>INFORMACIÓN DE CONTACTO</p>
              </div>
              <div className="ct-items">
                <div className="ct-item" onClick={() => window.open('https://maps.google.com/?q=Bagaces+Guanacaste+Costa+Rica', '_blank')}>
                  <div className="ct-item-icon">📍</div>
                  <div>
                    <div className="ct-item-label">DIRECCIÓN</div>
                    <div className="ct-item-value">Bagaces, Guanacaste, Costa Rica</div>
                  </div>
                </div>
                <div className="ct-item">
                  <div className="ct-item-icon">📱</div>
                  <div>
                    <div className="ct-item-label">WHATSAPP</div>
                    <div className="ct-item-value">
                      <a href="https://wa.me/50612345678" target="_blank" rel="noopener noreferrer" className="ct-wa-btn">+506 1234-5678</a>
                      <span className="ct-badge">WhatsApp</span>
                    </div>
                  </div>
                </div>
                <div className="ct-item">
                  <div className="ct-item-icon">✉️</div>
                  <div>
                    <div className="ct-item-label">CORREO</div>
                    <div className="ct-item-value">
                      <a href="mailto:lavacar@gmail.com" style={{ color: '#0eb8d0', textDecoration: 'none' }}>lavacar@gmail.com</a>
                    </div>
                  </div>
                </div>
                <div className="ct-item">
                  <div className="ct-item-icon">⏰</div>
                  <div>
                    <div className="ct-item-label">HORARIO</div>
                    <div className="ct-item-value">Lunes a Sábado: 8am - 6pm</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna derecha - Mapa y ubicación */}
            <div className="ct-card">
              <div className="ct-card-header">
                <p>UBICACIÓN</p>
              </div>
              <div className="ct-items">
                <div className="ct-iframe">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d15716.123456789!2d-85.2548091!3d10.5218901!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTDCsDMxJzE4LjgiTiA4NcKwMTUnMTcuMyJX!5e0!3m2!1ses!2scr!4v1234567890"
                    width="100%"
                    height="200"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    title="Google Maps - Bagaces, Guanacaste"
                  />
                </div>
                <button
                  className="ct-maps-btn"
                  onClick={() => window.open('https://www.google.com/maps/search/?api=1&query=10.5218901,-85.2548091', '_blank')}
                >
                  Abrir en Google Maps
                </button>
              </div>
            </div>
          </div>

          {/* CTA final - Simplificado con fondo oscuro */}
          <div className="ct-cta-card">
            <h3 className="ct-cta-title">¿Listo para que tu auto brille?</h3>
            <button 
              className="ct-cta-button"
              onClick={() => window.location.href = '/agendar'}
            >
              Agendar mi cita ahora
            </button>
          </div>
        </div>
      </div>
    </>
  )
}