import { useNavigate } from 'react-router-dom';
import { Icono } from '../Icono/Icono';
import { googleMapsUrl, googleMapsEmbedUrl, wazeUrl, appleMapsUrl, FACEBOOK_URL, INSTAGRAM_URL } from '../../lib/ubicacion';

export function Contact() {
  const navigate = useNavigate();

  return (
    <>
      <style>{`
        /* ============================================================
           PÁGINA DE CONTACTO: ESTÉTICA FUSIÓN PROFESIONAL
           Lienzo oscuro mate puro, rojo deportivo (#e0142c) y acabados precisos
           ============================================================ */

        .ct-root {
          min-height: calc(100vh - 72px);
          background-color: #080808;
          padding: 2rem 1.25rem 4rem;
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #d4d4d4;
          box-sizing: border-box;
        }

        .ct-inner {
          max-width: 1050px;
          margin: 0 auto;
        }

        /* Encabezado */
        .ct-header {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .ct-title {
          font-family: 'Sora', sans-serif;
          font-size: 2.1rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
          letter-spacing: -0.02em;
        }

        /* Sección de redes sociales (Mantenemos los colores y píldoras exactos pedidos) */
        .ct-redes {
          margin-bottom: 2rem;
        }

        .ct-redes-titulo {
          text-align: center;
          font-size: 0.88rem;
          color: #999999;
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
          transition: transform 0.2s ease, background 0.2s ease;
          box-sizing: border-box;
          text-decoration: none;
        }

        .ct-red i {
          font-size: 1.3rem;
        }

        /* Colores exactos de Facebook e Instagram preservados al 100% */
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
          background: linear-gradient(45deg, rgba(249, 206, 52, 0.14) 0%, rgba(238, 42, 123, 0.16) 45%, rgba(98, 40, 215, 0.16) 100%);
          border: 1px solid rgba(238, 42, 123, 0.35);
          color: #f06292;
        }

        .ct-red.ig:hover {
          background: linear-gradient(45deg, rgba(249, 206, 52, 0.24) 0%, rgba(238, 42, 123, 0.26) 45%, rgba(98, 40, 215, 0.26) 100%);
          transform: translateY(-2px);
        }

        /* Cuadrícula de tarjetas */
        .ct-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }

        .ct-card {
          background: #121212;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
        }

        .ct-card-header {
          background: linear-gradient(135deg, rgba(224, 20, 44, 0.12), rgba(224, 20, 44, 0.02));
          padding: 1.25rem 1.5rem;
          text-align: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .ct-card-header p {
          font-family: 'Sora', sans-serif;
          font-size: 0.82rem;
          color: #ffffff;
          letter-spacing: 0.08em;
          font-weight: 700;
          text-transform: uppercase;
          margin: 0;
        }

        .ct-items {
          padding: 1.5rem;
        }

        /* Items de contacto */
        .ct-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: #161616;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 0.85rem 1rem;
          margin-bottom: 0.85rem;
          transition: border-color 0.15s ease;
          text-decoration: none;
        }

        .ct-item:hover {
          border-color: rgba(255, 255, 255, 0.16);
        }

        .ct-item-icon {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: #1c1c20;
          border: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .ct-item-label {
          font-size: 0.68rem;
          color: #888888;
          margin-bottom: 0.2rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-weight: 600;
        }

        .ct-item-value {
          font-size: 0.92rem;
          font-weight: 600;
          color: #ffffff;
          line-height: 1.4;
          overflow-wrap: anywhere;
        }

        .ct-wa-btn {
          color: #25d366;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.4rem 0.6rem;
        }

        .ct-wa-btn:hover {
          color: #4ade80;
        }

        .ct-email-link {
          color: #ffffff;
          text-decoration: none;
        }

        .ct-email-link:hover {
          color: #e0142c;
        }

        /* Mapa y botones de navegación */
        .ct-iframe {
          border-radius: 14px;
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
          padding: 0.75rem 1rem;
          border-radius: 12px;
          font-size: 0.86rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.15s ease;
          font-family: 'DM Sans', sans-serif;
          border: 1px solid transparent;
        }

        .ct-maps-btn:hover {
          transform: translateY(-1px);
        }

        /* Adaptación móvil */
        @media (max-width: 768px) {
          .ct-root {
            padding: 1.25rem 0.85rem 3rem;
          }
          .ct-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          .ct-title {
            font-size: 1.75rem;
          }
          .ct-items {
            padding: 1.15rem 1rem;
          }
          .ct-item {
            padding: 0.75rem 0.85rem;
            gap: 0.75rem;
          }
          .ct-item-icon {
            width: 36px;
            height: 36px;
          }
        }
      `}</style>

      <div className="ct-root">
        <div className="ct-inner">
          <div className="ct-header">
            <h1 className="ct-title">Contacto</h1>
          </div>

          {/* Redes sociales con colores intactos */}
          <div className="ct-redes">
            <p className="ct-redes-titulo">
              Podés encontrarnos en nuestras redes sociales
            </p>
            <div className="ct-redes-btns">
              <a className="ct-red fb" href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer">
                <Icono nombre="facebook" size={20} />
                Facebook
              </a>
              <a className="ct-red ig" href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
                <Icono nombre="instagram" size={20} />
                Instagram
              </a>
            </div>
          </div>

          <div className="ct-grid">
            {/* Tarjeta 1: Información de contacto */}
            <div className="ct-card">
              <div className="ct-card-header">
                <p>INFORMACIÓN DE CONTACTO</p>
              </div>
              <div className="ct-items">
                {/* Dirección intacta */}
                <a className="ct-item" href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
                  <div className="ct-item-icon">
                    <Icono nombre="mapa" size={20} color="#e0142c" />
                  </div>
                  <div>
                    <div className="ct-item-label">DIRECCIÓN</div>
                    <div className="ct-item-value">Bagaces, Guanacaste, Costa Rica</div>
                  </div>
                </a>

                {/* WhatsApp */}
                <div className="ct-item">
                  <div className="ct-item-icon">
                    <Icono nombre="whatsapp" size={22} color="#25D366" />
                  </div>
                  <div>
                    <div className="ct-item-label">WHATSAPP</div>
                    <div className="ct-item-value">
                      <a href="https://wa.me/50683606680" target="_blank" rel="noopener noreferrer" className="ct-wa-btn">
                        +506 8360-6680
                      </a>
                    </div>
                  </div>
                </div>

                {/* Correo */}
                <div className="ct-item">
                  <div className="ct-item-icon">
                    <Icono nombre="sobre" size={20} color="#EA4335" />
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
                    <Icono nombre="reloj" size={20} color="#e0142c" />
                  </div>
                  <div>
                    <div className="ct-item-label">HORARIO</div>
                    <div className="ct-item-value">Lunes a Sábado: 8am - 6pm</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tarjeta 2: Ubicación */}
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
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    title="Google Maps - Autolavado Camaro Fraterno, Bagaces"
                  />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <a
                    className="ct-maps-btn"
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ background: 'rgba(219, 68, 55, 0.12)', borderColor: 'rgba(219, 68, 55, 0.25)', color: '#DB4437' }}
                  >
                    <Icono nombre="google" size={17} />
                    Google Maps (Ficha y Reseñas)
                  </a>

                  <a
                    className="ct-maps-btn"
                    href={wazeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ background: 'rgba(0, 179, 255, 0.12)', borderColor: 'rgba(0, 179, 255, 0.25)', color: '#00B3FF' }}
                  >
                    <Icono nombre="waze" size={17} />
                    Waze
                  </a>

                  <a
                    className="ct-maps-btn"
                    href={appleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ background: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.15)', color: '#ffffff' }}
                  >
                    <Icono nombre="apple" size={17} />
                    Apple Maps
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Enlaces Legales & Pie de Página */}
          <div style={{
            marginTop: '3.5rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            fontSize: '0.8rem',
            color: '#777777'
          }}>
            <div>© {new Date().getFullYear()} Auto Lavado y Servicios Camaro Fraterno · Bagaces, Guanacaste</div>
            <div style={{ display: 'flex', gap: '1.25rem' }}>
              <button
                type="button"
                onClick={() => navigate('/aviso-legal')}
                style={{ background: 'none', border: 'none', color: '#888888', cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#e0142c' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#888888' }}
              >
                Aviso Legal
              </button>
              <button
                type="button"
                onClick={() => navigate('/privacidad')}
                style={{ background: 'none', border: 'none', color: '#888888', cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#e0142c' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#888888' }}
              >
                Política de Privacidad
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}