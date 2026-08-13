// Debe coincidir con el nombre registrado en Google Maps
export const NOMBRE_NEGOCIO = 'Auto Lavado y Servicios Camaro Fraterno'

export const LAT = 10.5218292
export const LNG = -85.2548688

// Con codigo de pais porque wa.me lo necesita
export const WHATSAPP_NEGOCIO = '50683606680'

export const FACEBOOK_URL = 'https://www.facebook.com/profile.php?id=100064073801428&locale=es_LA'
export const INSTAGRAM_URL = 'https://www.instagram.com/camaro_fraterno'

export const whatsappNegocioUrl = (mensaje?: string) =>
  mensaje
    ? `https://wa.me/${WHATSAPP_NEGOCIO}?text=${encodeURIComponent(mensaje)}`
    : `https://wa.me/${WHATSAPP_NEGOCIO}`

// Opcional fuerza que se abra la ficha exacta
export const PLACE_ID = ''

const nombre = encodeURIComponent(NOMBRE_NEGOCIO)

export const googleMapsUrl = PLACE_ID
  ? `https://www.google.com/maps/search/?api=1&query=${nombre}&query_place_id=${PLACE_ID}`
  : `https://www.google.com/maps/search/?api=1&query=${nombre}`

// El mapa incrustado va por coordenadas: buscar por nombre deja el pin
// donde Google quiera, y no siempre cae en el local
export const googleMapsEmbedUrl = PLACE_ID
  ? `https://www.google.com/maps?q=place_id:${PLACE_ID}&z=17&output=embed`
  : `https://www.google.com/maps?q=${LAT},${LNG}&z=17&output=embed`

// Con coordenadas para que lleguen al punto exacto
export const wazeUrl = `https://waze.com/ul?ll=${LAT},${LNG}&q=${nombre}&navigate=yes`

export const appleMapsUrl = `https://maps.apple.com/?q=${nombre}&ll=${LAT},${LNG}`
