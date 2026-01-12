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
  padding: var(--spacing-sm) var(--spacing-lg);
  border: none;
  border-radius: var(--radius-pill);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
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
  background: linear-gradient(135deg, #e5dbcf 0%, #c2b1a1 100%);
  color: #3a2a1a;
}

.app-button--primary:hover:not(:disabled) {
  background-color: var(--color-primary-dark);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.app-button--secondary {
  background-color: var(--glass-bg);
  color: var(--color-text);
  border: 1px solid var(--glass-border);
  box-shadow: none;
  backdrop-filter: blur(20px) saturate(140%);
}

.app-button--secondary:hover:not(:disabled) {
  background-color: var(--glass-bg-strong);
  border-color: rgba(124, 139, 154, 0.4);
}

.app-button--danger {
  background-color: var(--color-accent);
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
  background-color: rgba(255, 255, 255, 0.2);
}

.app-button--outline {
  background-color: transparent;
  color: #111827;
  border: 1px solid var(--glass-border);
}

.app-button--outline:hover:not(:disabled) {
  background-color: var(--glass-bg);
  border-color: rgba(124, 139, 154, 0.4);
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
