<template>
  <button
    :class="['app-button', `app-button--${variant}`]"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <slot></slot>
  </button>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'danger'].includes(value),
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['click'])
</script>

<style scoped>
.app-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.app-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.app-button--primary {
  background-color: #007bff;
  color: white;
}

.app-button--primary:hover:not(:disabled) {
  background-color: #0056b3;
}

.app-button--secondary {
  background-color: #6c757d;
  color: white;
}

.app-button--secondary:hover:not(:disabled) {
  background-color: #545b62;
}

.app-button--danger {
  background-color: #dc3545;
  color: white;
}

.app-button--danger:hover:not(:disabled) {
  background-color: #c82333;
}
</style>
