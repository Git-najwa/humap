import { ref } from 'vue'

export const useForm = (initialValues = {}) => {
  const form = ref({ ...initialValues })
  const errors = ref({})

  const reset = () => {
    form.value = { ...initialValues }
    errors.value = {}
  }

  const setError = (field, message) => {
    errors.value[field] = message
  }

  const clearErrors = () => {
    errors.value = {}
  }

  return {
    form,
    errors,
    reset,
    setError,
    clearErrors,
  }
}
