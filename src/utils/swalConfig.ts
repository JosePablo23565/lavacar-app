import Swal from 'sweetalert2'

// Estilo común a todos los mensajes, para que se vean igual en toda la página
const base = {
  background: '#2d2d2d',
  color: '#e9e9e9',
  backdrop: 'rgba(0, 0, 0, 0.6)',
  customClass: {
    popup: 'swal-glass-popup',
    confirmButton: 'swal-confirm-btn',
    cancelButton: 'swal-cancel-btn',
  },
} as const

export const swalConfirm = (title: string, text?: string) => {
  return Swal.fire({
    ...base,
    title,
    text: text || '',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí',
    cancelButtonText: 'No',
    reverseButtons: true,
    confirmButtonColor: '#e0142c',
    cancelButtonColor: '#ef4444',
  })
}

export const swalSuccess = (title: string, text?: string) => {
  return Swal.fire({
    ...base,
    title,
    text: text || '',
    icon: 'success',
    confirmButtonText: 'OK',
    confirmButtonColor: '#e0142c',
    timer: 2000,
    showConfirmButton: true,
  })
}

export const swalError = (title: string, text?: string) => {
  return Swal.fire({
    ...base,
    title,
    text: text || '',
    icon: 'error',
    confirmButtonText: 'OK',
    confirmButtonColor: '#ef4444',
  })
}

// Para avisar algo que no es un error del sistema: falta un dato,
// el cupo se acabó, el día se cerró...
export const swalAviso = (title: string, text?: string) => {
  return Swal.fire({
    ...base,
    title,
    text: text || '',
    icon: 'warning',
    confirmButtonText: 'Entendido',
    confirmButtonColor: '#e0142c',
  })
}
