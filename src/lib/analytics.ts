/**
 * Camaro Fraterno - Módulo de Analítica y Métricas Web
 * Compatible con Google Analytics (gtag), Vercel Web Analytics y telemetría ligera.
 * Respeta el consentimiento de privacidad del usuario (GDPR / Políticas de cookies).
 */

declare global {
  interface Window {
    va?: (event: string, properties?: Record<string, unknown>) => void
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

/**
 * Verifica si el usuario ha otorgado consentimiento para analítica
 */
export function tieneConsentimientoAnalitica(): boolean {
  try {
    const consent = localStorage.getItem('camaro_cookies_consent')
    return consent === 'all'
  } catch {
    return false
  }
}

/**
 * Registra una vista de página
 */
export function trackPageView(url: string) {
  try {
    if (!tieneConsentimientoAnalitica()) return

    // Vercel Analytics
    if (typeof window.va === 'function') {
      window.va('pageview', { path: url })
    }

    // Google Analytics (si se añade ID de medición GA4)
    if (typeof window.gtag === 'function') {
      window.gtag('config', 'GA_MEASUREMENT_ID', {
        page_path: url,
      })
    }

    // Registro interno en desarrollo
    if (import.meta.env.DEV) {
      console.log(`[Analytics] PageView: ${url}`)
    }
  } catch (err) {
    console.debug('[Analytics] Error tracking pageview:', err)
  }
}

/**
 * Registra un evento de conversión clave (ej: agendar cita, clic a WhatsApp, ver mapa)
 */
export function trackEvent(name: string, data?: Record<string, unknown>) {
  try {
    if (!tieneConsentimientoAnalitica()) return

    if (typeof window.va === 'function') {
      window.va('event', { name, ...data })
    }

    if (typeof window.gtag === 'function') {
      window.gtag('event', name, data)
    }

    if (import.meta.env.DEV) {
      console.log(`[Analytics] Evento: ${name}`, data)
    }
  } catch (err) {
    console.debug('[Analytics] Error tracking event:', err)
  }
}
