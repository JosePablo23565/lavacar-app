import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
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

  // Cerrar al hacer clic fuera
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

      <style>{`
        .custom-select-trigger {
          width: 100%;
          padding: 0.85rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          color: #fff;
          font-size: 0.9rem;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          backdrop-filter: blur(10px);
        }

        .custom-select-trigger:hover {
          border-color: rgba(14, 184, 208, 0.4);
          background: rgba(14, 184, 208, 0.08);
          transform: scale(1.01);
        }

        .custom-select-trigger:active {
          transform: scale(0.99);
        }

        .custom-select-trigger.open {
          border-radius: 24px;
          background: rgba(15, 20, 35, 0.95);
          backdrop-filter: blur(20px);
          border-color: rgba(14, 184, 208, 0.5);
          transform: scale(1.02);
          box-shadow: 0 0 20px rgba(14, 184, 208, 0.2);
        }

        .custom-select-trigger.closing {
          transform: scale(1);
          transition: all 0.2s ease;
        }

        .custom-select-value {
          flex: 1;
        }

        .custom-select-arrow {
          font-size: 0.7rem;
          transition: transform 0.3s ease;
          color: #0eb8d0;
        }

        .custom-select-trigger.open .custom-select-arrow {
          transform: rotate(180deg);
        }

        .custom-select-options {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          background: rgba(15, 20, 35, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(14, 184, 208, 0.3);
          border-radius: 24px;
          overflow: hidden;
          z-index: 100;
          animation: bubbleExpand 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }

        .custom-select-options.fade-out {
          animation: bubbleShrink 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
        }

        @keyframes bubbleExpand {
          0% {
            opacity: 0;
            transform: translateY(-10px) scaleY(0.8);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scaleY(1);
          }
        }

        @keyframes bubbleShrink {
          0% {
            opacity: 1;
            transform: translateY(0) scaleY(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-10px) scaleY(0.8);
          }
        }

        .custom-select-option {
          padding: 0.85rem 1rem;
          cursor: pointer;
          color: rgba(255, 255, 255, 0.8);
          transition: all 0.2s ease;
          font-size: 0.9rem;
          margin: 4px 8px;
          border-radius: 18px;
        }

        .custom-select-option:hover {
          background: rgba(14, 184, 208, 0.15);
          color: #0eb8d0;
          transform: translateX(5px);
        }

        .custom-select-option.selected {
          background: rgba(14, 184, 208, 0.25);
          color: #0eb8d0;
        }
      `}</style>
    </div>
  )
}

