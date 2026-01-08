<template>
  <div class="container">
    <AppButton variant="secondary" @click="goBack">← Retour</AppButton>

    <ErrorMessage :message="activityStore.error" />

    <div v-if="activityStore.isLoading" class="loading text-tertiary">Chargement de l'activité...</div>

    <div v-else-if="activityStore.currentActivity" class="card" style="margin-top:var(--spacing-md)">
      <div class="flex-between">
        <div>
          <div class="activity-gallery">
            <img
              class="activity-hero"
              :src="activeGalleryImage"
              :alt="activityStore.currentActivity.title"
              loading="lazy"
              @error="handleImageError($event, activityStore.currentActivity)"
            />
            <div v-if="galleryImages.length > 1" class="gallery-thumbs">
              <button
                v-for="(url, idx) in galleryImages"
                :key="`${url}-${idx}`"
                type="button"
                class="gallery-thumb"
                :class="{ active: idx === selectedPhotoIndex }"
                @click="selectedPhotoIndex = idx"
                aria-label="Voir photo"
              >
                <img :src="url" :alt="`Photo ${idx + 1}`" loading="lazy" @error="handleImageError($event, activityStore.currentActivity)" />
              </button>
            </div>
          </div>
          <h1 class="text-2xl font-semibold">{{ activityStore.currentActivity.title }}</h1>
          <div class="category-tags" v-if="getCategoryTags(activityStore.currentActivity).length">
            <span
              v-for="tag in getCategoryTags(activityStore.currentActivity)"
              :key="`detail-${activityStore.currentActivity._id}-${tag}`"
              class="category-tag"
            >
              {{ tag }}
            </span>
          </div>
          <p class="text-secondary" style="margin-top:8px">
            {{ descriptionText }}
          </p>
          <div class="detail-meta">
            <p v-if="getMoodLabel(activityStore.currentActivity)" class="text-tertiary">
              Ambiance : {{ getMoodLabel(activityStore.currentActivity) }}
            </p>
            <p v-if="getBudgetLabel(activityStore.currentActivity.price_range)" class="text-tertiary">
              {{ activityStore.currentActivity.source === 'geoapify' ? 'Budget estimé' : 'Budget' }} :
              {{ getBudgetLabel(activityStore.currentActivity.price_range) }}
            </p>
          </div>
        </div>
        <div class="action-row">
          <AppButton
            v-if="isOwner"
            variant="secondary"
            @click="() => $router.push(`/activities/${activityStore.currentActivity._id}/edit`)"
          >
            <EditIcon :size="16" /> Modifier
          </AppButton>
          <AppButton v-if="isOwner" variant="danger" @click="handleDelete"><DeleteIcon :size="16" /> Supprimer</AppButton>
          <AppButton class="favorite-button" :variant="isLiked ? 'primary' : 'secondary'" @click="addToFavorites">
            <StarFilledIcon v-if="isLiked" :size="16" color="#ffffff" /> {{ isLiked ? 'Favori' : 'Favoris' }}
            <StarEmptyIcon v-if="!isLiked" :size="16" />
          </AppButton>
        </div>
      </div>

      <div class="list-actions" v-if="authStore.user">
        <div v-if="customLists.length" class="list-actions-row">
          <label class="text-tertiary" for="listSelect">Ajouter à une liste</label>
          <select id="listSelect" v-model="selectedListId" name="listSelect" class="input" style="min-width:220px">
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

      <section class="card map-card" v-if="hasCoordinates">
        <div class="flex-between" style="margin-bottom:var(--spacing-md)">
          <div>
            <h2 class="text-xl font-semibold">Localisation</h2>
            <p class="text-tertiary">{{ activityStore.currentActivity.location }}</p>
          </div>
        </div>
        <div ref="mapEl" class="detail-map" aria-label="Carte de l'activité"></div>
      </section>
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
              <template v-for="n in 5" :key="n">
                <StarFilledIcon v-if="n <= review.ranking" :size="16" color="#F59E0B" />
                <StarEmptyIcon v-else :size="16" color="#D1D5DB" />
              </template>
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
import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter, useRoute } from 'vue-router'
import { useActivityStore } from '../../store/activity.store'
import { useReviewStore } from '../../store/review.store'
import { useAuthStore } from '../../store/auth.store'
import { useListStore } from '../../store/list.store'
import ErrorMessageModern from '../../components/ui/ErrorMessage-modern.vue'
import AppButtonModern from '../../components/ui/AppButton-modern.vue'
import { useFavoriteStore } from '../../store/favorite.store'
import { EditIcon, DeleteIcon, StarFilledIcon, StarEmptyIcon } from '../../components/icons'

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

