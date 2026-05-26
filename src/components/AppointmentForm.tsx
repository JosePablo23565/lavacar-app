import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'

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

export function AppointmentForm() {
  const [step, setStep] = useState<'form' | 'history'>('form')
  const [animating, setAnimating] = useState(false)
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    service_type: '',
    vehicle_type: '',
    vehicle_model: '',
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '',
  })
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  const [customerHistory, setCustomerHistory] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [phoneToSearch, setPhoneToSearch] = useState('')
  const [successData, setSuccessData] = useState<{
    show: boolean
    name: string
    date: string
    time: string
    service: string
    vehicleType: string
    vehicleModel: string
  }>({ show: false, name: '', date: '', time: '', service: '', vehicleType: '', vehicleModel: '' })

  const services = [
    { value: 'basico', label: '🚗 Lavado Básico', price: '$10', duration: 30 },
    { value: 'completo', label: '✨ Lavado Completo', price: '$20', duration: 45 },
    { value: 'encerado', label: '🌟 Encerado + Lavado', price: '$35', duration: 60 },
    { value: 'tapizado', label: '🧼 Limpieza de Tapizado', price: '$25', duration: 40 },
  ]

  const vehicleTypes = [
    { value: 'carro', label: '🚗 Carro', icon: '🚗' },
    { value: 'moto', label: '🏍️ Moto', icon: '🏍️' },
    { value: 'camioneta', label: '🚐 Camioneta / SUV', icon: '🚐' },
  ]

  const handleStepChange = (newStep: 'form' | 'history') => {
    if (newStep === step) return
    setAnimating(true)
    setTimeout(() => {
      setStep(newStep)
      setTimeout(() => setAnimating(false), 100)
    }, 200)
  }

  const convertTo24Hour = (time12h: string) => {
    const [time, modifier] = time12h.split(' ')
    let [hours, minutes] = time.split(':')
    
    if (modifier === 'PM' && hours !== '12') {
      hours = String(parseInt(hours) + 12)
    }
    if (modifier === 'AM' && hours === '12') {
      hours = '00'
    }
    return `${hours}:${minutes}:00`
  }

  const convertTo12Hour = (time24h: string) => {
    const [hours, minutes] = time24h.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12.toString().padStart(2, '0')}:${minutes} ${ampm}`
  }

  const allTimes = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM'
  ]

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableTimes()
    }
  }, [selectedDate])

  const fetchAvailableTimes = async () => {
    const dateStr = selectedDate.toISOString().split('T')[0]
    
    const { data } = await supabase
      .from('appointments')
      .select('appointment_time')
      .eq('appointment_date', dateStr)

    const bookedTimes24h = data?.map(a => a.appointment_time) || []
    const bookedTimes12h = bookedTimes24h.map(t => convertTo12Hour(t))
    
    const available = allTimes.filter(time => !bookedTimes12h.includes(time))
    setAvailableTimes(available)
  }

  const fetchCustomerHistory = async (phone: string) => {
    const { data } = await supabase
      .from('appointments')
      .select('*')
      .eq('customer_phone', phone)
      .order('appointment_date', { ascending: false })
    
    setCustomerHistory(data || [])
  }

  const handleSearchHistory = () => {
    if (phoneToSearch) {
      fetchCustomerHistory(phoneToSearch)
      setShowHistory(true)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleDateChange = (date: Date) => {
    setSelectedDate(date)
    const formattedDate = date.toISOString().split('T')[0]
    setFormData({ ...formData, appointment_date: formattedDate, appointment_time: '' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!formData.appointment_date) {
      alert('Por favor selecciona una fecha')
      setLoading(false)
      return
    }

    if (!formData.appointment_time) {
      alert('Por favor selecciona una hora')
      setLoading(false)
      return
    }

    const time24h = convertTo24Hour(formData.appointment_time)
    
    const dataToSave = {
      ...formData,
      appointment_time: time24h
    }

    const { error } = await supabase.from('appointments').insert([dataToSave])

    if (error) {
      alert('Error: ' + error.message)
      setLoading(false)
    } else {
      const selectedService = services.find(s => s.value === formData.service_type)
      const selectedVehicle = vehicleTypes.find(v => v.value === formData.vehicle_type)
      
      setSuccessData({
        show: true,
        name: formData.customer_name,
        date: formData.appointment_date,
        time: formData.appointment_time,
        service: selectedService?.label || formData.service_type,
        vehicleType: selectedVehicle?.label || formData.vehicle_type,
        vehicleModel: formData.vehicle_model
      })
      
      setFormData({
        customer_name: '',
        customer_phone: '',
        service_type: '',
        vehicle_type: '',
        vehicle_model: '',
        appointment_date: new Date().toISOString().split('T')[0],
        appointment_time: '',
      })
      setSelectedDate(new Date())
      fetchAvailableTimes()
      
      setTimeout(() => {
        setSuccessData({ show: false, name: '', date: '', time: '', service: '', vehicleType: '', vehicleModel: '' })
      }, 5000)
    }
    setLoading(false)
  }

  const selectedService = services.find(s => s.value === formData.service_type)

  const formatDateForDisplay = (date: string) => {
    return new Date(date).toLocaleDateString('es-CR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateSimple = (date: string) => {
    return new Date(date).toLocaleDateString('es-CR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getVehicleIcon = (type: string) => {
    const vehicle = vehicleTypes.find(v => v.value === type)
    return vehicle?.icon || '🚗'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-100 to-blue-100 py-4 px-3 md:py-8 md:px-4">
      <div className="max-w-4xl mx-auto">
        {/* Tabs con animación */}
        <div className="flex gap-2 md:gap-3 mb-6 md:mb-8 bg-white/60 backdrop-blur-md rounded-2xl p-1.5 md:p-2 shadow-lg">
          <button
            onClick={() => handleStepChange('form')}
            className={`flex-1 py-2.5 md:py-3 rounded-xl font-bold text-sm md:text-lg transition-all duration-300 transform ${
              step === 'form' 
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg scale-105' 
                : 'bg-white/50 text-gray-700 hover:bg-white/70'
            }`}
          >
            📅 Agendar Cita
          </button>
          <button
            onClick={() => handleStepChange('history')}
            className={`flex-1 py-2.5 md:py-3 rounded-xl font-bold text-sm md:text-lg transition-all duration-300 transform ${
              step === 'history' 
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg scale-105' 
                : 'bg-white/50 text-gray-700 hover:bg-white/70'
            }`}
          >
            📋 Mis Citas
          </button>
        </div>

        <div className={`transition-all duration-300 ease-in-out ${
          animating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}>
          {/* Formulario de agendar */}
          {step === 'form' && (
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute rounded-full bg-blue-200/60 animate-bubble"
                      style={{
                        width: `${Math.random() * 80 + 20}px`,
                        height: `${Math.random() * 80 + 20}px`,
                        left: `${Math.random() * 100}%`,
                        bottom: `-${Math.random() * 50}px`,
                        animationDelay: `${Math.random() * 5}s`,
                        animationDuration: `${Math.random() * 8 + 4}s`,
                      }}
                    />
                  ))}
                </div>
                
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 md:p-6 text-white relative z-10">
                  <h2 className="text-xl md:text-2xl font-bold text-center">📅 Agendar Cita</h2>
                  <p className="text-center text-blue-100 text-xs md:text-sm mt-1">Completa los datos para reservar tu espacio</p>
                </div>
                
                <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 md:space-y-5 relative z-10">
                  <div className="transform transition-all duration-300 hover:translate-x-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1 md:mb-2">👤 Nombre completo</label>
                    <input
                      type="text"
                      name="customer_name"
                      value={formData.customer_name}
                      onChange={handleChange}
                      required
                      className="w-full px-3 md:px-4 py-2 md:py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none text-sm md:text-base"
                      placeholder="Tu nombre completo"
                    />
                  </div>

                  <div className="transform transition-all duration-300 hover:translate-x-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1 md:mb-2">📞 Teléfono</label>
                    <input
                      type="tel"
                      name="customer_phone"
                      value={formData.customer_phone}
                      onChange={handleChange}
                      placeholder="Ej: 50612345678"
                      required
                      className="w-full px-3 md:px-4 py-2 md:py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none text-sm md:text-base"
                    />
                    <p className="text-xs text-gray-400 mt-1">Número para contacto del negocio</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="transform transition-all duration-300 hover:translate-x-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1 md:mb-2">🚗 Tipo de vehículo</label>
                      <select
                        name="vehicle_type"
                        value={formData.vehicle_type}
                        onChange={handleChange}
                        required
                        className="w-full px-3 md:px-4 py-2 md:py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none text-sm md:text-base"
                      >
                        <option value="">Selecciona el tipo</option>
                        {vehicleTypes.map(v => (
                          <option key={v.value} value={v.value}>{v.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="transform transition-all duration-300 hover:translate-x-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1 md:mb-2">🔧 Marca y modelo</label>
                      <input
                        type="text"
                        name="vehicle_model"
                        value={formData.vehicle_model}
                        onChange={handleChange}
                        placeholder="Ej: Toyota Hilux"
                        required
                        className="w-full px-3 md:px-4 py-2 md:py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none text-sm md:text-base"
                      />
                    </div>
                  </div>

                  <div className="transform transition-all duration-300 hover:translate-x-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1 md:mb-2">🛠️ Servicio</label>
                    <select
                      name="service_type"
                      value={formData.service_type}
                      onChange={handleChange}
                      required
                      className="w-full px-3 md:px-4 py-2 md:py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none text-sm md:text-base"
                    >
                      <option value="">Selecciona un servicio</option>
                      {services.map(s => (
                        <option key={s.value} value={s.value}>{s.label} - {s.price}</option>
                      ))}
                    </select>
                    {selectedService && (
                      <p className="text-xs text-gray-500 mt-1">⏱️ Duración: {selectedService.duration} minutos</p>
                    )}
                  </div>

                  <div className="transform transition-all duration-300 hover:scale-105">
                    <label className="block text-sm font-semibold text-gray-700 mb-1 md:mb-2">📅 Fecha</label>
                    <div className="flex justify-center overflow-x-auto">
                      <Calendar
                        onChange={handleDateChange}
                        value={selectedDate}
                        minDate={new Date()}
                        className="border-0 shadow-lg rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1 md:mb-2">⏰ Hora</label>
                    <div className="grid grid-cols-3 gap-1.5 md:gap-2">
                      {availableTimes.map((time, idx) => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setFormData({ ...formData, appointment_time: time })}
                          className={`p-2 md:p-3 rounded-xl font-medium text-xs md:text-base transition-all duration-200 transform hover:scale-105 ${
                            formData.appointment_time === time 
                              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md scale-105' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          style={{ animationDelay: `${idx * 0.05}s` }}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                    {availableTimes.length === 0 && (
                      <p className="text-red-500 text-sm mt-2 text-center">No hay horarios disponibles</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !formData.appointment_time || availableTimes.length === 0}
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold text-base md:text-lg py-3 md:py-4 rounded-xl hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-300 transform hover:scale-[1.02] active:scale-95 shadow-lg"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        Agendando...
                      </span>
                    ) : (
                      '📌 AGENDAR CITA'
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Historial de citas - CON BUSCADOR MÁS PEQUEÑO EN MÓVIL */}
          {step === 'history' && (
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 md:p-6 text-white">
                <h2 className="text-xl md:text-2xl font-bold text-center">📋 Mis Citas</h2>
                <p className="text-center text-blue-100 text-xs md:text-sm mt-1">Consulta tus citas agendadas</p>
              </div>
              
              <div className="p-4 md:p-6">
                {/* Buscador responsivo - más pequeño en móvil */}
                <div className="flex flex-col sm:flex-row gap-2 md:gap-3 mb-6">
                  <input
                    type="tel"
                    placeholder="Ingresa tu número de teléfono"
                    value={phoneToSearch}
                    onChange={(e) => setPhoneToSearch(e.target.value)}
                    className="flex-1 px-3 md:px-4 py-2 md:py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none text-sm md:text-base"
                  />
                  <button
                    onClick={handleSearchHistory}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 md:px-6 py-2 md:py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 active:scale-95 text-sm md:text-base"
                  >
                    Buscar
                  </button>
                </div>

                {showHistory && (
                  <>
                    {customerHistory.length === 0 ? (
                      <div className="text-center py-8 md:py-12">
                        <div className="text-5xl md:text-6xl mb-3 md:mb-4 animate-bounce">📭</div>
                        <p className="text-gray-500 text-base md:text-lg">No tienes citas agendadas</p>
                      </div>
                    ) : (
                      <div className="space-y-3 md:space-y-4">
                        {customerHistory.map((cita, idx) => {
                          const service = services.find(s => s.value === cita.service_type)
                          const time12h = convertTo12Hour(cita.appointment_time)
                          return (
                            <div 
                              key={cita.id} 
                              className="border-2 border-gray-100 rounded-xl p-3 md:p-4 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] bg-white"
                              style={{ animationDelay: `${idx * 0.1}s` }}
                            >
                              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 md:gap-0">
                                <div className="space-y-1 md:space-y-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xl md:text-2xl">{service?.label.split(' ')[0]}</span>
                                    <p className="font-bold text-gray-800 text-sm md:text-base">{service?.label || cita.service_type}</p>
                                  </div>
                                  <p className="text-xs md:text-sm text-gray-600 flex items-center gap-1 flex-wrap">
                                    <span>{getVehicleIcon(cita.vehicle_type)}</span> {cita.vehicle_type} - {cita.vehicle_model}
                                  </p>
                                  <p className="text-xs md:text-sm text-gray-600">📅 {formatDateForDisplay(cita.appointment_date)}</p>
                                  <p className="text-xs md:text-sm text-gray-600">⏰ {time12h}</p>
                                </div>
                                <span className="text-xs bg-green-100 text-green-700 px-2 md:px-3 py-1 rounded-full font-semibold animate-pulse self-start">
                                  ✓ Confirmada
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* MODAL DE ÉXITO */}
        {successData.show && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl transform animate-scaleIn">
              <div className="text-center">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <svg className="w-8 h-8 md:w-10 md:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-blue-600 mb-2">¡Cita Agendada!</h2>
                <p className="text-gray-500 text-sm md:text-base mb-6">Tu cita ha sido confirmada exitosamente</p>
              </div>
              
              <div className="border-t border-b border-gray-100 py-4 space-y-2 md:space-y-3">
                <div className="flex justify-between items-center text-sm md:text-base">
                  <span className="text-gray-500">🚗 Vehículo:</span>
                  <span className="font-semibold">{successData.vehicleType} {successData.vehicleModel}</span>
                </div>
                <div className="flex justify-between items-center text-sm md:text-base">
                  <span className="text-gray-500">📅 Fecha:</span>
                  <span className="font-semibold">{formatDateSimple(successData.date)}</span>
                </div>
                <div className="flex justify-between items-center text-sm md:text-base">
                  <span className="text-gray-500">⏰ Hora:</span>
                  <span className="font-semibold">{successData.time}</span>
                </div>
                <div className="flex justify-between items-center text-sm md:text-base">
                  <span className="text-gray-500">🧼 Servicio:</span>
                  <span className="font-semibold">{successData.service}</span>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-400 mb-3">📸 Toma una captura para recordar tu cita</p>
                <button
                  onClick={() => setSuccessData({ show: false, name: '', date: '', time: '', service: '', vehicleType: '', vehicleModel: '' })}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 rounded-xl hover:from-blue-600 hover:to-cyan-600 font-semibold transition-all duration-300"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes bubble {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.4; }
          90% { opacity: 0.4; }
          100% { transform: translateY(-600px) rotate(360deg); opacity: 0; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out;
        }
        .animate-bubble {
          animation: bubble linear infinite;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .animate-pulse {
          animation: pulse 2s infinite;
        }
      `}</style>
    </div>
  )
}