export function AppointmentForm() {
  const location = useLocation()
  const [step, setStep] = useState<'form' | 'history'>('form')
  const [animating, setAnimating] = useState(false)
  const [menuAbiertoGlobal, setMenuAbiertoGlobal] = useState(false)
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
    show: boolean; name: string; date: string; time: string; service: string; vehicleType: string; vehicleModel: string
  }>({ show: false, name: '', date: '', time: '', service: '', vehicleType: '', vehicleModel: '' })

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

  const allTimes = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM',
  ]

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

  useEffect(() => { if (selectedDate) fetchAvailableTimes() }, [selectedDate])

  const fetchAvailableTimes = async () => {
    const dateStr = selectedDate.toISOString().split('T')[0]
    const { data } = await supabase.from('appointments').select('appointment_time').eq('appointment_date', dateStr)
    const bookedTimes12h = (data?.map((a) => a.appointment_time) || []).map((t) => convertTo12Hour(t))
    setAvailableTimes(allTimes.filter((time) => !bookedTimes12h.includes(time)))
  }

  const fetchCustomerHistory = async (phone: string) => {
    const { data } = await supabase.from('appointments').select('*').eq('customer_phone', phone).order('appointment_date', { ascending: false })
    setCustomerHistory(data || [])
  }

  // Función para validar solo letras en el nombre y máximo 40 caracteres
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const onlyLetters = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')
    if (onlyLetters.length <= 40) {
      setFormData({ ...formData, customer_name: onlyLetters })
    }
  }

  // Función para validar solo números en el teléfono (máximo 8 dígitos)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const onlyNumbers = value.replace(/[^0-9]/g, '')
    if (onlyNumbers.length <= 8) {
      setFormData({ ...formData, customer_phone: onlyNumbers })
    }
  }

  // Función para validar marca y modelo (máximo 25 caracteres)
  const handleVehicleModelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value.length <= 25) {
      setFormData({ ...formData, vehicle_model: value })
    }
  }



  const handleDateChange = (date: Date) => {
    setSelectedDate(date)
    setFormData({ ...formData, appointment_date: date.toISOString().split('T')[0], appointment_time: '' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.appointment_time) { alert('Por favor seleccioná una hora'); return }
    setLoading(true)
    const { error } = await supabase.from('appointments').insert([{ ...formData, appointment_time: convertTo24Hour(formData.appointment_time) }])
    if (error) {
      alert('Error: ' + error.message)
    } else {
      const svc = services.find((s) => s.value === formData.service_type)
      const veh = vehicleTypes.find((v) => v.value === formData.vehicle_type)
      setSuccessData({ show: true, name: formData.customer_name, date: formData.appointment_date, time: formData.appointment_time, service: svc?.label || formData.service_type, vehicleType: veh?.label || formData.vehicle_type, vehicleModel: formData.vehicle_model })
      setFormData({ customer_name: '', customer_phone: '', service_type: '', vehicle_type: '', vehicle_model: '', appointment_date: new Date().toISOString().split('T')[0], appointment_time: '' })
      setSelectedDate(new Date())
      fetchAvailableTimes()
      setTimeout(() => setSuccessData({ show: false, name: '', date: '', time: '', service: '', vehicleType: '', vehicleModel: '' }), 6000)
    }
    setLoading(false)
  }

  const selectedService = services.find((s) => s.value === formData.service_type)

  const formatDateDisplay = (date: string) => new Date(date).toLocaleDateString('es-CR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const formatDateSimple = (date: string) => new Date(date).toLocaleDateString('es-CR', { year: 'numeric', month: 'long', day: 'numeric' })

  const isDateDisabled = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');

        .af-root {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0e1a 0%, #0a1225 50%, #0a0e1a 100%);
          padding: 2rem 1rem 4rem;
          font-family: 'Inter', sans-serif;
        }

        /* TABS STICKY - LIQUID GLASS */
        .af-tabs {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 2rem;
          background: rgba(10, 14, 26, 0.3);
          backdrop-filter: blur(16px);
          border-radius: 20px;
          padding: 0.5rem;
          border: 1px solid rgba(14, 184, 208, 0.2);
          position: sticky;
          top: 75px;
          transition: all 0.3s ease;
          z-index: 30;
        }

        .af-tabs.menu-abierto {
          z-index: 1;
          opacity: 0.3;
          pointer-events: none;
        }

        .af-tabs.sticky-shadow {
          background: rgba(10, 14, 26, 0.85);
          backdrop-filter: blur(20px);
          border-color: rgba(14, 184, 208, 0.3);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
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

        /* CARD PRINCIPAL - LIQUID GLASS */
        .af-card {
          background: rgba(15, 20, 35, 0.35);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 32px;
          overflow: hidden;
          max-width: 680px;
          margin: 0 auto;
          position: relative;
          z-index: 10;
          box-shadow: 0 25px 45px rgba(0, 0, 0, 0.3);
        }

        .af-card-header {
          background: linear-gradient(135deg, rgba(14, 184, 208, 0.15), rgba(14, 184, 208, 0.05));
          padding: 1.75rem 2rem;
          text-align: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .af-card-header h2 {
          font-family: 'Sora', sans-serif;
          font-size: 1.5rem;
          font-weight: 600;
          color: #fff;
          margin-bottom: 0.3rem;
          letter-spacing: -0.02em;
        }

        .af-card-header p {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.5);
        }

        .af-body {
          padding: 1.75rem 2rem;
        }

        .af-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 0.5rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        /* INPUTS NORMALES CON EFECTO BURBUJA */
        .af-input {
          width: 100%;
          padding: 0.85rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          color: #fff;
          font-size: 0.9rem;
          font-family: 'Inter', sans-serif;
          transition: all 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          outline: none;
        }

        .af-input:focus {
          border-color: rgba(14, 184, 208, 0.5);
          background: rgba(14, 184, 208, 0.05);
          box-shadow: 0 0 0 3px rgba(14, 184, 208, 0.1);
        }

        .af-input:active {
          transform: scale(1.02);
          transition: transform 0.1s ease;
        }

        .af-field {
          margin-bottom: 1.25rem;
        }

        .af-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.25rem;
        }

        .af-hint {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.3);
          margin-top: 0.4rem;
        }

        .af-section-label {
          font-family: 'Sora', sans-serif;
          font-size: 0.75rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.5);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 1rem;
          margin-top: 1.5rem;
          display: block;
        }

        /* TIME GRID */
        .af-time-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.6rem;
        }

        .af-time-btn {
          padding: 0.7rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          font-family: 'Inter', sans-serif;
          background: rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.7);
        }

        .af-time-btn:active {
          transform: scale(0.98);
        }

        .af-time-btn.sel {
          background: linear-gradient(135deg, #0eb8d0, #0a8ca0);
          border-color: transparent;
          color: #fff;
          transform: scale(1.02);
          box-shadow: 0 4px 15px rgba(14, 184, 208, 0.3);
        }

        .af-time-btn:not(.sel):hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
          color: #fff;
          transform: translateY(-2px);
        }

        /* SUBMIT BUTTON */
        .af-submit {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, #0eb8d0, #0a8ca0);
          color: #fff;
          border: none;
          border-radius: 50px;
          font-size: 1rem;
          font-weight: 600;
          font-family: 'Sora', sans-serif;
          cursor: pointer;
          transition: all 0.25s ease;
          margin-top: 1.5rem;
          position: relative;
          overflow: hidden;
        }

        .af-submit::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s ease;
        }

        .af-submit:hover::before {
          left: 100%;
        }

        .af-submit:active {
          transform: scale(0.98);
        }

        .af-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(14, 184, 208, 0.4);
        }

        .af-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* BUSCAR BUTTON */
        .af-buscar-btn {
          background: linear-gradient(135deg, #0eb8d0, #0a8ca0) !important;
          color: #fff !important;
          border: none !important;
          padding: 0.85rem 1.5rem !important;
          border-radius: 50px !important;
          cursor: pointer !important;
          font-weight: 500 !important;
          font-family: 'Inter', sans-serif !important;
          white-space: nowrap !important;
          transition: all 0.25s ease !important;
        }

        .af-buscar-btn:active {
          transform: scale(0.97) !important;
        }

        .af-buscar-btn:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 8px 25px rgba(14, 184, 208, 0.4) !important;
        }

        /* CUSTOM CALENDAR - LIQUID GLASS CON FECHAS DESHABILITADAS */
        .custom-calendar {
          background: rgba(10, 14, 26, 0.4) !important;
          backdrop-filter: blur(16px) !important;
          border: 1px solid rgba(14, 184, 208, 0.2) !important;
          border-radius: 24px !important;
          padding: 1rem !important;
          width: 100% !important;
          max-width: 380px !important;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
          font-family: 'Inter', sans-serif !important;
        }

        .custom-calendar .react-calendar__navigation {
          margin-bottom: 1.5rem !important;
        }

        .custom-calendar .react-calendar__navigation button {
          color: #0eb8d0 !important;
          font-weight: 600 !important;
          font-size: 0.9rem !important;
          background: transparent !important;
          border-radius: 12px !important;
          padding: 0.5rem !important;
          transition: all 0.2s !important;
        }

        .custom-calendar .react-calendar__navigation button:hover {
          background: rgba(14, 184, 208, 0.15) !important;
        }

        .custom-calendar .react-calendar__navigation button:active {
          transform: scale(0.95);
        }

        .custom-calendar .react-calendar__month-view__weekdays {
          color: rgba(255, 255, 255, 0.4) !important;
          font-weight: 500 !important;
          font-size: 0.7rem !important;
          text-transform: uppercase !important;
          margin-bottom: 0.5rem !important;
        }

        .custom-calendar .react-calendar__month-view__weekdays abbr {
          text-decoration: none !important;
        }

        .custom-calendar .react-calendar__tile {
          color: rgba(255, 255, 255, 0.8) !important;
          border-radius: 14px !important;
          padding: 0.7rem 0.5rem !important;
          font-size: 0.85rem !important;
          font-weight: 500 !important;
          transition: all 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55) !important;
          background: transparent !important;
          cursor: pointer !important;
        }

        .custom-calendar .react-calendar__tile:enabled:hover {
          background: rgba(14, 184, 208, 0.15) !important;
          transform: scale(1.05) !important;
        }

        .custom-calendar .react-calendar__tile:enabled:active {
          transform: scale(0.95) !important;
        }

        .custom-calendar .react-calendar__tile:disabled {
          opacity: 0.3 !important;
          background: rgba(100, 100, 100, 0.1) !important;
          color: rgba(255, 255, 255, 0.3) !important;
          cursor: not-allowed !important;
          text-decoration: line-through !important;
        }

        .custom-calendar .react-calendar__tile--active {
          background: linear-gradient(135deg, #0eb8d0, #0a8ca0) !important;
          color: white !important;
          box-shadow: 0 4px 15px rgba(14, 184, 208, 0.3) !important;
          transform: scale(1.02) !important;
        }

        .custom-calendar .react-calendar__tile--now {
          background: rgba(14, 184, 208, 0.1) !important;
          border: 1px solid rgba(14, 184, 208, 0.3) !important;
          color: #0eb8d0 !important;
        }

        .custom-calendar .react-calendar__tile--now:enabled:hover {
          background: rgba(14, 184, 208, 0.2) !important;
        }

        /* HISTORY CARDS */
        .af-history-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 1.25rem;
          margin-bottom: 0.75rem;
          transition: all 0.3s ease;
        }

        .af-history-card:hover {
          border-color: rgba(14, 184, 208, 0.3);
          background: rgba(14, 184, 208, 0.03);
          transform: translateX(4px);
        }

        .af-history-card:active {
          transform: scale(0.99);
        }

        .af-confirmed {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          background: rgba(14, 184, 208, 0.1);
          color: #0eb8d0;
          border: 1px solid rgba(14, 184, 208, 0.2);
          padding: 0.3rem 0.9rem;
          border-radius: 30px;
          font-size: 0.7rem;
          font-weight: 500;
          text-transform: uppercase;
        }

        /* MODAL EXITO */
        .af-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
          padding: 1.5rem;
          animation: afFadeIn 0.25s ease;
        }

        .af-modal {
          background: rgba(15, 20, 35, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(14, 184, 208, 0.3);
          border-radius: 32px;
          padding: 2rem;
          max-width: 440px;
          width: 100%;
          animation: afScaleIn 0.2s ease;
        }

        .af-modal-icon {
          width: 70px;
          height: 70px;
          background: linear-gradient(135deg, #0eb8d0, #0a8ca0);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.25rem;
        }

        .af-modal-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.7rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          font-size: 0.85rem;
        }

        .af-modal-row:last-of-type {
          border-bottom: none;
        }

        .af-modal-key {
          color: rgba(255, 255, 255, 0.5);
          font-weight: 400;
        }

        .af-modal-val {
          font-weight: 500;
          color: #fff;
        }

        @keyframes afFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes afScaleIn {
          from { transform: scale(0.92); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 480px) {
          .af-grid-2 { grid-template-columns: 1fr; }
          .af-body { padding: 1.25rem; }
          .af-tabs { top: 68px; }
          .af-time-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

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
                    <div className="af-field">
                      <label className="af-label">NOMBRE COMPLETO</label>
                      <input 
                        className="af-input" 
                        type="text" 
                        name="customer_name" 
                        value={formData.customer_name} 
                        onChange={handleNameChange} 
                        required 
                        placeholder="Ej: Franklin Molina"
                        maxLength={40}
                      />
                    </div>

                    <div className="af-field">
                      <label className="af-label">TELÉFONO</label>
                      <input 
                        className="af-input" 
                        type="tel" 
                        name="customer_phone" 
                        value={formData.customer_phone} 
                        onChange={handlePhoneChange} 
                        required 
                        placeholder="Ej: 12345678"
                        maxLength={8}
                      />
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
                          onChange={handleVehicleModelChange} 
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

                    <span className="af-section-label">SELECCIONE LA FECHA</span>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <Calendar 
                        onChange={(date) => handleDateChange(date as Date)} 
                        value={selectedDate} 
                        minDate={new Date()}
                        tileDisabled={({ date }) => isDateDisabled(date)}
                        className="custom-calendar"
                      />
                    </div>

                    <span className="af-section-label">HORARIOS DISPONIBLES</span>
                    {availableTimes.length === 0 ? (
                      <p style={{ color: '#f87171', fontSize: '.88rem', textAlign: 'center', padding: '1rem 0' }}>No hay horarios disponibles para este día</p>
                    ) : (
                      <div className="af-time-grid">
                        {availableTimes.map((time) => (
                          <button key={time} type="button" className={`af-time-btn${formData.appointment_time === time ? ' sel' : ''}`} onClick={() => setFormData({ ...formData, appointment_time: time })}>
                            {time}
                          </button>
                        ))}
                      </div>
                    )}

                    <button type="submit" className="af-submit" disabled={loading || !formData.appointment_time || availableTimes.length === 0}>
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
                                <div>
                                  <div style={{ marginBottom: '.5rem' }}>
                                    <span style={{ fontWeight: 600, fontSize: '.95rem', color: '#0eb8d0' }}>{svc?.label || cita.service_type}</span>
                                  </div>
                                  <p style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.5)', marginBottom: '.3rem' }}>
                                    {veh?.label || cita.vehicle_type} — {cita.vehicle_model}
                                  </p>
                                  <p style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.5)', marginBottom: '.2rem' }}>{formatDateDisplay(cita.appointment_date)}</p>
                                  <p style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.5)' }}>{convertTo12Hour(cita.appointment_time)}</p>
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
                ].map((row) => (
                  <div key={row.k} className="af-modal-row">
                    <span className="af-modal-key">{row.k}</span>
                    <span className="af-modal-val">{row.v}</span>
                  </div>
                ))}
              </div>

              <button onClick={() => setSuccessData({ show: false, name: '', date: '', time: '', service: '', vehicleType: '', vehicleModel: '' })} style={{ width: '100%', padding: '1rem', background: 'linear-gradient(135deg, #0eb8d0, #0a8ca0)', color: '#fff', border: 'none', borderRadius: 14, fontWeight: 600, fontSize: '.9rem', cursor: 'pointer', fontFamily: "'Sora',sans-serif" }}>
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}