const buildPlaceholder = (seed = 'humap', label = 'Activité locale') => {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  const palettes = [
    ['#f5e7d7', '#f0d9c7', '#e9bfa1', '#d9a887'],
    ['#e6f1f8', '#d7e6f3', '#b9d3ea', '#8fb7dd'],
    ['#f8efe6', '#f4e2d1', '#e3c1a5', '#cf9f82'],
    ['#eef5ea', '#dfe9d6', '#b9cfae', '#9ab88f'],
  ]
  const palette = palettes[hash % palettes.length]
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="900" height="520" viewBox="0 0 900 520">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${palette[0]}"/>
        <stop offset="100%" stop-color="${palette[1]}"/>
      </linearGradient>
    </defs>
    <rect width="900" height="520" fill="url(#bg)"/>
    <circle cx="720" cy="150" r="110" fill="${palette[2]}" opacity="0.7"/>
    <path d="M0 420 L200 300 L360 420 L520 300 L720 420 L900 360 L900 520 L0 520 Z" fill="${palette[2]}"/>
    <path d="M0 350 L150 250 L300 330 L420 250 L600 350 L900 300 L900 520 L0 520 Z" fill="${palette[3]}"/>
    <text x="70" y="140" font-family="Georgia, serif" font-size="38" fill="#7a4f3a">HUMAP</text>
    <text x="70" y="185" font-family="Georgia, serif" font-size="22" fill="#7a4f3a">${label}</text>
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

const hashString = (value = '') => {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

const getExternalPhoto = (activity) => {
  if (activity?.photos?.length) return ''
  if (activity?.source !== 'geoapify') return ''
  const tags = getCategoryTags(activity)
  const query = encodeURIComponent([activity?.title, tags[0], tags[1]].filter(Boolean).join(','))
  if (!query) return ''
  const sig = hashString(activity?._id || activity?.title || query) % 1000
  return `https://source.unsplash.com/featured/900x520?${query}&sig=${sig}`
}

const getActivityImage = (activity) => {
  const seed = activity?._id || activity?.title || 'humap'
  const label = getCategoryTags(activity)[0] || activity?.title || 'Activité locale'
  return (
    activity?.photos?.[0] ||
    activity?.image ||
    activity?.photo ||
    activity?.pictures?.[0] ||
    getExternalPhoto(activity) ||
    buildPlaceholder(seed, label)
  )
}

const handleImageError = (event, activity) => {
  event.target.src = buildPlaceholder(activity?._id || activity?.title || 'humap', getCategoryTags(activity)[0] || activity?.title || 'Activité locale')
}

const galleryImages = computed(() => {
  const photos = activityStore.currentActivity?.photos || []
  if (photos.length) return photos
  return [getActivityImage(activityStore.currentActivity)]
})

const getCategoryTags = (activity) => {
  const categories = Array.isArray(activity?.categories) ? activity.categories : []
  if (categories.length) return categories.slice(0, 5)
  const description = activity?.description || ''
  if (!description || (!description.includes('.') && !description.includes('_'))) return []
  return description
    .split(',')
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => chunk.split('.').pop().replace(/_/g, ' '))
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .filter((value, index, arr) => arr.indexOf(value) === index)
    .slice(0, 5)
}

const getBudgetLabel = (priceRange) => {
  if (priceRange === null || priceRange === undefined) return ''
  if (priceRange === 0) return 'Gratuit'
  const level = Math.max(1, Math.min(3, Number(priceRange)))
  return '€'.repeat(level)
}

const deriveMoodFromCategories = (activity) => {
  const categories = Array.isArray(activity?.categories) ? activity.categories : []
  const haystack = categories.join(' ').toLowerCase()
  if (!haystack) return ''
  if (haystack.includes('natural') || haystack.includes('park') || haystack.includes('garden') || haystack.includes('beach')) {
    return 'calm'
  }
  if (haystack.includes('sport') || haystack.includes('fitness') || haystack.includes('adventure')) {
    return 'energetic'
  }
  if (haystack.includes('catering') || haystack.includes('restaurant') || haystack.includes('bar') || haystack.includes('cafe') || haystack.includes('entertainment')) {
    return 'social'
  }
  if (haystack.includes('culture') || haystack.includes('museum') || haystack.includes('gallery')) {
    return 'calm'
  }
  return ''
}

const getMoodLabel = (activity) => {
  const value = activity?.mood || deriveMoodFromCategories(activity)
  if (!value) return ''
  return value.charAt(0).toUpperCase() + value.slice(1)
}

const selectedPhotoIndex = ref(0)

const activeGalleryImage = computed(() => {
  return galleryImages.value[selectedPhotoIndex.value] || galleryImages.value[0]
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
const mapEl = ref(null)
const mapInstance = ref(null)
const mapMarker = ref(null)

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

const hasCoordinates = computed(() => {
  const coords = activityStore.currentActivity?.coordinates?.coordinates
  return Array.isArray(coords) && coords.length === 2
})

const descriptionText = computed(() => {
  const description = activityStore.currentActivity?.description?.trim()
  if (description) return description
  const categories = getCategoryTags(activityStore.currentActivity)
  if (categories.length) return categories.join(' • ')
  return 'Description non disponible.'
})

const initDetailMap = () => {
  if (!mapEl.value) return
  const { L } = window
  if (!L) return
  const coords = activityStore.currentActivity?.coordinates?.coordinates
  if (!Array.isArray(coords) || coords.length !== 2) return
  const lat = coords[1]
  const lng = coords[0]

  if (!mapInstance.value) {
    mapInstance.value = L.map(mapEl.value, {
      zoomControl: true,
      scrollWheelZoom: false,
    }).setView([lat, lng], 14)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(mapInstance.value)
  } else {
    mapInstance.value.setView([lat, lng], 14, { animate: false })
  }

  if (mapMarker.value) {
    mapMarker.value.remove()
  }
  mapMarker.value = L.marker([lat, lng]).addTo(mapInstance.value)
}

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
    initDetailMap()
  } catch (e) {
    console.error('ActivityDetail load failed', e)
    // leave activityStore.error populated by the store and avoid unhandled rejection
  }
})

