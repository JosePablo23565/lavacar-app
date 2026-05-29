export function Contact() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');

        .ct-root {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0e1a 0%, #0a1225 50%, #0a0e1a 100%);
          padding: 3rem 1.5rem;
          font-family: 'Inter', sans-serif;
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
          background: radial-gradient(circle, rgba(14,184,208,0.06) 0%, transparent 70%);
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
          background: radial-gradient(circle, rgba(14,184,208,0.04) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        .ct-inner {
          max-width: 1100px;
          margin: 0 auto;
          position: relative;
          z-index: 2;
        }

        .ct-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .ct-icon-circle {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #0eb8d0, #0a8ca0);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.2rem;
          box-shadow: 0 10px 25px rgba(14, 184, 208, 0.2);
          transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .ct-icon-circle:hover {
          transform: scale(1.05);
          box-shadow: 0 15px 35px rgba(14, 184, 208, 0.3);
        }

        .ct-icon-circle:active {
          transform: scale(0.95);
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

        .ct-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        /* LIQUID GLASS CARDS */
        .ct-card {
          background: rgba(15, 20, 35, 0.35);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 28px;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .ct-card:hover {
          transform: translateY(-6px);
          border-color: rgba(14, 184, 208, 0.3);
          box-shadow: 0 25px 45px rgba(0, 0, 0, 0.3);
        }

        .ct-card-header {
          background: linear-gradient(135deg, rgba(14, 184, 208, 0.15), rgba(14, 184, 208, 0.05));
          padding: 1rem 1.5rem;
          text-align: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .ct-card-header p {
          font-size: 0.75rem;
          color: #0eb8d0;
          letter-spacing: 0.1em;
          font-weight: 600;
          text-transform: uppercase;
          margin: 0;
        }

        .ct-items {
          padding: 1.5rem;
        }

        /* ITEMS CON EFECTO BURBUJA */
        .ct-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 18px;
          padding: 1rem;
          margin-bottom: 1rem;
          transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          cursor: pointer;
        }

        .ct-item:hover {
          background: rgba(14, 184, 208, 0.08);
          border-color: rgba(14, 184, 208, 0.3);
          transform: translateX(6px);
        }

        .ct-item:active {
          transform: scale(0.98);
        }

        .ct-item-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          flex-shrink: 0;
          transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .ct-item:hover .ct-item-icon {
          background: rgba(14, 184, 208, 0.15);
          transform: scale(1.08);
        }

        .ct-item-label {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 0.2rem;
          letter-spacing: 0.08em;
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
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .ct-wa-btn:hover {
          opacity: 0.8;
          transform: translateX(3px);
        }

        .ct-wa-btn:active {
          transform: scale(0.97);
        }

        .ct-badge {
          background: rgba(14, 184, 208, 0.12);
          color: #0eb8d0;
          border: 1px solid rgba(14, 184, 208, 0.2);
          padding: 0.2rem 0.6rem;
          border-radius: 30px;
          font-size: 0.65rem;
          margin-left: 0.5rem;
          font-weight: 500;
        }

        /* MAP SECTION */
        .ct-iframe {
          border-radius: 18px;
          overflow: hidden;
          margin-bottom: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }

        .ct-iframe:hover {
          border-color: rgba(14, 184, 208, 0.3);
          transform: scale(1.01);
        }

        .ct-iframe iframe {
          display: block;
          width: 100%;
          height: 200px;
          border: 0;
        }

        .ct-maps-btn {
          width: 100%;
          background: rgba(14, 184, 208, 0.12);
          color: #0eb8d0;
          border: 1px solid rgba(14, 184, 208, 0.25);
          padding: 0.85rem;
          border-radius: 16px;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          font-family: 'Inter', sans-serif;
        }

        .ct-maps-btn:hover {
          background: rgba(14, 184, 208, 0.2);
          color: #fff;
          transform: translateY(-3px);
          border-color: rgba(14, 184, 208, 0.4);
          box-shadow: 0 8px 20px rgba(14, 184, 208, 0.2);
        }

        .ct-maps-btn:active {
          transform: scale(0.97);
        }

        /* CTA CARD LIQUID GLASS */
        .ct-cta-card {
          background: rgba(15, 20, 35, 0.35);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 28px;
          padding: 2rem;
          text-align: center;
          transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          margin-top: 1.5rem;
        }

        .ct-cta-card:hover {
          transform: translateY(-6px);
          border-color: rgba(14, 184, 208, 0.3);
          box-shadow: 0 25px 45px rgba(0, 0, 0, 0.3);
        }

        .ct-cta-title {
          font-family: 'Sora', sans-serif;
          font-size: 1.3rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: #fff;
        }

        .ct-cta-button {
          background: linear-gradient(135deg, #0eb8d0, #0a8ca0);
          color: #fff;
          border: none;
          padding: 0.9rem 2.2rem;
          border-radius: 50px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-family: 'Sora', sans-serif;
          position: relative;
          overflow: hidden;
        }

        .ct-cta-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s ease;
        }

        .ct-cta-button:hover::before {
          left: 100%;
        }

        .ct-cta-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 30px rgba(14, 184, 208, 0.4);
        }

        .ct-cta-button:active {
          transform: scale(0.97);
        }

        /* LINKS */
        a {
          text-decoration: none;
        }

        .ct-email-link {
          color: #0eb8d0;
          transition: all 0.2s ease;
        }

        .ct-email-link:hover {
          color: #fff;
          text-decoration: underline;
        }

        @media (max-width: 768px) {
          .ct-root {
            padding: 2rem 1rem;
          }
          .ct-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          .ct-title {
            font-size: 1.8rem;
          }
          .ct-icon-circle {
            width: 65px;
            height: 65px;
          }
          .ct-icon-circle svg {
            width: 32px;
            height: 32px;
          }
          .ct-cta-title {
            font-size: 1.1rem;
          }
          .ct-cta-button {
            padding: 0.7rem 1.5rem;
            font-size: 0.85rem;
          }
          .ct-item {
            padding: 0.8rem;
          }
          .ct-item-icon {
            width: 40px;
            height: 40px;
            font-size: 1rem;
          }
        }
      `}</style>

      <div className="ct-root">
        <div className="ct-inner">
          <div className="ct-header">
            <div className="ct-icon-circle">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <h1 className="ct-title">Contacto</h1>
            <p className="ct-sub">Estamos aquí para ayudarle</p>
          </div>

          <div className="ct-grid">
            {/* Columna izquierda - Información de contacto */}
            <div className="ct-card">
              <div className="ct-card-header">
                <p>INFORMACIÓN DE CONTACTO</p>
              </div>
              <div className="ct-items">
                {/* Dirección */}
                <div className="ct-item" onClick={() => window.open('https://maps.google.com/?q=Bagaces+Guanacaste+Costa+Rica', '_blank')}>
                  <div className="ct-item-icon">📍</div>
                  <div>
                    <div className="ct-item-label">DIRECCIÓN</div>
                    <div className="ct-item-value">Bagaces, Guanacaste, Costa Rica</div>
                  </div>
                </div>

                {/* WhatsApp - Número 1 */}
                <div className="ct-item">
                  <div className="ct-item-icon">📱</div>
                  <div>
                    <div className="ct-item-label">WHATSAPP 1</div>
                    <div className="ct-item-value">
                      <a href="https://wa.me/50683606680" target="_blank" rel="noopener noreferrer" className="ct-wa-btn">
                        +506 8360-6680
                        <span className="ct-badge">WhatsApp</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* WhatsApp - Número 2 */}
                <div className="ct-item">
                  <div className="ct-item-icon">📱</div>
                  <div>
                    <div className="ct-item-label">WHATSAPP 2</div>
                    <div className="ct-item-value">
                      <a href="https://wa.me/50689594947" target="_blank" rel="noopener noreferrer" className="ct-wa-btn">
                        +506 8959-4947
                        <span className="ct-badge">WhatsApp</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Correo */}
                <div className="ct-item">
                  <div className="ct-item-icon">✉️</div>
                  <div>
                    <div className="ct-item-label">CORREO</div>
                    <div className="ct-item-value">
                      <a href="mailto:camarofraterno@gmail.com" className="ct-email-link">camarofraterno@gmail.com</a>
                    </div>
                  </div>
                </div>

                {/* Horario */}
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
                  onClick={() => window.open('https://www.google.com/maps/search/?api=1&query=Bagaces+Guanacaste+Costa+Rica', '_blank')}
                >
                  Abrir en Google Maps
                </button>
              </div>
            </div>
          </div>

          {/* CTA final */}
          <div className="ct-cta-card">
            <h3 className="ct-cta-title">¿Listo para que su auto brille?</h3>
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