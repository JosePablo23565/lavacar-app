// Lista única de servicios. La usan el formulario de citas, el panel de
// admin y el inicio, para que no se desincronicen los nombres ni los precios.

export type Servicio = {
  value: string
  label: string
  price: string
  duration: number
  desc: string
  tag?: string
  caracteristicas?: string[]
  imagen: string
}

export const SERVICIOS: Servicio[] = [
  {
    value: 'basico',
    label: 'Lavado Básico',
    price: '₡7,000',
    duration: 30,
    tag: 'Solo para mantenimiento y suciedad leve',
    desc: 'Lavado exterior y aspirado rápido.',
    caracteristicas: [
      'Lavado exterior',
      'Aspirado rápido',
    ],
    imagen: '/lavado-basico.jpg',
  },
  {
    value: 'premium',
    label: 'Lavado Premium',
    price: '₡10,000',
    duration: 45,
    tag: 'El más recomendado',
    desc: 'Lavado exterior detallado, aspirado completo, limpieza de llantas y limpieza básica de interiores.',
    caracteristicas: [
      'Lavado exterior detallado',
      'Aspirado completo',
      'Limpieza de llantas',
      'Limpieza básica de interiores',
    ],
    imagen: '/lavado-completo.jpg',
  },
  {
    value: 'exclusivo',
    label: 'Lavado Exclusivo / Intensivo',
    price: '₡15,000',
    duration: 60,
    tag: 'Para vehículos muy sucios',
    desc: 'Lavado profundo exterior, limpieza detallada de llantas y rin, aspirado profundo y limpieza detallada de interiores.',
    caracteristicas: [
      'Lavado profundo exterior',
      'Limpieza detallada de llantas y rin',
      'Aspirado profundo',
      'Limpieza detallada de interiores',
    ],
    imagen: '/encerado.jpg',
  },
  {
    value: 'ceramico',
    label: 'Lavado Cerámico',
    price: '₡25,000',
    duration: 90,
    tag: 'Brillo, protección y durabilidad',
    desc: 'Lavado detallado completo, aplicación cerámica, protección de pintura y efecto repelente al agua y suciedad.',
    caracteristicas: [
      'Lavado detallado completo',
      'Aplicación cerámica',
      'Protección de pintura',
      'Efecto repelente al agua y suciedad',
    ],
    imagen: '/encerado.jpg',
  },
]

export const TIPOS_VEHICULO = [
  { value: 'carro', label: 'Carro' },
  { value: 'moto', label: 'Moto' },
  { value: 'camioneta', label: 'Camioneta / SUV' },
]

export const nombreServicio = (value: string) => {
  const match = SERVICIOS.find(s => s.value === value)
  if (match) return match.label
  // Compatibilidad con citas históricas registradas en la base de datos
  if (value === 'completo') return 'Lavado Premium'
  if (value === 'encerado' || value === 'tapizado') return 'Lavado Exclusivo / Intensivo'
  if (value === 'parabrisas') return 'Pulido de Parabrisas'
  return value
}

export const duracionServicio = (value: string) =>
  SERVICIOS.find(s => s.value === value)?.duration || 30
