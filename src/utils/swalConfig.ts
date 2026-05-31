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
    background: '#1e293b',
    color: '#e2e8f0',
    confirmButtonColor: '#0eb8d0',
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
    background: '#1e293b',
    color: '#e2e8f0',
    confirmButtonColor: '#0eb8d0',
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
    background: '#1e293b',
    color: '#e2e8f0',
    confirmButtonColor: '#ef4444',
  })
}