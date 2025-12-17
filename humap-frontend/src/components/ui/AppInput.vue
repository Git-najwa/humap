<template>
  <div class="app-input-wrapper">
    <label v-if="label" :for="id" class="app-input-label">{{ label }}</label>
    <input
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
  margin-bottom: 1rem;
}

.app-input-label {
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.app-input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.app-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.app-input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}
</style>
