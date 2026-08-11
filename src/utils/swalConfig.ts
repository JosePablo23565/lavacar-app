import Swal from 'sweetalert2'

export const swalConfirm = (title: string, text?: string) => {
  return Swal.fire({
    title: title,
    text: text || '',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí',
    cancelButtonText: 'No',
    reverseButtons: true,
    background: '#2d2d2d',
    color: '#e9e9e9',
    confirmButtonColor: '#e0142c',
    cancelButtonColor: '#ef4444',
    customClass: {
      popup: 'swal-glass-popup',
      confirmButton: 'swal-confirm-btn',
      cancelButton: 'swal-cancel-btn',
    },
    backdrop: `rgba(0, 0, 0, 0.6)`,
  })
}

export const swalSuccess = (title: string, text?: string) => {
  return Swal.fire({
    title: title,
    text: text || '',
    icon: 'success',
    confirmButtonText: 'OK',
    background: '#2d2d2d',
    color: '#e9e9e9',
    confirmButtonColor: '#e0142c',
    timer: 2000,
    showConfirmButton: true,
  })
}

export const swalError = (title: string, text?: string) => {
  return Swal.fire({
    title: title,
    text: text || '',
    icon: 'error',
    confirmButtonText: 'OK',
    background: '#2d2d2d',
    color: '#e9e9e9',
    confirmButtonColor: '#ef4444',
  })
}