watch(
  () => activityStore.currentActivity?._id,
  () => {
    selectedPhotoIndex.value = 0
    initDetailMap()
  }
)

onBeforeUnmount(() => {
  if (mapInstance.value) {
    mapInstance.value.remove()
    mapInstance.value = null
    mapMarker.value = null
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

.activity-hero {
  width: 100%;
  height: 220px;
  object-fit: cover;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  margin-bottom: 12px;
}

.activity-gallery {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.gallery-thumbs {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
}

.gallery-thumb {
  border: 1px solid #e5e7eb;
  padding: 0;
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
  cursor: pointer;
}

.gallery-thumb img {
  width: 100%;
  height: 64px;
  object-fit: cover;
  display: block;
}

.gallery-thumb.active {
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}

.detail-meta {
  margin-top: 8px;
}

.category-tags {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.category-tag {
  padding: 6px 12px;
  font-size: 12px;
  border-radius: 999px;
  background: var(--tag-bg);
  color: var(--tag-text);
  border: 1px solid var(--tag-border);
  backdrop-filter: blur(16px) saturate(140%);
}

.action-row {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.favorite-button {
  margin-top: -4px;
}

.map-card {
  margin-top: var(--spacing-lg);
}

.detail-map {
  width: 100%;
  height: 260px;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}
</style>
