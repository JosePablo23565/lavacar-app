import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import '../css/AppointmentForm.css'

type Appointment = {
  id: number
  customer_name: string
  customer_phone: string
  service_type: string
  vehicle_type: string
  vehicle_model: string
  appointment_date: string
  appointment_time: string
  notes: string
  created_at: string
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

// Componente Select personalizado con efecto burbuja
interface CustomSelectProps {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder: string
  label?: string
  required?: boolean
}

function CustomSelect({ value, onChange, options, placeholder, label }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const selectRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(opt => opt.value === value)

  const handleToggle = () => {
    if (isOpen) {
      setIsAnimating(true)
      setTimeout(() => {
        setIsOpen(false)
        setIsAnimating(false)
      }, 200)
    } else {
      setIsOpen(true)
    }
  }

  const handleSelect = (optValue: string) => {
    onChange(optValue)
    setIsAnimating(true)
    setTimeout(() => {
      setIsOpen(false)
      setIsAnimating(false)
    }, 200)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        if (isOpen) {
          setIsAnimating(true)
          setTimeout(() => {
            setIsOpen(false)
            setIsAnimating(false)
          }, 200)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  return (
    <div ref={selectRef} style={{ position: 'relative', width: '100%' }}>
      {label && <label className="af-label">{label}</label>}
      
      <div
        className={`custom-select-trigger ${isOpen ? 'open' : ''} ${isAnimating ? 'closing' : ''}`}
        onClick={handleToggle}
      >
        <span className="custom-select-value">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="custom-select-arrow">▼</span>
      </div>

      {isOpen && (
        <div className={`custom-select-options ${isAnimating ? 'fade-out' : 'fade-in'}`}>
          {options.map((opt) => (
            <div
              key={opt.value}
              className={`custom-select-option ${value === opt.value ? 'selected' : ''}`}
              onClick={() => handleSelect(opt.value)}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function AppointmentForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const [step, setStep] = useState<'form' | 'history'>('form')
  const [animating, setAnimating] = useState(false)
  const [menuAbiertoGlobal, setMenuAbiertoGlobal] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [perfil, setPerfil] = useState({ nombre: '', telefono: '' })
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [horarios, setHorarios] = useState<Horario[]>([])
  
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    service_type: '',
    vehicle_type: '',
    vehicle_model: '',
    appointment_date: '',
    appointment_time: '',
    notes: '',
  })
  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  const [customerHistory, setCustomerHistory] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [phoneToSearch, setPhoneToSearch] = useState('')
  const [successData, setSuccessData] = useState<{
    show: boolean; name: string; date: string; time: string; service: string; vehicleType: string; vehicleModel: string; notes: string
  }>({ show: false, name: '', date: '', time: '', service: '', vehicleType: '', vehicleModel: '', notes: '' })

  const services = [
    { value: 'basico', label: 'Lavado Básico', price: '$10', duration: 30 },
    { value: 'completo', label: 'Lavado Completo', price: '$20', duration: 45 },
    { value: 'encerado', label: 'Encerado + Lavado', price: '$35', duration: 60 },
    { value: 'tapizado', label: 'Limpieza de Tapizado', price: '$25', duration: 40 },
  ]

  const vehicleTypes = [
    { value: 'carro', label: 'Carro' },
    { value: 'moto', label: 'Moto' },
    { value: 'camioneta', label: 'Camioneta / SUV' },
  ]

  // Cargar horarios desde Supabase
  useEffect(() => {
    const fetchHorarios = async () => {
      const { data } = await supabase
        .from('horarios')
        .select('*')
        .order('dia_semana', { ascending: true })
      setHorarios(data || [])
    }
    fetchHorarios()
  }, [])

  // Verificar autenticación al cargar
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Debes iniciar sesión para agendar una cita')
        navigate('/acceder')
      }
    }
    checkAuth()
  }, [navigate])

  // Obtener usuario logueado
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email || '')
        setUserId(user.id)
      }
    }
    getUser()
  }, [])

  // Cargar perfil del usuario logueado
  useEffect(() => {
    const cargarPerfil = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('perfiles')
          .select('nombre, telefono')
          .eq('id', user.id)
          .single()
        
        if (data) {
          setPerfil(data)
          setFormData(prev => ({
            ...prev,
            customer_name: data.nombre || '',
            customer_phone: data.telefono || ''
          }))
        }
      }
    }
    cargarPerfil()
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const servicio = params.get('servicio')
    if (servicio && ['basico', 'completo', 'encerado', 'tapizado'].includes(servicio)) {
      setFormData(prev => ({ ...prev, service_type: servicio }))
    }
  }, [location])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const tab = params.get('tab')
    if (tab === 'history') {
      setStep('history')
    }
  }, [location])

  useEffect(() => {
    const handleMenuChange = () => {
      const overlay = document.querySelector('.menu-overlay')
      setMenuAbiertoGlobal(!!overlay && window.getComputedStyle(overlay).opacity !== '0')
    }
    
    const observer = new MutationObserver(handleMenuChange)
    observer.observe(document.body, { attributes: true, childList: true, subtree: true })
    
    const interval = setInterval(handleMenuChange, 500)
    
    return () => {
      observer.disconnect()
      clearInterval(interval)
    }
  }, [])

  const handleStepChange = (newStep: 'form' | 'history') => {
    if (newStep === step) return
    setAnimating(true)
    setTimeout(() => { setStep(newStep); setTimeout(() => setAnimating(false), 100) }, 200)
  }

  const convertTo24Hour = (time12h: string) => {
    const [time, modifier] = time12h.split(' ')
    let [hours, minutes] = time.split(':')
    if (modifier === 'PM' && hours !== '12') hours = String(parseInt(hours) + 12)
    if (modifier === 'AM' && hours === '12') hours = '00'
    return `${hours}:${minutes}:00`
  }

  const convertTo12Hour = (time24h: string) => {
    const [hours, minutes] = time24h.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12.toString().padStart(2, '0')}:${minutes} ${ampm}`
  }

  // Generar horarios según inicio, fin e intervalo
  const generateTimeSlots = (start12h: string, end12h: string, intervalMinutes: number): string[] => {
    const slots: string[] = []
    
    // Si no está activo o es domingo, retornar vacío
    if (!start12h || !end12h || start12h === '00:00 AM' || end12h === '00:00 AM') {
      return slots
    }
    
    const start24h = convertTo24Hour(start12h)
    const end24h = convertTo24Hour(end12h)
    
    let [startHour, startMinute] = start24h.split(':').map(Number)
    let [endHour, endMinute] = end24h.split(':').map(Number)
    
    let current = new Date(2000, 0, 1, startHour, startMinute)
    const end = new Date(2000, 0, 1, endHour, endMinute)
    
    while (current <= end) {
      const hour = current.getHours()
      const minute = current.getMinutes()
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const hour12 = hour % 12 || 12
      const minuteStr = minute.toString().padStart(2, '0')
      slots.push(`${hour12}:${minuteStr} ${ampm}`)
      current.setMinutes(current.getMinutes() + intervalMinutes)
    }
    
    return slots
  }

  // Obtener horarios para un día específico
  const getHorariosPorDia = (diaSemana: number): string[] => {
    const horario = horarios.find(h => h.dia_semana === diaSemana)
    if (!horario || !horario.activo) {
      return []
    }
    return generateTimeSlots(horario.hora_inicio, horario.hora_fin, horario.intervalo_minutos)
  }

  useEffect(() => { 
    if (selectedDate) {
      fetchAvailableTimes()
    } else {
      setAvailableTimes([])
    }
  }, [selectedDate, horarios])

  const fetchAvailableTimes = async () => {
    if (!selectedDate) return
    
    const diaSemana = selectedDate.getDay() // 0=domingo, 1=lunes, etc.
    
    // Obtener horarios base según la configuración de la tabla horarios
    const horariosDelDia = getHorariosPorDia(diaSemana)
    
    if (horariosDelDia.length === 0) {
      setAvailableTimes([])
      return
    }
    
    const year = selectedDate.getFullYear()
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
    const day = String(selectedDate.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    
    const hoy = new Date()
    const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`
    
    const ahora = new Date()
    const horaActual = ahora.getHours()
    const minutosActual = ahora.getMinutes()
    
    // Obtener horas ya reservadas
    const { data } = await supabase
      .from('appointments')
      .select('appointment_time')
      .eq('appointment_date', dateStr)

    const bookedTimes24h = data?.map(a => a.appointment_time) || []
    const bookedTimes12h = bookedTimes24h.map(t => convertTo12Hour(t))
    
    // Filtrar horas ocupadas
    let available = horariosDelDia.filter(time => !bookedTimes12h.includes(time))
    
    // Si es hoy, filtrar horas pasadas
    if (dateStr === hoyStr) {
      available = available.filter(time => {
        const [horaStr, modifier] = time.split(' ')
        let [hora, minuto] = horaStr.split(':')
        let hora24 = parseInt(hora)
        
        if (modifier === 'PM' && hora24 !== 12) hora24 += 12
        if (modifier === 'AM' && hora24 === 12) hora24 = 0
        
        if (hora24 < horaActual) return false
        if (hora24 === horaActual && parseInt(minuto) <= minutosActual) return false
        return true
      })
    }
    
    setAvailableTimes(available)
    
    if (formData.appointment_time && !available.includes(formData.appointment_time)) {
      setFormData(prev => ({ ...prev, appointment_time: '' }))
    }
  }

  const fetchCustomerHistory = async (phone: string) => {
    const { data } = await supabase.from('appointments').select('*').eq('customer_phone', phone).order('appointment_date', { ascending: false })
    setCustomerHistory(data || [])
  }

  const handleDateChange = (date: Date) => {
    if (date.getDay() === 0) {
      alert('Los domingos estamos cerrados')
      return
    }
    
    const newDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    setSelectedDate(newDate)
    
    const year = newDate.getFullYear()
    const month = String(newDate.getMonth() + 1).padStart(2, '0')
    const day = String(newDate.getDate()).padStart(2, '0')
    
    setFormData(prev => ({ 
      ...prev, 
      appointment_date: `${year}-${month}-${day}`, 
      appointment_time: '' 
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedDate) {
      alert('Por favor seleccione una fecha')
      return
    }
    
    if (!formData.appointment_time) {
      alert('Por favor seleccioná una hora')
      return
    }
    
    const hoy = new Date()
    const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`
    const ahora = new Date()
    const horaActual = ahora.getHours()
    const minutosActual = ahora.getMinutes()
    
    if (formData.appointment_date === hoyStr) {
      const [horaStr, modifier] = formData.appointment_time.split(' ')
      let [hora, minuto] = horaStr.split(':')
      let hora24 = parseInt(hora)
      
      if (modifier === 'PM' && hora24 !== 12) hora24 += 12
      if (modifier === 'AM' && hora24 === 12) hora24 = 0
      
      if (hora24 < horaActual || (hora24 === horaActual && parseInt(minuto) <= minutosActual)) {
        alert('No puede agendar una cita en un horario que ya pasó')
        return
      }
    }
    
    setLoading(true)
    
    if (!userId || !userEmail) {
      alert('Error: No se pudo identificar al usuario. Por favor inicia sesión nuevamente.')
      setLoading(false)
      navigate('/acceder')
      return
    }
    
    const { error } = await supabase.from('appointments').insert([{ 
      ...formData, 
      appointment_time: convertTo24Hour(formData.appointment_time),
      email: userEmail,
      user_id: userId,
      notes: formData.notes || null
    }])
    
    if (error) {
      alert('Error: ' + error.message)
    } else {
      const svc = services.find((s) => s.value === formData.service_type)
      const veh = vehicleTypes.find((v) => v.value === formData.vehicle_type)
      setSuccessData({ 
        show: true, 
        name: formData.customer_name, 
        date: formData.appointment_date, 
        time: formData.appointment_time, 
        service: svc?.label || formData.service_type, 
        vehicleType: veh?.label || formData.vehicle_type, 
        vehicleModel: formData.vehicle_model,
        notes: formData.notes || ''
      })
      
      setSelectedDate(null)
      setFormData({ 
        customer_name: perfil.nombre,
        customer_phone: perfil.telefono,
        service_type: '', 
        vehicle_type: '', 
        vehicle_model: '', 
        appointment_date: '', 
        appointment_time: '',
        notes: ''
      })
      setAvailableTimes([])
      
      setTimeout(() => setSuccessData({ 
        show: false, name: '', date: '', time: '', service: '', vehicleType: '', vehicleModel: '', notes: ''
      }), 6000)
    }
    setLoading(false)
  }

  const selectedService = services.find((s) => s.value === formData.service_type)

  const formatDateDisplay = (date: string) => new Date(date).toLocaleDateString('es-CR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const formatDateSimple = (date: string) => new Date(date).toLocaleDateString('es-CR', { year: 'numeric', month: 'long', day: 'numeric' })

  // Función para deshabilitar fechas pasadas
  const isDateDisabled = (date: Date) => {
    const today = new Date()
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    
    if (compareDate < todayMidnight) return true
    if (date.getDay() === 0) return true
    
    return false
  }

  const getTileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month' && date.getDay() === 0) {
      return 'sunday-disabled'
    }
    return ''
  }

  // Fecha mínima para el calendario (hoy sin horas)
  const today = new Date()
  const minDateValue = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  return (
    <div className="af-root">
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div className={`af-tabs ${menuAbiertoGlobal ? 'menu-abierto' : ''}`} id="sticky-tabs">
          <button className={`af-tab${step === 'form' ? ' active' : ''}`} onClick={() => handleStepChange('form')}>
            Agendar Cita
          </button>
          <button className={`af-tab${step === 'history' ? ' active' : ''}`} onClick={() => handleStepChange('history')}>
            Mis Citas
          </button>
        </div>

        <div style={{ transition: 'all .3s', opacity: animating ? 0 : 1, transform: animating ? 'scale(.97)' : 'scale(1)' }}>
          {step === 'form' && (
            <div className="af-card">
              <div className="af-card-header">
                <h2>Agendar Cita</h2>
                <p>Complete los datos para reservar su espacio</p>
              </div>
              <div className="af-body">
                <form onSubmit={handleSubmit}>
                  <div className="af-row-compact">
                    <div className="af-compact-field">
                      <label className="af-label-compact">NOMBRE</label>
                      <p className="af-value-compact">{perfil.nombre || 'Cargando...'}</p>
                    </div>
                    <div className="af-compact-field">
                      <label className="af-label-compact">TELÉFONO</label>
                      <p className="af-value-compact">{perfil.telefono || 'Cargando...'}</p>
                    </div>
                  </div>

                  <div className="af-grid-2">
                    <div>
                      <CustomSelect
                        label="TIPO DE VEHÍCULO"
                        value={formData.vehicle_type}
                        onChange={(value) => setFormData({ ...formData, vehicle_type: value })}
                        options={vehicleTypes}
                        placeholder="Seleccione"
                      />
                    </div>
                    <div>
                      <label className="af-label">MARCA Y MODELO</label>
                      <input 
                        className="af-input" 
                        type="text" 
                        name="vehicle_model" 
                        value={formData.vehicle_model} 
                        onChange={(e) => {
                          const value = e.target.value
                          if (value.length <= 25) {
                            setFormData({ ...formData, vehicle_model: value })
                          }
                        }} 
                        required 
                        placeholder="Ej: Toyota Hilux"
                        maxLength={25}
                      />
                    </div>
                  </div>

                  <div className="af-field">
                    <CustomSelect
                      label="SERVICIO"
                      value={formData.service_type}
                      onChange={(value) => setFormData({ ...formData, service_type: value })}
                      options={services.map(s => ({ value: s.value, label: `${s.label} — ${s.price}` }))}
                      placeholder="Seleccione un servicio"
                    />
                    {selectedService && <p className="af-hint">Duración estimada: {selectedService.duration} minutos</p>}
                  </div>

                  <div className="af-field">
                    <label className="af-label">DETALLES DE LA CITA (OPCIONAL)</label>
                    <textarea
                      className="af-textarea"
                      rows={3}
                      placeholder="Ej: No va a llegar el dueño, lo va a llevar mi hermano(NOMBRE). O alguna observación importante..."
                      value={formData.notes}
                      onChange={(e) => {
                        if (e.target.value.length <= 100) {
                          setFormData({ ...formData, notes: e.target.value })
                        }
                      }}
                      maxLength={100}
                    />
                    <div className="af-hint" style={{ textAlign: 'right', marginTop: '0.25rem' }}>
                      {formData.notes.length}/100 caracteres
                    </div>
                  </div>

                  <span className="af-section-label">SELECCIONE LA FECHA</span>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <Calendar 
                      onChange={(date) => handleDateChange(date as Date)} 
                      value={selectedDate}
                      minDate={minDateValue}
                      tileDisabled={({ date }) => isDateDisabled(date)}
                      tileClassName={getTileClassName}
                      className="custom-calendar"
                    />
                  </div>

                  {!selectedDate && (
                    <p style={{ color: '#f87171', fontSize: '.88rem', textAlign: 'center', padding: '1rem 0' }}>
                      Seleccione una fecha para ver los horarios disponibles
                    </p>
                  )}

                  {selectedDate && (
                    <>
                      <span className="af-section-label">HORARIOS DISPONIBLES</span>
                      {availableTimes.length === 0 ? (
                        <p style={{ color: '#f87171', fontSize: '.88rem', textAlign: 'center', padding: '1rem 0' }}>
                          No hay horarios disponibles para este día
                        </p>
                      ) : (
                        <div className="af-time-grid">
                          {availableTimes.map((time) => (
                            <button 
                              key={time} 
                              type="button" 
                              className={`af-time-btn${formData.appointment_time === time ? ' sel' : ''}`} 
                              onClick={() => setFormData({ ...formData, appointment_time: time })}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  <button 
                    type="submit" 
                    className="af-submit" 
                    disabled={loading || !selectedDate || !formData.appointment_time || availableTimes.length === 0}
                  >
                    {loading ? (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem' }}>
                        <svg style={{ animation: 'spin 1s linear infinite', width: 18, height: 18 }} viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" fill="none" strokeDasharray="31" strokeDashoffset="10" />
                        </svg>
                        Agendando...
                      </span>
                    ) : 'AGENDAR CITA'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {step === 'history' && (
            <div className="af-card">
              <div className="af-card-header">
                <h2>Mis Citas</h2>
                <p>Consulte sus citas agendadas</p>
              </div>
              <div className="af-body">
                <div style={{ display: 'flex', gap: '.75rem', marginBottom: '1.5rem' }}>
                  <input 
                    className="af-input" 
                    type="tel" 
                    placeholder="Ingrese su número de teléfono" 
                    value={phoneToSearch} 
                    onChange={(e) => {
                      const onlyNumbers = e.target.value.replace(/[^0-9]/g, '')
                      if (onlyNumbers.length <= 8) {
                        setPhoneToSearch(onlyNumbers)
                      }
                    }} 
                    style={{ flex: 1 }} 
                    maxLength={8}
                  />
                  <button onClick={() => { if (phoneToSearch) { fetchCustomerHistory(phoneToSearch); setShowHistory(true) } }} className="af-buscar-btn">
                    Buscar
                  </button>
                </div>

                {showHistory && (
                  customerHistory.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 0', color: 'rgba(255,255,255,.4)' }}>
                      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                      <p>No hay citas registradas para ese número</p>
                    </div>
                  ) : (
                    <div>
                      {customerHistory.map((cita) => {
                        const svc = services.find((s) => s.value === cita.service_type)
                        const veh = vehicleTypes.find((v) => v.value === cita.vehicle_type)
                        return (
                          <div key={cita.id} className="af-history-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ marginBottom: '.5rem' }}>
                                  <span style={{ fontWeight: 600, fontSize: '.95rem', color: '#0eb8d0' }}>{svc?.label || cita.service_type}</span>
                                </div>
                                <p style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.5)', marginBottom: '.3rem' }}>
                                  {veh?.label || cita.vehicle_type} — {cita.vehicle_model}
                                </p>
                                <p style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.5)', marginBottom: '.2rem' }}>{formatDateDisplay(cita.appointment_date)}</p>
                                <p style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.5)' }}>{convertTo12Hour(cita.appointment_time)}</p>
                                {cita.notes && (
                                  <p style={{ fontSize: '.75rem', color: '#0eb8d0', marginTop: '.5rem', fontStyle: 'italic', background: 'rgba(14,184,208,0.1)', padding: '0.3rem 0.6rem', borderRadius: '12px' }}>
                                    {cita.notes}
                                  </p>
                                )}
                              </div>
                              <span className="af-confirmed">Confirmada</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {successData.show && (
        <div className="af-modal-overlay">
          <div className="af-modal">
            <div className="af-modal-icon">
              <svg width="32" height="32" fill="none" stroke="white" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 style={{ fontFamily: "'Sora',sans-serif", textAlign: 'center', fontSize: '1.3rem', marginBottom: '.4rem', color: '#fff' }}>Cita Agendada</h2>
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,.45)', fontSize: '.85rem', marginBottom: '1.5rem' }}>Su cita fue confirmada exitosamente</p>

            <div style={{ background: 'rgba(255,255,255,.03)', borderRadius: 16, padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
              {[
                { k: 'Vehículo', v: `${successData.vehicleType} ${successData.vehicleModel}` },
                { k: 'Fecha', v: formatDateSimple(successData.date) },
                { k: 'Hora', v: successData.time },
                { k: 'Servicio', v: successData.service },
                ...(successData.notes ? [{ k: 'Detalles', v: successData.notes }] : [])
              ].map((row) => (
                <div key={row.k} className="af-modal-row">
                  <span className="af-modal-key">{row.k}</span>
                  <span className="af-modal-val">{row.v}</span>
                </div>
              ))}
            </div>

            <button onClick={() => setSuccessData({ show: false, name: '', date: '', time: '', service: '', vehicleType: '', vehicleModel: '', notes: '' })} style={{ width: '100%', padding: '1rem', background: 'linear-gradient(135deg, #0eb8d0, #0a8ca0)', color: '#fff', border: 'none', borderRadius: 14, fontWeight: 600, fontSize: '.9rem', cursor: 'pointer', fontFamily: "'Sora',sans-serif" }}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}