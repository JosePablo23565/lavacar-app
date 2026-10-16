import { useNavigate } from 'react-router-dom'
import './Legal.css'

export function AvisoLegal() {
  const navigate = useNavigate()

  return (
    <div className="legal-page">
      <div className="legal-container">
        <div className="legal-header">
          <button className="legal-back-btn" onClick={() => navigate(-1)}>
            ← Volver
          </button>
          <h1 className="legal-title">Aviso Legal</h1>
          <div className="legal-updated">Última actualización: Octubre 2026</div>
        </div>

        <div className="legal-content">
          <div className="legal-section">
            <h2>1. Datos Identificativos del Titular</h2>
            <p>
              En cumplimiento de la legislación aplicable en materia de comercio electrónico y protección al consumidor, 
              se informa que este sitio web es propiedad y está operado por:
            </p>
            <ul>
              <li><strong>Razón Comercial:</strong> Auto Lavado y Servicios Camaro Fraterno</li>
              <li><strong>Ubicación Física:</strong> Costado Sur de la Plaza de Deportes, Bagaces, Guanacaste, Costa Rica</li>
              <li><strong>Teléfono de contacto / WhatsApp:</strong> +506 8360 6680</li>
              <li><strong>Correo electrónico:</strong> alexvillegascuendis@gmail.com</li>
              <li><strong>Actividad Comercial:</strong> Lavado, encerado, detallado de tapicería y tratamiento estético automotriz</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2>2. Objeto y Condiciones de Uso</h2>
            <p>
              El presente sitio web tiene por finalidad poner a disposición de los usuarios información acerca de los servicios 
              profesionales de autolavado y detallado automotriz ofrecidos por <strong>Auto Lavado y Servicios Camaro Fraterno</strong>, 
              así como brindar una plataforma digital para la reserva y gestión de citas en línea.
            </p>
            <p>
              El acceso y navegación por este sitio web atribuye la condición de usuario, implicando la aceptación plena y sin reservas 
              de todas las disposiciones incluidas en este Aviso Legal.
            </p>
          </div>

          <div className="legal-section">
            <h2>3. Propiedad Intelectual e Industrial</h2>
            <p>
              Todos los contenidos de este sitio web, incluyendo marcas comerciales, logotipos, diseños gráficos, códigos fuente, 
              textos, iconos e imágenes, están protegidos por las leyes de propiedad intelectual y pertenecen a 
              <strong> Auto Lavado y Servicios Camaro Fraterno</strong> o se utilizan con las debidas autorizaciones. 
              Queda prohibida su reproducción, distribución o modificación sin autorización previa y por escrito.
            </p>
          </div>

          <div className="legal-section">
            <h2>4. Política de Reservas y Cancelaciones</h2>
            <p>
              El sistema de citas en línea permite agendar turnos de acuerdo con la disponibilidad real del establecimiento. 
              Se solicita a los clientes presentarse puntualmente a la hora reservada.
            </p>
            <div className="legal-highlight">
              <strong>Importante:</strong> Si no puede asistir a su cita, le solicitamos cancelarla o comunicarse con nosotros 
              con antelación a través de WhatsApp para liberar el espacio a otro cliente.
            </div>
          </div>

          <div className="legal-section">
            <h2>5. Limitación de Responsabilidad</h2>
            <p>
              Auto Lavado y Servicios Camaro Fraterno no se hace responsable de daños derivados de interferencias telefónicas, 
              desconexiones o caídas temporales del servidor de internet ajenas a su control razonable, garantizando no obstante 
              su mayor empeño en mantener el servicio siempre activo y seguro.
            </p>
          </div>

          <div className="legal-section">
            <h2>6. Legislación y Jurisdicción Aplicable</h2>
            <p>
              Para la resolución de cualquier controversia que pudiera suscitarse con motivo del uso de esta plataforma web, 
              las partes se someten expresamente a la legislación vigente de la República de Costa Rica y a los tribunales 
              competentes de la provincia de Guanacaste.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
