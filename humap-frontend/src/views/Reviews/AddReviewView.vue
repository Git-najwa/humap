<template>
  <div class="add-review-container container">
    <div class="card">
      <h1 class="text-2xl font-semibold">Ajouter un avis</h1>

      <ErrorMessage :message="reviewStore.error" />

      <form @submit.prevent="handleAddReview" class="review-form">
        <div class="form-group">
          <label for="ranking" class="font-medium">Note (1-5)</label>
          <select v-model.number="form.ranking" id="ranking" class="input" required>
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
          :rows="4"
        />

        <div class="form-actions" style="margin-top:var(--spacing-md)">
          <AppButton
            type="submit"
            :disabled="reviewStore.isLoading"
            variant="primary"
          >
            {{ reviewStore.isLoading ? 'Envoi...' : 'Poster l\'avis' }}
          </AppButton>
          <AppButton variant="secondary" @click="goBack">Annuler</AppButton>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useReviewStore } from '../../store/review.store'
import AppInputModern from '../../components/ui/AppInput-modern.vue'
import AppButtonModern from '../../components/ui/AppButton-modern.vue'
import ErrorMessageModern from '../../components/ui/ErrorMessage-modern.vue'

const AppInput = AppInputModern
const AppButton = AppButtonModern
const ErrorMessage = ErrorMessageModern

const router = useRouter()
const route = useRoute()
const reviewStore = useReviewStore()

const form = ref({
  activity_id: route.params.activityId,
  ranking: '',
  comment: '',
})

const handleAddReview = async () => {
  try {
    reviewStore.error = null
    if (!form.value.ranking) {
      reviewStore.error = 'Veuillez sélectionner une note.'
      return
    }
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
