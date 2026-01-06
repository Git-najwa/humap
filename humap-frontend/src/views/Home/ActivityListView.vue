<template>
  <div class="activity-list-container">
    <header class="header container">
      <h1 class="text-2xl font-semibold">Activités HUMAP</h1>
      <div class="flex gap-sm">
        <router-link to="/activities/create">
          <AppButtonModern variant="primary">+ Nouvelle activité</AppButtonModern>
        </router-link>
      </div>
    </header>

    <section class="map-section container card">
      <div class="map-header">
        <div>
          <h2 class="text-xl font-semibold">Carte des activités</h2>
          <p class="text-tertiary">Explorez les activités proches.</p>
        </div>
        <div v-if="!hasMapData" class="map-empty">Aucune activité géolocalisée.</div>
      </div>
      <div ref="mapEl" class="activity-map" aria-label="Carte des activités"></div>
    </section>

    <!-- Error Message -->
    <ErrorMessage :message="activityStore.error" />

    <section class="filters container card" style="display:flex;gap:12px;align-items:center;margin-bottom:var(--spacing-lg)">
      <AppInputModern v-model="q" placeholder="Recherche..." />
      <select v-model="mood" class="input" style="width:180px">
        <option value="">Tous les moods</option>
        <option value="calm">calm</option>
        <option value="social">social</option>
        <option value="energetic">energetic</option>
      </select>
      <AppInputModern v-model.number="price_max" type="number" placeholder="Prix max" style="width:120px" />
      <AppInputModern v-model.number="nb_people" type="number" placeholder="Nb personnes" style="width:120px" />
      <AppButtonModern variant="primary" @click="applyFilters">Filtrer</AppButtonModern>
      <AppButtonModern variant="secondary" @click="resetFilters">Réinitialiser</AppButtonModern>
    </section>

    <div v-if="activityStore.isLoading" class="loading">Chargement des activités...</div>

    <!-- Empty State -->
    <div v-else-if="activityStore.activities.length === 0" class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M8 12h8"></path>
      </svg>
      <h3>Aucune activité</h3>
      <p>Soyez le premier à créer une activité</p>
      <router-link to="/activities/create" class="empty-state-btn">Créer une activité</router-link>
    </div>

    <div v-else class="activities-grid container grid grid-cols-3">
      <div v-for="activity in activityStore.activities" :key="activity._id" class="card activity-card" style="position:relative;">
        <button class="favorite-badge" @click.prevent="toggleFavorite(activity._id)">
          <span v-if="isFavorited(activity._id)">★</span>
          <span v-else>☆</span>
        </button>
        <h3 class="text-lg font-semibold">{{ activity.title }}</h3>
        <p class="text-secondary" style="margin-top:8px">{{ activity.description }}</p>
        <div style="margin-top:12px;display:flex;justify-content:space-between;align-items:center">
          <div>
            <p class="location text-tertiary">📍 {{ activity.location }}</p>
            <p class="mood text-tertiary">Ambiance : {{ activity.mood }}</p>
          </div>
          <router-link :to="`/activities/${activity._id}`">
            <AppButtonModern variant="secondary">Voir</AppButtonModern>
          </router-link>
        </div>
        <div v-if="authStore.user && customLists.length" class="list-inline">
          <select
            v-model="selectedListByActivity[activity._id]"
            class="input"
          >
            <option value="">Ajouter à une liste</option>
            <option v-for="list in customLists" :key="list._id" :value="list._id">
              {{ list.custom_name || 'Sans nom' }}
            </option>
          </select>
          <AppButtonModern
            variant="secondary"
            :disabled="!selectedListByActivity[activity._id] || isActivityInList(activity._id, selectedListByActivity[activity._id])"
            @click="addToCustomList(activity._id)"
          >
            {{ isActivityInList(activity._id, selectedListByActivity[activity._id]) ? 'Déjà dans la liste' : 'Ajouter' }}
          </AppButtonModern>
        </div>
      </div>
    </div>

    <div
      v-if="pagination.total > pagination.limit"
      class="pagination container"
      style="display:flex;gap:12px;align-items:center;justify-content:center;margin-top:var(--spacing-lg)"
    >
      <AppButtonModern variant="secondary" @click="goToPage(pagination.page - 1)" :disabled="pagination.page <= 1">Préc</AppButtonModern>
      <span class="text-sm text-tertiary">Page {{ pagination.page }} / {{ pagination.totalPages || Math.ceil(pagination.total / pagination.limit) }}</span>
      <AppButtonModern
        variant="secondary"
        @click="goToPage(pagination.page + 1)"
        :disabled="pagination.page >= (pagination.totalPages || Math.ceil(pagination.total / pagination.limit))"
      >
        Suiv
      </AppButtonModern>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useActivityStore } from '../../store/activity.store'
import { useAuthStore } from '../../store/auth.store'
import { useFavoriteStore } from '../../store/favorite.store'
import { useListStore } from '../../store/list.store'
import ErrorMessageModern from '../../components/ui/ErrorMessage-modern.vue'
import AppInputModern from '../../components/ui/AppInput-modern.vue'
import AppButtonModern from '../../components/ui/AppButton-modern.vue'

