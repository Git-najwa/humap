import { ref } from 'vue'

const toasts = ref([])
let toastId = 0

export function useToast() {
  const addToast = ({ type = 'info', title, message, duration = 5000 }) => {
    const id = ++toastId
    toasts.value.push({ id, type, title, message })
    
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration)
    }
    
    return id
  }

  const removeToast = (id) => {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }

  const success = (title, message) => addToast({ type: 'success', title, message })
  const info = (title, message) => addToast({ type: 'info', title, message })

  return {
    toasts,
    addToast,
    removeToast,
    success,
    info,
  }
}

export default useToast
