<template>
  <div class="activity-list-container">
    <header class="header container">
      <h1 class="text-2xl font-semibold">Activités HUMAP</h1>
      <div class="flex gap-sm">
        <router-link to="/activities/create">
          <AppButtonModern variant="primary">+ Nouvelle activité</AppButtonModern>
        </router-link>
        <AppButtonModern
          v-if="authStore.user"
          variant="secondary"
          :disabled="isImporting"
          @click="handleManualImport"
        >
          {{ isImporting ? 'Import...' : 'Importer' }}
        </AppButtonModern>
      </div>
    </header>

    <div v-if="importError" class="container" style="margin-bottom:var(--spacing-md);color:#dc2626">
      {{ importError }}
    </div>
    <div v-else-if="importNotice" class="container" style="margin-bottom:var(--spacing-md);color:#0f766e">
      {{ importNotice }}
    </div>

    <!-- Error Message -->
    <ErrorMessage :message="activityStore.error" />

    <section class="filters container card" style="display:flex;gap:12px;align-items:center;margin-bottom:var(--spacing-lg)">
      <AppInputModern v-model="q" placeholder="Recherche..." />
      <select v-model="mood" class="input" style="width:180px" id="filter-mood" name="mood">
        <option value="">Tous les moods</option>
        <option v-for="option in moodOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
      <AppInputModern v-model.number="price_max" type="number" placeholder="Prix max" style="width:120px" />
      <AppInputModern v-model.number="nb_people" type="number" placeholder="Nb personnes" style="width:120px" />
      <AppButtonModern variant="primary" @click="applyFilters">Filtrer</AppButtonModern>
      <AppButtonModern variant="secondary" @click="resetFilters">Réinitialiser</AppButtonModern>
    </section>

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
          <StarFilledIcon v-if="isFavorited(activity._id)" :size="20" color="#F59E0B" />
          <StarEmptyIcon v-else :size="20" color="#6B7280" />
        </button>
        <img
          class="activity-image"
          :src="getActivityImage(activity)"
          :alt="activity.title"
          loading="lazy"
          @error="handleImageError($event, activity)"
        />
        <h3 class="text-lg font-semibold">{{ activity.title }}</h3>
        <div class="category-tags" v-if="getCategoryTags(activity).length">
          <span v-for="tag in getCategoryTags(activity)" :key="`${activity._id}-${tag}`" class="category-tag">
            {{ tag }}
          </span>
        </div>
        <p v-else-if="activity.description" class="text-secondary" style="margin-top:8px">
          {{ activity.description }}
        </p>
        <div style="margin-top:12px;display:flex;justify-content:space-between;align-items:center">
          <div>
            <p class="location text-tertiary"><LocationIcon :size="14" /> {{ activity.location }}</p>
            <p v-if="activity.mood" class="mood text-tertiary">Ambiance : {{ activity.mood }}</p>
            <p v-if="getBudgetLabel(activity.price_range)" class="mood text-tertiary">
              Budget : {{ getBudgetLabel(activity.price_range) }}
            </p>
          </div>
          <router-link :to="`/activities/${activity._id}`">
            <AppButtonModern variant="secondary">Voir</AppButtonModern>
          </router-link>
        </div>
        <div v-if="authStore.user && customLists.length" class="list-inline">
          <select
            v-model="selectedListByActivity[activity._id]"
            class="input"
            :id="`list-select-${activity._id}`"
            :name="`list-select-${activity._id}`"
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
import api from '../../services/api'
import { useActivityStore } from '../../store/activity.store'
import { useAuthStore } from '../../store/auth.store'
import { useFavoriteStore } from '../../store/favorite.store'
import { useListStore } from '../../store/list.store'
import ErrorMessageModern from '../../components/ui/ErrorMessage-modern.vue'
import AppInputModern from '../../components/ui/AppInput-modern.vue'
import AppButtonModern from '../../components/ui/AppButton-modern.vue'
import { LocationIcon, StarFilledIcon, StarEmptyIcon } from '../../components/icons'

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
const importError = ref('')
const importNotice = ref('')
const isImporting = ref(false)

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

const moodOptions = computed(() => {
  const base = ['calm', 'social', 'energetic']
  const fromActivities = activityStore.activities
    .map((activity) => activity?.mood)
    .filter(Boolean)
    .map((value) => value.toString().trim().toLowerCase())
  const merged = Array.from(new Set([...base, ...fromActivities])).filter(Boolean)
  return merged.map((value) => ({
    value,
    label: value.charAt(0).toUpperCase() + value.slice(1),
  }))
})

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
  if (price_max.value !== null && price_max.value !== '') filters.price_range = price_max.value
  if (nb_people.value !== null && nb_people.value !== '') filters.nb_people = nb_people.value
  return filters
}

