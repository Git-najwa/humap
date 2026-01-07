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
  padding: 0.5rem 1rem;
  border-radius: var(--radius-lg);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  white-space: nowrap;
}

.modern-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modern-btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.modern-btn-primary {
  background-color: var(--color-primary);
  color: white;
  box-shadow: var(--shadow-sm);
}

.modern-btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-dark);
  box-shadow: var(--shadow-md);
}

.modern-btn-primary:active:not(:disabled) {
  box-shadow: var(--shadow-sm);
}

.modern-btn-secondary {
  background-color: #ffffff;
  color: var(--color-text);
  border: 1px solid var(--color-border);
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
  background-color: #b91c1c;
}

</style>