const activityStore = useActivityStore()
const router = useRouter()
const authStore = useAuthStore()
const favoriteStore = useFavoriteStore()
const listStore = useListStore()

const { pagination } = storeToRefs(activityStore)
const { favorites } = storeToRefs(favoriteStore)

const ErrorMessage = ErrorMessageModern

const q = ref('')
const mood = ref('')
const price_max = ref(null)
const nb_people = ref(null)
const mapEl = ref(null)
const mapInstance = ref(null)
const markerLayer = ref(null)

const hasMapData = computed(() => {
  return activityStore.activities.some(activity => {
    const coords = activity.coordinates?.coordinates
    return Array.isArray(coords) && coords.length === 2
  })
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
const selectedListByActivity = ref({})

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

const buildFilters = () => {
  const filters = {}
  if (q.value) filters.q = q.value
  if (mood.value) filters.mood = mood.value
  if (price_max.value !== null && price_max.value !== '') filters.price_max = price_max.value
  if (nb_people.value !== null && nb_people.value !== '') filters.nb_people = nb_people.value
  return filters
}

onMounted(async () => {
  try {
    await activityStore.fetchActivities()
    await favoriteStore.loadFavorites()
    if (authStore.user) {
      await listStore.fetchAllLists()
    }
    initMap()
    refreshMapMarkers()
  } catch (err) {
    console.error(err)
  }
})

onBeforeUnmount(() => {
  if (mapInstance.value) {
    mapInstance.value.remove()
    mapInstance.value = null
  }
})

watch(
  () => activityStore.activities,
  () => {
    refreshMapMarkers()
  },
  { deep: true }
)

const applyFilters = async () => {
  try {
    await activityStore.applyFilters(buildFilters())
  } catch (err) {
    console.error(err)
  }
}

const resetFilters = async () => {
  q.value = ''
  mood.value = ''
  price_max.value = null
  nb_people.value = null
  try {
    await activityStore.applyFilters({})
  } catch (err) {
    console.error(err)
  }
}

const goToPage = async (page) => {
  try {
    await activityStore.goToPage(page)
  } catch (err) {
    console.error(err)
  }
}

const isFavorited = (activityId) => favorites.value.some(activity => activity._id === activityId)

const toggleFavorite = async (activityId) => {
  try {
    await favoriteStore.toggleFavorite(activityId)
  } catch (err) {
    console.error(err)
  }
}

const addToCustomList = async (activityId) => {
  const listId = selectedListByActivity.value[activityId]
  if (!listId || isActivityInList(activityId, listId)) return
  try {
    await listStore.addActivityToList(listId, activityId)
    selectedListByActivity.value[activityId] = ''
  } catch (err) {
    console.error('addToCustomList failed', err)
  }
}

const initMap = () => {
  if (!mapEl.value || mapInstance.value) return
  const { L } = window
  if (!L) return
  mapInstance.value = L.map(mapEl.value, {
    zoomControl: true,
    scrollWheelZoom: false,
  }).setView([46.5197, 6.6323], 12)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(mapInstance.value)

  markerLayer.value = L.layerGroup().addTo(mapInstance.value)
}

const refreshMapMarkers = () => {
  const { L } = window
  if (!L || !mapInstance.value || !markerLayer.value) return
  markerLayer.value.clearLayers()

  const points = activityStore.activities
    .map(activity => {
      const coords = activity.coordinates?.coordinates
      if (!Array.isArray(coords) || coords.length !== 2) return null
      return {
        id: activity._id,
        title: activity.title,
        location: activity.location,
        lat: coords[1],
        lng: coords[0],
      }
    })
    .filter(Boolean)

  if (!points.length) return

  const bounds = []
  points.forEach(point => {
    const marker = L.marker([point.lat, point.lng]).addTo(markerLayer.value)
    marker.bindPopup(`<strong>${point.title}</strong><br/>${point.location}`)
    marker.on('click', () => {
      router.push(`/activities/${point.id}`)
    })
    marker.on('mouseover', () => {
      marker.openPopup()
    })
    marker.on('mouseout', () => {
      marker.closePopup()
    })
    bounds.push([point.lat, point.lng])
  })

  if (bounds.length === 1) {
    mapInstance.value.setView(bounds[0], 13)
  } else {
    mapInstance.value.fitBounds(bounds, { padding: [32, 32] })
  }
}
</script>

<style scoped>
.activities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-lg);
}

.location,
.mood {
  font-size: var(--font-size-sm);
}

.list-inline {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  align-items: center;
}

.list-inline .input {
  flex: 1;
  min-width: 180px;
}

.map-section {
  margin-bottom: var(--spacing-lg);
}

.map-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
  gap: var(--spacing-md);
}

.map-empty {
  font-size: 0.875rem;
  color: var(--color-text-tertiary, #6b7280);
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  padding: 0.375rem 0.75rem;
  border-radius: 999px;
  white-space: nowrap;
}

.activity-map {
  width: 100%;
  height: 320px;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

@media (max-width: 768px) {
  .activity-map {
    height: 260px;
  }
}
</style>
