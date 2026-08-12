import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { swalConfirm, swalSuccess, swalError } from '../../utils/swalConfig'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { nombreServicio } from '../../lib/servicios'
import { NuevaCitaAdmin } from '../../components/NuevaCitaAdmin/NuevaCitaAdmin'
import './AdminDashboard.css'

type Appointment = {
  id: number
  customer_name: string
  customer_phone: string
  email: string
  service_type: string
  vehicle_type: string
  vehicle_model: string
  appointment_date: string
  appointment_time: string
  notes: string
  created_at: string
  estado?: string
  origen?: string
  duracion_minutos?: number
}

type Testimonial = {
  id: number
  customer_name: string
  email: string 
  rating: number
  comment: string
  created_at: string
  is_approved: boolean
}

type Horario = {
  id: number
  dia_semana: number
  nombre_dia: string
  hora_inicio: string
  hora_fin: string
  intervalo_minutos: number
  activo: boolean
}

type DiaCerrado = {
  id: number
  fecha: string
  created_at: string
}

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'citas' | 'historial' | 'testimonios' | 'horarios'>('citas')
  const [historial, setHistorial] = useState<Appointment[]>([])
  const [mostrarNuevaCita, setMostrarNuevaCita] = useState(false)
  const [cargandoHistorial, setCargandoHistorial] = useState(false)
  const [origenHistorial, setOrigenHistorial] = useState<'web' | 'local'>('web')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [horarios, setHorarios] = useState<Horario[]>([])
  const [loading, setLoading] = useState(true)
  const [savingHorarios, setSavingHorarios] = useState(false)
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState({ total: 0, hoy: 0, proximas: 0 })
  const [limpiezaMsg, setLimpiezaMsg] = useState('')
  const navigate = useNavigate()

  const [diasCerrados, setDiasCerrados] = useState<DiaCerrado[]>([])
  const [fechasSeleccionadas, setFechasSeleccionadas] = useState<string[]>([])
  const [citasAfectadas, setCitasAfectadas] = useState<Appointment[]>([])
  const [mostrarAvisos, setMostrarAvisos] = useState(false)
  const [cerrandoDias, setCerrandoDias] = useState(false)
  const [avisados, setAvisados] = useState<number[]>([])
  // Ya se cerraron los dias y solo falta avisar
  const [cierreCompletado, setCierreCompletado] = useState(false)

  useEffect(() => {
    checkAdminAndFetch()
  }, [])

  // El estado de cada cita depende de la hora, asi que hay que
  // volver a mirarlo cada tanto sin recargar la pagina
  const [ahora, setAhora] = useState(() => new Date())

  useEffect(() => {
    const reloj = setInterval(() => setAhora(new Date()), 30000)
    return () => clearInterval(reloj)
  }, [])

  const estadoCita = (cita: Appointment) => {
    const inicio = new Date(`${cita.appointment_date}T${cita.appointment_time}`)
    const fin = new Date(inicio.getTime() + (cita.duracion_minutos || 30) * 60000)

    if (ahora < inicio) return { clave: 'pendiente', texto: 'Pendiente' }
    if (ahora < fin) return { clave: 'en-curso', texto: 'En curso' }
    return { clave: 'finalizada', texto: 'Finalizada' }
  }

  const completarCitasPasadas = async () => {
    const { data, error } = await supabase.rpc('completar_citas_pasadas')

    if (error) {
      swalError('No se pudo cerrar el dia', error.message)
      return 0
    }

    const total = Number(data) || 0
    if (total > 0) {
      setLimpiezaMsg(`Se marcaron ${total} cita(s) como completadas`)
      setTimeout(() => setLimpiezaMsg(''), 4000)
    }
    return total
  }

  const limpiarManual = async () => {
    const resultado = await swalConfirm(
      'Cerrar citas ya atendidas',
      'Las citas que ya pasaron se marcarán como completadas y saldrán de la lista, pero quedan guardadas en el historial. ¿Continuar?'
    )

    if (!resultado.isConfirmed) return

    const total = await completarCitasPasadas()
    if (total > 0) {
      swalSuccess('Listo', `Se completaron ${total} cita(s)`)
      await fetchAppointments()
    } else {
      swalSuccess('Sin cambios', 'No hay citas pendientes que ya hayan pasado')
    }
  }

  const checkAdminAndFetch = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      navigate('/acceder')
      return
    }

    const { data: perfil, error: perfilError } = await supabase
      .from('perfiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (perfilError || !perfil?.is_admin) {
      navigate('/')
      return
    }

    fetchAppointments()
    fetchTestimonials()
    fetchHorarios()
    fetchDiasCerrados()
  }

  const fetchAppointments = async () => {
    const { data } = await supabase
      .from('appointments')
      .select('*')
      .eq('estado', 'pendiente')
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true })

    const citas = data || []
    setAppointments(citas)

    const hoyLocal = new Date()
    const hoy = `${hoyLocal.getFullYear()}-${String(hoyLocal.getMonth() + 1).padStart(2, '0')}-${String(hoyLocal.getDate()).padStart(2, '0')}`

    setStats({
      total: citas.length,
      hoy: citas.filter(c => c.appointment_date === hoy).length,
      proximas: citas.filter(c => c.appointment_date > hoy).length,
    })
    setLoading(false)
  }

  const fetchHistorial = async () => {
    setCargandoHistorial(true)
    const { data } = await supabase
      .from('appointments')
      .select('*')
      .eq('estado', 'completada')
      .order('appointment_date', { ascending: false })
      .order('appointment_time', { ascending: false })
      .limit(300)

    setHistorial(data || [])
    setCargandoHistorial(false)
  }

  useEffect(() => {
    if (activeTab === 'historial') fetchHistorial()
  }, [activeTab])

  const fetchTestimonials = async () => {
    const { data } = await supabase
      .from('testimonials')
      .select('*')
      .order('created_at', { ascending: false })
    
    setTestimonials(data || [])
  }

  const fetchHorarios = async () => {
    const { data } = await supabase
      .from('horarios')
      .select('*')
      .order('dia_semana', { ascending: true })

    setHorarios(data || [])
  }

  const fetchDiasCerrados = async () => {
    const hoyLocal = new Date()
    const hoy = `${hoyLocal.getFullYear()}-${String(hoyLocal.getMonth() + 1).padStart(2, '0')}-${String(hoyLocal.getDate()).padStart(2, '0')}`

    const { data } = await supabase
      .from('dias_cerrados')
      .select('*')
      .gte('fecha', hoy)
      .order('fecha', { ascending: true })

    setDiasCerrados(data || [])
  }

  const toggleFechaSeleccionada = (date: Date) => {
    const fecha = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

    setFechasSeleccionadas(prev =>
      prev.includes(fecha) ? prev.filter(f => f !== fecha) : [...prev, fecha].sort()
    )
    setMostrarAvisos(false)
  }

  // Paso 1 revisar las citas afectadas antes de cerrar
  const revisarCierre = async () => {
    if (fechasSeleccionadas.length === 0) return

    const { data } = await supabase
      .from('appointments')
      .select('*')
      .in('appointment_date', fechasSeleccionadas)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true })

    const afectadas = data || []
    setCitasAfectadas(afectadas)

    if (afectadas.length === 0) {
      const result = await swalConfirm(
        `¿Cerrar ${fechasSeleccionadas.length} día(s)?`,
        'No hay citas agendadas en esas fechas. Los clientes no podrán agendar esos días.'
      )
      if (result.isConfirmed) await confirmarCierre()
    } else {
      setCierreCompletado(false)
      setMostrarAvisos(true)
    }
  }

  // Paso 2 guardar los cierres y cancelar las citas
  const confirmarCierre = async () => {
    const sinAvisar = citasAfectadas.filter(c => !avisados.includes(c.id))
    if (sinAvisar.length > 0) {
      const seguir = await swalConfirm(
        `Falta avisar a ${sinAvisar.length} cliente(s)`,
        'Si cerrás ahora, esas citas se cancelarán sin que el cliente reciba el mensaje. ¿Cerrar de todas formas?'
      )
      if (!seguir.isConfirmed) return
    }

    setCerrandoDias(true)

    // Devuelve las canceladas incluidas las que entraron al final
    const { data, error } = await supabase.rpc('cerrar_dias', {
      p_fechas: fechasSeleccionadas
    })

    if (error) {
      swalError(
        'No se pudieron cerrar los días',
        error.message.includes('NO_AUTORIZADO')
          ? 'Tu sesión de administrador expiró. Iniciá sesión de nuevo.'
          : error.message
      )
      setCerrandoDias(false)
      return
    }

    const canceladas = (data || []) as Appointment[]
    const diasCerradosCount = fechasSeleccionadas.length

    setCerrandoDias(false)
    setFechasSeleccionadas([])
    await fetchDiasCerrados()
    await fetchAppointments()

    const sinAvisarFinal = canceladas.filter(c => !avisados.includes(c.id))

    if (sinAvisarFinal.length > 0) {
      setCitasAfectadas(sinAvisarFinal)
      setCierreCompletado(true)
      setMostrarAvisos(true)
      return
    }

    swalSuccess(
      'Días cerrados',
      canceladas.length > 0
        ? `Se cerraron ${diasCerradosCount} día(s) y se cancelaron ${canceladas.length} cita(s)`
        : `Se cerraron ${diasCerradosCount} día(s)`
    )

    setCitasAfectadas([])
    setMostrarAvisos(false)
    setAvisados([])
  }

  // Se abren dentro del clic para que el navegador no los bloquee
  const abrirTodosLosChats = () => {
    const abiertos: number[] = []
    let bloqueados = 0

    citasAfectadas.forEach((apt) => {
      const ventana = window.open(getWhatsappCancelacion(apt), '_blank')
      if (ventana) {
        abiertos.push(apt.id)
      } else {
        bloqueados++
      }
    })

    setAvisados(prev => [...new Set([...prev, ...abiertos])])

    if (bloqueados > 0) {
      swalError(
        'El navegador bloqueó las ventanas',
        `Se abrieron ${abiertos.length} de ${citasAfectadas.length} chats. Permití las ventanas emergentes para este sitio, o usá el botón de WhatsApp de cada cliente.`
      )
    }
  }

  const reabrirDia = async (dia: DiaCerrado) => {
    const result = await swalConfirm(
      '¿Reabrir este día?',
      `El ${formatDateLong(dia.fecha)} volverá a estar disponible para agendar citas.`
    )
    if (!result.isConfirmed) return

    const { error } = await supabase.from('dias_cerrados').delete().eq('id', dia.id)

    if (error) {
      swalError('Error', 'No se pudo reabrir el día')
      return
    }

    swalSuccess('Día reabierto', 'Los clientes ya pueden agendar ese día')
    await fetchDiasCerrados()
  }

  const getWhatsappCancelacion = (apt: Appointment) => {
    const mensaje = `Hola ${apt.customer_name}, Somos Autolavado y Servicios Camaro Fraterno, tienes una cita el ${formatDateLong(apt.appointment_date)} a las ${convertTo12Hour(apt.appointment_time)} pero, por motivos personales no abriremos ese día, tu cita ha quedado cancelada, agenda una cita nueva en el siguiente enlace https://lavacar-app-ashen.vercel.app/   estamos para servirte`
    return `https://wa.me/${getWhatsappNumero(apt.customer_phone)}?text=${encodeURIComponent(mensaje)}`
  }

  const updateHorario = async (id: number, campo: string, valor: any) => {
    setSavingHorarios(true)
    const { error } = await supabase
      .from('horarios')
      .update({ [campo]: valor })
      .eq('id', id)
    
    if (error) {
      swalError('Error', 'No se pudo actualizar el horario')
    } else {
      fetchHorarios()
    }
    setSavingHorarios(false)
  }

  const deleteAppointment = async (id: number) => {
    const result = await swalConfirm('¿Eliminar esta cita?', 'Esta acción no se puede deshacer.')

    if (result.isConfirmed) {
      const { error } = await supabase.from('appointments').delete().eq('id', id)
      
      if (error) {
        swalError('Error', 'No se pudo eliminar la cita')
      } else {
        swalSuccess('Eliminada', 'La cita se ha eliminado correctamente')
        fetchAppointments()
      }
    }
  }

  const approveTestimonial = async (id: number) => {
    await supabase
      .from('testimonials')
      .update({ is_approved: true })
      .eq('id', id)
    fetchTestimonials()
    window.dispatchEvent(new Event('opiniones-actualizadas'))
  }

  const deleteTestimonial = async (id: number) => {
    const result = await swalConfirm('¿Eliminar esta opinión?', 'Esta acción no se puede deshacer.')

    if (result.isConfirmed) {
      const { error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', id)
      
      if (error) {
        swalError('Error', 'No se pudo eliminar la opinión')
      } else {
        swalSuccess('Eliminada', 'La opinión se ha eliminado correctamente')
        fetchTestimonials()
        window.dispatchEvent(new Event('opiniones-actualizadas'))
      }
    }
  }

  const getServiceLabel = (type: string) => nombreServicio(type)

  const historialFiltrado = historial.filter(c => (c.origen || 'web') === origenHistorial)

  const resumenServicio = (() => {
    if (historialFiltrado.length === 0) return { nombre: '-' }
    const cuenta: Record<string, number> = {}
    for (const c of historialFiltrado) cuenta[c.service_type] = (cuenta[c.service_type] || 0) + 1
    const top = Object.entries(cuenta).sort((a, b) => b[1] - a[1])[0]
    return { nombre: getServiceLabel(top[0]) }
  })()

  const imprimirHistorial = () => window.print()

  const compartirHistorial = async () => {
    const titulo = origenHistorial === 'web' ? 'pagina web' : 'local'
    const lineas = historialFiltrado.map(c =>
      `${formatDateDisplay(c.appointment_date)} ${convertTo12Hour(c.appointment_time)} - ${c.customer_name} - ${getServiceLabel(c.service_type)}`
    )
    const texto = [
      `Historial de citas (${titulo}) - Autolavado Camaro Fraterno`,
      `${historialFiltrado.length} lavados atendidos`,
      '',
      ...lineas,
    ].join(String.fromCharCode(10))

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Historial de citas', text: texto })
        return
      } catch {
        return
      }
    }

    try {
      await navigator.clipboard.writeText(texto)
      swalSuccess('Copiado', 'El historial se copió y ya lo podés pegar donde quieras')
    } catch {
      swalError('No se pudo compartir', 'Tu navegador no permite compartir ni copiar desde aca')
    }
  }


  const getVehicleLabel = (type: string) => {
    const vehicles: Record<string, string> = {
      carro: 'Carro',
      moto: 'Moto',
      camioneta: 'Camioneta'
    }
    return vehicles[type] || type || '—'
  }

  const convertTo12Hour = (time24h: string) => {
    if (!time24h) return '—'
    const [hours, minutes] = time24h.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  const formatDateDisplay = (date: string) => {
    if (!date) return '—'
    const [year, month, day] = date.split('-')
    return `${parseInt(day)}/${parseInt(month)}/${year}`
  }

  const formatDateLong = (date: string) => {
    if (!date) return ''
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
    const [year, month, day] = date.split('-')
    const mesNum = parseInt(month) - 1
    return `${parseInt(day)} de ${meses[mesNum]} de ${year}`
  }

  // wa.me necesita el codigo de pais
  const getWhatsappNumero = (telefono: string) => {
    const soloNumeros = (telefono || '').replace(/\D/g, '')
    return soloNumeros.length === 8 ? `506${soloNumeros}` : soloNumeros
  }

  const getWhatsappLink = (apt: Appointment) => {
    const mensaje = `Hola ${apt.customer_name}, Somos Autolavado y Servicios Camaro Fraterno, tienes una cita el ${formatDateLong(apt.appointment_date)} a las ${convertTo12Hour(apt.appointment_time)}.`
    return `https://wa.me/${getWhatsappNumero(apt.customer_phone)}?text=${encodeURIComponent(mensaje)}`
  }

  const filteredAppointments = appointments.filter(a =>
    a.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    a.customer_phone.includes(search) ||
    a.email?.toLowerCase().includes(search.toLowerCase()) ||
    a.vehicle_model?.toLowerCase().includes(search.toLowerCase())
  )

  const pendingTestimonials = testimonials.filter(t => !t.is_approved)
  const approvedTestimonials = testimonials.filter(t => t.is_approved)

  // Domingo es el unico dia que se activa o desactiva fijo
  const domingo = horarios.find(h => h.dia_semana === 0)
  const domingoActivo = domingo?.activo === true

  // De 7 AM a 10 PM cada 30 minutos
  const HORA_MIN = 7   // 07:00 AM
  const HORA_MAX = 22  // 10:00 PM

  const generateTimeOptions = (): string[] => {
    const times: string[] = []
    for (let hour = HORA_MIN; hour <= HORA_MAX; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === HORA_MAX && minute > 0) break // cortar en 10:00 PM exacto
        const hour12 = hour % 12 || 12
        const ampm = hour < 12 ? 'AM' : 'PM'
        const minuteStr = minute.toString().padStart(2, '0')
        times.push(`${hour12.toString().padStart(2, '0')}:${minuteStr} ${ampm}`)
      }
    }
    return times
  }

  if (loading) return (
    <div className="admin-loading">
      <div className="admin-loading-spinner" />
      <div className="admin-loading-text">Cargando...</div>
    </div>
  )

  return (
    <div className="admin-root">
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

        {limpiezaMsg && (
          <div style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#6ee7b7' }}>
            {limpiezaMsg}
          </div>
        )}

        <div className="af-tabs">
          <button onClick={() => setActiveTab('citas')} className={`af-tab ${activeTab === 'citas' ? 'active' : ''}`}>
            Citas ({appointments.length})
          </button>
          <button onClick={() => setActiveTab('historial')} className={`af-tab ${activeTab === 'historial' ? 'active' : ''}`}>
            Historial
          </button>
          <button onClick={() => setActiveTab('testimonios')} className={`af-tab ${activeTab === 'testimonios' ? 'active' : ''}`}>
            Opiniones {pendingTestimonials.length > 0 && `(${pendingTestimonials.length} pendientes)`}
          </button>
          <button onClick={() => setActiveTab('horarios')} className={`af-tab ${activeTab === 'horarios' ? 'active' : ''}`}>
            Horarios
          </button>
        </div>

        {activeTab === 'citas' && (
          <>
            <div style={{ marginBottom: '1.25rem' }}>
              <button className="admin-btn-nueva" onClick={() => setMostrarNuevaCita(v => !v)}>
                {mostrarNuevaCita ? 'Cancelar' : '+ Agendar cita a un cliente'}
              </button>
            </div>

            {mostrarNuevaCita && (
              <NuevaCitaAdmin
                onCreada={() => { setMostrarNuevaCita(false); fetchAppointments() }}
              />
            )}

            <div className="stats-row">
              <div className="stat-pill">
                <p className="stat-pill-num" style={{ color: '#e0142c' }}>{stats.total}</p>
                <p className="stat-pill-label">Total</p>
              </div>
              <div className="stat-pill">
                <p className="stat-pill-num" style={{ color: '#34d399' }}>{stats.hoy}</p>
                <p className="stat-pill-label">Hoy</p>
              </div>
              <div className="stat-pill">
                <p className="stat-pill-num" style={{ color: '#a78bfa' }}>{stats.proximas}</p>
                <p className="stat-pill-label">Próximas</p>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <button onClick={limpiarManual} className="btn-clean" style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                padding: '0.6rem 1.2rem',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: 'inherit'
              }}>
                Cerrar citas atendidas
              </button>
            </div>

            <div className="search-bare">
              <span className="search-bare-icon">🔍</span>
              <input type="text" placeholder="nombre, teléfono, correo o vehículo..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <div className="block md:hidden space-y-4">
              {filteredAppointments.length === 0 ? (
                <div className="admin-card" style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>No hay citas registradas</div>
              ) : (
                filteredAppointments.map((apt) => (
                  <div key={apt.id} className="cita-card">
                    <div className="cita-header">
                      <div className="cita-cliente">
                        <span className={`estado-cita ${estadoCita(apt).clave}`}>
                          {estadoCita(apt).texto}
                        </span>
                        <p className="cita-nombre">{apt.customer_name}</p>
                        <p className="cita-telefono">{apt.customer_phone}</p>
                        <p className="cita-email">{apt.email}</p>
                      </div>
                      <div className="cita-acciones">
                        <button onClick={() => deleteAppointment(apt.id)} className="cita-btn-borrar" title="Eliminar cita">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button>
                        <a href={getWhatsappLink(apt)} target="_blank" className="cita-btn-wa" title="Enviar WhatsApp">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.5 3.45 1.44 4.94L2 22l5.25-1.42c1.45.85 3.1 1.31 4.79 1.31 5.46 0 9.91-4.45 9.91-9.91 0-2.66-1.04-5.16-2.92-7.04A9.91 9.91 0 0 0 12.04 2zm.04 18.22c-1.49 0-2.97-.4-4.26-1.16l-.31-.18-3.11.84.85-3.03-.2-.33a8.02 8.02 0 0 1-1.22-4.27c0-4.47 3.64-8.1 8.11-8.1 2.16 0 4.19.84 5.72 2.37a8.04 8.04 0 0 1 2.38 5.72c-.01 4.47-3.64 8.11-8.11 8.11zm4.44-6.07c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12s-.62.78-.76.94c-.14.16-.28.18-.52.06-.24-.12-1.01-.37-1.92-1.18-.71-.63-1.19-1.41-1.33-1.65-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.19-.47-.39-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2 0 1.18.86 2.32.98 2.48.12.16 1.69 2.58 4.1 3.62.57.25 1.02.39 1.37.5.57.18 1.09.15 1.5.09.46-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28z"/>
                          </svg>
                        </a>
                      </div>
                    </div>
                    <div className="cita-datos">
                      <div className="cita-fila">
                        <span className="cita-etiqueta">Vehículo</span>
                        <span className="cita-valor">{getVehicleLabel(apt.vehicle_type)}</span>
                      </div>
                      <div className="cita-fila">
                        <span className="cita-etiqueta">Modelo</span>
                        <span className="cita-valor">{apt.vehicle_model || '—'}</span>
                      </div>
                      <div className="cita-fila">
                        <span className="cita-etiqueta">Servicio</span>
                        <span className="cita-valor">{getServiceLabel(apt.service_type)}</span>
                      </div>
                      <div className="cita-fila">
                        <span className="cita-etiqueta">Fecha y hora</span>
                        <span className="cita-valor cita-valor-fecha">
                          {formatDateDisplay(apt.appointment_date)} · {convertTo12Hour(apt.appointment_time)}
                        </span>
                      </div>
                      {apt.notes && (
                        <div className="cita-detalles">
                          <span className="cita-etiqueta">Detalles</span>
                          <span className="cita-valor">{apt.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="hidden md:block admin-card" style={{ overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Estado</th><th>Cliente</th><th>Teléfono</th><th>Correo</th><th>Vehículo</th><th>Modelo</th><th>Servicio</th><th>Fecha</th><th>Hora</th><th>Detalles</th><th style={{ textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppointments.length === 0 ? (
                      <tr><td colSpan={11} style={{ textAlign: 'center', padding: '2.5rem', color: 'rgba(255,255,255,0.4)' }}>No hay citas registradas</td></tr>
                    ) : (
                      filteredAppointments.map((apt) => (
                        <tr key={apt.id}>
                          <td>
                            <span className={`estado-cita ${estadoCita(apt).clave}`}>
                              {estadoCita(apt).texto}
                            </span>
                          </td>
                          <td style={{ fontWeight: '500' }}>{apt.customer_name}</td>
                          <td>{apt.customer_phone}</td>
                          <td style={{ fontSize: '0.8rem', color: '#a6a6a6' }}>{apt.email}</td>
                          <td>{getVehicleLabel(apt.vehicle_type)}</td>
                          <td>{apt.vehicle_model || '—'}</td>
                          <td>{getServiceLabel(apt.service_type)}</td>
                          <td><span className="badge-blue">{formatDateDisplay(apt.appointment_date)}</span></td>
                          <td><span className="badge-green">{convertTo12Hour(apt.appointment_time)}</span></td>
                          <td style={{ maxWidth: '200px', fontSize: '0.8rem', color: '#fff' }}>
                            {apt.notes ? <span style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '0.2rem 0.5rem', borderRadius: '12px', display: 'inline-block' }}>{apt.notes.length > 30 ? apt.notes.substring(0, 30) + '...' : apt.notes}</span> : <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                              <button onClick={() => deleteAppointment(apt.id)} className="btn-danger">🗑️</button>
                              <a href={getWhatsappLink(apt)} target="_blank" className="btn-success" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0.4rem 0.8rem' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.5 3.45 1.44 4.94L2 22l5.25-1.42c1.45.85 3.1 1.31 4.79 1.31 5.46 0 9.91-4.45 9.91-9.91 0-2.66-1.04-5.16-2.92-7.04A9.91 9.91 0 0 0 12.04 2zm.04 18.22c-1.49 0-2.97-.4-4.26-1.16l-.31-.18-3.11.84.85-3.03-.2-.33a8.02 8.02 0 0 1-1.22-4.27c0-4.47 3.64-8.1 8.11-8.1 2.16 0 4.19.84 5.72 2.37a8.04 8.04 0 0 1 2.38 5.72c-.01 4.47-3.64 8.11-8.11 8.11zm4.44-6.07c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12s-.62.78-.76.94c-.14.16-.28.18-.52.06-.24-.12-1.01-.37-1.92-1.18-.71-.63-1.19-1.41-1.33-1.65-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.19-.47-.39-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2 0 1.18.86 2.32.98 2.48.12.16 1.69 2.58 4.1 3.62.57.25 1.02.39 1.37.5.57.18 1.09.15 1.5.09.46-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28z"/>
                                </svg>
                              </a>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'historial' && (
          <div className="admin-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontFamily: "'Sora',sans-serif", color: '#fff', marginBottom: '.4rem' }}>
              Trabajo realizado
            </h3>
            <p style={{ color: 'rgba(255,255,255,.45)', fontSize: '.85rem', marginBottom: '1.25rem' }}>
              Citas ya atendidas. Se conservan como registro del negocio.
            </p>

            <div className="admin-subtabs no-imprimir">
              <button
                className={`admin-subtab ${origenHistorial === 'web' ? 'active' : ''}`}
                onClick={() => setOrigenHistorial('web')}
              >
                Página web
              </button>
              <button
                className={`admin-subtab ${origenHistorial === 'local' ? 'active' : ''}`}
                onClick={() => setOrigenHistorial('local')}
              >
                Local
              </button>
            </div>

            {cargandoHistorial ? (
              <p style={{ color: 'rgba(255,255,255,.4)', textAlign: 'center', padding: '2rem 0' }}>Cargando...</p>
            ) : historialFiltrado.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,.4)', textAlign: 'center', padding: '2rem 0' }}>
                {origenHistorial === 'web'
                  ? 'Todavía no hay citas completadas agendadas desde la página'
                  : 'Todavía no hay citas completadas hechas en el local'}
              </p>
            ) : (
              <>
                <div className="admin-acciones-historial no-imprimir">
                  <button className="admin-btn-suave" onClick={imprimirHistorial}>Imprimir</button>
                  <button className="admin-btn-suave" onClick={compartirHistorial}>Compartir</button>
                </div>

                <div className="admin-resumen">
                  <div>
                    <span className="admin-resumen-num">{historialFiltrado.length}</span>
                    <span className="admin-resumen-lbl">lavados atendidos</span>
                  </div>
                  <div>
                    <span className="admin-resumen-num">{resumenServicio.nombre}</span>
                    <span className="admin-resumen-lbl">servicio más pedido</span>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Hora</th>
                        <th>Cliente</th>
                        <th>Servicio</th>
                        <th>Vehículo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historialFiltrado.map(c => (
                        <tr key={c.id}>
                          <td>{formatDateDisplay(c.appointment_date)}</td>
                          <td>{convertTo12Hour(c.appointment_time)}</td>
                          <td>{c.customer_name}</td>
                          <td>{getServiceLabel(c.service_type)}</td>
                          <td>{c.vehicle_model}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'testimonios' && (
          <div className="space-y-6">
            <div className="admin-card testimonios-container">
              <div className="testimonios-header pendiente">
                <span className="testimonios-header-icon"></span>
                <h2>Opiniones Pendientes ({pendingTestimonials.length})</h2>
              </div>
              {pendingTestimonials.length === 0 ? (
                <div className="testimonios-empty"><p>No hay opiniones pendientes de aprobación</p></div>
              ) : (
                <div className="testimonios-grid">
                  {pendingTestimonials.map((t) => (
                    <div key={t.id} className="testimonial-card">
                      <div className="testimonial-card-header">
                        <div className="testimonial-avatar">{t.customer_name?.charAt(0) || 'U'}</div>
                        <div className="testimonial-info">
                          <div className="testimonial-name">{t.customer_name}</div>
                          <div className="testimonial-email">{(t as any).email || 'correo@ejemplo.com'}</div>
                        </div>
                        <div className="testimonial-stars">
                          {[1, 2, 3, 4, 5].map((star) => (<span key={star} className={star <= t.rating ? 'star filled' : 'star empty'}>★</span>))}
                        </div>
                      </div>
                      <div className="testimonial-comment">"{t.comment}"</div>
                      <div className="testimonial-card-footer">
                        <div className="testimonial-date">{formatDateLong(t.created_at)}</div>
                        <div className="testimonial-actions">
                          <button onClick={() => approveTestimonial(t.id)} className="btn-approve">✓ Aprobar</button>
                          <button onClick={() => deleteTestimonial(t.id)} className="btn-delete">✗ Eliminar</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="admin-card testimonios-container">
              <div className="testimonios-header aprobada">
                <span className="testimonios-header-icon">✓</span>
                <h2>Opiniones Aprobadas ({approvedTestimonials.length})</h2>
              </div>
              {approvedTestimonials.length === 0 ? (
                <div className="testimonios-empty"><p>No hay opiniones aprobadas aún</p></div>
              ) : (
                <div className="testimonios-grid">
                  {approvedTestimonials.map((t) => (
                    <div key={t.id} className="testimonial-card approved">
                      <div className="testimonial-card-header">
                        <div className="testimonial-avatar">{t.customer_name?.charAt(0) || 'U'}</div>
                        <div className="testimonial-info">
                          <div className="testimonial-name">{t.customer_name}</div>
                          <div className="testimonial-email">{(t as any).email || 'correo@ejemplo.com'}</div>
                        </div>
                        <div className="testimonial-stars">
                          {[1, 2, 3, 4, 5].map((star) => (<span key={star} className={star <= t.rating ? 'star filled' : 'star empty'}>★</span>))}
                        </div>
                      </div>
                      <div className="testimonial-comment">"{t.comment}"</div>
                      <div className="testimonial-card-footer">
                        <div className="testimonial-date">{formatDateLong(t.created_at)}</div>
                        <button onClick={() => deleteTestimonial(t.id)} className="btn-delete">✗ Eliminar</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'horarios' && (
          <div className="admin-card">
            <div className="af-card-header">
              <h2>Configuración de Horarios</h2>
              <p>Define los horarios de atención por día (formato 12 horas)</p>
            </div>
            <div className="af-body">
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Día</th>
                      <th>Hora Inicio</th>
                      <th>Hora Fin</th>
                      <th>Intervalo (min)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {horarios.map((horario) => (
                      <tr key={horario.id}>
                        <td style={{ fontWeight: '500' }}>{horario.nombre_dia}</td>
                        <td>
                          <select value={horario.hora_inicio} onChange={(e) => updateHorario(horario.id, 'hora_inicio', e.target.value)} className="af-input" style={{ width: '120px', padding: '0.4rem' }} disabled={savingHorarios}>
                            {generateTimeOptions().map(time => (<option key={time} value={time}>{time}</option>))}
                          </select>
                        </td>
                        <td>
                          <select value={horario.hora_fin} onChange={(e) => updateHorario(horario.id, 'hora_fin', e.target.value)} className="af-input" style={{ width: '120px', padding: '0.4rem' }} disabled={savingHorarios}>
                            {generateTimeOptions().map(time => (<option key={time} value={time}>{time}</option>))}
                          </select>
                        </td>
                        <td>
                          <select value={horario.intervalo_minutos} onChange={(e) => updateHorario(horario.id, 'intervalo_minutos', parseInt(e.target.value))} className="af-input" style={{ width: '100px', padding: '0.4rem' }} disabled={savingHorarios}>
                            <option value={30}>30 min</option>
                            <option value={60}>60 min</option>
                            <option value={90}>90 min</option>
                            <option value={120}>120 min</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="af-hint" style={{ marginTop: '1rem', textAlign: 'center' }}>ℹ️ Los horarios se actualizan automáticamente. Los clientes verán los cambios inmediatamente.</p>
            </div>
          </div>
        )}

        {activeTab === 'horarios' && (
          <div className="admin-card" style={{ marginTop: '1.5rem' }}>
            <div className="af-card-header">
              <h2>Cerrar días específicos</h2>
              <p>Seleccioná en el calendario los días que el negocio no abrirá</p>
            </div>
            <div className="af-body">
              <div className="cierre-layout">
                <div className="cierre-calendario">
                  <Calendar
                    onClickDay={toggleFechaSeleccionada}
                    value={null}
                    minDate={new Date()}
                    className="custom-calendar calendar-loaded"
                    prev2Label={null}
                    next2Label={null}
                    prevLabel="‹"
                    nextLabel="›"
                    locale="es-ES"
                    showNeighboringMonth={false}
                    tileDisabled={({ date }) => date.getDay() === 0 && !domingoActivo}
                    tileClassName={({ date, view }) => {
                      if (view !== 'month') return null
                      const f = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
                      if (fechasSeleccionadas.includes(f)) return 'dia-seleccionado'
                      if (diasCerrados.some(d => d.fecha === f)) return 'dia-ya-cerrado'
                      if (date.getDay() === 0 && !domingoActivo) return 'blocked-day'
                      return null
                    }}
                  />
                  <p className="af-hint" style={{ textAlign: 'center', marginTop: '.75rem' }}>
                    Tocá un día para marcarlo. Si lo volvés a tocar, se desmarca.
                  </p>

                  {domingo && (
                    <label className="domingo-toggle">
                      <input
                        type="checkbox"
                        checked={domingoActivo}
                        onChange={(e) => updateHorario(domingo.id, 'activo', e.target.checked)}
                        disabled={savingHorarios}
                      />
                      <span className="domingo-toggle-texto">Abrir los domingos</span>
                      <span className={`domingo-toggle-estado ${domingoActivo ? 'activo' : 'inactivo'}`}>
                        {domingoActivo ? 'Activo' : 'Inactivo'}
                      </span>
                    </label>
                  )}
                </div>

                <div className="cierre-panel">
                  <div className="cierre-seccion">
                    <span className="af-section-label">DÍAS MARCADOS PARA CERRAR</span>
                    {fechasSeleccionadas.length === 0 ? (
                      <p style={{ color: 'rgba(255,255,255,.4)', fontSize: '.85rem', padding: '.5rem 0' }}>
                        Ningún día marcado todavía
                      </p>
                    ) : (
                      <div className="cierre-chips">
                        {fechasSeleccionadas.map(f => (
                          <span key={f} className="cierre-chip">
                            {formatDateLong(f)}
                            <button
                              type="button"
                              onClick={() => setFechasSeleccionadas(prev => prev.filter(x => x !== f))}
                              title="Quitar"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    <button
                      type="button"
                      className="cierre-btn-confirmar"
                      onClick={revisarCierre}
                      disabled={fechasSeleccionadas.length === 0 || cerrandoDias}
                    >
                      {cerrandoDias ? 'Cerrando...' : `Confirmar cierre (${fechasSeleccionadas.length})`}
                    </button>
                  </div>

                  <div className="cierre-seccion">
                    <span className="af-section-label">DÍAS YA CERRADOS</span>
                    {diasCerrados.length === 0 ? (
                      <p style={{ color: 'rgba(255,255,255,.4)', fontSize: '.85rem', padding: '.5rem 0' }}>
                        No hay días cerrados próximamente
                      </p>
                    ) : (
                      <div className="cierre-lista">
                        {diasCerrados.map(d => (
                          <div key={d.id} className="cierre-item">
                            <span>{formatDateLong(d.fecha)}</span>
                            <button type="button" onClick={() => reabrirDia(d)}>Reabrir</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Aviso a los clientes de los dias que se cierran */}
      {mostrarAvisos && (
        <div className="af-modal-overlay">
          <div className="af-modal" style={{ maxWidth: 560 }}>
            <h2 style={{ fontFamily: "'Sora',sans-serif", textAlign: 'center', fontSize: '1.25rem', marginBottom: '.4rem', color: '#fff' }}>
              {cierreCompletado ? 'Reservaron a último momento' : 'Avisar a los clientes'}
            </h2>
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,.45)', fontSize: '.85rem', marginBottom: '1rem' }}>
              {cierreCompletado
                ? `Los días ya quedaron cerrados. ${citasAfectadas.length} cita(s) entraron mientras revisabas y también se cancelaron: avisales por WhatsApp.`
                : `Hay ${citasAfectadas.length} cita(s) en esos días. Abrí los chats, presioná enviar en cada uno y luego confirmá el cierre.`}
            </p>

            <button type="button" className="aviso-abrir-todos" onClick={abrirTodosLosChats}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.695.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
              </svg>
              Abrir todos los chats ({citasAfectadas.length})
            </button>

            <div className="aviso-contador">
              {avisados.filter(id => citasAfectadas.some(c => c.id === id)).length} de {citasAfectadas.length} avisados
            </div>

            <div className="aviso-lista">
              {citasAfectadas.map(apt => (
                <div key={apt.id} className={`aviso-item ${avisados.includes(apt.id) ? 'avisado' : ''}`}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '.9rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                      {apt.customer_name}
                      {avisados.includes(apt.id) && <span className="aviso-check">✓ avisado</span>}
                    </div>
                    <div style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.5)' }}>
                      {formatDateLong(apt.appointment_date)} · {convertTo12Hour(apt.appointment_time)}
                    </div>
                    <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.35)' }}>{apt.customer_phone}</div>
                  </div>
                  <a
                    href={getWhatsappCancelacion(apt)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aviso-wa-btn"
                    title="Avisar por WhatsApp"
                    onClick={() => setAvisados(prev => [...new Set([...prev, apt.id])])}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.695.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                    </svg>
                  </a>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '.75rem', marginTop: '1.5rem' }}>
              <button
                onClick={() => {
                  setMostrarAvisos(false)
                  setCitasAfectadas([])
                  setAvisados([])
                  setCierreCompletado(false)
                }}
                className="cierre-btn-cancelar"
                disabled={cerrandoDias}
              >
                {cierreCompletado ? 'Listo' : 'Cancelar'}
              </button>
              {!cierreCompletado && (
                <button
                  onClick={confirmarCierre}
                  className="cierre-btn-confirmar"
                  style={{ marginTop: 0 }}
                  disabled={cerrandoDias}
                >
                  {cerrandoDias ? 'Cerrando...' : 'Confirmar cierre'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}