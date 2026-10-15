import Swal from 'sweetalert2'

// Estilo sobrio y profesional para todas las alertas
const base = {
  background: '#121212',
  color: '#ffffff',
  backdrop: 'rgba(0, 0, 0, 0.82)',
  buttonsStyling: false,
  customClass: {
    popup: 'swal-glass-popup',
    title: 'swal-title-luxury',
    htmlContainer: 'swal-text-luxury',
    confirmButton: 'swal-confirm-btn',
    cancelButton: 'swal-cancel-btn',
    actions: 'swal-actions-luxury',
  },
} as const

export const swalConfirm = (title: string, text?: string) => {
  return Swal.fire({
    ...base,
    title,
    text: text || '',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, continuar',
    cancelButtonText: 'Cancelar',
    reverseButtons: true,
  })
}

export const swalSuccess = (title: string, text?: string) => {
  return Swal.fire({
    ...base,
    title,
    text: text || '',
    icon: 'success',
    confirmButtonText: 'Aceptar',
    timer: 2200,
    showConfirmButton: true,
  })
}

export const swalError = (title: string, text?: string) => {
  return Swal.fire({
    ...base,
    title,
    text: text || '',
    icon: 'error',
    confirmButtonText: 'Entendido',
  })
}

// Avisos que no son errores del sistema
export const swalAviso = (title: string, text?: string) => {
  return Swal.fire({
    ...base,
    title,
    text: text || '',
    icon: 'warning',
    confirmButtonText: 'Entendido',
  })
}
