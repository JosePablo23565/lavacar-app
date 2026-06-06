import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { swalConfirm, swalSuccess, swalError } from '../../utils/swalConfig'
import '../css/AdminDashboard.css'

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

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'citas' | 'testimonios' | 'horarios'>('citas')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [horarios, setHorarios] = useState<Horario[]>([])
  const [loading, setLoading] = useState(true)
  const [savingHorarios, setSavingHorarios] = useState(false)
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState({ total: 0, hoy: 0, proximas: 0 })
  const [limpiezaMsg, setLimpiezaMsg] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    checkAdminAndFetch()
  }, [])

  // Función para limpiar citas pasadas (ahora usa fecha local)
  const limpiarCitasPasadas = async () => {
    // Usar fecha local, no UTC
    const hoyLocal = new Date()
    const year = hoyLocal.getFullYear()
    const month = String(hoyLocal.getMonth() + 1).padStart(2, '0')
    const day = String(hoyLocal.getDate()).padStart(2, '0')
    const hoy = `${year}-${month}-${day}`
    
    const horaActual = `${hoyLocal.getHours().toString().padStart(2, '0')}:${hoyLocal.getMinutes().toString().padStart(2, '0')}:00`
    
    const { data: citasPasadas, error: selectError } = await supabase
      .from('appointments')
      .select('id, appointment_date, appointment_time')
      .or(`appointment_date.lt.${hoy},and(appointment_date.eq.${hoy},appointment_time.lt.${horaActual})`)
    
    if (selectError) {
      console.error('Error al buscar citas pasadas:', selectError)
      return 0
    }
    
    if (citasPasadas && citasPasadas.length > 0) {
      const idsAEliminar = citasPasadas.map(c => c.id)
      const { error: deleteError } = await supabase
        .from('appointments')
        .delete()
        .in('id', idsAEliminar)
      
      if (!deleteError) {
        const mensaje = `✅ Se eliminaron ${idsAEliminar.length} cita(s) vencida(s)`
        setLimpiezaMsg(mensaje)
        setTimeout(() => setLimpiezaMsg(''), 4000)
        return idsAEliminar.length
      } else {
        console.error('Error al eliminar:', deleteError)
      }
    }
    return 0
  }

  const limpiarManual = async () => {
    const resultado = await swalConfirm(
      'Limpiar citas vencidas', 
      'Se eliminarán todas las citas con fecha anterior a hoy y las de hoy que ya pasaron la hora actual. ¿Continuar?'
    )
    
    if (resultado.isConfirmed) {
      const eliminadas = await limpiarCitasPasadas()
      if (eliminadas > 0) {
        swalSuccess('Limpieza completada', `Se eliminaron ${eliminadas} cita(s) vencida(s)`)
        await fetchAppointments()
      } else {
        swalSuccess('Sin cambios', 'No hay citas vencidas para eliminar')
      }
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

    // IMPORTANTE: YA NO se eliminan citas automáticamente al cargar
    // La limpieza ahora es SOLO manual con el botón
    // await limpiarCitasPasadas()  // <--- ELIMINADO
    
    fetchAppointments()
    fetchTestimonials()
    fetchHorarios()
  }

  const fetchAppointments = async () => {
    const { data } = await supabase
      .from('appointments')
      .select('*')
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true })
    
    const citas = data || []
    
    const hoyLocal = new Date()
    const year = hoyLocal.getFullYear()
    const month = String(hoyLocal.getMonth() + 1).padStart(2, '0')
    const day = String(hoyLocal.getDate()).padStart(2, '0')
    const hoy = `${year}-${month}-${day}`
    
    const horaActual = `${hoyLocal.getHours().toString().padStart(2, '0')}:${hoyLocal.getMinutes().toString().padStart(2, '0')}:00`
    
    // Mostrar SOLO citas futuras (no vencidas)
    const citasFuturas = citas.filter(c => {
      if (c.appointment_date > hoy) return true
      if (c.appointment_date === hoy && c.appointment_time >= horaActual) return true
      return false
    })
    
    setAppointments(citasFuturas)
    
    const citasHoy = citasFuturas.filter(c => c.appointment_date === hoy)
    
    setStats({
      total: citasFuturas.length,
      hoy: citasHoy.length,
      proximas: citasFuturas.length - citasHoy.length
    })
    setLoading(false)
  }

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

  const getServiceLabel = (type: string) => {
    const services: Record<string, string> = {
      basico: 'Lavado Básico',
      completo: 'Lavado Completo',
      encerado: 'Encerado',
      tapizado: 'Tapizado'
    }
    return services[type] || type
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

  const formatDateCard = (date: string) => {
    if (!date) return ''
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
    const [year, month, day] = date.split('-')
    const mesNum = parseInt(month) - 1
    return `${parseInt(day)} ${meses[mesNum]} ${year}`
  }

  const filteredAppointments = appointments.filter(a =>
    a.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    a.customer_phone.includes(search) ||
    a.email?.toLowerCase().includes(search.toLowerCase()) ||
    a.vehicle_model?.toLowerCase().includes(search.toLowerCase())
  )

  const pendingTestimonials = testimonials.filter(t => !t.is_approved)
  const approvedTestimonials = testimonials.filter(t => t.is_approved)

  const generateTimeOptions = (): string[] => {
    const times: string[] = []
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const hour12 = hour % 12 || 12
        const ampm = hour < 12 ? 'AM' : 'PM'
        const minuteStr = minute.toString().padStart(2, '0')
        times.push(`${hour12.toString().padStart(2, '0')}:${minuteStr} ${ampm}`)
      }
    }
    return times
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="text-xl text-gray-300">Cargando...</div>
    </div>
  )

  return (
    <div className="admin-root">
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

        {limpiezaMsg && (
          <div className="mb-4 p-3 rounded-lg text-center" style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#6ee7b7' }}>
            {limpiezaMsg}
          </div>
        )}

        <div className="af-tabs">
          <button onClick={() => setActiveTab('citas')} className={`af-tab ${activeTab === 'citas' ? 'active' : ''}`}>
            Citas ({appointments.length})
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
            <div className="stats-row">
              <div className="stat-pill">
                <p className="stat-pill-num" style={{ color: '#0eb8d0' }}>{stats.total}</p>
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

            <div className="mb-4">
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
                Limpiar citas vencidas
              </button>
            </div>

            <div className="search-bare">
              <span className="search-bare-icon">🔍</span>
              <input type="text" placeholder="nombre, teléfono, correo o vehículo..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <div className="block md:hidden space-y-4">
              {filteredAppointments.length === 0 ? (
                <div className="admin-card p-8 text-center text-white/40">No hay citas registradas</div>
              ) : (
                filteredAppointments.map((apt) => (
                  <div key={apt.id} className="cita-card">
                    <div className="flex justify-between items-start mb-3 pb-3 border-b border-white/10">
                      <div>
                        <p className="font-semibold text-white text-base">{apt.customer_name}</p>
                        <p className="text-sm text-white/50 mt-0.5">{apt.customer_phone}</p>
                        <p className="text-xs text-white/40 mt-0.5 break-all">{apt.email}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => deleteAppointment(apt.id)} className="text-red-400 hover:text-red-300 text-lg px-2 py-1 transition">🗑️</button>
                        <a href={`https://wa.me/${apt.customer_phone}?text=Hola%20${apt.customer_name}%2C%20tu%20cita%20del%20${formatDateDisplay(apt.appointment_date)}%20a%20las%20${convertTo12Hour(apt.appointment_time)}%20está%20confirmada.`} target="_blank" className="text-green-400 hover:text-green-300 transition" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.5 3.45 1.44 4.94L2 22l5.25-1.42c1.45.85 3.1 1.31 4.79 1.31 5.46 0 9.91-4.45 9.91-9.91 0-2.66-1.04-5.16-2.92-7.04A9.91 9.91 0 0 0 12.04 2zm.04 18.22c-1.49 0-2.97-.4-4.26-1.16l-.31-.18-3.11.84.85-3.03-.2-.33a8.02 8.02 0 0 1-1.22-4.27c0-4.47 3.64-8.1 8.11-8.1 2.16 0 4.19.84 5.72 2.37a8.04 8.04 0 0 1 2.38 5.72c-.01 4.47-3.64 8.11-8.11 8.11zm4.44-6.07c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12s-.62.78-.76.94c-.14.16-.28.18-.52.06-.24-.12-1.01-.37-1.92-1.18-.71-.63-1.19-1.41-1.33-1.65-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.19-.47-.39-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2 0 1.18.86 2.32.98 2.48.12.16 1.69 2.58 4.1 3.62.57.25 1.02.39 1.37.5.57.18 1.09.15 1.5.09.46-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28z"/>
                          </svg>
                        </a>
                      </div>
                    </div>
                    <div className="space-y-2.5 text-sm">
                      <div className="flex"><span className="text-white/40 w-24">Vehículo:</span><span className="text-white/80">{getVehicleLabel(apt.vehicle_type)}</span></div>
                      <div className="flex"><span className="text-white/40 w-24">Modelo:</span><span className="text-white/80">{apt.vehicle_model || '—'}</span></div>
                      <div className="flex"><span className="text-white/40 w-24">Servicio:</span><span className="text-white/80">{getServiceLabel(apt.service_type)}</span></div>
                      <div className="flex"><span className="text-white/40 w-24">Fecha y hora:</span><span className="text-white/80">{formatDateCard(apt.appointment_date)} · {convertTo12Hour(apt.appointment_time)}</span></div>
                      {apt.notes && (<div className="flex mt-2 border-white/10"><span className="text-white/40 w-24">Detalles:</span><span className="text-white/80 text-sm" style={{ color: '#0eb8d0' }}>{apt.notes}</span></div>)}
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
                      <th>Cliente</th><th>Teléfono</th><th>Correo</th><th>Vehículo</th><th>Modelo</th><th>Servicio</th><th>Fecha</th><th>Hora</th><th>Detalles</th><th style={{ textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppointments.length === 0 ? (
                      <tr><td colSpan={10} style={{ textAlign: 'center', padding: '2.5rem', color: 'rgba(255,255,255,0.4)' }}>No hay citas registradas</td></tr>
                    ) : (
                      filteredAppointments.map((apt) => (
                        <tr key={apt.id}>
                          <td style={{ fontWeight: '500' }}>{apt.customer_name}</td>
                          <td>{apt.customer_phone}</td>
                          <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{apt.email}</td>
                          <td>{getVehicleLabel(apt.vehicle_type)}</td>
                          <td>{apt.vehicle_model || '—'}</td>
                          <td>{getServiceLabel(apt.service_type)}</td>
                          <td><span className="badge-blue">{formatDateDisplay(apt.appointment_date)}</span></td>
                          <td><span className="badge-green">{convertTo12Hour(apt.appointment_time)}</span></td>
                          <td style={{ maxWidth: '200px', fontSize: '0.75rem', color: '#0eb8d0' }}>
                            {apt.notes ? <span style={{ background: 'rgba(14,184,208,0.1)', padding: '0.2rem 0.5rem', borderRadius: '12px', display: 'inline-block' }}>{apt.notes.length > 30 ? apt.notes.substring(0, 30) + '...' : apt.notes}</span> : <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                              <button onClick={() => deleteAppointment(apt.id)} className="btn-danger">🗑️</button>
                              <a href={`https://wa.me/${apt.customer_phone}?text=Hola%20${apt.customer_name}%2C%20tu%20cita%20del%20${formatDateDisplay(apt.appointment_date)}%20a%20las%20${convertTo12Hour(apt.appointment_time)}%20está%20confirmada.`} target="_blank" className="btn-success" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0.4rem 0.8rem' }}>
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
                      <th>Activo</th>
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
                        <td>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input type="checkbox" checked={horario.activo} onChange={(e) => updateHorario(horario.id, 'activo', e.target.checked)} disabled={savingHorarios} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                            <span style={{ color: horario.activo ? '#34d399' : '#f87171' }}>{horario.activo ? 'Activo' : 'Inactivo'}</span>
                          </label>
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
      </div>
    </div>
  )
}