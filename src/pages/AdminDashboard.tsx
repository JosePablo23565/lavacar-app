import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { swalConfirm, swalSuccess, swalError } from '../utils/swalConfig'


type Appointment = {
  id: number
  customer_name: string
  customer_phone: string
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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/acceder')
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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600&family=DM+Sans:wght@400;500&display=swap');
        
        .admin-root {
          font-family: 'DM Sans', sans-serif;
          background: linear-gradient(135deg, #0a0e1a 0%, #0f1e3a 60%, #0a0e1a 100%);
          min-height: 100vh;
          padding: 2rem;
        }
        
        .admin-card {
          background: #111827;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          transition: all 0.3s ease;
        }
        
        .admin-card:hover {
          border-color: rgba(14, 184, 208, 0.3);
        }
        
        .admin-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .admin-table th {
          text-align: left;
          padding: 1.1rem 1.25rem;
          background: linear-gradient(135deg, #0f1e3a, #0a0e1a);
          color: rgba(255, 255, 255, 0.9);
          font-weight: 600;
          font-size: 0.85rem;
          letter-spacing: 0.05em;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        
        .admin-table td {
          padding: 1.1rem 1.25rem;
          color: rgba(255, 255, 255, 0.8);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .admin-table tr:hover td {
          background: rgba(14, 184, 208, 0.05);
        }
        
        .badge-blue {
          background: rgba(14, 184, 208, 0.15);
          color: #0eb8d0;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 500;
        }
        
        .badge-green {
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 500;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #1a6fd4, #0eb8d0);
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }
        
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(14, 184, 208, 0.3);
        }
        
        .btn-danger {
          background: rgba(239, 68, 68, 0.2);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.3);
          padding: 0.4rem 0.8rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.8rem;
          transition: all 0.2s;
        }
        
        .btn-danger:hover {
          background: rgba(239, 68, 68, 0.4);
          color: #ff9e9e;
        }
        
        .btn-success {
          background: rgba(16, 185, 129, 0.2);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.3);
          padding: 0.4rem 0.8rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.8rem;
          transition: all 0.2s;
        }
        
        .btn-success:hover {
          background: rgba(16, 185, 129, 0.4);
          color: #6ee7b7;
        }
        
        .search-input {
          width: 100%;
          padding: 1rem 1rem 1rem 2.5rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: white;
          outline: none;
          transition: all 0.2s;
        }
        
        .search-input:focus {
          border-color: #0eb8d0;
          box-shadow: 0 0 0 3px rgba(14, 184, 208, 0.15);
        }
        
        .search-input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }
        
        .stat-card {
          background: #111827;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 1.5rem;
          text-align: center;
          transition: all 0.2s;
        }
        
        .stat-card:hover {
          border-color: rgba(14, 184, 208, 0.3);
          transform: translateY(-2px);
        }
        
        .stat-number {
          font-size: 2rem;
          font-weight: bold;
          color: #0eb8d0;
          margin: 0;
        }
        
        .stat-label {
          font-size: 0.7rem;
          color: #94a3b8;
          margin: 0.35rem 0 0 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        /* TABS MODERNOS - MISMO ESTILO QUE AppointmentForm */
        .af-tabs {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 2rem;
          background: rgba(10, 14, 26, 0.3);
          backdrop-filter: blur(16px);
          border-radius: 20px;
          padding: 0.5rem;
          border: 1px solid rgba(14, 184, 208, 0.2);
        }
        
        .af-tab {
          flex: 1;
          padding: 0.75rem;
          border-radius: 14px;
          font-weight: 500;
          font-size: 0.9rem;
          cursor: pointer;
          border: none;
          transition: all 0.3s ease;
          font-family: 'Inter', sans-serif;
          background: transparent;
          color: rgba(255, 255, 255, 0.6);
          text-align: center;
        }
        
        .af-tab.active {
          background: linear-gradient(135deg, rgba(14, 184, 208, 0.2), rgba(14, 184, 208, 0.1));
          color: #0eb8d0;
          border: 1px solid rgba(14, 184, 208, 0.3);
          transform: translateY(-2px);
        }
        
        .af-tab:not(.active):hover {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.9);
        }
        
        .stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 1.5rem;
        }

        .stat-pill {
          background: #111827;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          padding: 1.1rem 0.75rem;
          text-align: center;
        }

        .stat-pill-num {
          font-size: 1.8rem;
          font-weight: 700;
          line-height: 1;
          margin-bottom: 6px;
        }

        .stat-pill-label {
          font-size: 0.68rem;
          color: rgba(255,255,255,0.4);
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }

        .search-bare {
          position: relative;
          margin-bottom: 1.5rem;
        }

        .search-bare-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255,255,255,0.3);
          font-size: 15px;
          pointer-events: none;
        }

        .search-bare input {
          width: 100%;
          background: #111827;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          color: white;
          font-size: 0.875rem;
          padding: 0.75rem 1rem 0.75rem 2.6rem;
          outline: none;
          transition: border-color 0.2s;
        }

        .search-bare input:focus {
          border-color: rgba(14,184,208,0.5);
        }

        .search-bare input::placeholder {
          color: rgba(255,255,255,0.25);
        }
        
        .cita-card {
          background: #111827;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 1.25rem;
          transition: all 0.2s;
        }
        
        .cita-card:hover {
          border-color: rgba(14, 184, 208, 0.3);
        }


      `}</style>

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
                  placeholder="nombre, teléfono o vehículo..."
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
                          <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'rgba(255,255,255,0.4)' }}>No hay citas registradas</td>
                        </tr>
                      ) : (
                        filteredAppointments.map((apt) => (
                          <tr key={apt.id}>
                            <td style={{ fontWeight: '500' }}>{apt.customer_name}</td>
                            <td>{apt.customer_phone}</td>
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