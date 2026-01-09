<template>
  <div class="activity-list-container">
    <header class="hero container">
      <div class="hero-content">
        <div>
          <p class="hero-eyebrow">Découvrir</p>
          <h1 class="hero-title">Des activités locales</h1>
          <p class="text-secondary hero-subtitle">Trouvez des idées adaptées à votre mood et à la météo du jour.</p>
        </div>
        <div class="hero-actions">
          <router-link to="/activities/create">
            <AppButtonModern variant="primary">+ Nouvelle activité</AppButtonModern>
          </router-link>
        </div>
      </div>
      <div class="hero-meta card">
        <div>
          <p class="hero-meta-label">Position</p>
          <p class="hero-meta-value">{{ locationLabel }}</p>
        </div>
        <div v-if="weatherSummary">
          <p class="hero-meta-label">Météo actuelle</p>
          <p class="hero-meta-value">{{ weatherSummary }}</p>
          <p class="hero-meta-sub">{{ weatherDetails }}</p>
          <p v-if="weatherPreferenceLabel" class="hero-meta-chip">
            Suggestion : {{ weatherPreferenceLabel }}
          </p>
        </div>
        <div v-else class="hero-meta-muted">
          <p class="hero-meta-label">Météo actuelle</p>
          <p class="hero-meta-value">En attente…</p>
        </div>
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

    <section class="filters container card">
      <div class="filters-row">
        <AppInputModern v-model="q" placeholder="Recherche une activité, un lieu..." />
        <div class="filters-actions">
          <AppButtonModern variant="secondary" @click="toggleFilters">
            Filtres
            <span v-if="activeFiltersCount" class="filters-count">{{ activeFiltersCount }}</span>
          </AppButtonModern>
          <AppButtonModern variant="primary" @click="applyFilters">Rechercher</AppButtonModern>
        </div>
      </div>

      <div v-if="showFilters" class="filters-popover">
        <div class="filters-popover-header">
          <div>
            <p class="filters-popover-title">Filtres avancés</p>
            <p class="text-tertiary text-sm">Affinez votre recherche.</p>
          </div>
          <button class="filters-close" type="button" @click="showFilters = false">×</button>
        </div>
        <div class="filters-popover-grid">
          <div class="filters-field">
            <label class="filters-label" for="filter-price">Budget max</label>
            <AppInputModern id="filter-price" v-model.number="price_max" type="number" placeholder="Prix max" />
          </div>
          <div class="filters-field">
            <label class="filters-label" for="filter-people">Nb personnes</label>
            <AppInputModern id="filter-people" v-model.number="nb_people" type="number" placeholder="Nb personnes" />
          </div>
        </div>
        <div class="filters-popover-actions">
          <AppButtonModern variant="secondary" @click="resetFilters">Réinitialiser</AppButtonModern>
          <AppButtonModern variant="primary" @click="applyFilters">Appliquer</AppButtonModern>
        </div>
      </div>

      <div class="filters-chips">
        <button
          v-for="chip in chipFilters"
          :key="chip.key"
          type="button"
          class="filter-chip"
          :class="{ active: activeChip === chip.key }"
          @click="setChip(chip)"
        >
          {{ chip.label }}
        </button>
      </div>
    </section>

    <div class="split-layout container">
      <div class="list-pane">
        <div v-if="activityStore.isLoading" class="loading">Chargement des activités...</div>

        <!-- Empty State -->
        <div v-else-if="visibleActivities.length === 0" class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M8 12h8"></path>
          </svg>
          <h3>Aucune activité</h3>
          <p>Soyez le premier à créer une activité</p>
          <router-link to="/activities/create" class="empty-state-btn">Créer une activité</router-link>
        </div>

        <div v-else class="activities-grid">
          <div v-for="activity in sortedActivities" :key="activity._id" class="card activity-card" style="position:relative;">
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
            <p v-if="getMoodLabel(activity)" class="mood text-tertiary">Ambiance : {{ getMoodLabel(activity) }}</p>
            <p v-if="getBudgetLabel(activity.price_range)" class="mood text-tertiary">
              {{ activity.source === 'geoapify' ? 'Budget estimé' : 'Budget' }} : {{ getBudgetLabel(activity.price_range) }}
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
          class="pagination"
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

      <aside class="map-pane">
        <section class="map-section card">
          <div class="map-header">
            <div>
              <h2 class="text-xl font-semibold">Carte des activités</h2>
              <p class="text-tertiary">Explorez les activités proches.</p>
            </div>
            <div v-if="!hasMapData" class="map-empty">Aucune activité géolocalisée.</div>
          </div>
          <div ref="mapEl" class="activity-map" aria-label="Carte des activités"></div>
        </section>
      </aside>
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
const weather = ref(null)
const weatherLoading = ref(false)
const weatherError = ref('')
const activeChip = ref('all')
const showFilters = ref(false)

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
const userCoords = ref(null)
const usingNearby = ref(false)

