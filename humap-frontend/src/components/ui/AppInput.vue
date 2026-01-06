<template>
  <div class="app-input-wrapper">
    <label v-if="label" :for="id" class="app-input-label">{{ label }}</label>
    <textarea
      v-if="rows"
      :id="id"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :rows="rows"
      class="app-input"
      @input="$emit('update:modelValue', $event.target.value)"
    />
    <input
      v-else
      :id="id"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      class="app-input"
      @input="$emit('update:modelValue', $event.target.value)"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    default: 'text',
    validator: (value) => ['text', 'email', 'password', 'number', 'tel', 'url'].includes(value),
  },
  placeholder: {
    type: String,
    default: '',
  },
  rows: {
    type: [Number, String],
    default: null,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const id = computed(() => `input-${Math.random().toString(36).substr(2, 9)}`)

defineEmits(['update:modelValue'])
</script>

<style scoped>
.app-input-wrapper {
  display: flex;
  flex-direction: column;
  margin-bottom: var(--spacing-lg);
}

.app-input-label {
  margin-bottom: var(--spacing-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
}

.app-input {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid rgba(230, 221, 210, 0.9);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  background-color: rgba(255, 252, 248, 0.9);
  transition: all var(--transition-fast);
}

.app-input:focus {
  outline: none;
  border-color: rgba(14, 116, 144, 0.7);
  background-color: #ffffff;
  box-shadow: 0 0 0 3px rgba(14, 116, 144, 0.12);
}

.app-input:disabled {
  background-color: var(--color-bg-alt);
  cursor: not-allowed;
}
</style>
