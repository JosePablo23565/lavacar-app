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
  const [origenHistorial, setOrigenHistorial] = useState<'todas' | 'web' | 'local'>('todas')
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
  const [cierreCompletado, setCierreCompletado] = useState(false)

  useEffect(() => {
    checkAdminAndFetch()
  }, [])

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
      swalError('No se pudo cerrar el día', error.message)
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
    }
  }

  const checkAdminAndFetch = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      navigate('/admin/login')
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
        'El navegador bloqueó las ventanas emergentes',
        `Se abrieron ${abiertos.length} de ${citasAfectadas.length} chats. Permití las ventanas emergentes para este sitio o abrí cada cliente manualmente.`
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

  const historialFiltrado = historial.filter(c => {
    if (origenHistorial === 'todas') return true
    return (c.origen || 'web') === origenHistorial
  })

  const resumenServicio = (() => {
    if (historialFiltrado.length === 0) return { nombre: '—' }
    const cuenta: Record<string, number> = {}
    for (const c of historialFiltrado) cuenta[c.service_type] = (cuenta[c.service_type] || 0) + 1
    const top = Object.entries(cuenta).sort((a, b) => b[1] - a[1])[0]
    return { nombre: getServiceLabel(top[0]) }
  })()

  const filasHistorial = () => historialFiltrado.map(c => [
    formatDateDisplay(c.appointment_date),
    convertTo12Hour(c.appointment_time),
    c.customer_name,
    getServiceLabel(c.service_type),
    c.vehicle_model || '-',
  ])

  const tituloHistorial = () => {
    if (origenHistorial === 'todas') return 'Todas las citas agendadas (Web y Físicas)'
    return origenHistorial === 'web' ? 'Citas agendadas desde la página web' : 'Citas agendadas en el local'
  }

  const imprimirHistorial = () => window.print()

  const compartirHistorial = async () => {
    const filas = filasHistorial()

    if (filas.length === 0) {
      swalError('Nada que compartir', 'No hay citas en esta lista.')
      return
    }

    const [{ jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ])

    const doc = new jsPDF()

    doc.setFontSize(15)
    doc.text('Auto Lavado y Servicios Camaro Fraterno', 14, 18)
    doc.setFontSize(10)
    doc.setTextColor(110)
    doc.text(tituloHistorial(), 14, 25)
    doc.text(`${filas.length} lavados atendidos  |  Servicio más pedido: ${resumenServicio.nombre}`, 14, 31)

    autoTable(doc, {
      startY: 38,
      head: [['Fecha', 'Hora', 'Cliente', 'Servicio', 'Vehículo']],
      body: filas,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [224, 20, 44], textColor: 255 },
      alternateRowStyles: { fillColor: [247, 247, 247] },
    })

    const nombre = `historial-${origenHistorial}-${new Date().toISOString().slice(0, 10)}.pdf`
    const archivo = new File([doc.output('blob')], nombre, { type: 'application/pdf' })

    if (navigator.canShare?.({ files: [archivo] })) {
      try {
        await navigator.share({ files: [archivo], title: 'Historial de citas' })
        return
      } catch {
        return
      }
    }

    doc.save(nombre)
    swalSuccess('PDF listo', 'Se descargó el archivo correctamente.')
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

  const domingo = horarios.find(h => h.dia_semana === 0)
  const domingoActivo = domingo?.activo === true

  const horariosOrdenados = [...horarios].sort((a, b) => {
    const ordenA = a.dia_semana === 0 ? 7 : a.dia_semana
    const ordenB = b.dia_semana === 0 ? 7 : b.dia_semana
    return ordenA - ordenB
  })

  const HORA_MIN = 7
  const HORA_MAX = 22

  const generateTimeOptions = (): string[] => {
    const times: string[] = []
    for (let hour = HORA_MIN; hour <= HORA_MAX; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === HORA_MAX && minute > 0) break
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
      <div className="admin-loading-text">Cargando panel...</div>
    </div>
  )

  return (
    <div className="admin-root">
      <div className="admin-container">

        {/* Encabezado limpio y sobrio */}
        <header className="admin-header">
          <div>
            <h1 className="admin-title">Panel Administrativo</h1>
          </div>
        </header>

        {limpiezaMsg && (
          <div className="admin-toast-clean">
            <span>{limpiezaMsg}</span>
          </div>
        )}

        {/* Pestañas limpias (Clean Underline Style) */}
        <nav className="admin-tabs" role="tablist">
          <button 
            role="tab"
            aria-selected={activeTab === 'citas'}
            onClick={() => setActiveTab('citas')} 
            className={`admin-tab-item ${activeTab === 'citas' ? 'active' : ''}`}
          >
            <span>Citas</span>
          </button>

          <button 
            role="tab"
            aria-selected={activeTab === 'historial'}
            onClick={() => setActiveTab('historial')} 
            className={`admin-tab-item ${activeTab === 'historial' ? 'active' : ''}`}
          >
            <span>Historial</span>
          </button>

          <button 
            role="tab"
            aria-selected={activeTab === 'testimonios'}
            onClick={() => setActiveTab('testimonios')} 
            className={`admin-tab-item ${activeTab === 'testimonios' ? 'active' : ''}`}
          >
            <span>Opiniones</span>
            {pendingTestimonials.length > 0 && (
              <span className="admin-tab-count alert">{pendingTestimonials.length}</span>
            )}
          </button>

          <button 
            role="tab"
            aria-selected={activeTab === 'horarios'}
            onClick={() => setActiveTab('horarios')} 
            className={`admin-tab-item ${activeTab === 'horarios' ? 'active' : ''}`}
          >
            <span>Horarios</span>
          </button>
        </nav>

        {/* ========================================================
            TAB 1: CITAS ACTIVAS
           ======================================================== */}
        {activeTab === 'citas' && (
          <div>
            {mostrarNuevaCita && (
              <NuevaCitaAdmin
                onCerrar={() => setMostrarNuevaCita(false)}
                onCreada={() => { setMostrarNuevaCita(false); fetchAppointments() }}
              />
            )}

            {/* Métricas limpias (Clean Stats Cards) */}
            <div className="clean-stats-grid">
              <div className="clean-stat-card">
                <span className="clean-stat-label">Citas Totales</span>
                <span className="clean-stat-value">{stats.total}</span>
              </div>
              <div className="clean-stat-card">
                <span className="clean-stat-label">Agendadas Hoy</span>
                <span className="clean-stat-value">{stats.hoy}</span>
              </div>
              <div className="clean-stat-card">
                <span className="clean-stat-label">Próximos Días</span>
                <span className="clean-stat-value">{stats.proximas}</span>
              </div>
            </div>

            {/* Barra de Acciones y Búsqueda */}
            <div className="admin-action-bar">
              <div className="admin-action-buttons">
                <button 
                  className="btn-admin-primary" 
                  onClick={() => setMostrarNuevaCita(true)}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  <span>Agendar cita</span>
                </button>

                <button 
                  onClick={limpiarManual} 
                  className="btn-admin-secondary"
                  title="Marcar como completadas citas pasadas"
                >
                  <span>Cerrar citas atendidas</span>
                </button>
              </div>

              <div className="admin-search-wrapper">
                <svg className="admin-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input 
                  type="text" 
                  placeholder="Buscar cliente, teléfono o vehículo..." 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                  className="admin-search-input"
                />
              </div>
            </div>

            {/* Vista Móvil: Tarjetas sobrias */}
            <div className="mobile-only-view space-y-3">
              {filteredAppointments.length === 0 ? (
                <div className="admin-empty-box">No hay citas registradas</div>
              ) : (
                filteredAppointments.map((apt) => (
                  <div key={apt.id} className="clean-card-mobile compact-apt-card">
                    <div className="compact-apt-header">
                      <div className="compact-apt-header-left">
                        <span className={`clean-badge ${estadoCita(apt).clave}`}>
                          {estadoCita(apt).texto}
                        </span>
                        <span className="compact-apt-time">
                          {formatDateDisplay(apt.appointment_date)} · {convertTo12Hour(apt.appointment_time)}
                        </span>
                      </div>
                      <div className="clean-actions-mobile">
                        <a 
                          href={getWhatsappLink(apt)} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="clean-btn-icon wa" 
                          title="WhatsApp"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.5 3.45 1.44 4.94L2 22l5.25-1.42c1.45.85 3.1 1.31 4.79 1.31 5.46 0 9.91-4.45 9.91-9.91 0-2.66-1.04-5.16-2.92-7.04A9.91 9.91 0 0 0 12.04 2zm.04 18.22c-1.49 0-2.97-.4-4.26-1.16l-.31-.18-3.11.84.85-3.03-.2-.33a8.02 8.02 0 0 1-1.22-4.27c0-4.47 3.64-8.1 8.11-8.1 2.16 0 4.19.84 5.72 2.37a8.04 8.04 0 0 1 2.38 5.72c-.01 4.47-3.64 8.11-8.11 8.11zm4.44-6.07c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12s-.62.78-.76.94c-.14.16-.28.18-.52.06-.24-.12-1.01-.37-1.92-1.18-.71-.63-1.19-1.41-1.33-1.65-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.19-.47-.39-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2 0 1.18.86 2.32.98 2.48.12.16 1.69 2.58 4.1 3.62.57.25 1.02.39 1.37.5.57.18 1.09.15 1.5.09.46-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28z"/>
                          </svg>
                        </a>
                        <button 
                          onClick={() => deleteAppointment(apt.id)} 
                          className="clean-btn-icon del" 
                          title="Eliminar"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="compact-apt-client-row">
                      <h4 className="compact-apt-name">{apt.customer_name}</h4>
                      <p className="compact-apt-contact">
                        <span>{apt.customer_phone}</span>
                        {apt.email && <span className="compact-apt-email"> · {apt.email}</span>}
                      </p>
                    </div>

                    <div className="compact-apt-chips">
                      <span className="compact-chip service-chip">
                        <span className="chip-lbl">Servicio:</span> {getServiceLabel(apt.service_type)}
                      </span>
                      <span className="compact-chip vehicle-chip">
                        <span className="chip-lbl">Vehículo:</span> {getVehicleLabel(apt.vehicle_type)}{apt.vehicle_model ? ` · ${apt.vehicle_model}` : ''}
                      </span>
                    </div>

                    {apt.notes && (
                      <div className="compact-apt-notes">
                        <span className="notes-icon">📝</span>
                        <span className="notes-text">{apt.notes}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Vista Desktop: Tabla Limpia & Profesional */}
            <div className="desktop-only-view clean-table-container">
              <table className="clean-table">
                <thead>
                  <tr>
                    <th>Estado</th>
                    <th>Cliente</th>
                    <th>Teléfono</th>
                    <th>Vehículo</th>
                    <th>Servicio</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Notas</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="clean-table-empty">
                        No hay citas registradas en este momento
                      </td>
                    </tr>
                  ) : (
                    filteredAppointments.map((apt) => (
                      <tr key={apt.id}>
                        <td>
                          <span className={`clean-badge ${estadoCita(apt).clave}`}>
                            {estadoCita(apt).texto}
                          </span>
                        </td>
                        <td className="cell-client-name">
                          {apt.customer_name}
                        </td>
                        <td className="cell-client-phone">
                          {apt.customer_phone}
                        </td>
                        <td className="cell-vehicle">
                          {getVehicleLabel(apt.vehicle_type)} {apt.vehicle_model ? `(${apt.vehicle_model})` : ''}
                        </td>
                        <td>
                          <span className="clean-service-tag">{getServiceLabel(apt.service_type)}</span>
                        </td>
                        <td className="cell-date">
                          {formatDateDisplay(apt.appointment_date)}
                        </td>
                        <td className="cell-time">
                          {convertTo12Hour(apt.appointment_time)}
                        </td>
                        <td className="cell-notes" title={apt.notes || ''}>
                          {apt.notes ? (apt.notes.length > 24 ? apt.notes.substring(0, 24) + '...' : apt.notes) : '—'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="clean-table-actions">
                            <a 
                              href={getWhatsappLink(apt)} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="btn-table-action wa" 
                              title="Abrir WhatsApp"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.5 3.45 1.44 4.94L2 22l5.25-1.42c1.45.85 3.1 1.31 4.79 1.31 5.46 0 9.91-4.45 9.91-9.91 0-2.66-1.04-5.16-2.92-7.04A9.91 9.91 0 0 0 12.04 2zm.04 18.22c-1.49 0-2.97-.4-4.26-1.16l-.31-.18-3.11.84.85-3.03-.2-.33a8.02 8.02 0 0 1-1.22-4.27c0-4.47 3.64-8.1 8.11-8.1 2.16 0 4.19.84 5.72 2.37a8.04 8.04 0 0 1 2.38 5.72c-.01 4.47-3.64 8.11-8.11 8.11zm4.44-6.07c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12s-.62.78-.76.94c-.14.16-.28.18-.52.06-.24-.12-1.01-.37-1.92-1.18-.71-.63-1.19-1.41-1.33-1.65-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.19-.47-.39-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2 0 1.18.86 2.32.98 2.48.12.16 1.69 2.58 4.1 3.62.57.25 1.02.39 1.37.5.57.18 1.09.15 1.5.09.46-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28z"/>
                              </svg>
                            </a>
                            <button 
                              onClick={() => deleteAppointment(apt.id)} 
                              className="btn-table-action del" 
                              title="Eliminar cita"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: HISTORIAL
           ======================================================== */}
        {activeTab === 'historial' && (
          <div className="clean-content-panel">
            <div className="clean-panel-top">
              <div>
                <h3 className="clean-panel-title">Historial de Citas Agendadas</h3>
              </div>

              <div className="clean-channel-tabs no-imprimir">
                <button
                  className={`clean-channel-btn ${origenHistorial === 'todas' ? 'active' : ''}`}
                  onClick={() => setOrigenHistorial('todas')}
                >
                  Todas
                </button>
                <button
                  className={`clean-channel-btn ${origenHistorial === 'web' ? 'active' : ''}`}
                  onClick={() => setOrigenHistorial('web')}
                >
                  Web
                </button>
                <button
                  className={`clean-channel-btn ${origenHistorial === 'local' ? 'active' : ''}`}
                  onClick={() => setOrigenHistorial('local')}
                >
                  Físicas
                </button>
              </div>
            </div>

            {cargandoHistorial ? (
              <div className="admin-empty-box">Cargando registros históricos...</div>
            ) : historialFiltrado.length === 0 ? (
              <div className="admin-empty-box">
                {origenHistorial === 'todas'
                  ? 'No hay registros de citas completadas aún.'
                  : origenHistorial === 'web'
                  ? 'No hay registros de citas web completadas aún.'
                  : 'No hay registros de citas físicas aún.'}
              </div>
            ) : (
              <>
                <div className="clean-historial-bar no-imprimir">
                  <div className="clean-stat-summary">
                    <span><strong>{historialFiltrado.length}</strong> lavados completados</span>
                    <span className="dot-sep">•</span>
                    <span>Servicio frecuente: <strong>{resumenServicio.nombre}</strong></span>
                  </div>

                  <div className="clean-export-actions">
                    <button className="btn-clean-ghost" onClick={imprimirHistorial}>
                      Imprimir
                    </button>
                    <button className="btn-clean-ghost" onClick={compartirHistorial}>
                      Exportar PDF
                    </button>
                  </div>
                </div>

                {/* Vista Mobile: Tarjetas de Historial (sin desplazamiento horizontal) */}
                <div className="mobile-only-view clean-historial-cards">
                  {historialFiltrado.map(c => (
                    <div key={c.id} className="clean-historial-card">
                      <div className="clean-historial-card-top">
                        <span className="clean-historial-date-badge">
                          {formatDateDisplay(c.appointment_date)} · {convertTo12Hour(c.appointment_time)}
                        </span>
                        <span className="clean-historial-channel-badge">
                          {(c.origen || 'web') === 'local' ? 'Física' : 'Web'}
                        </span>
                      </div>
                      <div className="clean-historial-client-name">{c.customer_name}</div>
                      <div className="clean-historial-chips">
                        <span className="clean-historial-chip">
                          <span className="chip-lbl">Servicio:</span> {getServiceLabel(c.service_type)}
                        </span>
                        <span className="clean-historial-chip">
                          <span className="chip-lbl">Vehículo:</span> {c.vehicle_model || getVehicleLabel(c.vehicle_type)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Vista Desktop: Tabla Tradicional */}
                <div className="desktop-only-view clean-table-container">
                  <table className="clean-table">
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
                          <td className="cell-date">{formatDateDisplay(c.appointment_date)}</td>
                          <td className="cell-time">{convertTo12Hour(c.appointment_time)}</td>
                          <td className="cell-client-name">{c.customer_name}</td>
                          <td><span className="clean-service-tag">{getServiceLabel(c.service_type)}</span></td>
                          <td>{c.vehicle_model || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 3: TESTIMONIOS
           ======================================================== */}
        {activeTab === 'testimonios' && (
          <div className="space-y-6">
            <div className="clean-content-panel">
              <div className="clean-panel-top">
                <h3 className="clean-panel-title">Opiniones Pendientes ({pendingTestimonials.length})</h3>
              </div>

              {pendingTestimonials.length === 0 ? (
                <div className="admin-empty-box">No hay opiniones pendientes de revisión</div>
              ) : (
                <div className="clean-reviews-grid">
                  {pendingTestimonials.map((t) => (
                    <div key={t.id} className="clean-review-item">
                      <div className="clean-review-header">
                        <div className="clean-review-user">
                          <span className="clean-review-name">{t.customer_name}</span>
                          <span className="clean-review-date">{formatDateDisplay(t.created_at.slice(0, 10))}</span>
                        </div>
                        <div className="clean-stars">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star} className={star <= t.rating ? 'filled' : 'empty'}>★</span>
                          ))}
                        </div>
                      </div>
                      <div className="clean-review-content-row">
                        <p className="clean-review-text">"{t.comment}"</p>
                        <div className="clean-review-actions">
                          <button onClick={() => approveTestimonial(t.id)} className="btn-clean-approve">
                            Aprobar
                          </button>
                          <button onClick={() => deleteTestimonial(t.id)} className="btn-clean-delete">
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="clean-content-panel">
              <div className="clean-panel-top">
                <h3 className="clean-panel-title">Opiniones Publicadas ({approvedTestimonials.length})</h3>
              </div>

              {approvedTestimonials.length === 0 ? (
                <div className="admin-empty-box">No hay opiniones publicadas todavía</div>
              ) : (
                <div className="clean-reviews-grid">
                  {approvedTestimonials.map((t) => (
                    <div key={t.id} className="clean-review-item approved">
                      <div className="clean-review-header">
                        <div className="clean-review-user">
                          <span className="clean-review-name">{t.customer_name}</span>
                          <span className="clean-review-date">{formatDateDisplay(t.created_at.slice(0, 10))}</span>
                        </div>
                        <div className="clean-stars">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star} className={star <= t.rating ? 'filled' : 'empty'}>★</span>
                          ))}
                        </div>
                      </div>
                      <div className="clean-review-content-row">
                        <p className="clean-review-text">"{t.comment}"</p>
                        <div className="clean-review-actions">
                          <button onClick={() => deleteTestimonial(t.id)} className="btn-clean-delete">
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 4: HORARIOS Y CIERRES
           ======================================================== */}
        {activeTab === 'horarios' && (
          <div className="space-y-6">
            <div className="clean-content-panel">
              <div className="clean-panel-top">
                <div>
                  <h3 className="clean-panel-title">Horarios de Atención</h3>
                </div>
              </div>

              {/* Vista Mobile: Tarjetas por Día (sin desplazamiento horizontal) */}
              <div className="mobile-only-view clean-schedule-cards">
                {horariosOrdenados.map((horario) => {
                  const esDomingoDeshabilitado = horario.dia_semana === 0 && !domingoActivo
                  return (
                    <div 
                      key={horario.id} 
                      className={`clean-schedule-card ${esDomingoDeshabilitado ? 'schedule-card-disabled' : ''}`}
                    >
                      <div className="clean-schedule-card-header">
                        <span className="clean-schedule-day-name">{horario.nombre_dia}</span>
                        <div className="clean-schedule-interval">
                          <span>Intervalo:</span>
                          <select 
                            value={horario.intervalo_minutos} 
                            onChange={(e) => updateHorario(horario.id, 'intervalo_minutos', parseInt(e.target.value))} 
                            className="clean-select clean-select-sm" 
                            disabled={savingHorarios || esDomingoDeshabilitado}
                          >
                            <option value={30}>30 min</option>
                            <option value={60}>60 min</option>
                            <option value={90}>90 min</option>
                            <option value={120}>120 min</option>
                          </select>
                        </div>
                      </div>
                      <div className="clean-schedule-times-grid">
                        <div className="clean-schedule-time-field">
                          <span className="clean-schedule-time-lbl">Apertura</span>
                          <select 
                            value={horario.hora_inicio} 
                            onChange={(e) => updateHorario(horario.id, 'hora_inicio', e.target.value)} 
                            className="clean-select" 
                            disabled={savingHorarios || esDomingoDeshabilitado}
                          >
                            {generateTimeOptions().map(time => (
                              <option key={time} value={time}>{time}</option>
                            ))}
                          </select>
                        </div>
                        <div className="clean-schedule-time-field">
                          <span className="clean-schedule-time-lbl">Cierre</span>
                          <select 
                            value={horario.hora_fin} 
                            onChange={(e) => updateHorario(horario.id, 'hora_fin', e.target.value)} 
                            className="clean-select" 
                            disabled={savingHorarios || esDomingoDeshabilitado}
                          >
                            {generateTimeOptions().map(time => (
                              <option key={time} value={time}>{time}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Vista Desktop: Tabla Tradicional */}
              <div className="desktop-only-view clean-table-container">
                <table className="clean-table">
                  <thead>
                    <tr>
                      <th>Día</th>
                      <th>Apertura</th>
                      <th>Cierre</th>
                      <th>Intervalo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {horariosOrdenados.map((horario) => {
                      const esDomingoDeshabilitado = horario.dia_semana === 0 && !domingoActivo
                      return (
                        <tr key={horario.id} className={esDomingoDeshabilitado ? 'schedule-row-disabled' : ''}>
                          <td className="cell-client-name">
                            <span>{horario.nombre_dia}</span>
                          </td>
                          <td>
                            <select 
                              value={horario.hora_inicio} 
                              onChange={(e) => updateHorario(horario.id, 'hora_inicio', e.target.value)} 
                              className="clean-select" 
                              disabled={savingHorarios || esDomingoDeshabilitado}
                            >
                              {generateTimeOptions().map(time => (
                                <option key={time} value={time}>{time}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <select 
                              value={horario.hora_fin} 
                              onChange={(e) => updateHorario(horario.id, 'hora_fin', e.target.value)} 
                              className="clean-select" 
                              disabled={savingHorarios || esDomingoDeshabilitado}
                            >
                              {generateTimeOptions().map(time => (
                                <option key={time} value={time}>{time}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <select 
                              value={horario.intervalo_minutos} 
                              onChange={(e) => updateHorario(horario.id, 'intervalo_minutos', parseInt(e.target.value))} 
                              className="clean-select" 
                              disabled={savingHorarios || esDomingoDeshabilitado}
                            >
                              <option value={30}>30 min</option>
                              <option value={60}>60 min</option>
                              <option value={90}>90 min</option>
                              <option value={120}>120 min</option>
                            </select>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="clean-content-panel">
              <div className="clean-panel-top">
                <div>
                  <h3 className="clean-panel-title">Cerrar Días Específicos</h3>
                </div>
              </div>

              <div className="clean-closure-layout">
                <div>
                  <Calendar
                    onClickDay={toggleFechaSeleccionada}
                    value={null}
                    minDate={new Date()}
                    className="custom-calendar"
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

                  {domingo && (
                    <label className="clean-checkbox-row">
                      <input
                        type="checkbox"
                        checked={domingoActivo}
                        onChange={(e) => updateHorario(domingo.id, 'activo', e.target.checked)}
                        disabled={savingHorarios}
                      />
                      <span>Atención los días domingo</span>
                      <span className={`clean-status-pill ${domingoActivo ? 'active' : 'inactive'}`}>
                        {domingoActivo ? 'Abierto' : 'Cerrado'}
                      </span>
                    </label>
                  )}
                </div>

                <div className="clean-closure-side">
                  <div className="clean-sub-panel">
                    <span className="clean-sub-title">Días seleccionados para cierre</span>
                    {fechasSeleccionadas.length === 0 ? (
                      <p className="clean-hint">Toca una fecha en el calendario para marcarla</p>
                    ) : (
                      <div className="clean-chips-wrap">
                        {fechasSeleccionadas.map(f => (
                          <span key={f} className="clean-chip">
                            <span>{formatDateLong(f)}</span>
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
                      className="btn-admin-primary w-full"
                      onClick={revisarCierre}
                      disabled={fechasSeleccionadas.length === 0 || cerrandoDias}
                    >
                      {cerrandoDias ? 'Cerrando...' : `Confirmar cierre (${fechasSeleccionadas.length})`}
                    </button>
                  </div>

                  <div className="clean-sub-panel">
                    <span className="clean-sub-title">Próximos días cerrados</span>
                    {diasCerrados.length === 0 ? (
                      <p className="clean-hint">No hay cierres programados</p>
                    ) : (
                      <div className="clean-closure-list">
                        {diasCerrados.map(d => (
                          <div key={d.id} className="clean-closure-row">
                            <span>{formatDateLong(d.fecha)}</span>
                            <button type="button" onClick={() => reabrirDia(d)} className="btn-clean-ghost small">
                              Reabrir
                            </button>
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

      {/* Modal Limpio de Avisos */}
      {mostrarAvisos && (
        <div className="clean-modal-backdrop">
          <div className="clean-modal-card">
            <h3 className="clean-modal-title">
              {cierreCompletado ? 'Citas registradas a último momento' : 'Avisar a clientes por WhatsApp'}
            </h3>
            <p className="clean-modal-desc">
              {cierreCompletado
                ? `Los días ya quedaron cerrados. ${citasAfectadas.length} cita(s) entraron antes de guardar: favor avisarles.`
                : `Hay ${citasAfectadas.length} cita(s) agendadas en esas fechas. Puedes enviar un mensaje a cada cliente antes de cancelar.`}
            </p>

            <button type="button" className="btn-clean-wa-all" onClick={abrirTodosLosChats}>
              Abrir WhatsApp para todos ({citasAfectadas.length})
            </button>

            <div className="clean-modal-list">
              {citasAfectadas.map(apt => (
                <div key={apt.id} className={`clean-modal-item ${avisados.includes(apt.id) ? 'done' : ''}`}>
                  <div>
                    <div className="item-name">
                      {apt.customer_name} {avisados.includes(apt.id) && <span className="item-done-tag">Avisado</span>}
                    </div>
                    <div className="item-sub">
                      {formatDateLong(apt.appointment_date)} · {convertTo12Hour(apt.appointment_time)}
                    </div>
                  </div>
                  <a
                    href={getWhatsappCancelacion(apt)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-modal-wa"
                    onClick={() => setAvisados(prev => [...new Set([...prev, apt.id])])}
                  >
                    WhatsApp
                  </a>
                </div>
              ))}
            </div>

            <div className="clean-modal-actions">
              <button
                onClick={() => {
                  setMostrarAvisos(false)
                  setCitasAfectadas([])
                  setAvisados([])
                  setCierreCompletado(false)
                }}
                className="btn-clean-ghost"
                disabled={cerrandoDias}
              >
                {cierreCompletado ? 'Listo' : 'Cancelar'}
              </button>
              {!cierreCompletado && (
                <button
                  onClick={confirmarCierre}
                  className="btn-admin-primary"
                  disabled={cerrandoDias}
                >
                  {cerrandoDias ? 'Cerrando...' : 'Confirmar Cierre'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}