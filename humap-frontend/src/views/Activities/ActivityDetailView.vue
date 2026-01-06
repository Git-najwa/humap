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
          <AppButton :variant="isLiked ? 'primary' : 'secondary'" @click="addToFavorites">{{ isLiked ? '★ Favori' : '☆ Favoris' }}</AppButton>
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
import { useFavoriteStore } from '../../store/favorite.store'

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
    // determine whether current user has liked this activity via favoriteStore
    if (authStore.user) {
      try {
        await favoriteStore.loadFavorites()
        isLiked.value = favoriteStore.favorites.some(f => f._id === route.params.id)
      } catch (e) {
        console.warn('Could not load favorites to determine liked state', e)
      }
    }
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

const addToFavorites = async () => {
  if (!authStore.user) {
    router.push('/login')
    return
  }
  try {
    await favoriteStore.toggleFavorite(activityStore.currentActivity._id)
    // reload favorites and update local flag
    await favoriteStore.loadFavorites()
    isLiked.value = favoriteStore.favorites.some(f => f._id === activityStore.currentActivity._id)
  } catch (e) {
    console.error('addToFavorites failed', e)
  }
}

const isLiked = ref(false)
const favoriteStore = useFavoriteStore()

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
