<template>
  <div class="input-wrapper">
    <label v-if="label" class="input-label" :for="inputId">{{ label }}</label>
    <textarea
      v-if="rows"
      ref="inputEl"
      :id="inputId"
      :name="inputName"
      :value="modelValue"
      :placeholder="placeholder"
      :required="required"
      :rows="rows"
      @input="$emit('update:modelValue', $event.target.value)"
      class="modern-input"
    />
    <input
      v-else
      ref="inputEl"
      :id="inputId"
      :name="inputName"
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
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  type: { type: String, default: 'text' },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  rows: { type: [Number, String], default: null },
  required: { type: Boolean, default: false },
  name: { type: String, default: '' },
})

defineEmits(['update:modelValue'])

const inputEl = ref(null)
const inputId = computed(() => `input-${Math.random().toString(36).slice(2, 9)}`)
const inputName = computed(() => props.name || inputId.value)

const focus = () => {
  inputEl.value?.focus()
}

defineExpose({ focus })
</script>

<style scoped>
.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin-bottom: var(--spacing-md);
}

.input-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
}

.modern-input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-sm);
  font-family: inherit;
  background-color: #ffffff;
  color: var(--color-text);
  transition: all var(--transition-fast);
  line-height: 1.5;
}

.modern-input::placeholder {
  color: var(--color-text-tertiary);
}

.modern-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(14, 116, 144, 0.1);
}

.modern-input:disabled {
  background-color: var(--color-bg-alt);
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