const chipFilters = computed(() => {
  const categories = [
    { key: 'all', label: 'Tout', type: 'all', value: '' },
    { key: 'cat:nature', label: 'Nature', type: 'category', value: 'nature' },
    { key: 'cat:culture', label: 'Culture', type: 'category', value: 'culture' },
    { key: 'cat:sport', label: 'Sport', type: 'category', value: 'sport' },
    { key: 'cat:food', label: 'Food', type: 'category', value: 'food' },
    { key: 'cat:kids', label: 'Famille', type: 'category', value: 'kids' },
    { key: 'cat:indoor', label: 'Indoor', type: 'category', value: 'indoor' },
  ]
  const moods = (moodOptions.value || []).map((option) => ({
    key: `mood:${option.value}`,
    label: option.label,
    type: 'mood',
    value: option.value,
  }))
  return [...categories, ...moods]
})

const setChip = (chip) => {
  activeChip.value = chip.key
  if (chip.type === 'mood') {
    mood.value = chip.value
  } else {
    mood.value = ''
  }
}

const toggleFilters = () => {
  showFilters.value = !showFilters.value
}

const activeFiltersCount = computed(() => {
  let count = 0
  if (q.value) count += 1
  if (mood.value) count += 1
  if (price_max.value !== null && price_max.value !== '') count += 1
  if (nb_people.value !== null && nb_people.value !== '') count += 1
  if (activeChip.value && activeChip.value !== 'all') count += 1
  return count
})

