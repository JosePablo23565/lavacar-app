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

const CUPOS_POR_HORA = 2

type Props = { onCreada: () => void; onCerrar: () => void }

// Mismo formulario que ven los clientes, pero sin el limite de una cita
// por persona: aca el negocio agenda para quien llega al local
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
      customer_name: '', customer_phone: '', vehicle_type: '',
      vehicle_model: '', service_type: '', appointment_time: '', notes: '',
    })
    setFecha(null)
    onCreada()
  }

  const hoy = new Date()
  const fechaMinima = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
  const servicio = SERVICIOS.find(s => s.value === datos.service_type)

  return (
    <div className="af-card nca-card">
      <div className="af-card-header nca-header">
        <h2>Agendar para un cliente</h2>
        <p>Para quien llega al local o llama por teléfono</p>

        <button type="button" className="nca-cerrar" onClick={onCerrar} aria-label="Cerrar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="af-body">
        <form onSubmit={guardar}>
          <div className="af-grid-2">
            <div>
              <label className="af-label">NOMBRE DEL CLIENTE</label>
              <input
                className="af-input"
                value={datos.customer_name}
                onChange={(e) => {
                  const v = e.target.value
                  if (/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]*$/.test(v) && v.length <= 40) {
                    setDatos({ ...datos, customer_name: v })
                  }
                }}
                placeholder="Nombre y apellido"
              />
              <p className="af-hint">Solo letras, máximo 40</p>
            </div>

            <div>
              <label className="af-label">TELÉFONO (OPCIONAL)</label>
              <input
                className="af-input"
                type="tel"
                value={datos.customer_phone}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9]/g, '')
                  if (v.length <= 8) setDatos({ ...datos, customer_phone: v })
                }}
                placeholder="8 dígitos"
                maxLength={8}
              />
              <p className="af-hint">Para poder avisarle por WhatsApp</p>
            </div>
          </div>

          <div className="af-grid-2">
            <div>
              <CustomSelect
                label="TIPO DE VEHÍCULO"
                value={datos.vehicle_type}
                onChange={(v) => setDatos({ ...datos, vehicle_type: v })}
                options={TIPOS_VEHICULO}
                placeholder="Seleccione"
              />
            </div>

            <div>
              <label className="af-label">MARCA Y MODELO</label>
              <input
                className="af-input"
                value={datos.vehicle_model}
                onChange={(e) => {
                  if (e.target.value.length <= 25) {
                    setDatos({ ...datos, vehicle_model: e.target.value })
                  }
                }}
                placeholder="Ej: Toyota Hilux"
                maxLength={25}
              />
            </div>
          </div>

          <div className="af-field">
            <CustomSelect
              label="SERVICIO"
              value={datos.service_type}
              onChange={(v) => setDatos({ ...datos, service_type: v })}
              options={SERVICIOS.map(s => ({ value: s.value, label: `${s.label} — ${s.price}` }))}
              placeholder="Seleccione un servicio"
            />
            {servicio && (
              <p className="af-hint">Duración estimada: {servicio.duration} minutos</p>
            )}
          </div>

          <div className="af-field">
            <label className="af-label">DETALLES DE LA CITA (OPCIONAL)</label>
            <input
              className="af-input"
              value={datos.notes}
              onChange={(e) => {
                if (e.target.value.length <= 100) setDatos({ ...datos, notes: e.target.value })
              }}
              placeholder="Algo que haya que tener en cuenta"
              maxLength={100}
            />
            <div className="af-hint" style={{ textAlign: 'right', marginTop: '0.25rem' }}>
              {datos.notes.length}/100 caracteres
            </div>
          </div>

          <span className="af-section-label">SELECCIONE LA FECHA</span>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Calendar
              onChange={(d) => { setFecha(d as Date); setDatos(prev => ({ ...prev, appointment_time: '' })) }}
              value={fecha}
              minDate={fechaMinima}
              tileDisabled={({ date }) => diaBloqueado(date)}
              tileClassName={claseDia}
              className={`custom-calendar ${horarios.length > 0 ? 'calendar-loaded' : ''}`}
              prev2Label={null}
              next2Label={null}
              prevLabel="‹"
              nextLabel="›"
              locale="es-ES"
              showNeighboringMonth={false}
            />
          </div>

          {!fecha && (
            <p style={{ color: '#f87171', fontSize: '.88rem', textAlign: 'center', padding: '1rem 0' }}>
              Seleccione una fecha para ver los horarios disponibles
            </p>
          )}

          {fecha && (
            <>
              <span className="af-section-label">HORARIOS DISPONIBLES</span>
              {franjas.length === 0 ? (
                <p style={{ color: '#f87171', fontSize: '.88rem', textAlign: 'center', padding: '1rem 0' }}>
                  No hay horarios disponibles para este día
                </p>
              ) : (
                <div className="af-time-grid">
                  {franjas.map((hora) => (
                    <button
                      key={hora}
                      type="button"
                      className={`af-time-btn${datos.appointment_time === hora ? ' sel' : ''}`}
                      onClick={() => setDatos({ ...datos, appointment_time: hora })}
                    >
                      {hora}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            className="af-submit"
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
            {guardando ? 'Guardando...' : 'AGENDAR CITA'}
          </button>
        </form>
      </div>
    </div>
  )
}
