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
          <AppButton
            v-if="isOwner"
            variant="secondary"
            @click="() => $router.push(`/activities/${activityStore.currentActivity._id}/edit`)"
          >
            ✏️ Modifier
          </AppButton>
          <AppButton v-if="isOwner" variant="danger" @click="handleDelete">🗑️ Supprimer</AppButton>
          <AppButton :variant="isLiked ? 'primary' : 'secondary'" @click="addToFavorites">{{ isLiked ? '★ Favori' : '☆ Favoris' }}</AppButton>
        </div>
      </div>

      <div class="list-actions" v-if="authStore.user">
        <div v-if="customLists.length" class="list-actions-row">
          <label class="text-tertiary" for="listSelect">Ajouter à une liste</label>
          <select id="listSelect" v-model="selectedListId" class="input" style="min-width:220px">
            <option value="">Choisir une liste</option>
            <option v-for="list in customLists" :key="list._id" :value="list._id">
              {{ list.custom_name || 'Sans nom' }}
            </option>
          </select>
          <AppButton
            variant="secondary"
            :disabled="!selectedListId || isActivityInList(activityStore.currentActivity._id, selectedListId)"
            @click="addToCustomList"
          >
            {{ isActivityInList(activityStore.currentActivity._id, selectedListId) ? 'Déjà dans la liste' : 'Ajouter' }}
          </AppButton>
        </div>
        <div v-else class="text-tertiary">
          Aucune liste personnalisée. <a class="link" @click.prevent="router.push('/lists')">Créer une liste</a>
        </div>
      </div>
    </div>

    <section v-if="activityStore.currentActivity" class="card" style="margin-top:var(--spacing-lg)">
      <div class="flex-between" style="margin-bottom:var(--spacing-md)">
        <div>
          <h2 class="text-xl font-semibold">Avis</h2>
          <p class="text-tertiary">
            {{ reviewCount }} avis
            <span v-if="reviewCount > 0">• Note moyenne {{ averageRating }}</span>
          </p>
        </div>
        <AppButton variant="primary" @click="goToAddReview">Ajouter un avis</AppButton>
      </div>

      <div v-if="reviewStore.isLoading" class="loading text-tertiary">Chargement des avis...</div>
      <div v-else-if="reviews.length === 0" class="no-activities">Aucun avis pour le moment.</div>
      <div v-else class="reviews-list">
        <div v-for="review in reviews" :key="review._id" class="review-item">
          <div class="review-header">
            <div class="review-author">
              {{ review.user?.username || 'Utilisateur' }}
            </div>
            <div class="review-rating">
              <span v-for="n in 5" :key="n">{{ n <= review.ranking ? '★' : '☆' }}</span>
            </div>
          </div>
          <p class="review-comment">{{ review.comment || 'Aucun commentaire.' }}</p>
          <div v-if="review.pictures?.length" class="review-photos">
            <img
              v-for="(url, idx) in review.pictures"
              :key="`${review._id}-${idx}`"
              :src="url"
              alt="Photo avis"
              loading="lazy"
            />
          </div>
          <div class="review-actions" v-if="canDeleteReview(review)">
            <AppButton variant="secondary" @click="deleteReview(review._id)">Supprimer</AppButton>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter, useRoute } from 'vue-router'
import { useActivityStore } from '../../store/activity.store'
import { useReviewStore } from '../../store/review.store'
import { useAuthStore } from '../../store/auth.store'
import { useListStore } from '../../store/list.store'
import ErrorMessageModern from '../../components/ui/ErrorMessage-modern.vue'
import AppButtonModern from '../../components/ui/AppButton-modern.vue'
import { useFavoriteStore } from '../../store/favorite.store'

const router = useRouter()
const route = useRoute()
const activityStore = useActivityStore()
const reviewStore = useReviewStore()
const { reviews } = storeToRefs(reviewStore)
const authStore = useAuthStore()
const listStore = useListStore()

// expose modern components to template by importing them
const AppButton = AppButtonModern
const ErrorMessage = ErrorMessageModern

const isOwner = computed(() => {
  const owner = activityStore.currentActivity?.user_id || activityStore.currentActivity?.owner
  const ownerId = typeof owner === 'string' ? owner : owner?._id || owner?.id
  const userId = authStore.user?._id
  return !!(ownerId && userId && ownerId.toString() === userId.toString())
})

const customLists = computed(() => {
  const map = new Map()
  listStore.lists
    .filter(entry => entry.list_type === 'custom')
    .forEach(entry => {
      const name = entry.custom_name?.trim() || 'Sans nom'
      if (!map.has(name)) {
        map.set(name, { _id: entry._id, custom_name: name })
      }
    })
  return Array.from(map.values())
})
const selectedListId = ref('')

const isActivityInList = (activityId, listId) => {
  const baseEntry = listStore.lists.find(entry => entry._id === listId)
  if (!baseEntry) return false
  const listName = baseEntry.custom_name?.trim() || 'Sans nom'
  return listStore.lists.some(entry =>
    entry.list_type === 'custom' &&
    (entry.custom_name?.trim() || 'Sans nom') === listName &&
    entry.activity_id === activityId
  )
}

const reviewCount = computed(() => reviews.value.length)
const averageRating = computed(() => {
  if (!reviews.value.length) return '0.0'
  const total = reviews.value.reduce((sum, review) => sum + (Number(review.ranking) || 0), 0)
  return (total / reviews.value.length).toFixed(1)
})

onMounted(async () => {
  try {
    await activityStore.fetchActivityById(route.params.id)
    await reviewStore.fetchReviewsByActivity(route.params.id)
    if (authStore.user) {
      await listStore.fetchAllLists()
    }
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

const goToAddReview = () => {
  router.push(`/reviews/${route.params.id}`)
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

const addToCustomList = async () => {
  const activityId = activityStore.currentActivity?._id
  if (!selectedListId.value || !activityId) return
  if (isActivityInList(activityId, selectedListId.value)) return
  try {
    await listStore.addActivityToList(selectedListId.value, activityId)
    selectedListId.value = ''
  } catch (e) {
    console.error('addToCustomList failed', e)
  }
}

const isLiked = ref(false)
const favoriteStore = useFavoriteStore()

const handleDelete = async () => {
  if (!activityStore.currentActivity) return
  const shouldDelete = window.confirm('Supprimer cette activité ?')
  if (!shouldDelete) return
  try {
    await activityStore.deleteActivity(activityStore.currentActivity._id)
    router.push('/')
  } catch (e) {
    console.error('delete failed', e)
  }
}

const canDeleteReview = (review) => {
  if (!authStore.user) return false
  return review.user_id === authStore.user._id || review.user?.id === authStore.user._id || authStore.user.role === 'admin'
}

const deleteReview = async (reviewId) => {
  const shouldDelete = window.confirm('Supprimer cet avis ?')
  if (!shouldDelete) return
  try {
    await reviewStore.deleteReview(route.params.id, reviewId)
  } catch (e) {
    console.error('deleteReview failed', e)
  }
}
</script>

<style scoped>
.list-actions {
  margin-top: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.list-actions-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.link {
  color: #6366f1;
  text-decoration: none;
  font-weight: 500;
}

.link:hover {
  text-decoration: underline;
}

.review-photos {
  margin-top: 8px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
}

.review-photos img {
  width: 100%;
  height: 90px;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
}
</style>