const moodOptions = computed(() => {
  const base = ['calm', 'social', 'energetic']
  const fromActivities = activityStore.activities
    .map((activity) => deriveMoodFromCategories(activity) || activity?.mood)
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

const locationLabel = computed(() => {
  if (!userCoords.value) return 'Autour de vous'
  return `Lat ${userCoords.value.lat.toFixed(3)} · Lon ${userCoords.value.lon.toFixed(3)}`
})

const weatherSummary = computed(() => {
  if (!weather.value) return ''
  const temp = weather.value.temperature?.toFixed(0)
  const label = getWeatherLabel(weather.value.code)
  if (!temp || !label) return ''
  return `${label} · ${temp}°C`
})

const weatherDetails = computed(() => {
  if (!weather.value) return ''
  const rain = weather.value.precipitation ?? 0
  const wind = weather.value.wind ?? 0
  return `Pluie ${rain.toFixed(1)} mm · Vent ${wind.toFixed(0)} km/h`
})

const weatherPreferenceLabel = computed(() => {
  const pref = getWeatherPreference()
  return pref?.label || ''
})

onMounted(async () => {
  try {
    await activityStore.fetchActivities()
    await favoriteStore.loadFavorites()
    if (authStore.user) {
      await listStore.fetchAllLists()
      await runAutoImport()
      await activityStore.fetchActivities()
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          userCoords.value = { lat: pos.coords.latitude, lon: pos.coords.longitude }
          await fetchWeather(userCoords.value.lat, userCoords.value.lon)
          await runAutoImport(userCoords.value)
          if (!mood.value && !q.value && (price_max.value === null || price_max.value === '') && (nb_people.value === null || nb_people.value === '')) {
            usingNearby.value = true
            await activityStore.fetchNearby(userCoords.value.lat, userCoords.value.lon, 15000, 50)
          }
        },
        () => {
          userCoords.value = null
        },
        { enableHighAccuracy: true, timeout: 5000 }
      )
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

const applyFilters = async () => {
  try {
    usingNearby.value = false
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
    if (userCoords.value) {
      usingNearby.value = true
      await activityStore.fetchNearby(userCoords.value.lat, userCoords.value.lon, 15000, 50)
    } else {
      usingNearby.value = false
      await activityStore.applyFilters({})
    }
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

const runAutoImport = async (coords) => {
  const token = localStorage.getItem('token')
  if (!token) return 0
  if (!coords?.lat || !coords?.lon) return 0

  const key = 'humap:external-import:coords'
  const last = localStorage.getItem(key)
  let shouldImport = true
  if (last) {
    try {
      const parsed = JSON.parse(last)
      if (parsed?.lat && parsed?.lon) {
        const km = haversineKm(parsed.lat, parsed.lon, coords.lat, coords.lon)
        shouldImport = km >= 2
      }
    } catch {
      shouldImport = true
    }
  }
  if (!shouldImport) return 0

  try {
    const response = await api.get('/external-activities/geoapify', {
      params: {
        lat: coords.lat,
        lon: coords.lon,
        radius: 15000,
        limit: 50,
        save: true,
        categories: 'tourism,leisure,entertainment,education,commercial,service,accommodation,catering,natural,public_transport',
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const items = Array.isArray(response.data?.items) ? response.data.items : []
    if (items.length > 0) {
      localStorage.setItem(key, JSON.stringify({ lat: coords.lat, lon: coords.lon }))
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

const handleImageError = (event, activity) => {
  event.target.src = buildPlaceholder(activity?._id || activity?.title || 'humap', getCategoryTags(activity)[0] || activity?.title || 'Activité locale')
}

const fetchWeather = async (lat, lon) => {
  weatherLoading.value = true
  weatherError.value = ''
  try {
    const url = new URL('https://api.open-meteo.com/v1/forecast')
    url.searchParams.set('latitude', lat)
    url.searchParams.set('longitude', lon)
    url.searchParams.set('current', 'temperature_2m,precipitation,weathercode,wind_speed_10m')
    url.searchParams.set('timezone', 'auto')
    const res = await fetch(url.toString())
    const data = await res.json()
    const current = data?.current
    if (!current) {
      weather.value = null
      return
    }
    weather.value = {
      temperature: current.temperature_2m,
      precipitation: current.precipitation,
      wind: current.wind_speed_10m,
      code: current.weathercode,
    }
  } catch (err) {
    weatherError.value = err.message || 'Erreur météo'
  } finally {
    weatherLoading.value = false
  }
}

function getWeatherLabel(code) {
  if (code === null || code === undefined) return ''
  if (code === 0) return 'Ensoleillé'
  if ([1, 2].includes(code)) return 'Peu nuageux'
  if (code === 3) return 'Nuageux'
  if ([45, 48].includes(code)) return 'Brouillard'
  if (code >= 51 && code <= 67) return 'Pluie'
  if (code >= 71 && code <= 77) return 'Neige'
  if (code >= 80 && code <= 82) return 'Averses'
  if (code >= 95) return 'Orage'
  return 'Variable'
}

function getWeatherPreference() {
  if (!weather.value) return null
  const rainCodes = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99])
  const code = weather.value.code
  const isRainy = rainCodes.has(code) || (weather.value.precipitation ?? 0) >= 0.2
  const isCold = (weather.value.temperature ?? 0) <= 6
  if (isRainy) return { type: 'indoor', label: 'Pluie' }
  if (isCold) return { type: 'indoor', label: 'Froid' }
  if (code === 0 || code === 1) return { type: 'outdoor', label: 'Soleil' }
  return { type: 'mixed', label: 'Nuageux' }
}

function getActivityEnvironment(activity) {
  const categories = Array.isArray(activity?.categories) ? activity.categories.join(' ').toLowerCase() : ''
  const title = (activity?.title || '').toLowerCase()
  const haystack = `${categories} ${title}`
  const indoor = ['museum', 'gallery', 'theatre', 'cinema', 'shopping', 'mall', 'cafe', 'restaurant', 'bar', 'spa', 'escape']
  const outdoor = ['park', 'garden', 'trail', 'hiking', 'beach', 'natural', 'camp', 'sport', 'stadium', 'playground', 'lake']
  if (indoor.some((key) => haystack.includes(key))) return 'indoor'
  if (outdoor.some((key) => haystack.includes(key))) return 'outdoor'
  return 'mixed'
}

function matchesChip(activity) {
  if (!activeChip.value || activeChip.value === 'all') return true
  const env = getActivityEnvironment(activity)
  const categories = Array.isArray(activity?.categories) ? activity.categories.join(' ').toLowerCase() : ''
  const title = (activity?.title || '').toLowerCase()
  const haystack = `${categories} ${title}`
  if (activeChip.value.startsWith('mood:')) {
    const moodValue = activeChip.value.split(':')[1]
    const derived = (activity?.mood || deriveMoodFromCategories(activity) || '').toLowerCase()
    return derived === moodValue
  }
  if (!activeChip.value.startsWith('cat:')) return true
  const catValue = activeChip.value.split(':')[1]
  switch (catValue) {
    case 'nature':
      return haystack.includes('park') || haystack.includes('garden') || haystack.includes('natural') || haystack.includes('lake')
    case 'culture':
      return haystack.includes('museum') || haystack.includes('gallery') || haystack.includes('theatre')
    case 'sport':
      return haystack.includes('sport') || haystack.includes('fitness') || haystack.includes('stadium')
    case 'food':
      return haystack.includes('restaurant') || haystack.includes('cafe') || haystack.includes('bar') || haystack.includes('catering')
    case 'kids':
      return haystack.includes('playground') || haystack.includes('zoo') || haystack.includes('family')
    case 'indoor':
      return env === 'indoor'
    default:
      return true
  }
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (value) => (value * Math.PI) / 180
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

const visibleActivities = computed(() => {
  return (activityStore.activities || []).filter(activity => matchesChip(activity))
})

const sortedActivities = computed(() => {
  const base = visibleActivities.value || []
  if (!userCoords.value) return base
  const { lat, lon } = userCoords.value
  const preference = getWeatherPreference()
  return [...base].sort((a, b) => {
    const aCoords = a.coordinates?.coordinates
    const bCoords = b.coordinates?.coordinates
    if (!Array.isArray(aCoords) || !Array.isArray(bCoords)) return 0
    const aDist = haversineKm(lat, lon, aCoords[1], aCoords[0])
    const bDist = haversineKm(lat, lon, bCoords[1], bCoords[0])
    if (!preference || preference.type === 'mixed') {
      return aDist - bDist
    }
    const aEnv = getActivityEnvironment(a)
    const bEnv = getActivityEnvironment(b)
    const aPenalty = aEnv === preference.type ? 0 : 1
    const bPenalty = bEnv === preference.type ? 0 : 1
    if (aPenalty !== bPenalty) return aPenalty - bPenalty
    return aDist - bDist
  })
})

watch(
  [() => activityStore.activities, () => activeChip.value],
  () => {
    refreshMapMarkers()
  },
  { deep: true }
)

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

  if (userCoords.value) {
    const userMarker = L.circleMarker([userCoords.value.lat, userCoords.value.lon], {
      radius: 6,
      color: '#0f766e',
      fillColor: '#14b8a6',
      fillOpacity: 0.9,
    }).addTo(markerLayer.value)
    userMarker.bindPopup('Vous êtes ici')
    mapInstance.value.setView([userCoords.value.lat, userCoords.value.lon], 12, { animate: false })
  }

  const points = visibleActivities.value
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

  if (!userCoords.value) {
    if (bounds.length === 1) {
      mapInstance.value.setView(bounds[0], 13, { animate: false })
    } else {
      mapInstance.value.fitBounds(bounds, { padding: [32, 32], animate: false })
    }
  }
}
</script>

<style scoped>
.activities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-lg);
}

.hero {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.hero-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-lg);
  flex-wrap: wrap;
}

.hero-title {
  font-size: clamp(2rem, 3vw, 2.6rem);
  font-weight: var(--font-weight-semibold);
  letter-spacing: var(--letter-spacing-tight);
  margin-bottom: 0.25rem;
}

.hero-subtitle {
  max-width: 520px;
}

.hero-eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 0.7rem;
  color: var(--color-text-tertiary);
  margin-bottom: 0.25rem;
}

.hero-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.hero-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--spacing-md);
  padding: var(--spacing-md);
}

.hero-meta-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--color-text-tertiary);
}

.hero-meta-value {
  font-size: 1rem;
  font-weight: var(--font-weight-semibold);
}

.hero-meta-sub {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  margin-top: 4px;
}

.hero-meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--glass-border);
  background: var(--glass-bg);
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.hero-meta-muted .hero-meta-value {
  color: var(--color-text-tertiary);
}

.filters {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
}

.filters-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.filters-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.filters-count {
  margin-left: 8px;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  background: rgba(15, 118, 110, 0.15);
  border: 1px solid rgba(15, 118, 110, 0.25);
}

.filters-popover {
  margin-top: var(--spacing-sm);
  padding: var(--spacing-md);
  border-radius: var(--radius-xl);
  background: var(--glass-bg-strong);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(22px) saturate(140%);
  box-shadow: var(--glass-shadow);
}

.filters-popover-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-sm);
}