onMounted(async () => {
  try {
    await activityStore.fetchActivities()
    await favoriteStore.loadFavorites()
    if (authStore.user) {
      await listStore.fetchAllLists()
      await runAutoImport()
      await activityStore.fetchActivities()
    }
    initMap()
    refreshMapMarkers()
  } catch (err) {
    console.error(err)
  }
})

onBeforeUnmount(() => {
  if (mapInstance.value) {
    mapInstance.value.closePopup()
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

const handleManualImport = async () => {
  if (isImporting.value) return
  isImporting.value = true
  importError.value = ''
  importNotice.value = ''
  try {
    console.log('manual import: start')
    const importedCount = await runAutoImport()
    console.log('manual import: done')
    await activityStore.fetchActivities()
    if (importedCount === -1) {
      importNotice.value = 'Import déjà effectué aujourd\'hui.'
    } else if (importedCount === 0) {
      importError.value = 'Aucune activité trouvée via Geoapify.'
    } else if (typeof importedCount === 'number') {
      importNotice.value = `Import réussi : ${importedCount} activité(s).`
    }
  } catch (err) {
    console.error('manual import failed', err)
  } finally {
    isImporting.value = false
  }
}

const runAutoImport = async () => {
  const key = 'humap:external-import'
  const today = new Date().toISOString().slice(0, 10)
  if (localStorage.getItem(key) === today) return -1
  const token = localStorage.getItem('token')
  if (!token) {
    importError.value = 'Connecte-toi pour importer des activités.'
    return 0
  }

  const defaultLat = 46.5197
  const defaultLon = 6.6323

  const coords = await new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ lat: defaultLat, lon: defaultLon })
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve({ lat: defaultLat, lon: defaultLon }),
      { enableHighAccuracy: true, timeout: 5000 }
    )
  })

  try {
    const response = await api.get('/external-activities/geoapify', {
      params: {
        lat: coords.lat,
        lon: coords.lon,
        radius: 2000,
        limit: 50,
        save: true,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const items = Array.isArray(response.data?.items) ? response.data.items : []
    if (items.length > 0) {
      localStorage.setItem(key, today)
    }
    return items.length
  } catch (err) {
    const status = err.response?.status
    const message = err.response?.data?.message || err.message || 'Import impossible'
    importError.value = `Import Geoapify échoué (${status || 'erreur'}): ${message}`
    console.warn('auto import failed', status, message)
    return 0
  }
}

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
  <svg xmlns="http://www.w3.org/2000/svg" width="800" height="520" viewBox="0 0 800 520">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${palette[0]}"/>
        <stop offset="100%" stop-color="${palette[1]}"/>
      </linearGradient>
    </defs>
    <rect width="800" height="520" fill="url(#bg)"/>
    <circle cx="640" cy="140" r="90" fill="${palette[2]}" opacity="0.7"/>
    <path d="M0 420 L180 280 L340 400 L480 300 L680 420 L800 360 L800 520 L0 520 Z" fill="${palette[2]}"/>
    <path d="M0 360 L130 260 L260 340 L380 260 L560 360 L800 300 L800 520 L0 520 Z" fill="${palette[3]}"/>
    <text x="60" y="120" font-family="Georgia, serif" font-size="36" fill="#7a4f3a">HUMAP</text>
    <text x="60" y="165" font-family="Georgia, serif" font-size="20" fill="#7a4f3a">${label}</text>
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
  return `https://source.unsplash.com/featured/800x520?${query}&sig=${sig}`
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

const getCategoryTags = (activity) => {
  const categories = Array.isArray(activity?.categories) ? activity.categories : []
  if (categories.length) return categories.slice(0, 3)
  const description = activity?.description || ''
  if (!description || (!description.includes('.') && !description.includes('_'))) return []
  return description
    .split(',')
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => chunk.split('.').pop().replace(/_/g, ' '))
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .filter((value, index, arr) => arr.indexOf(value) === index)
    .slice(0, 3)
}

const getBudgetLabel = (priceRange) => {
  if (priceRange === null || priceRange === undefined) return ''
  if (priceRange === 0) return 'Gratuit'
  const level = Math.max(1, Math.min(3, Number(priceRange)))
  return '€'.repeat(level)
}

const handleImageError = (event, activity) => {
  event.target.src = buildPlaceholder(activity?._id || activity?.title || 'humap', getCategoryTags(activity)[0] || activity?.title || 'Activité locale')
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
  mapInstance.value.closePopup()
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
    mapInstance.value.setView(bounds[0], 13, { animate: false })
  } else {
    mapInstance.value.fitBounds(bounds, { padding: [32, 32], animate: false })
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

.category-tags {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.category-tag {
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 999px;
  background: #f1e6db;
  color: #7a4f3a;
  border: 1px solid rgba(122, 79, 58, 0.2);
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

.activity-image {
  width: 100%;
  height: 160px;
  object-fit: cover;
  border-radius: 12px;
  margin-bottom: 12px;
  border: 1px solid #e5e7eb;
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
