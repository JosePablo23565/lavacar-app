import { useState, useEffect } from 'react'
import Calendar from 'react-calendar'
import { supabase } from '../../lib/supabase'
import { swalError, swalSuccess, swalAviso } from '../../utils/swalConfig'
import { CustomSelect } from '../CustomSelect/CustomSelect'
import { SERVICIOS, TIPOS_VEHICULO, duracionServicio } from '../../lib/servicios'
import {
  type Horario, type CitaOcupada,
  franjasDelDia, horarioDelDia, franjasDisponibles,
  fechaATexto, a24Horas,
} from '../../lib/horarios'
import './NuevaCitaAdmin.css'

const CUPOS_POR_HORA = 2

type Props = { onCreada: () => void; onCerrar: () => void }

export function NuevaCitaAdmin({ onCreada, onCerrar }: Props) {
  const [horarios, setHorarios] = useState<Horario[]>([])
  const [diasCerrados, setDiasCerrados] = useState<string[]>([])
  const [fecha, setFecha] = useState<Date | null>(null)
  const [franjas, setFranjas] = useState<string[]>([])
  const [guardando, setGuardando] = useState(false)

  const [datos, setDatos] = useState({
    customer_name: '',
    customer_phone: '',
    vehicle_type: '',
    vehicle_model: '',
    service_type: '',
    appointment_time: '',
    notes: '',
  })

  // Cerrar con la tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCerrar])

  useEffect(() => {
    const cargar = async () => {
      const { data: hs } = await supabase
        .from('horarios')
        .select('*')
        .order('dia_semana', { ascending: true })
      setHorarios(hs || [])

      const hoy = fechaATexto(new Date())
      const { data: dc } = await supabase
        .from('dias_cerrados')
        .select('fecha')
        .gte('fecha', hoy)
      setDiasCerrados((dc || []).map(d => d.fecha))
    }
    cargar()
  }, [])

  useEffect(() => {
    if (!fecha) {
      setFranjas([])
      return
    }
    calcularFranjas()
  }, [fecha, horarios, datos.service_type])

  const calcularFranjas = async () => {
    if (!fecha) return

    const dia = fecha.getDay()
    const delDia = franjasDelDia(horarios, dia)
    const horario = horarioDelDia(horarios, dia)

    if (delDia.length === 0 || !horario) {
      setFranjas([])
      return
    }

    const texto = fechaATexto(fecha)
    const { data } = await supabase.rpc('citas_del_dia', { p_fecha: texto })

    const disponibles = franjasDisponibles({
      franjas: delDia,
      ocupadas: (data || []) as CitaOcupada[],
      duracion: duracionServicio(datos.service_type),
      horaCierre: horario.hora_fin,
      cupos: CUPOS_POR_HORA,
      esHoy: texto === fechaATexto(new Date()),
    })

    setFranjas(disponibles)

    if (datos.appointment_time && !disponibles.includes(datos.appointment_time)) {
      setDatos(prev => ({ ...prev, appointment_time: '' }))
    }
  }

  const diaBloqueado = (date: Date) => {
    const hoy = new Date()
    const hoyCero = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
    const comparar = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    if (comparar < hoyCero) return true

    const horario = horarios.find(h => h.dia_semana === date.getDay())
    if (!horario || !horario.activo) return true

    return diasCerrados.includes(fechaATexto(date))
  }

  const claseDia = ({ date, view }: { date: Date; view: string }) =>
    view === 'month' && diaBloqueado(date) ? 'blocked-day' : null

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!datos.customer_name.trim()) {
      await swalAviso('Falta el nombre', 'Escribí el nombre del cliente.')
      return
    }
    if (datos.customer_phone && datos.customer_phone.length !== 8) {
      await swalAviso('Teléfono incompleto', 'El teléfono debe tener 8 dígitos, o dejalo vacío.')
      return
    }
    if (!datos.vehicle_type) {
      await swalAviso('Falta el tipo de vehículo', 'Seleccioná si es carro, moto o camioneta.')
      return
    }
    if (!datos.vehicle_model.trim()) {
      await swalAviso('Falta la marca y modelo', 'Escribí la marca y el modelo del vehículo.')
      return
    }
    if (!datos.service_type) {
      await swalAviso('Falta el servicio', 'Elegí el servicio para el vehículo.')
      return
    }
    if (!fecha) {
      await swalAviso('Falta la fecha', 'Elegí en el calendario el día de la cita.')
      return
    }
    if (!datos.appointment_time) {
      await swalAviso('Falta la hora', 'Elegí uno de los horarios disponibles.')
      return
    }

    setGuardando(true)

    const { error } = await supabase.rpc('crear_cita_admin', {
      p_customer_name: datos.customer_name.trim(),
      p_customer_phone: datos.customer_phone,
      p_service_type: datos.service_type,
      p_vehicle_type: datos.vehicle_type,
      p_vehicle_model: datos.vehicle_model.trim(),
      p_appointment_date: fechaATexto(fecha),
      p_appointment_time: a24Horas(datos.appointment_time),
      p_notes: datos.notes || null,
      p_duracion: duracionServicio(datos.service_type),
    })

    setGuardando(false)

    if (error) {
      const motivo = error.message || ''
      if (motivo.includes('CUPO_LLENO')) {
        await swalAviso(
          'Ese cupo se acaba de ocupar',
          'Alguien tomó ese espacio justo ahora. Elegí otra de las horas disponibles.'
        )
        setDatos(prev => ({ ...prev, appointment_time: '' }))
        await calcularFranjas()
      } else if (motivo.includes('NO_ALCANZA_EL_TIEMPO')) {
        await swalAviso('No alcanza el tiempo', 'Ese servicio no termina antes de la hora de cierre.')
        setDatos(prev => ({ ...prev, appointment_time: '' }))
        await calcularFranjas()
      } else if (motivo.includes('DIA_CERRADO')) {
        await swalAviso('Ese día está cerrado', 'El negocio no abre ese día.')
        setFecha(null)
      } else if (motivo.includes('FECHA_PASADA')) {
        await swalAviso('Esa fecha ya pasó', 'Elegí una fecha de hoy en adelante.')
        setFecha(null)
      } else if (motivo.includes('NO_AUTORIZADO')) {
        await swalError('Sin permiso', 'Tu sesión de administrador expiró.')
      } else {
        await swalError('No se pudo agendar', motivo)
      }
      return
    }

    await swalSuccess('Cita agendada', `Queda registrada a nombre de ${datos.customer_name.trim()}`)

    setDatos({
      customer_name: '',
      customer_phone: '',
      vehicle_type: '',
      vehicle_model: '',
      service_type: '',
      appointment_time: '',
      notes: '',
    })
    setFecha(null)
    onCreada()
  }

  const hoy = new Date()
  const fechaMinima = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
  const servicio = SERVICIOS.find(s => s.value === datos.service_type)

  const fechaSeleccionadaTexto = fecha
    ? fecha.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
    : null

  return (
    <div className="nca-overlay" onClick={onCerrar}>
      <div className="nca-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        
        {/* Encabezado con X ubicada arriba a la derecha */}
        <div className="nca-header">
          <span className="nca-badge-pill">Cita Presencial / Telefónica</span>
          <h2 className="nca-title">Agendar Cita en el Local</h2>
          <p className="nca-subtitle">Registro de citas sin límite para clientes que llegan al local o llaman.</p>

          <button 
            type="button" 
            className="nca-btn-close" 
            onClick={onCerrar} 
            aria-label="Cerrar ventana"
            title="Cerrar (Esc)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Formulario en 2 columnas */}
        <form onSubmit={guardar} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div className="nca-body">
            <div className="nca-form-grid">
              
              {/* COLUMNA 1: CLIENTE, VEHÍCULO Y SERVICIO */}
              <div className="nca-col">
                <div>
                  <div className="nca-field-row">
                    <div className="nca-field">
                      <label className="nca-label">Nombre y Apellido *</label>
                      <input
                        className="nca-input"
                        value={datos.customer_name}
                        onChange={(e) => {
                          const v = e.target.value
                          if (/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]*$/.test(v) && v.length <= 40) {
                            setDatos({ ...datos, customer_name: v })
                          }
                        }}
                        placeholder="Ej: Carlos Murillo"
                      />
                    </div>

                    <div className="nca-field">
                      <label className="nca-label">Teléfono (Opcional)</label>
                      <input
                        className="nca-input"
                        type="tel"
                        value={datos.customer_phone}
                        onChange={(e) => {
                          const v = e.target.value.replace(/[^0-9]/g, '')
                          if (v.length <= 8) setDatos({ ...datos, customer_phone: v })
                        }}
                        placeholder="8 dígitos"
                        maxLength={8}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="nca-field" style={{ marginBottom: '0.85rem' }}>
                    <CustomSelect
                      label="TIPO DE VEHÍCULO *"
                      value={datos.vehicle_type}
                      onChange={(v) => setDatos(prev => ({ ...prev, vehicle_type: v }))}
                      options={TIPOS_VEHICULO}
                      placeholder="Elegir tipo de vehículo"
                    />
                  </div>

                  <div className="nca-field">
                    <label className="nca-label">Marca y Modelo *</label>
                    <input
                      className="nca-input"
                      value={datos.vehicle_model}
                      onChange={(e) => {
                        if (e.target.value.length <= 25) {
                          setDatos({ ...datos, vehicle_model: e.target.value })
                        }
                      }}
                      placeholder="Ej: Toyota Hilux, Hyundai Elantra"
                      maxLength={25}
                    />
                  </div>
                </div>

                <div>
                  <div className="nca-field" style={{ marginBottom: '0.65rem' }}>
                    {/* COMBOBOX ANIMADO (CustomSelect) */}
                    <CustomSelect
                      label="SERVICIO A REALIZAR *"
                      value={datos.service_type}
                      onChange={(v) => setDatos(prev => ({ ...prev, service_type: v }))}
                      options={SERVICIOS.map(s => ({ value: s.value, label: `${s.label} — ${s.price}` }))}
                      placeholder="Elegir tipo de lavado"
                    />

                    {servicio && (
                      <div className="nca-service-info" style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', alignItems: 'stretch', padding: '0.75rem 0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.9rem' }}>{servicio.label}</span>
                          <strong className="nca-service-price" style={{ color: '#ff334b', fontSize: '0.95rem' }}>{servicio.price}</strong>
                        </div>
                        {servicio.tag && (
                          <div style={{
                            background: 'linear-gradient(135deg, rgba(224, 20, 44, 0.22) 0%, rgba(140, 10, 25, 0.35) 100%)',
                            border: '1px solid rgba(224, 20, 44, 0.45)',
                            color: '#ff8593',
                            fontWeight: 700,
                            fontSize: '0.76rem',
                            padding: '0.3rem 0.6rem',
                            borderRadius: '8px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            width: 'fit-content'
                          }}>
                            {servicio.tag}
                          </div>
                        )}
                        {servicio.caracteristicas && servicio.caracteristicas.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.15rem' }}>
                            {servicio.caracteristicas.map((c, i) => (
                              <span key={i} style={{
                                fontSize: '0.72rem',
                                color: '#e5e7eb',
                                background: 'rgba(255, 255, 255, 0.06)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                padding: '0.2rem 0.55rem',
                                borderRadius: '6px',
                                fontWeight: 500
                              }}>
                                {c}
                              </span>
                            ))}
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#777777', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '0.4rem' }}>
                          <span>⏱️ Duración estimada: {servicio.duration} min</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="nca-field">
                    <label className="nca-label">Detalles o Notas (Opcional)</label>
                    <input
                      className="nca-input"
                      value={datos.notes}
                      onChange={(e) => {
                        if (e.target.value.length <= 100) setDatos({ ...datos, notes: e.target.value })
                      }}
                      placeholder="Observaciones de la cita o del vehículo..."
                      maxLength={100}
                    />
                  </div>
                </div>
              </div>

              {/* COLUMNA 2: CALENDARIO Y HORARIOS */}
              <div className="nca-col">
                <div>
                  <div className="nca-calendar-card">
                    <Calendar
                      onChange={(d) => {
                        setFecha(d as Date)
                        setDatos(prev => ({ ...prev, appointment_time: '' }))
                      }}
                      value={fecha}
                      minDate={fechaMinima}
                      tileDisabled={({ date }) => diaBloqueado(date)}
                      tileClassName={claseDia}
                      prev2Label={null}
                      next2Label={null}
                      prevLabel="‹"
                      nextLabel="›"
                      locale="es-ES"
                      showNeighboringMonth={false}
                    />
                  </div>
                </div>

                <div>
                  <div className="nca-times-container">
                    {!fecha ? (
                      <div className="nca-empty-alert">
                        Seleccione un día en el calendario para consultar los horarios disponibles.
                      </div>
                    ) : franjas.length === 0 ? (
                      <div className="nca-empty-alert warning">
                        No hay horarios disponibles para esta fecha.
                      </div>
                    ) : (
                      <div className="nca-times-grid">
                        {franjas.map((hora) => (
                          <button
                            key={hora}
                            type="button"
                            className={`nca-time-btn ${datos.appointment_time === hora ? 'active' : ''}`}
                            onClick={() => setDatos(prev => ({ ...prev, appointment_time: hora }))}
                          >
                            {hora}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* BARRA DE ACCIÓN INFERIOR */}
          <div className="nca-footer">
            <div className="nca-summary-pill">
              {fechaSeleccionadaTexto && datos.appointment_time ? (
                <>
                  <span>Selección:</span>
                  <span className="nca-summary-val">{fechaSeleccionadaTexto} · {datos.appointment_time}</span>
                </>
              ) : (
                <span>Complete los campos requeridos (*)</span>
              )}
            </div>

            <div className="nca-footer-actions">
              <button type="button" className="nca-btn-cancel" onClick={onCerrar}>
                Cancelar
              </button>
              
              <button
                type="submit"
                className="nca-btn-submit"
                disabled={
                  guardando ||
                  !datos.customer_name.trim() ||
                  !datos.vehicle_type ||
                  !datos.vehicle_model.trim() ||
                  !datos.service_type ||
                  !fecha ||
                  !datos.appointment_time
                }
              >
                {guardando ? 'Guardando...' : 'Confirmar Cita'}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  )
}