.filters-popover-title {
  font-weight: var(--font-weight-semibold);
}

.filters-close {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  border: 1px solid var(--glass-border);
  background: var(--glass-bg);
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  display: grid;
  place-items: center;
}

.filters-popover-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--spacing-sm);
}

.filters-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filters-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--color-text-tertiary);
}

.filters-popover-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: var(--spacing-sm);
}

.filters-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-chip {
  border-radius: 999px;
  padding: 6px 14px;
  font-size: 0.8rem;
  border: 1px solid var(--glass-border);
  background: var(--glass-bg);
  color: var(--color-text-secondary);
  backdrop-filter: blur(14px) saturate(140%);
  transition: all var(--transition-fast);
  cursor: pointer;
}

.filter-chip:hover {
  color: var(--color-text);
  border-color: rgba(124, 139, 154, 0.4);
}

.filter-chip.active {
  background: rgba(15, 118, 110, 0.16);
  color: var(--color-primary);
  border-color: rgba(15, 118, 110, 0.3);
}

.split-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 0.55fr);
  gap: var(--spacing-lg);
  align-items: start;
}

.list-pane {
  display: flex;
  flex-direction: column;
}

.map-pane {
  position: sticky;
  top: 96px;
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
  padding: 6px 12px;
  font-size: 12px;
  border-radius: 999px;
  background: var(--tag-bg);
  color: var(--tag-text);
  border: 1px solid var(--tag-border);
  backdrop-filter: blur(16px) saturate(140%);
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
  height: 520px;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

@media (max-width: 768px) {
  .split-layout {
    grid-template-columns: 1fr;
  }

  .map-pane {
    position: static;
  }

  .activity-map {
    height: 260px;
  }
}
</style>
