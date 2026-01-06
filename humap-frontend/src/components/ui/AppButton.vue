<template>
  <button
    :class="[
      'app-button',
      `app-button--${variant}`,
      `app-button--${size}`,
      { 'app-button--loading': loading, 'app-button--full-width': fullWidth }
    ]"
    :disabled="disabled || loading"
    :type="type"
    @click="$emit('click')"
  >
    <span v-if="loading" class="app-button__spinner"></span>
    <span :class="{ 'app-button__content--hidden': loading }">
      <slot></slot>
    </span>
  </button>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'danger', 'ghost', 'outline'].includes(value),
  },
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value),
  },
  type: {
    type: String,
    default: 'button',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  fullWidth: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['click'])
</script>

<style scoped>
.app-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  font-family: inherit;
}

.app-button:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.1);
}

.app-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Sizes */
.app-button--small {
  padding: 0.5rem 1rem;
  font-size: 0.8125rem;
}

.app-button--medium {
  padding: 0.75rem 1.25rem;
  font-size: 0.875rem;
}

.app-button--large {
  padding: 1rem 1.75rem;
  font-size: 1rem;
}

/* Variants */
.app-button--primary {
  background-color: #111827;
  color: white;
}

.app-button--primary:hover:not(:disabled) {
  background-color: #374151;
}

.app-button--secondary {
  background-color: #f3f4f6;
  color: #374151;
}

.app-button--secondary:hover:not(:disabled) {
  background-color: #e5e7eb;
}

.app-button--danger {
  background-color: #dc2626;
  color: white;
}

.app-button--danger:hover:not(:disabled) {
  background-color: #b91c1c;
}

.app-button--ghost {
  background-color: transparent;
  color: #374151;
}

.app-button--ghost:hover:not(:disabled) {
  background-color: #f3f4f6;
}

.app-button--outline {
  background-color: transparent;
  color: #111827;
  border: 1px solid #d1d5db;
}

.app-button--outline:hover:not(:disabled) {
  background-color: #f9fafb;
  border-color: #9ca3af;
}

/* Full Width */
.app-button--full-width {
  width: 100%;
}

/* Loading */
.app-button--loading {
  position: relative;
}

.app-button__spinner {
  position: absolute;
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.app-button__content--hidden {
  visibility: hidden;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
