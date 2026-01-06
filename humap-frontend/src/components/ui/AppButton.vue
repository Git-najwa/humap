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
  padding: var(--spacing-sm) var(--spacing-lg);
  border: none;
  border-radius: var(--radius-lg);
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

.app-button--primary {
  background: linear-gradient(135deg, #0E7490 0%, #0B4C5F 100%);
  color: white;
}

.app-button--primary:hover:not(:disabled) {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.app-button--secondary {
  background-color: var(--color-bg-elevated);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  box-shadow: none;
}

.app-button--secondary:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.9);
  border-color: rgba(124, 139, 154, 0.4);
}

.app-button--danger {
  background-color: var(--color-accent);
  color: white;
}

.app-button--danger:hover:not(:disabled) {
  background-color: #BE123C;
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.app-button:focus-visible {
  outline: 2px solid rgba(14, 116, 144, 0.35);
  outline-offset: 2px;
}
</style>
