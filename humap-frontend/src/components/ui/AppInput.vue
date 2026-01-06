<template>
  <div :class="['app-input-wrapper', { 'app-input-wrapper--error': error }]">
    <label v-if="label" :for="id" class="app-input-label">
      {{ label }}
      <span v-if="required" class="app-input-required">*</span>
    </label>
    <div class="app-input-container">
      <span v-if="$slots.prefix" class="app-input-prefix">
        <slot name="prefix"></slot>
      </span>
      <input
        :id="id"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :class="[
          'app-input',
          { 'app-input--with-prefix': $slots.prefix },
          { 'app-input--with-suffix': $slots.suffix }
        ]"
        @input="$emit('update:modelValue', $event.target.value)"
        @blur="$emit('blur')"
        @focus="$emit('focus')"
      />
      <span v-if="$slots.suffix" class="app-input-suffix">
        <slot name="suffix"></slot>
      </span>
    </div>
    <p v-if="error" class="app-input-error">{{ error }}</p>
    <p v-else-if="hint" class="app-input-hint">{{ hint }}</p>
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
    validator: (value) => ['text', 'email', 'password', 'number', 'tel', 'url', 'search'].includes(value),
  },
  placeholder: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  required: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
  hint: {
    type: String,
    default: '',
  },
})

const id = computed(() => `input-${Math.random().toString(36).substr(2, 9)}`)

defineEmits(['update:modelValue', 'blur', 'focus'])
</script>

<style scoped>
.app-input-wrapper {
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
}

.app-input-label {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.app-input-required {
  color: #dc2626;
}

.app-input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.app-input-prefix,
.app-input-suffix {
  position: absolute;
  display: flex;
  align-items: center;
  color: #9ca3af;
  pointer-events: none;
}

.app-input-prefix {
  left: 0.875rem;
}

.app-input-suffix {
  right: 0.875rem;
}

.app-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-family: inherit;
  color: #111827;
  background-color: white;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.app-input::placeholder {
  color: #9ca3af;
}

.app-input:focus {
  outline: none;
  border-color: #111827;
  box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.08);
}

.app-input:disabled {
  background-color: #f9fafb;
  color: #9ca3af;
  cursor: not-allowed;
}

.app-input--with-prefix {
  padding-left: 2.5rem;
}

.app-input--with-suffix {
  padding-right: 2.5rem;
}

/* Error State */
.app-input-wrapper--error .app-input {
  border-color: #dc2626;
}

.app-input-wrapper--error .app-input:focus {
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.app-input-error {
  margin: 0.375rem 0 0 0;
  font-size: 0.8125rem;
  color: #dc2626;
}

.app-input-hint {
  margin: 0.375rem 0 0 0;
  font-size: 0.8125rem;
  color: #6b7280;
}
</style>
