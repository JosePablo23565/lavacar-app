// Datos de ubicación del negocio. Los usan Home y Contacto para que los
// enlaces de mapas sean siempre los mismos en toda la página.

// Debe ser EXACTAMENTE el nombre con el que el negocio está registrado en
// Google Maps: es lo que hace que se abra su ficha y no un pin suelto.
export const NOMBRE_NEGOCIO = 'Auto Lavado y Servicios Camaro Fraterno'

export const LAT = 10.5218292
export const LNG = -85.2548688

// WhatsApp del negocio (con código de país: wa.me lo necesita completo)
export const WHATSAPP_NEGOCIO = '50683606680'
export const WHATSAPP_NEGOCIO_VISIBLE = '+506 8360-6680'

// Redes sociales del negocio
export const FACEBOOK_URL = 'https://www.facebook.com/profile.php?id=100064073801428&locale=es_LA'
export const INSTAGRAM_URL = 'https://www.instagram.com/camaro_fraterno'

export const whatsappNegocioUrl = (mensaje?: string) =>
  mensaje
    ? `https://wa.me/${WHATSAPP_NEGOCIO}?text=${encodeURIComponent(mensaje)}`
    : `https://wa.me/${WHATSAPP_NEGOCIO}`

// Opcional pero recomendado: el Place ID del negocio en Google.
// Con él, el enlace abre siempre la ficha correcta aunque existan lugares
// con nombre parecido. Se obtiene en: https://developers.google.com/maps/documentation/places/web-service/place-id
export const PLACE_ID = ''

const nombre = encodeURIComponent(NOMBRE_NEGOCIO)

// Abre la ficha del negocio (con su nombre, fotos, horario y reseñas),
// en vez de dejar un pin generico en unas coordenadas.
export const googleMapsUrl = PLACE_ID
  ? `https://www.google.com/maps/search/?api=1&query=${nombre}&query_place_id=${PLACE_ID}`
  : `https://www.google.com/maps/search/?api=1&query=${nombre}`

// Mapa incrustado: busca por nombre para que salga la etiqueta del negocio
export const googleMapsEmbedUrl = PLACE_ID
  ? `https://www.google.com/maps?q=place_id:${PLACE_ID}&z=17&output=embed`
  : `https://www.google.com/maps?q=${nombre}&z=17&output=embed`

// Waze y Apple Maps son apps de navegacion: se les pasa el nombre y ademas
// las coordenadas, para que lleguen al punto exacto aunque no encuentren la ficha.
export const wazeUrl = `https://waze.com/ul?ll=${LAT},${LNG}&q=${nombre}&navigate=yes`

export const appleMapsUrl = `https://maps.apple.com/?q=${nombre}&ll=${LAT},${LNG}`
