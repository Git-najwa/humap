<template>
  <div class="add-review-container">
    <h1>Ajouter un avis</h1>

    <ErrorMessage :message="reviewStore.error" />

    <form @submit.prevent="handleAddReview" class="review-form">
      <div class="form-group">
        <label for="rating">Note (1-5)</label>
        <select v-model.number="form.rating" id="rating" required>
          <option value="">-- Choisir une note --</option>
          <option value="1">1 - Mauvais</option>
          <option value="2">2 - Moyen</option>
          <option value="3">3 - Acceptable</option>
          <option value="4">4 - Bon</option>
          <option value="5">5 - Excellent</option>
        </select>
      </div>

      <AppInput
        v-model="form.comment"
        label="Commentaire"
        placeholder="Partager votre expérience..."
        required
      />

      <div class="form-actions">
        <AppButton
          type="submit"
          :disabled="reviewStore.isLoading"
        >
          {{ reviewStore.isLoading ? 'Envoi...' : 'Poster l\'avis' }}
        </AppButton>
        <button type="button" @click="goBack" class="cancel-btn">
          Annuler
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useReviewStore } from '../../store/review.store'
import AppInput from '../../components/ui/AppInput.vue'
import AppButton from '../../components/ui/AppButton.vue'
import ErrorMessage from '../../components/ui/ErrorMessage.vue'

const router = useRouter()
const route = useRoute()
const reviewStore = useReviewStore()

const form = ref({
  activity_id: route.params.activityId,
  rating: '',
  comment: '',
})

const handleAddReview = async () => {
  try {
    await reviewStore.createReview(form.value)
    router.back()
  } catch (err) {
    console.error(err)
    reviewStore.error = err.response?.data?.message || err.message || 'Impossible de poster l\'avis'
  }
}

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.add-review-container {
  padding: 2rem;
  max-width: 600px;
  margin: 0 auto;
}

h1 {
  text-align: center;
  margin-bottom: 2rem;
}

.review-form {
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 0.5rem;
  font-size: 1rem;
}

.form-group select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.cancel-btn {
  flex: 1;
  padding: 0.75rem 1.5rem;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.3s;
}

.cancel-btn:hover {
  background-color: #545b62;
}
</style>
