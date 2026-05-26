import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

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
    checkUser()
    fetchAppointments()
    fetchTestimonials()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      navigate('/login')
    }
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
    if (confirm('¿Eliminar esta cita?')) {
      await supabase.from('appointments').delete().eq('id', id)
      fetchAppointments()
    }
  }

  const approveTestimonial = async (id: number) => {
    await supabase
      .from('testimonials')
      .update({ is_approved: true })
      .eq('id', id)
    fetchTestimonials()
  }

  const deleteTestimonial = async (id: number) => {
    if (confirm('¿Eliminar esta opinión?')) {
      await supabase.from('testimonials').delete().eq('id', id)
      fetchTestimonials()
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const getServiceLabel = (type: string) => {
    const services: Record<string, string> = {
      basico: '🚗 Lavado Básico',
      completo: '✨ Lavado Completo',
      encerado: '🌟 Encerado',
      tapizado: '🧼 Tapizado'
    }
    return services[type] || type
  }

  const getVehicleLabel = (type: string) => {
    const vehicles: Record<string, string> = {
      carro: '🚗 Carro',
      moto: '🏍️ Moto',
      camioneta: '🚐 Camioneta'
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
          padding: 1.5rem;
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
          padding: 1rem;
          background: linear-gradient(135deg, #0f1e3a, #0a0e1a);
          color: rgba(255, 255, 255, 0.9);
          font-weight: 600;
          font-size: 0.85rem;
          letter-spacing: 0.05em;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        
        .admin-table td {
          padding: 1rem;
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
          padding: 0.75rem 1rem 0.75rem 2.5rem;
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
          padding: 1.25rem;
          text-align: center;
          transition: all 0.3s;
        }
        
        .stat-card:hover {
          border-color: rgba(14, 184, 208, 0.4);
          transform: translateY(-3px);
        }
        
        .tab-active {
          background: linear-gradient(135deg, #1a6fd4, #0eb8d0);
          color: white;
          box-shadow: 0 4px 12px rgba(14, 184, 208, 0.3);
        }
        
        .tab-inactive {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.6);
        }
        
        .tab-inactive:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }
      `}</style>

      <div className="admin-root">
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* CABECERA */}
          <div className="admin-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', background: 'linear-gradient(135deg, #fff, #0eb8d0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                📋 Panel de Administración
              </h1>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <a 
                  href="/" 
                  className="btn-primary"
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  🏠 Volver al inicio
                </a>
                <button 
                  onClick={handleLogout} 
                  className="btn-danger"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  🔒 Cerrar Sesión
                </button>
              </div>
            </div>
          </div>

          {/* TABS */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <button
              onClick={() => setActiveTab('citas')}
              style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', fontWeight: '600', transition: 'all 0.2s', cursor: 'pointer', border: 'none' }}
              className={activeTab === 'citas' ? 'tab-active' : 'tab-inactive'}
            >
              📅 Citas ({appointments.length})
            </button>
            <button
              onClick={() => setActiveTab('testimonios')}
              style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', fontWeight: '600', transition: 'all 0.2s', cursor: 'pointer', border: 'none' }}
              className={activeTab === 'testimonios' ? 'tab-active' : 'tab-inactive'}
            >
              ⭐ Opiniones {pendingTestimonials.length > 0 && `(${pendingTestimonials.length} pendientes)`}
            </button>
          </div>

          {/* CONTENIDO DE CITAS */}
          {activeTab === 'citas' && (
            <>
              {/* ESTADÍSTICAS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="stat-card">
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0eb8d0' }}>{stats.total}</p>
                  <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>📊 Total Citas</p>
                </div>
                <div className="stat-card">
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#34d399' }}>{stats.hoy}</p>
                  <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>📅 Citas Hoy</p>
                </div>
                <div className="stat-card">
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>{stats.proximas}</p>
                  <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>⏳ Próximas Citas</p>
                </div>
              </div>

              {/* BUSCADOR */}
              <div className="admin-card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'rgba(255,255,255,0.4)' }}>🔍</div>
                  <input
                    type="text"
                    placeholder="Buscar por nombre, teléfono o vehículo..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="search-input"
                  />
                </div>
              </div>

              {/* TABLA DE CITAS */}
              <div className="admin-card" style={{ overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>👤 Cliente</th>
                        <th>📞 Teléfono</th>
                        <th>🚗 Vehículo</th>
                        <th>🔧 Modelo</th>
                        <th>🛠️ Servicio</th>
                        <th>📅 Fecha</th>
                        <th>⏰ Hora</th>
                        <th style={{ textAlign: 'center' }}>⚙️ Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAppointments.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>No hay citas registradas</td>
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
                                <button onClick={() => deleteAppointment(apt.id)} className="btn-danger">🗑️ Eliminar</button>
                                <a
                                  href={`https://wa.me/${apt.customer_phone}?text=Hola%20${apt.customer_name}%2C%20tu%20cita%20del%20${formatDateDisplay(apt.appointment_date)}%20a%20las%20${convertTo12Hour(apt.appointment_time)}%20está%20confirmada.`}
                                  target="_blank"
                                  className="btn-success"
                                  style={{ textDecoration: 'none' }}
                                >
                                  💬 WhatsApp
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

          {/* CONTENIDO DE TESTIMONIOS */}
          {activeTab === 'testimonios' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Pendientes */}
              <div className="admin-card" style={{ padding: '1.5rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#f59e0b' }}>⏳ Opiniones Pendientes ({pendingTestimonials.length})</h2>
                {pendingTestimonials.length === 0 ? (
                  <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '1rem' }}>No hay opiniones pendientes de aprobación</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {pendingTestimonials.map((t) => (
                      <div key={t.id} style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '12px', padding: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div>
                            <p style={{ fontWeight: '600' }}>{t.customer_name}</p>
                            <div style={{ display: 'flex', color: '#f59e0b', fontSize: '0.8rem', margin: '0.25rem 0' }}>
                              {'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}
                            </div>
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>"{t.comment}"</p>
                            <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.5rem' }}>{formatDateLong(t.created_at)}</p>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => approveTestimonial(t.id)} className="btn-success">✅ Aprobar</button>
                            <button onClick={() => deleteTestimonial(t.id)} className="btn-danger">🗑️ Eliminar</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Aprobados */}
              <div className="admin-card" style={{ padding: '1.5rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#34d399' }}>✅ Opiniones Aprobadas ({approvedTestimonials.length})</h2>
                {approvedTestimonials.length === 0 ? (
                  <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '1rem' }}>No hay opiniones aprobadas aún</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {approvedTestimonials.map((t) => (
                      <div key={t.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div>
                            <p style={{ fontWeight: '600' }}>{t.customer_name}</p>
                            <div style={{ display: 'flex', color: '#f59e0b', fontSize: '0.8rem', margin: '0.25rem 0' }}>
                              {'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}
                            </div>
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>"{t.comment}"</p>
                            <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.5rem' }}>{formatDateLong(t.created_at)}</p>
                          </div>
                          <button onClick={() => deleteTestimonial(t.id)} className="btn-danger">🗑️ Eliminar</button>
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