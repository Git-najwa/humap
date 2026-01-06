<template>
  <div v-if="message" class="error-message" role="alert">
    <svg class="error-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
    <span class="error-text">{{ message }}</span>
  </div>
</template>

<script setup>
defineProps({
  message: {
    type: String,
    default: '',
  },
})
</script>

<style scoped>
.error-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  margin-bottom: 1rem;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
}

.error-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
}

.error-text {
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.4;
}
</style>
