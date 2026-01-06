<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="['modern-btn', `modern-btn-${variant}`]"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>

<script setup>
defineProps({
  type: { type: String, default: 'button' },
  disabled: { type: Boolean, default: false },
  variant: { type: String, default: 'primary', validator: (v) => ['primary', 'secondary', 'danger'].includes(v) },
})

defineEmits(['click'])
</script>

<style scoped>
.modern-btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  white-space: nowrap;
  box-shadow: var(--shadow-sm);
}

.modern-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.modern-btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.modern-btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-dark);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.modern-btn-primary:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}

.modern-btn-secondary {
  background-color: var(--color-bg-elevated);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  box-shadow: none;
}

.modern-btn-secondary:hover:not(:disabled) {
  background-color: var(--color-bg-alt);
  border-color: var(--color-text-tertiary);
}

.modern-btn-danger {
  background-color: var(--color-accent);
  color: white;
}

.modern-btn-danger:hover:not(:disabled) {
  background-color: #E63946;
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.modern-btn-danger:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}
</style>
