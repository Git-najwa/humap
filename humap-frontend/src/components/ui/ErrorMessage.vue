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
  padding: 1rem;
  margin-bottom: 1rem;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 0.5rem;
  color: #721c24;
}
</style>
