<template>
  <div class="input-wrapper">
    <label v-if="label" class="input-label">{{ label }}</label>
    <textarea
      v-if="rows"
      :value="modelValue"
      :placeholder="placeholder"
      :required="required"
      :rows="rows"
      @input="$emit('update:modelValue', $event.target.value)"
      class="modern-input"
    />
    <input
      v-else
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
  rows: { type: [Number, String], default: null },
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
  border: 1px solid rgba(230, 221, 210, 0.9);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  font-family: inherit;
  background-color: rgba(255, 252, 248, 0.9);
  color: var(--color-text);
  transition: all var(--transition-fast);
}

.modern-input::placeholder {
  color: var(--color-text-tertiary);
}

.modern-input:focus {
  outline: none;
  border-color: rgba(14, 116, 144, 0.7);
  background-color: #ffffff;
  box-shadow: 0 0 0 3px rgba(14, 116, 144, 0.12);
}

.modern-input:disabled {
  background-color: var(--color-bg-alt);
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
