<template>
  <div v-if="message" class="error-message">
    <strong>Erreur :</strong> {{ message }}
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
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  background-color: rgba(254, 226, 226, 0.8);
  border: 1px solid rgba(254, 202, 202, 0.8);
  border-radius: var(--radius-lg);
  color: #B91C1C;
  font-weight: var(--font-weight-medium);
}
</style>
