// Lista unica de servicios. La usan el formulario de citas, el panel de
// admin y el inicio, para que no se desincronicen los nombres ni los precios.

export type Servicio = {
  value: string
  label: string
  price: string
  duration: number
  desc: string
  imagen: string
}

export const SERVICIOS: Servicio[] = [
  {
    value: 'basico',
    label: 'Lavado y Aspirado',
    price: '$10',
    duration: 30,
    desc: 'Lavado exterior con agua a presión, shampoo especial y secado manual.',
    imagen: '/lavado-basico.jpg',
  },
  {
    value: 'completo',
    label: 'Lavado prémium',
    price: '$20',
    duration: 45,
    desc: 'Interior y exterior. Aspirado, tablero, vidrios y limpieza de llantas.',
    imagen: '/lavado-completo.jpg',
  },
  {
    value: 'encerado',
    label: 'Full Prémium',
    price: '$35',
    duration: 60,
    desc: 'Lavado completo más encerado profesional para proteger y dar brillo a la pintura.',
    imagen: '/encerado.jpg',
  },
  {
    value: 'tapizado',
    label: 'Pulido de Focos',
    price: '$25',
    duration: 40,
    desc: 'Limpieza profunda de asientos y alfombras con extractora profesional.',
    imagen: '/tapizado.jpg',
  },
  {
    value: 'parabrisas',
    label: 'Pulido de Parabrisas',
    price: '$15',
    duration: 25,
    desc: 'Pulido profesional del parabrisas para eliminar manchas de agua dura y mejorar la visibilidad.',
    imagen: '/lavado-basico.jpg',
  },
  {
    value: 'ceramico',
    label: 'Tratamiento Cerámico',
    price: '$50',
    duration: 90,
    desc: 'Protección cerámica de larga duración que sella la pintura y realza el brillo.',
    imagen: '/encerado.jpg',
  },
]

export const TIPOS_VEHICULO = [
  { value: 'carro', label: 'Carro' },
  { value: 'moto', label: 'Moto' },
  { value: 'camioneta', label: 'Camioneta / SUV' },
]

export const nombreServicio = (value: string) =>
  SERVICIOS.find(s => s.value === value)?.label || value

export const duracionServicio = (value: string) =>
  SERVICIOS.find(s => s.value === value)?.duration || 30
