<template>
  <div class="input-wrapper">
    <label v-if="label" class="input-label">{{ label }}</label>
    <input
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :required="required"
      @input="$emit('update:modelValue', $event.target.value)"
      class="modern-input"
    />
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: [String, Number], default: '' },
  type: { type: String, default: 'text' },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  required: { type: Boolean, default: false },
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
}

.input-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
}

.modern-input {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  font-family: inherit;
  background-color: var(--color-bg-elevated);
  color: var(--color-text);
  transition: all var(--transition-fast);
}

.modern-input::placeholder {
  color: var(--color-text-tertiary);
}

.modern-input:focus {
  outline: none;
  border-color: var(--color-primary);
  background-color: var(--color-bg);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.modern-input:disabled {
  background-color: var(--color-bg-alt);
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
