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
  created_at: string
}

type Testimonial = {
  id: number
  customer_name: string
  rating: number
  comment: string
  created_at: string
  is_approved: boolean
}

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'citas' | 'testimonios'>('citas')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState({ total: 0, hoy: 0, proximas: 0 })
  const navigate = useNavigate()

  useEffect(() => {
    checkAdminAndFetch()
  }, [])

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
  }

  const fetchAppointments = async () => {
    const { data } = await supabase
      .from('appointments')
      .select('*')
      .order('appointment_date', { ascending: true })
    
    const citas = data || []
    setAppointments(citas)
    
    const hoy = new Date().toISOString().split('T')[0]
    const ahora = new Date()
    const horaActual = `${ahora.getHours().toString().padStart(2, '0')}:${ahora.getMinutes().toString().padStart(2, '0')}:00`
    
    const proximas = citas.filter(c => {
      if (c.appointment_date > hoy) return true
      if (c.appointment_date === hoy && c.appointment_time >= horaActual) return true
      return false
    })
    
    setStats({
      total: citas.length,
      hoy: citas.filter(c => c.appointment_date === hoy).length,
      proximas: proximas.length
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
    return new Date(date).toLocaleDateString('es-CR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatDateLong = (date: string) => {
    return new Date(date).toLocaleDateString('es-CR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateCard = (date: string) => {
    return new Date(date).toLocaleDateString('es-CR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const filteredAppointments = appointments.filter(a =>
    a.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    a.customer_phone.includes(search) ||
    a.email?.toLowerCase().includes(search.toLowerCase()) ||
    a.vehicle_model?.toLowerCase().includes(search.toLowerCase())
  )

  const pendingTestimonials = testimonials.filter(t => !t.is_approved)
  const approvedTestimonials = testimonials.filter(t => t.is_approved)

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="text-xl text-gray-300">Cargando...</div>
    </div>
  )

  return (
    <>

      <div className="admin-root">
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

          {/* TABS MODERNOS */}
          <div className="af-tabs">
            <button
              onClick={() => setActiveTab('citas')}
              className={`af-tab ${activeTab === 'citas' ? 'active' : ''}`}
            >
              Citas ({appointments.length})
            </button>
            <button
              onClick={() => setActiveTab('testimonios')}
              className={`af-tab ${activeTab === 'testimonios' ? 'active' : ''}`}
            >
              Opiniones {pendingTestimonials.length > 0 && `(${pendingTestimonials.length} pendientes)`}
            </button>
          </div>

          {/* CONTENIDO DE CITAS */}
          {activeTab === 'citas' && (
            <>
              {/* ESTADÍSTICAS */}
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

              {/* BUSCADOR */}
              <div className="search-bare">
                <span className="search-bare-icon">🔍</span>
                <input
                  type="text"
                  placeholder="nombre, teléfono, correo o vehículo..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* VISTA EN TARJETAS (MÓVIL) */}
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
                          <a
                            href={`https://wa.me/${apt.customer_phone}?text=Hola%20${apt.customer_name}%2C%20tu%20cita%20del%20${formatDateDisplay(apt.appointment_date)}%20a%20las%20${convertTo12Hour(apt.appointment_time)}%20está%20confirmada.`}
                            target="_blank"
                            className="text-green-400 hover:text-green-300 text-lg px-2 py-1 transition"
                          >
                            💬
                          </a>
                        </div>
                      </div>
                      <div className="space-y-2.5 text-sm">
                        <div className="flex">
                          <span className="text-white/40 w-24">Vehículo:</span>
                          <span className="text-white/80">{getVehicleLabel(apt.vehicle_type)}</span>
                        </div>
                        <div className="flex">
                          <span className="text-white/40 w-24">Modelo:</span>
                          <span className="text-white/80">{apt.vehicle_model || '—'}</span>
                        </div>
                        <div className="flex">
                          <span className="text-white/40 w-24">Servicio:</span>
                          <span className="text-white/80">{getServiceLabel(apt.service_type)}</span>
                        </div>
                        <div className="flex">
                          <span className="text-white/40 w-24">Fecha y hora:</span>
                          <span className="text-white/80">{formatDateCard(apt.appointment_date)} · {convertTo12Hour(apt.appointment_time)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* VISTA EN TABLA (ESCRITORIO) */}
              <div className="hidden md:block admin-card" style={{ overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Cliente</th>
                        <th>Teléfono</th>
                        <th>Correo</th>
                        <th>Vehículo</th>
                        <th>Modelo</th>
                        <th>Servicio</th>
                        <th>Fecha</th>
                        <th>Hora</th>
                        <th style={{ textAlign: 'center' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAppointments.length === 0 ? (
                        <tr>
                          <td colSpan={9} style={{ textAlign: 'center', padding: '2.5rem', color: 'rgba(255,255,255,0.4)' }}>No hay citas registradas</td>
                        </tr>
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
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                <button onClick={() => deleteAppointment(apt.id)} className="btn-danger">🗑️</button>
                                <a href={`https://wa.me/${apt.customer_phone}?text=Hola%20${apt.customer_name}%2C%20tu%20cita%20del%20${formatDateDisplay(apt.appointment_date)}%20a%20las%20${convertTo12Hour(apt.appointment_time)}%20está%20confirmada.`} target="_blank" className="btn-success">💬</a>
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

          {/* CONTENIDO DE TESTIMONIOS */}
          {activeTab === 'testimonios' && (
            <div className="space-y-6">
              <div className="admin-card" style={{ padding: '1.75rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1.25rem', color: '#94a3b8', letterSpacing: '0.05em' }}>Opiniones Pendientes ({pendingTestimonials.length})</h2>
                {pendingTestimonials.length === 0 ? (
                  <p style={{ color: '#64748b', textAlign: 'center', padding: '2.5rem' }}>No hay opiniones pendientes de aprobación</p>
                ) : (
                  <div className="space-y-4">
                    {pendingTestimonials.map((t) => (
                      <div key={t.id} className="bg-[#1e293b] border border-[#334155] rounded-lg p-5">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                              <p className="font-semibold text-white">{t.customer_name}</p>
                              <div className="flex text-yellow-500 text-sm">{'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}</div>
                            </div>
                            <p className="text-gray-300 text-sm italic mb-3">"{t.comment}"</p>
                            <p className="text-gray-500 text-xs">{formatDateLong(t.created_at)}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => approveTestimonial(t.id)} className="bg-green-700 hover:bg-green-600 text-green-200 text-xs px-3 py-1.5 rounded transition">Aprobar</button>
                            <button onClick={() => deleteTestimonial(t.id)} className="bg-red-900 hover:bg-red-800 text-red-300 text-xs px-3 py-1.5 rounded transition">Eliminar</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="admin-card" style={{ padding: '1.75rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1.25rem', color: '#94a3b8', letterSpacing: '0.05em' }}>Opiniones Aprobadas ({approvedTestimonials.length})</h2>
                {approvedTestimonials.length === 0 ? (
                  <p style={{ color: '#64748b', textAlign: 'center', padding: '2.5rem' }}>No hay opiniones aprobadas aún</p>
                ) : (
                  <div className="space-y-4">
                    {approvedTestimonials.map((t) => (
                      <div key={t.id} className="bg-[#1e293b] border border-[#334155] rounded-lg p-5">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                              <p className="font-semibold text-white">{t.customer_name}</p>
                              <div className="flex text-yellow-500 text-sm">{'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}</div>
                            </div>
                            <p className="text-gray-300 text-sm italic mb-3">"{t.comment}"</p>
                            <p className="text-gray-500 text-xs">{formatDateLong(t.created_at)}</p>
                          </div>
                          <button onClick={() => deleteTestimonial(t.id)} className="bg-red-900 hover:bg-red-800 text-red-300 text-xs px-3 py-1.5 rounded transition">Eliminar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}