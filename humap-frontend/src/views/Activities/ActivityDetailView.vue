<template>
  <div class="container">
    <AppButton variant="secondary" @click="goBack">← Retour</AppButton>

    <ErrorMessage :message="activityStore.error" />

    <div v-if="activityStore.isLoading" class="loading text-tertiary">Chargement de l'activité...</div>

    <div v-else-if="activityStore.currentActivity" class="card" style="margin-top:var(--spacing-md)">
      <div class="flex-between">
        <div>
          <h1 class="text-2xl font-semibold">{{ activityStore.currentActivity.title }}</h1>
          <p class="text-secondary" style="margin-top:8px">{{ activityStore.currentActivity.description }}</p>
        </div>
        <div class="flex-col" style="gap:8px">
          <AppButton v-if="isOwner" variant="secondary" @click="() => $router.push(`/activities/${activityStore.currentActivity._id}/edit`)">✏️ Modifier</AppButton>
          <AppButton variant="primary" @click="addToFavorites">⭐ Favoris</AppButton>
        </div>
      </div>

      <div class="details" style="margin-top:var(--spacing-md);display:flex;gap:12px;align-items:center;justify-content:space-between">
        <div>
          <p class="text-tertiary">📍 {{ activityStore.currentActivity.location }}</p>
          <p class="text-tertiary">🎭 {{ activityStore.currentActivity.mood }}</p>
        </div>
        <div>
          <p class="text-tertiary">💰 {{ activityStore.currentActivity.price_range }}</p>
          <p class="text-tertiary">👥 {{ activityStore.currentActivity.nb_people }}</p>
        </div>
      </div>

      <div class="actions" style="margin-top:var(--spacing-md);display:flex;gap:12px">
        <router-link :to="`/reviews/${activityStore.currentActivity._id}`">
          <AppButton variant="secondary">Ajouter un avis</AppButton>
        </router-link>
        <AppButton variant="secondary" @click="refreshReviews">↻ Rafraîchir avis</AppButton>
        <AppButton v-if="isOwner" variant="danger" @click="handleDelete">🗑️ Supprimer</AppButton>
      </div>

      <div class="reviews-section" style="margin-top:var(--spacing-md)">
        <h2 class="font-semibold">Avis</h2>
        <div v-if="reviews.length === 0" class="no-reviews text-tertiary">Aucun avis pour cette activité</div>
        <div v-else class="reviews-list" style="margin-top:var(--spacing-md)">
          <div v-for="review in reviews" :key="review._id" class="card" style="margin-bottom:var(--spacing-sm)">
            <p class="font-medium">{{ review.user_id.username }} - ⭐ {{ review.ranking }}/5</p>
            <p class="text-secondary" style="margin-top:6px">{{ review.comment }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useActivityStore } from '../../store/activity.store'
import { useReviewStore } from '../../store/review.store'
import { useAuthStore } from '../../store/auth.store'
import ErrorMessageModern from '../../components/ui/ErrorMessage-modern.vue'
import AppButtonModern from '../../components/ui/AppButton-modern.vue'

const router = useRouter()
const route = useRoute()
const activityStore = useActivityStore()
const reviewStore = useReviewStore()
// keep reviews reactive directly from the store
const reviews = reviewStore.reviews
const authStore = useAuthStore()

// expose modern components to template by importing them
const AppButton = AppButtonModern
const ErrorMessage = ErrorMessageModern

const isOwner = computed(() => {
  const ownerId = activityStore.currentActivity?.user_id || activityStore.currentActivity?.owner
  return !!(authStore.user && ownerId && authStore.user._id === ownerId)
})

onMounted(async () => {
  try {
    await activityStore.fetchActivityById(route.params.id)
    await reviewStore.fetchReviewsByActivity(route.params.id)
  } catch (e) {
    console.error('ActivityDetail load failed', e)
    // leave activityStore.error populated by the store and avoid unhandled rejection
  }
})

const refreshReviews = async () => {
  try {
    await reviewStore.fetchReviewsByActivity(route.params.id)
  } catch (e) {
    console.error('refreshReviews failed', e)
  }
}

const goBack = () => {
  router.back()
}

const addToFavorites = () => {
  alert('Ajouté aux favoris !')
}

const handleDelete = async () => {
  if (!activityStore.currentActivity) return
  try {
    await activityStore.deleteActivity(activityStore.currentActivity._id)
    router.push('/')
  } catch (e) {
    console.error('delete failed', e)
  }
}
</script>

<style scoped>
.activity-detail-container {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.back-btn {
  padding: 0.5rem 1rem;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  margin-bottom: 1rem;
}

.back-btn:hover {
  background-color: #545b62;
}

.activity-detail {
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h1 {
  margin-top: 0;
  color: #333;
}

.description {
  font-size: 1.1rem;
  color: #666;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.details {
  background-color: #f8f9fa;
  padding: 1.5rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
}

.details p {
  margin: 0.5rem 0;
}

.actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.action-link {
  padding: 0.75rem 1.5rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  text-decoration: none;
  font-weight: 600;
  transition: background-color 0.3s;
}

.action-link:hover {
  background-color: #0056b3;
}

.reviews-section {
  margin-top: 2rem;
  border-top: 1px solid #ddd;
  padding-top: 1.5rem;
}

.reviews-section h2 {
  margin-top: 0;
}

.no-reviews {
  color: #999;
  text-align: center;
  padding: 1rem;
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.review {
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 0.5rem;
}

.review p {
  margin: 0.5rem 0;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
}
</style>
