// Logica de horarios compartida entre el formulario de clientes y el del
// panel de admin, para que los dos calculen la disponibilidad igual.

export type Horario = {
  id: number
  dia_semana: number
  nombre_dia: string
  hora_inicio: string
  hora_fin: string
  intervalo_minutos: number
  activo: boolean
}

export type CitaOcupada = { hora: string; duracion: number }

// Lleva cualquier formato de hora a HH:MM de 24 horas
export const normalizarHora = (hora: string) => {
  if (!hora) return ''
  const m = hora.trim().toUpperCase().match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/)
  if (!m) return hora.trim().toUpperCase()
  let h = parseInt(m[1], 10)
  if (m[3] === 'PM' && h !== 12) h += 12
  if (m[3] === 'AM' && h === 12) h = 0
  return `${String(h).padStart(2, '0')}:${m[2]}`
}

export const aMinutos = (hora: string) => {
  const [h, m] = normalizarHora(hora).split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

export const a12Horas = (hora24: string) => {
  if (!hora24) return ''
  const [h, m] = hora24.split(':')
  const n = parseInt(h, 10)
  const ampm = n >= 12 ? 'PM' : 'AM'
  return `${String(n % 12 || 12).padStart(2, '0')}:${m} ${ampm}`
}

export const a24Horas = (hora12: string) => {
  const [t, modificador] = hora12.split(' ')
  let [h, m] = t.split(':')
  if (modificador === 'PM' && h !== '12') h = String(parseInt(h) + 12)
  if (modificador === 'AM' && h === '12') h = '00'
  return `${h}:${m}:00`
}

export const fechaATexto = (fecha: Date) =>
  `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`

// Franjas de un dia segun su hora de apertura, cierre e intervalo
export const generarFranjas = (inicio12: string, fin12: string, intervalo: number): string[] => {
  const franjas: string[] = []
  if (!inicio12 || !fin12 || inicio12 === '00:00 AM' || fin12 === '00:00 AM') return franjas

  let actual = aMinutos(inicio12)
  const fin = aMinutos(fin12)

  while (actual <= fin) {
    const h = Math.floor(actual / 60)
    const m = actual % 60
    const ampm = h >= 12 ? 'PM' : 'AM'
    franjas.push(`${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`)
    actual += intervalo
  }

  return franjas
}

export const horarioDelDia = (horarios: Horario[], diaSemana: number) =>
  horarios.find(h => h.dia_semana === diaSemana && h.activo)

export const franjasDelDia = (horarios: Horario[], diaSemana: number) => {
  const h = horarioDelDia(horarios, diaSemana)
  if (!h) return []
  return generarFranjas(h.hora_inicio, h.hora_fin, h.intervalo_minutos)
}

type Opciones = {
  franjas: string[]
  ocupadas: CitaOcupada[]
  duracion: number
  horaCierre: string
  cupos: number
  esHoy: boolean
}

// Una franja sirve si el trabajo cabe antes de cerrar y si no hay ya
// demasiadas citas cruzandose con ese rango
export const franjasDisponibles = ({
  franjas, ocupadas, duracion, horaCierre, cupos, esHoy,
}: Opciones): string[] => {
  const cierre = aMinutos(horaCierre)
  const ahora = new Date()
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes()

  const rangos = ocupadas.map(c => ({
    inicio: aMinutos(c.hora),
    fin: aMinutos(c.hora) + Number(c.duracion || 30),
  }))

  return franjas.filter(franja => {
    const inicio = aMinutos(franja)
    const fin = inicio + duracion

    if (fin > cierre) return false
    if (esHoy && inicio <= minutosAhora) return false

    const cruzadas = rangos.filter(r => r.inicio < fin && inicio < r.fin).length
    return cruzadas < cupos
  })
}
