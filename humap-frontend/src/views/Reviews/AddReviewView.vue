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

        <div class="form-group">
          <label class="font-medium">Photos (URLs)</label>
          <div class="photo-input-row">
            <AppInput
              v-model="photoUrl"
              placeholder="https://exemple.com/photo.jpg"
              type="url"
            />
            <AppButton variant="secondary" type="button" @click="addPhoto">
              Ajouter
            </AppButton>
          </div>
          <div v-if="form.pictures.length" class="photo-chip-list">
            <span v-for="(url, idx) in form.pictures" :key="`${url}-${idx}`" class="photo-chip">
              {{ url }}
              <button type="button" class="photo-chip-remove" @click="removePhoto(idx)">×</button>
            </span>
          </div>
        </div>

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
  ranking: '',
  comment: '',
  pictures: [],
})
const photoUrl = ref('')

const handleAddReview = async () => {
  try {
    reviewStore.error = null
    if (!form.value.ranking) {
      reviewStore.error = 'Veuillez sélectionner une note.'
      return
    }
    const payload = {
      ...form.value,
      pictures: form.value.pictures.filter(Boolean),
    }
    await reviewStore.createReview(route.params.activityId, payload)
    router.push(`/activities/${route.params.activityId}`)
  } catch (err) {
    console.error(err)
    reviewStore.error = err.response?.data?.message || err.message || 'Impossible de poster l\'avis'
  }
}

const addPhoto = () => {
  const url = photoUrl.value.trim()
  if (!url) return
  if (!form.value.pictures.includes(url)) {
    form.value.pictures.push(url)
  }
  photoUrl.value = ''
}

const removePhoto = (index) => {
  form.value.pictures.splice(index, 1)
}

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.photo-input-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.photo-chip-list {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.photo-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  font-size: 0.75rem;
}

.photo-chip-remove {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.875rem;
  line-height: 1;
  color: #6b7280;
}
</style>
