import '@fortawesome/fontawesome-free/css/all.min.css';
import { googleMapsUrl, googleMapsEmbedUrl, wazeUrl, appleMapsUrl, FACEBOOK_URL, INSTAGRAM_URL } from '../../lib/ubicacion';

export function Contact() {

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');

        .ct-root {
          background: linear-gradient(135deg, #121212 0%, #181818 50%, #121212 100%);
          padding: 2rem 1.5rem;
          font-family: 'Inter', sans-serif;
          position: relative;
          /* 'clip' recorta los adornos que se salen a los lados igual que
             'hidden', pero sin convertir esto en una segunda zona de scroll.
             Con 'hidden' el navegador vuelve el eje vertical desplazable y
             la pagina rebota al bajar y subir en el telefono. */
          overflow-x: hidden; /* respaldo para navegadores viejos */
          overflow-x: clip;
        }

        .ct-root::before {
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

        .ct-root::after {
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

        .ct-inner {
          max-width: 1100px;
          margin: 0 auto;
          position: relative;
          z-index: 2;
        }

        .ct-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .ct-icon-circle {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #e0142c, #a10e1f);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.2rem;
          transition: transform 0.2s ease;
        }

        .ct-icon-circle:hover {
          transform: scale(1.02);
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
          background: linear-gradient(135deg, #fff, #e0142c);
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
        }

        .ct-card {
          background: rgba(25, 25, 25, 0.35);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 28px;
          overflow: hidden;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }

        .ct-card:hover {
          transform: translateY(-4px);
          border-color: rgba(224, 20, 44, 0.3);
        }

        .ct-card-header {
          background: linear-gradient(135deg, rgba(224, 20, 44, 0.15), rgba(224, 20, 44, 0.05));
          padding: 1rem 1.5rem;
          text-align: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .ct-card-header p {
          font-size: 0.75rem;
          color: #e0142c;
          letter-spacing: 0.1em;
          font-weight: 600;
          text-transform: uppercase;
          margin: 0;
        }

        .ct-items {
          padding: 1.5rem;
        }

        .ct-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 18px;
          padding: 1rem;
          margin-bottom: 1rem;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .ct-item:hover {
          background: rgba(224, 20, 44, 0.08);
          border-color: rgba(224, 20, 44, 0.3);
          transform: translateX(4px);
        }

        .ct-item-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 24px;
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
          line-height: 1.5;
          overflow-wrap: anywhere;
        }

        .ct-wa-btn {
          color: #25d366;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.4rem 0.6rem;
          line-height: 1.5;
        }

        .ct-wa-btn:hover {
          opacity: 0.8;
        }

        .ct-badge {
          background: rgba(224, 20, 44, 0.12);
          color: #e0142c;
          border: 1px solid rgba(224, 20, 44, 0.2);
          padding: 0.2rem 0.6rem;
          border-radius: 30px;
          font-size: 0.65rem;
          font-weight: 500;
          white-space: nowrap;
        }

        .ct-iframe {
          border-radius: 18px;
          overflow: hidden;
          margin-bottom: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .ct-iframe iframe {
          display: block;
          width: 100%;
          height: 200px;
          border: 0;
        }

        .ct-maps-btn {
          width: 100%;
          box-sizing: border-box;
          text-decoration: none;
          background: rgba(224, 20, 44, 0.12);
          color: #e0142c;
          border: 1px solid rgba(224, 20, 44, 0.25);
          padding: 0.85rem;
          border-radius: 16px;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.2s ease;
          font-family: 'Inter', sans-serif;
        }

        .ct-maps-btn:hover {
          background: rgba(224, 20, 44, 0.2);
          color: #fff;
          transform: translateY(-2px);
          border-color: rgba(224, 20, 44, 0.4);
        }

        a {
          text-decoration: none;
        }

        .ct-redes {
          margin-bottom: 2rem;
        }

        .ct-redes-titulo {
          text-align: center;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.75);
          margin-bottom: 1rem;
          line-height: 1.5;
        }

        .ct-redes-btns {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .ct-red {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.8rem 1.4rem;
          border-radius: 40px;
          font-size: 0.9rem;
          font-weight: 600;
          transition: all 0.25s ease;
          box-sizing: border-box;
        }

        .ct-red i {
          font-size: 1.3rem;
        }

        .ct-red.fb {
          background: rgba(24, 119, 242, 0.12);
          border: 1px solid rgba(24, 119, 242, 0.35);
          color: #1877F2;
        }

        .ct-red.fb:hover {
          background: rgba(24, 119, 242, 0.22);
          transform: translateY(-2px);
        }

        .ct-red.ig {
          background: rgba(225, 48, 108, 0.12);
          border: 1px solid rgba(225, 48, 108, 0.35);
          color: #E1306C;
        }

        .ct-red.ig:hover {
          background: rgba(225, 48, 108, 0.22);
          transform: translateY(-2px);
        }

        .ct-email-link {
          color: #e0142c;
        }

        .ct-email-link:hover {
          color: #fff;
        }

        /* Optimización para móvil */
        @media (max-width: 768px) {
          .ct-root {
            padding: 1.5rem 1rem;
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
          .ct-item {
            padding: 0.9rem;
            gap: 0.85rem;
            margin-bottom: 0.85rem;
          }
          .ct-item-icon {
            width: 40px;
            height: 40px;
            font-size: 20px;
          }
          
          .ct-card {
            backdrop-filter: none !important;
            background: rgba(25, 25, 25, 0.7) !important;
          }
          
          .ct-card:hover {
            transform: none;
          }
          
          .ct-item:hover {
            transform: translateX(2px);
          }
          
          .ct-maps-btn:hover {
            transform: none;
          }
        }

        @media (max-width: 480px) {
          .ct-items {
            padding: 1rem;
          }
          .ct-item {
            padding: 0.6rem;
            gap: 0.8rem;
          }
          .ct-item-icon {
            width: 36px;
            height: 36px;
            font-size: 18px;
          }
          .ct-item-label {
            font-size: 0.6rem;
          }
          .ct-item-value {
            font-size: 0.75rem;
          }
          .ct-badge {
            font-size: 0.55rem;
            padding: 0.15rem 0.5rem;
          }
          .ct-maps-btn {
            padding: 0.6rem;
            font-size: 0.75rem;
          }
          .ct-iframe iframe {
            height: 160px;
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

          {/* Redes sociales: lo primero que ve el cliente */}
          <div className="ct-redes">
            <p className="ct-redes-titulo">
              Podés encontrarnos en nuestras redes sociales
            </p>
            <div className="ct-redes-btns">
              <a className="ct-red fb" href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer">
                <i className="fab fa-facebook-f"></i>
                Facebook
              </a>
              <a className="ct-red ig" href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
                <i className="fab fa-instagram"></i>
                Instagram
              </a>
            </div>
          </div>

          <div className="ct-grid">
            {/* Tarjeta de información de contacto */}
            <div className="ct-card">
              <div className="ct-card-header">
                <p>INFORMACIÓN DE CONTACTO</p>
              </div>
              <div className="ct-items">
                {/* Dirección */}
                <a className="ct-item" href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer">
                  <div className="ct-item-icon">
                    <i className="fas fa-map-marker-alt" style={{ color: '#e0142c', fontSize: '24px' }}></i>
                  </div>
                  <div>
                    <div className="ct-item-label">DIRECCIÓN</div>
                    <div className="ct-item-value">Bagaces, Guanacaste, Costa Rica</div>
                  </div>
                </a>

                {/* WHATSAPP */}
                <div className="ct-item">
                  <div className="ct-item-icon">
                    <i className="fab fa-whatsapp" style={{ color: '#25D366', fontSize: '28px' }}></i>
                  </div>
                  <div>
                    <div className="ct-item-label">WHATSAPP</div>
                    <div className="ct-item-value">
                      <a href="https://wa.me/50683606680" target="_blank" rel="noopener noreferrer" className="ct-wa-btn">
                        +506 8360-6680
                        <span className="ct-badge">WhatsApp</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* CORREO */}
                <div className="ct-item">
                  <div className="ct-item-icon">
                    <i className="fas fa-envelope" style={{ color: '#EA4335', fontSize: '24px' }}></i>
                  </div>
                  <div>
                    <div className="ct-item-label">CORREO</div>
                    <div className="ct-item-value">
                      <a href="mailto:camarofraterno@gmail.com" className="ct-email-link">
                        camarofraterno@gmail.com
                      </a>
                    </div>
                  </div>
                </div>

                {/* Horario */}
                <div className="ct-item">
                  <div className="ct-item-icon">
                    <i className="far fa-clock" style={{ color: '#e0142c', fontSize: '24px' }}></i>
                  </div>
                  <div>
                    <div className="ct-item-label">HORARIO</div>
                    <div className="ct-item-value">Lunes a Sábado: 8am - 6pm</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tarjeta del mapa - CON BOTONES DE GOOGLE, WAZE Y APPLE MAPS */}
            <div className="ct-card">
              <div className="ct-card-header">
                <p>UBICACIÓN</p>
              </div>
              <div className="ct-items">
                <div className="ct-iframe">
                  <iframe
                    src={googleMapsEmbedUrl}
                    width="100%"
                    height="200"
                    style={{ border: 0, borderRadius: '16px' }}
                    allowFullScreen
                    loading="lazy"
                    title="Google Maps - Autolavado Camaro Fraterno, Bagaces"
                  />
                </div>
                
                {/* BOTONES DE MAPAS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {/* Google Maps */}
                  <a
                    className="ct-maps-btn"
                    href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    style={{ background: 'rgba(219, 68, 55, 0.12)', borderColor: 'rgba(219, 68, 55, 0.25)', color: '#DB4437' }}
                  >
                    <i className="fab fa-google"></i>
                    Google Maps
                  </a>

                  {/* Waze */}
                  <a
                    className="ct-maps-btn"
                    href={wazeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    style={{ background: 'rgba(0, 179, 255, 0.12)', borderColor: 'rgba(0, 179, 255, 0.25)', color: '#00B3FF' }}
                  >
                    <i className="fab fa-waze"></i>
                    Waze
                  </a>

                  {/* Apple Maps */}
                  <a
                    className="ct-maps-btn"
                    href={appleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    style={{ background: 'rgba(0, 0, 0, 0.2)', borderColor: 'rgba(255, 255, 255, 0.2)', color: '#ffffff' }}
                  >
                    <i className="fab fa-apple"></i>
                    Apple Maps
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}