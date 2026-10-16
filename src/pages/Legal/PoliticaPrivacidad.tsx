import { useNavigate } from 'react-router-dom'
import './Legal.css'

export function PoliticaPrivacidad() {
  const navigate = useNavigate()

  return (
    <div className="legal-page">
      <div className="legal-container">
        <div className="legal-header">
          <button className="legal-back-btn" onClick={() => navigate(-1)}>
            ← Volver
          </button>
          <h1 className="legal-title">Política de Privacidad y Cookies</h1>
          <div className="legal-updated">Última actualización: Octubre 2026</div>
        </div>

        <div className="legal-content">
          <div className="legal-section">
            <h2>1. Compromiso de Privacidad</h2>
            <p>
              En <strong>Auto Lavado y Servicios Camaro Fraterno</strong> (Bagaces, Guanacaste, Costa Rica), 
              respetamos su derecho a la privacidad y nos comprometemos a proteger los datos personales que nos proporcione 
              al utilizar nuestra plataforma de reservas y servicios automotrices.
            </p>
          </div>

          <div className="legal-section">
            <h2>2. Información que Recopilamos</h2>
            <p>
              Para poder brindarle un servicio eficiente y gestionar sus citas, recopilamos únicamente la información necesaria:
            </p>
            <ul>
              <li><strong>Datos de contacto e identificación:</strong> Nombre completo, número de teléfono (8 dígitos) y correo electrónico.</li>
              <li><strong>Datos del vehículo:</strong> Tipo de vehículo (automóvil, pickup, SUV, etc.) y modelo/marca del auto para calcular los tiempos y cupos de atención.</li>
              <li><strong>Datos de autenticación:</strong> Si decide registrarse con Google, recibimos de forma segura su nombre, correo y foto de perfil autorizada por Google.</li>
              <li><strong>Opiniones y testimonios:</strong> Comentarios y calificaciones que usted voluntariamente decida publicar sobre nuestro servicio.</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2>3. Finalidad del Tratamiento de los Datos</h2>
            <p>Sus datos personales se utilizan exclusivamente para:</p>
            <ul>
              <li>Confirmar, gestionar y recordar sus citas de lavado y detallado vehicular.</li>
              <li>Contactarle en caso de cambios imprevistos en su horario o consultas técnicas sobre su vehículo.</li>
              <li>Permitirle consultar su historial de citas y gestionar su perfil personal.</li>
              <li>Prevenir fraudes, registros no deseados o suplantación de identidad mediante validaciones técnicas de seguridad.</li>
            </ul>
            <div className="legal-highlight">
              <strong>Garantía de no comercialización:</strong> Camaro Fraterno jamás venderá, alquilará ni cederá sus datos personales 
              a terceros con fines publicitarios o comerciales ajenos a nuestro servicio.
            </div>
          </div>

          <div className="legal-section">
            <h2>4. Política de Cookies</h2>
            <p>
              Este sitio web utiliza cookies y almacenamiento local (LocalStorage) esencial para garantizar el correcto funcionamiento del sistema:
            </p>
            <ul>
              <li><strong>Cookies técnicas esenciales:</strong> Mantienen su sesión activa de manera segura y recuerdan si ya ha aceptado las políticas de cookies.</li>
              <li><strong>Cookies de rendimiento y navegación:</strong> Ayudan a optimizar los tiempos de carga de la plataforma y garantizar una experiencia fluida tanto en dispositivos móviles como en computadoras.</li>
            </ul>
            <p>
              Usted puede en cualquier momento borrar o bloquear las cookies a través de la configuración de su navegador web (Chrome, Safari, Firefox, Edge).
            </p>
          </div>

          <div className="legal-section">
            <h2>5. Seguridad de la Información</h2>
            <p>
              Implementamos rigurosas medidas técnicas de seguridad, incluyendo cifrado en tránsito mediante <strong>HTTPS (SSL/TLS de 256 bits)</strong>, 
              políticas de seguridad a nivel de base de datos (Row Level Security - RLS) y validaciones anti-suplantación, asegurando que 
              cada cliente únicamente pueda acceder a sus propios datos e historial de citas.
            </p>
          </div>

          <div className="legal-section">
            <h2>6. Sus Derechos</h2>
            <p>
              Usted tiene derecho en cualquier momento a consultar, rectificar o solicitar la eliminación de su cuenta y datos personales 
              de nuestro sistema. Para ejercer estos derechos, puede comunicarse directamente con nosotros a través de nuestro 
              WhatsApp <strong>+506 8360 6680</strong> o enviando un correo a <strong>alexvillegascuendis@gmail.com</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
