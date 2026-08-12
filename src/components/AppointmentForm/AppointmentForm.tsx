import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { swalConfirm, swalSuccess, swalError, swalAviso } from '../../utils/swalConfig'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { whatsappNegocioUrl } from '../../lib/ubicacion'
import './AppointmentForm.css'

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
  const [diasCerrados, setDiasCerrados] = useState<string[]>([])
  
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
  // Cita vigente del cliente: mientras exista, no puede agendar otra
  const [citaActiva, setCitaActiva] = useState<Appointment | null>(null)
  const [customerHistory, setCustomerHistory] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)
  const [cargandoCitas, setCargandoCitas] = useState(false)
  const [successData, setSuccessData] = useState<{
    show: boolean; name: string; date: string; time: string; service: string; vehicleType: string; vehicleModel: string; notes: string
  }>({ show: false, name: '', date: '', time: '', service: '', vehicleType: '', vehicleModel: '', notes: '' })

  const services = [
    { value: 'basico', label: 'Lavado y Aspirado', price: '$10', duration: 30 },
    { value: 'completo', label: 'Lavado prémium', price: '$20', duration: 45 },
    { value: 'encerado', label: 'Full Prémium', price: '$35', duration: 60 },
    { value: 'tapizado', label: 'Pulido de Focos', price: '$25', duration: 40 },
    { value: 'parabrisas', label: 'Pulido de Parabrisas', price: '$15', duration: 25 },
    { value: 'ceramico', label: 'Tratamiento Cerámico', price: '$50', duration: 90 },
  ]

  const vehicleTypes = [
    { value: 'carro', label: 'Carro' },
    { value: 'moto', label: 'Moto' },
    { value: 'camioneta', label: 'Camioneta / SUV' },
  ]

  // Vehículos que se pueden atender en la misma hora.
  // El límite de verdad lo aplica la base de datos (función crear_cita);
  // acá solo sirve para no mostrar horas que ya están llenas.
  const CUPOS_POR_HORA = 2

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

  // Cargar los días que el negocio cerró (fechas específicas)
  const recargarDiasCerrados = async () => {
    const hoyLocal = new Date()
    const hoy = `${hoyLocal.getFullYear()}-${String(hoyLocal.getMonth() + 1).padStart(2, '0')}-${String(hoyLocal.getDate()).padStart(2, '0')}`

    const { data } = await supabase
      .from('dias_cerrados')
      .select('fecha')
      .gte('fecha', hoy)

    setDiasCerrados((data || []).map(d => d.fecha))
  }

  useEffect(() => {
    recargarDiasCerrados()
  }, [])

  // La base de datos dice si el cliente ya tiene una cita vigente
  const cargarCitaActiva = async () => {
    const { data } = await supabase.rpc('mi_cita_activa')
    const cita = Array.isArray(data) ? data[0] : data

    // Cuando no hay cita, la base puede devolver un objeto con todos los
    // campos vacíos en vez de nada. Eso no es una cita: si lo diéramos por
    // bueno, al pintar la fecha y la hora reventaría la pantalla.
    const esCitaReal = !!(cita && cita.id && cita.appointment_date && cita.appointment_time)
    setCitaActiva(esCitaReal ? cita : null)
  }

  useEffect(() => {
    cargarCitaActiva()
  }, [])

  // Las citas se cargan solas apenas se sabe quién es el cliente,
  // y se refrescan al entrar a la pestaña "Mis Citas"
  useEffect(() => {
    if (userId) fetchCustomerHistory()
  }, [userId, step])

  // Verificar autenticación al cargar
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        await swalAviso('Iniciá sesión', 'Necesitás una cuenta para agendar una cita.')
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

  // Mostrar el formulario desde arriba al entrar (ej: al tocar un servicio en Home)
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const servicio = params.get('servicio')
    if (servicio && services.some(s => s.value === servicio)) {
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

  // Deja cualquier hora en "HH:MM" de 24 horas ("9:00 AM", "09:00 AM"
  // y "09:00:00" terminan igual), para poder compararlas sin errores.
  const normalizarHora = (hora: string) => {
    if (!hora) return ''
    const m = hora.trim().toUpperCase().match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/)
    if (!m) return hora.trim().toUpperCase()
    let h = parseInt(m[1], 10)
    if (m[3] === 'PM' && h !== 12) h += 12
    if (m[3] === 'AM' && h === 12) h = 0
    return `${String(h).padStart(2, '0')}:${m[2]}`
  }

  const convertTo12Hour = (time24h: string) => {
    if (!time24h) return ''
    const [hours, minutes] = time24h.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12.toString().padStart(2, '0')}:${minutes} ${ampm}`
  }

  // Generar horarios según inicio, fin e intervalo
  const generateTimeSlots = (start12h: string, end12h: string, intervalMinutes: number): string[] => {
    const slots: string[] = []
    
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
    
    const diaSemana = selectedDate.getDay()
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
    
    // Cuántos vehículos hay reservados en cada hora de ese día
    const { data } = await supabase.rpc('cupos_ocupados', { p_fecha: dateStr })

    // Se comparan las horas ya normalizadas: la lista de horarios usa
    // "9:00 AM" y la base devuelve "09:00:00", que como texto no coinciden.
    const ocupadosPorHora = new Map<string, number>()
    for (const fila of (data || []) as { hora: string; ocupados: number }[]) {
      ocupadosPorHora.set(normalizarHora(fila.hora), Number(fila.ocupados))
    }

    // Una hora sigue disponible mientras no llegue al máximo de vehículos
    let available = horariosDelDia.filter(
      time => (ocupadosPorHora.get(normalizarHora(time)) || 0) < CUPOS_POR_HORA
    )
    
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

  // Las citas del cliente que tiene la sesión abierta. No se pide el
  // teléfono: se sabe quién es por su sesión, y la base de datos solo
  // le deja ver las suyas.
  const fetchCustomerHistory = async () => {
    if (!userId) return
    setCargandoCitas(true)

    const { data } = await supabase
      .from('appointments')
      .select('*')
      .eq('user_id', userId)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true })

    const citas = data || []

    // Mostrar SOLO las citas pendientes (las que ya pasaron se ocultan)
    const hoyLocal = new Date()
    const year = hoyLocal.getFullYear()
    const month = String(hoyLocal.getMonth() + 1).padStart(2, '0')
    const day = String(hoyLocal.getDate()).padStart(2, '0')
    const hoy = `${year}-${month}-${day}`

    const horaActual = `${hoyLocal.getHours().toString().padStart(2, '0')}:${hoyLocal.getMinutes().toString().padStart(2, '0')}:00`

    const citasPendientes = citas.filter(c => {
      if (c.appointment_date > hoy) return true
      if (c.appointment_date === hoy && c.appointment_time >= horaActual) return true
      return false
    })

    setCustomerHistory(citasPendientes)
    setCargandoCitas(false)
  }

  const eliminarCita = async (cita: Appointment) => {
    const result = await swalConfirm(
      '¿Seguro de eliminar esta cita?',
      'El espacio quedará disponible para otro cliente. Esta acción no se puede deshacer.'
    )

    if (!result.isConfirmed) return

    // El .select() devuelve lo que realmente se borró: si la cita no es
    // del cliente, la base no la toca y vuelve vacío, sin dar error.
    const { data: borradas, error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', cita.id)
      .select()

    if (error) {
      swalError('Error', 'No se pudo eliminar la cita')
      return
    }

    if (!borradas || borradas.length === 0) {
      swalError('No se pudo eliminar', 'Esa cita no es tuya, así que no podés eliminarla.')
      return
    }

    swalSuccess('Cita eliminada', 'El horario quedó disponible nuevamente')

    // Refrescar la lista y liberar el horario en el calendario
    await fetchCustomerHistory()
    await fetchAvailableTimes()
  }

  const handleDateChange = (date: Date) => {
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

    if (!formData.vehicle_type) {
      swalAviso('Falta el tipo de vehículo', 'Seleccioná si es carro, moto o camioneta.')
      return
    }

    if (!formData.vehicle_model.trim()) {
      swalAviso('Falta la marca y modelo', 'Escribí la marca y el modelo del vehículo.')
      return
    }

    if (!formData.service_type) {
      swalAviso('Falta el servicio', 'Elegí el servicio que querés para tu vehículo.')
      return
    }

    if (!selectedDate) {
      swalAviso('Falta la fecha', 'Elegí en el calendario el día de tu cita.')
      return
    }

    if (!formData.appointment_time) {
      swalAviso('Falta la hora', 'Elegí uno de los horarios disponibles.')
      return
    }

    if (diasCerrados.includes(formData.appointment_date)) {
      swalAviso('Ese día está cerrado', 'El negocio no abrirá ese día. Por favor elegí otra fecha.')
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
        swalAviso('Ese horario ya pasó', 'Elegí una hora que todavía no haya llegado.')
        return
      }
    }
    
    setLoading(true)
    
    if (!userId || !userEmail) {
      await swalError('No pudimos identificarte', 'Iniciá sesión de nuevo para agendar tu cita.')
      setLoading(false)
      navigate('/acceder')
      return
    }
    
    // La reserva la hace la base de datos: ahí se revisa el cupo y el día
    // cerrado dentro de una misma operación, para que dos personas no
    // puedan tomar el último espacio al mismo tiempo.
    const { error } = await supabase.rpc('crear_cita', {
      p_customer_name: formData.customer_name,
      p_customer_phone: formData.customer_phone,
      p_service_type: formData.service_type,
      p_vehicle_type: formData.vehicle_type,
      p_vehicle_model: formData.vehicle_model,
      p_appointment_date: formData.appointment_date,
      p_appointment_time: convertTo24Hour(formData.appointment_time),
      p_notes: formData.notes || null,
      p_email: userEmail,
      p_user_id: userId,
    })

    if (error) {
      const motivo = error.message || ''

      if (motivo.includes('CUPO_LLENO')) {
        await swalAviso(
          'Ese cupo se acaba de ocupar',
          'Otro cliente reservó ese espacio justo ahora. Por favor elegí otra de las horas disponibles.'
        )
        setFormData(prev => ({ ...prev, appointment_time: '' }))
        await fetchAvailableTimes()
      } else if (motivo.includes('DIA_CERRADO')) {
        await swalAviso(
          'Tu cita no se reservó',
          'El negocio acaba de cerrar ese día. Por favor agendá en otro de los días y horas disponibles.'
        )
        setFormData(prev => ({ ...prev, appointment_time: '', appointment_date: '' }))
        setSelectedDate(null)
        await recargarDiasCerrados()
      } else if (motivo.includes('FECHA_PASADA')) {
        await swalAviso('Esa fecha ya pasó', 'Por favor elegí una fecha próxima.')
        setFormData(prev => ({ ...prev, appointment_time: '', appointment_date: '' }))
        setSelectedDate(null)
      } else if (motivo.includes('NO_AUTORIZADO')) {
        await swalError('Tu sesión expiró', 'Iniciá sesión de nuevo para agendar tu cita.')
        navigate('/acceder')
      } else if (motivo.includes('YA_TIENE_CITA')) {
        await swalAviso(
          'Ya tenés una cita agendada',
          'Solo se puede tener una cita a la vez. Vas a poder agendar otra 2 horas después de la que ya tenés.'
        )
        await cargarCitaActiva()
      } else {
        await swalError('No se pudo agendar', motivo)
      }

      setLoading(false)
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
      
      // Se limpian los datos de la cita (el nombre y el teléfono del
      // perfil se mantienen, porque no los escribe el cliente)
      setFormData(prev => ({
        ...prev,
        service_type: '',
        vehicle_type: '',
        vehicle_model: '',
        appointment_date: '',
        appointment_time: '',
        notes: '',
      }))
      setSelectedDate(null)
      setAvailableTimes([])

      await cargarCitaActiva()
      
      setTimeout(() => setSuccessData({ 
        show: false, name: '', date: '', time: '', service: '', vehicleType: '', vehicleModel: '', notes: ''
      }), 6000)
    }
    setLoading(false)
  }

  const selectedService = services.find((s) => s.value === formData.service_type)

  // Formato de fecha con zona horaria
  const formatDateDisplay = (date: string) => {
    if (!date) return ''
    const d = new Date(date + 'T00:00:00')
    return d.toLocaleDateString('es-CR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      timeZone: 'America/Costa_Rica'
    })
  }

  // Formato de fecha simple con zona horaria
  const formatDateSimple = (date: string) => {
    if (!date) return ''
    const d = new Date(date + 'T00:00:00')
    return d.toLocaleDateString('es-CR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      timeZone: 'America/Costa_Rica'
    })
  }

  const toFechaStr = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

  const isDateDisabled = (date: Date) => {
    const today = new Date()
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    // Días pasados
    if (compareDate < todayMidnight) return true

    // Días deshabilitados desde la tabla horarios
    const diaSemana = date.getDay()
    const horario = horarios.find(h => h.dia_semana === diaSemana)
    if (!horario || !horario.activo) return true

    // Días cerrados por el negocio (fechas específicas)
    if (diasCerrados.includes(toFechaStr(date))) return true

    return false
  }

  const getTileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null
    
    const today = new Date()
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    
    // Días pasados → candado
    if (compareDate < todayMidnight) return 'blocked-day'
    
    // Días deshabilitados desde horarios
    const diaSemana = date.getDay()
    const horario = horarios.find(h => h.dia_semana === diaSemana)
    if (!horario || !horario.activo) return 'blocked-day'

    // Días cerrados por el negocio (fechas específicas)
    if (diasCerrados.includes(toFechaStr(date))) return 'blocked-day'

    return null
  }

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
                {citaActiva && (
                  <div className="af-limite">
                    <div className="af-limite-icono">
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    </div>
                    <h3>Ya tenés una cita agendada</h3>
                    <p>
                      Tu cita es el <strong>{formatDateDisplay(citaActiva.appointment_date)}</strong>
                      {' a las '}
                      <strong>{convertTo12Hour(citaActiva.appointment_time)}</strong>.
                    </p>
                    <p className="af-limite-nota">
                      Solo se puede tener una cita a la vez. Vas a poder agendar otra
                      {' '}2 horas después de que pase la que ya tenés.
                    </p>
                    <p className="af-limite-nota">
                      ¿Tuviste algún problema con tu cita? Escribinos y te ayudamos.
                    </p>
                    <a
                      href={whatsappNegocioUrl('Hola, tengo una consulta sobre mi cita en Autolavado Camaro Fraterno.')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="af-limite-wa"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.5 3.45 1.44 4.94L2 22l5.25-1.42c1.45.85 3.1 1.31 4.79 1.31 5.46 0 9.91-4.45 9.91-9.91 0-2.66-1.04-5.16-2.92-7.04A9.91 9.91 0 0 0 12.04 2zm.04 18.22c-1.49 0-2.97-.4-4.26-1.16l-.31-.18-3.11.84.85-3.03-.2-.33a8.02 8.02 0 0 1-1.22-4.27c0-4.47 3.64-8.1 8.11-8.1 2.16 0 4.19.84 5.72 2.37a8.04 8.04 0 0 1 2.38 5.72c-.01 4.47-3.64 8.11-8.11 8.11z"/>
                      </svg>
                      Escribir al WhatsApp del negocio
                    </a>
                  </div>
                )}

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
                      placeholder="Ej: No lo voy a llevar yo, lo va a llevar mi hermano (NOMBRE)"
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
                      className={`custom-calendar ${horarios.length > 0 ? 'calendar-loaded' : ''}`}
                      prev2Label={null}
                      next2Label={null}
                      prevLabel="‹"
                      nextLabel="›"
                      locale="es-ES"
                      showNeighboringMonth={false}
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
                    disabled={
                      loading ||
                      citaActiva !== null ||
                      !formData.vehicle_type ||
                      !formData.vehicle_model.trim() ||
                      !formData.service_type ||
                      !selectedDate ||
                      !formData.appointment_time ||
                      availableTimes.length === 0
                    }
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
                <p>Estas son tus citas agendadas</p>
              </div>
              <div className="af-body">
                {cargandoCitas ? (
                  <div style={{ textAlign: 'center', padding: '3rem 0', color: 'rgba(255,255,255,.4)' }}>
                    <p>Cargando tus citas...</p>
                  </div>
                ) : (
                  customerHistory.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 0', color: 'rgba(255,255,255,.4)' }}>
                      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                      <p>Todavía no tenés citas agendadas</p>
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
                                  <span style={{ fontWeight: 600, fontSize: '.95rem', color: '#e0142c' }}>{svc?.label || cita.service_type}</span>
                                </div>
                                <p style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.5)', marginBottom: '.3rem' }}>
                                  {veh?.label || cita.vehicle_type} — {cita.vehicle_model}
                                </p>
                                <p style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.5)', marginBottom: '.2rem' }}>
                                  {formatDateDisplay(cita.appointment_date)}
                                </p>
                                <p style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.5)' }}>{convertTo12Hour(cita.appointment_time)}</p>
                                {cita.notes && (
                                  <p style={{ fontSize: '.75rem', color: '#e0142c', marginTop: '.5rem', fontStyle: 'italic', background: 'rgba(224, 20, 44,0.1)', padding: '0.3rem 0.6rem', borderRadius: '12px' }}>
                                    {cita.notes}
                                  </p>
                                )}
                              </div>
                              <button
                                type="button"
                                className="af-delete-btn"
                                onClick={() => eliminarCita(cita)}
                                title="Eliminar cita"
                              >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                  <line x1="10" y1="11" x2="10" y2="17" />
                                  <line x1="14" y1="11" x2="14" y2="17" />
                                </svg>
                              </button>
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

            <button onClick={() => setSuccessData({ show: false, name: '', date: '', time: '', service: '', vehicleType: '', vehicleModel: '', notes: '' })} style={{ width: '100%', padding: '1rem', background: 'linear-gradient(135deg, #e0142c, #a10e1f)', color: '#fff', border: 'none', borderRadius: 14, fontWeight: 600, fontSize: '.9rem', cursor: 'pointer', fontFamily: "'Sora',sans-serif" }}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}