<template>
  <div class="activity-detail-container">
    <button @click="goBack" class="back-btn">← Retour</button>

    <ErrorMessage :message="activityStore.error" />

    <div v-if="activityStore.isLoading" class="loading">Chargement de l'activité...</div>

    <div v-else-if="activityStore.currentActivity" class="activity-detail">
      <h1>{{ activityStore.currentActivity.title }}</h1>
      <p class="description">{{ activityStore.currentActivity.description }}</p>
      <div class="details">
        <p><strong>📍 Lieu :</strong> {{ activityStore.currentActivity.location }}</p>
        <p><strong>🎭 Ambiance :</strong> {{ activityStore.currentActivity.mood }}</p>
        <p><strong>💰 Budget :</strong> {{ activityStore.currentActivity.price_range }}</p>
        <p><strong>👥 Nombre de personnes :</strong> {{ activityStore.currentActivity.nb_people }}</p>
      </div>

      <div class="actions">
        <router-link :to="`/reviews/${activityStore.currentActivity._id}`" class="action-link">
          Ajouter un avis
        </router-link>
        <button @click="addToFavorites" class="action-link">⭐ Ajouter aux favoris</button>
      </div>

      <div class="reviews-section">
        <h2>Avis</h2>
        <div v-if="reviews.length === 0" class="no-reviews">Aucun avis pour cette activité</div>
        <div v-else class="reviews-list">
          <div v-for="review in reviews" :key="review._id" class="review">
            <p><strong>{{ review.user_id.username }}</strong> - ⭐ {{ review.rating }}/5</p>
            <p>{{ review.comment }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useActivityStore } from '../../store/activity.store'
import { useReviewStore } from '../../store/review.store'
import ErrorMessage from '../../components/ui/ErrorMessage.vue'

const router = useRouter()
const route = useRoute()
const activityStore = useActivityStore()
const reviewStore = useReviewStore()
const reviews = ref([])

onMounted(async () => {
  await activityStore.fetchActivityById(route.params.id)
  await reviewStore.fetchReviewsByActivity(route.params.id)
  reviews.value = reviewStore.reviews
})

const goBack = () => {
  router.back()
}

const addToFavorites = () => {
  alert('Ajouté aux favoris !')
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
