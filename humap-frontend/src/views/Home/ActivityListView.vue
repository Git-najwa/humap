<template>
  <div class="activity-list-container">
    <div v-if="importError" class="container" style="margin-bottom:var(--spacing-md);color:#dc2626">
      {{ importError }}
    </div>
    <div v-else-if="importNotice" class="container" style="margin-bottom:var(--spacing-md);color:#0f766e">
      {{ importNotice }}
    </div>

    <!-- Error Message -->
    <ErrorMessage :message="activityStore.error" />

    <section class="airbnb-topbar">
      <div class="airbnb-topbar-inner">
        <div class="search-pill">
          <div class="pill-segment pill-segment-input">
            <span class="segment-title">Activité</span>
            <input
              v-model="q"
              class="pill-input"
              placeholder="Ville, activité..."
              aria-label="Recherche"
            />
          </div>
          <div class="pill-divider"></div>
          <button class="pill-segment pill-desktop-only" type="button" @click="scrollToChips">
            <span class="segment-title">Mood</span>
            <span class="segment-value">{{ activeChipLabel }}</span>
          </button>
          <div class="pill-divider"></div>
          <button class="pill-segment pill-desktop-only" type="button" @click="openFilters">
            <span class="segment-title">Filtres</span>
            <span class="segment-value">{{ activeFiltersCount ? `${activeFiltersCount} actifs` : 'Aucun' }}</span>
          </button>
          <button class="pill-search" type="button" aria-label="Rechercher" @click="applyFilters">
            <span class="pill-search-icon">🔍</span>
            <span class="pill-search-label">Rechercher</span>
          </button>
        </div>
        <button class="mobile-filters-button" type="button" @click="openFilters">
          Filtres
          <span v-if="activeFiltersCount" class="mobile-filters-count">{{ activeFiltersCount }}</span>
        </button>
      </div>

      <div class="airbnb-status">
        <div class="status-left">
          <div class="status-item">
            <LocationIcon :size="16" />
            <span>{{ locationLabel }}</span>
          </div>
          <div v-if="weatherLoading" class="status-item status-muted">Météo en cours...</div>
          <div v-else-if="weatherError" class="status-item status-muted">Météo indisponible</div>
          <div v-else-if="weatherSummary" class="status-item">
            <span class="status-label">{{ weatherSummary }}</span>
            <span v-if="weatherDetails" class="status-sub">{{ weatherDetails }}</span>
            <span v-if="weatherPreferenceLabel" class="status-chip">{{ weatherPreferenceLabel }}</span>
          </div>
          <div v-else class="status-item status-muted">Météo indisponible</div>
        </div>
      </div>

      <div v-if="showFilters" class="filters-modal">
        <div class="filters-modal-card">
          <div class="filters-popover-header">
            <div>
              <p class="filters-popover-title">Filtres</p>
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
              <label class="filters-label" for="filter-people">Nombre de personnes</label>
              <AppInputModern id="filter-people" v-model.number="nb_people" type="number" min="1" placeholder="Nb personnes" />
            </div>
          </div>
          <div class="filters-popover-actions">
            <AppButtonModern variant="secondary" @click="resetFilters">Réinitialiser</AppButtonModern>
            <AppButtonModern variant="primary" @click="applyFilters">Appliquer</AppButtonModern>
          </div>
        </div>
      </div>

      <div class="filters-chips-wrap" ref="chipsEl">
        <div class="filters-chips airbnb-chips">
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
        <div class="chips-actions">
          <router-link to="/activities/create">
            <AppButtonModern variant="primary" class="no-shadow">+ Nouvelle activité</AppButtonModern>
          </router-link>
        </div>
      </div>
    </section>

    <div class="split-layout airbnb-layout">
      <aside class="map-pane">
        <section class="map-section">
          <div v-if="!hasMapData" class="map-empty">Aucune activité géolocalisée.</div>
          <div ref="mapEl" class="activity-map" aria-label="Carte des activités"></div>
        </section>
      </aside>

      <div class="list-pane">
        <div class="list-head">
          <p class="text-tertiary text-sm">
            {{ pagination.total || activityStore.activities.length }} activités
          </p>
        </div>
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
          <div v-for="activity in sortedActivities" :key="activity._id" class="activity-card" style="position:relative;">
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
            <p v-if="getMoodLabel(activity)" class="mood text-tertiary">Mood : {{ getMoodLabel(activity) }}</p>
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

    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch, nextTick } from 'vue'
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
const chipsEl = ref(null)
let mapMoveTimer = null
let suppressMapMove = false
const lastMapQuery = ref(null)
const manualMapMove = ref(false)
const pendingMapRefresh = ref(false)
let mapZooming = false

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
const mapCenter = ref({ lat: 46.5197, lon: 6.6323 })
const usingNearby = ref(false)
const USER_ZOOM = 13

const chipFilters = computed(() => {
  return [
    { key: 'all', label: 'Tout', type: 'all', value: '' },
    { key: 'cat:nature', label: 'Nature', type: 'category', value: 'nature' },
    { key: 'cat:culture', label: 'Culture', type: 'category', value: 'culture' },
    { key: 'cat:sport', label: 'Sport', type: 'category', value: 'sport' },
    { key: 'cat:food', label: 'Food', type: 'category', value: 'food' },
    { key: 'cat:kids', label: 'Famille', type: 'category', value: 'kids' },
    { key: 'cat:indoor', label: 'Indoor', type: 'category', value: 'indoor' },
    { key: 'mood:calm', label: 'Calm', type: 'mood', value: 'calm' },
    { key: 'mood:social', label: 'Social', type: 'mood', value: 'social' },
  ]
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

const openFilters = () => {
  showFilters.value = true
}

const scrollToChips = () => {
  if (!chipsEl.value) return
  chipsEl.value.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
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

const activeChipLabel = computed(() => {
  const chip = chipFilters.value.find((entry) => entry.key === activeChip.value)
  return chip?.label || 'Tout'
})

const hasServerFilters = computed(() => {
  return Boolean(
    q.value ||
    mood.value ||
    (price_max.value !== null && price_max.value !== '') ||
    (nb_people.value !== null && nb_people.value !== '')
  )
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
  if (userCoords.value) {
    return `Autour de vous · Lat ${userCoords.value.lat.toFixed(3)} · Lon ${userCoords.value.lon.toFixed(3)}`
  }
  if (!mapCenter.value) return 'Autour de vous'
  return `Lat ${mapCenter.value.lat.toFixed(3)} · Lon ${mapCenter.value.lon.toFixed(3)}`
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
          mapCenter.value = { lat: userCoords.value.lat, lon: userCoords.value.lon }
          await fetchWeather(userCoords.value.lat, userCoords.value.lon)
          await runAutoImport(userCoords.value)
          if (!hasServerFilters.value) {
            usingNearby.value = true
            await activityStore.fetchNearby(userCoords.value.lat, userCoords.value.lon, 15000, 50)
          }
          await focusMapOnUser(userCoords.value)
        },
        () => {
          userCoords.value = null
        },
        { enableHighAccuracy: true, timeout: 5000 }
      )
    }
    initMap()
    if (!weather.value && mapCenter.value) {
      await fetchWeather(mapCenter.value.lat, mapCenter.value.lon)
    }
    refreshMapMarkers()
  } catch (err) {
    console.error(err)
  }
})

onBeforeUnmount(() => {
  if (mapMoveTimer) {
    clearTimeout(mapMoveTimer)
    mapMoveTimer = null
  }
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

const runAutoImport = async (coords, options = {}) => {
  const token = localStorage.getItem('token')
  if (!token) return 0
  if (!coords?.lat || !coords?.lon) return 0
  const force = Boolean(options.force || coords?.force)

  const key = 'humap:external-import:coords'
  const last = localStorage.getItem(key)
  if (!force) {
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
  }

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
      weatherError.value = 'Météo indisponible'
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
      return (
        haystack.includes('sport') ||
        haystack.includes('fitness') ||
        haystack.includes('stadium') ||
        haystack.includes('leisure') ||
        haystack.includes('riding') ||
        haystack.includes('horse') ||
        haystack.includes('golf') ||
        haystack.includes('tennis') ||
        haystack.includes('swimming') ||
        haystack.includes('climb') ||
        haystack.includes('hiking') ||
        haystack.includes('trail') ||
        (activity?.mood || deriveMoodFromCategories(activity)) === 'energetic'
      )
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
  const initialCenter = userCoords.value || mapCenter.value || { lat: 46.5197, lon: 6.6323 }
  mapInstance.value = L.map(mapEl.value, {
    zoomControl: true,
    scrollWheelZoom: false,
  }).setView([initialCenter.lat, initialCenter.lon], 12)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(mapInstance.value)

  markerLayer.value = L.layerGroup().addTo(mapInstance.value)
  mapInstance.value.on('moveend', handleMapMove)
  mapInstance.value.on('zoomstart', () => {
    mapZooming = true
  })
  mapInstance.value.whenReady(() => {
    mapInstance.value.invalidateSize()
    if (userCoords.value) {
      void focusMapOnUser(userCoords.value)
      return
    }
    if (!hasServerFilters.value || pendingMapRefresh.value) {
      pendingMapRefresh.value = false
      void loadMapActivities({ force: true })
    }
  })
}

const handleMapMove = () => {
  if (suppressMapMove || !mapInstance.value) return
  if (mapZooming) {
    mapZooming = false
    return
  }
  clearTimeout(mapMoveTimer)
  mapMoveTimer = setTimeout(async () => {
    try {
      await loadMapActivities({ markManual: true })
    } catch (err) {
      console.error(err)
    }
  }, 400)
}

const setMapView = (lat, lon, zoom = 12, options = {}) => {
  if (!mapInstance.value) return
  suppressMapMove = true
  mapInstance.value.setView([lat, lon], zoom, { animate: false })
  if (options.track !== false) {
    lastMapQuery.value = { lat, lng: lon, zoom }
    mapCenter.value = { lat, lon }
  }
  setTimeout(() => {
    suppressMapMove = false
  }, 200)
}

const focusMapOnUser = async (coords) => {
  if (!coords) return
  if (!mapInstance.value) {
    if (!hasServerFilters.value) {
      pendingMapRefresh.value = true
    }
    return
  }
  await nextTick()
  mapInstance.value.invalidateSize()
  setMapView(coords.lat, coords.lon, USER_ZOOM)
  if (!hasServerFilters.value) {
    await loadMapActivities({ force: true })
  }
}

const loadMapActivities = async (options = {}) => {
  if (!mapInstance.value) return
  const center = mapInstance.value.getCenter()
  const bounds = mapInstance.value.getBounds()
  const zoom = mapInstance.value.getZoom()
  if (!options.force && lastMapQuery.value) {
    const movedKm = haversineKm(
      lastMapQuery.value.lat,
      lastMapQuery.value.lng,
      center.lat,
      center.lng
    )
    if (movedKm < 0.2) {
      return
    }
  }
  lastMapQuery.value = { lat: center.lat, lng: center.lng, zoom }
  mapCenter.value = { lat: center.lat, lon: center.lng }
  await fetchWeather(center.lat, center.lng)
  if (options.markManual) {
    manualMapMove.value = true
  }
  const token = localStorage.getItem('token')
  if (token) {
    await runAutoImport({ lat: center.lat, lon: center.lng }, { force: true })
  }
  usingNearby.value = true
  const sw = bounds.getSouthWest()
  const ne = bounds.getNorthEast()
  const bbox = [sw.lng, sw.lat, ne.lng, ne.lat].join(',')
  await activityStore.fetchWithinBounds(bbox, 50)
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
    if (!lastMapQuery.value && !manualMapMove.value) {
      setMapView(userCoords.value.lat, userCoords.value.lon, USER_ZOOM)
    }
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

  if (!userCoords.value && !manualMapMove.value) {
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
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
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
  gap: 10px;
  margin-bottom: var(--spacing-lg);
}

.activity-list-container {
  display: block;
  height: 100vh;
  overflow: hidden;
  padding-top: 0;
  padding-bottom: 0;
  --header-height: 96px;
  --map-offset: 160px;
  --page-max-width: 1320px;
}

:global(html),
:global(body),
:global(#app) {
  height: 100%;
}

@media (min-width: 769px) {
  :global(body) {
    overflow: hidden;
  }
}

.airbnb-topbar {
  position: sticky;
  top: 0;
  z-index: 7;
  background: rgba(255, 255, 255, 0.92);
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(18px) saturate(140%);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
  flex-shrink: 0;
  padding-top: 0;
}

.airbnb-topbar-inner {
  max-width: var(--page-max-width);
  margin: 0 auto;
  padding: 6px 24px 4px;
  display: flex;
  align-items: center;
  justify-content: stretch;
}

.mobile-filters-button {
  display: none;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #fff;
  font-weight: 600;
  color: var(--color-text);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
  cursor: pointer;
}

.mobile-filters-count {
  min-width: 20px;
  height: 20px;
  border-radius: 999px;
  background: #0f766e;
  color: #fff;
  font-size: 0.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
}

.search-pill {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 6px;
  border-radius: 999px;
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.12);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
  flex: 1 1 auto;
  width: 100%;
  max-width: 100%;
}

.pill-segment {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 18px;
  border: none;
  background: transparent;
  text-align: left;
  font-family: inherit;
  cursor: pointer;
  min-width: 160px;
}

.pill-segment-input {
  flex: 1 1 auto;
  min-width: 220px;
}

.pill-input {
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.98rem;
  color: var(--color-text);
}

.pill-divider {
  width: 1px;
  height: 32px;
  background: rgba(15, 23, 42, 0.12);
}

.segment-title {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--color-text-tertiary);
}

.segment-value {
  font-size: 0.96rem;
  color: var(--color-text);
}

.pill-search {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 18px;
  height: 44px;
  border-radius: 999px;
  border: none;
  background: #0f766e;
  color: #fff;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  box-shadow: 0 8px 18px rgba(15, 118, 110, 0.22);
  margin-right: 8px;
}

.pill-search-icon {
  font-size: 1rem;
}

.pill-search-label {
  font-size: 0.9rem;
}

.airbnb-status {
  max-width: var(--page-max-width);
  margin: 0 auto;
  padding: 0 24px 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.status-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px 18px;
}

.status-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.status-muted {
  color: var(--color-text-tertiary);
}

.status-label {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
}

.status-sub {
  color: var(--color-text-tertiary);
  margin-left: 6px;
}

.status-chip {
  margin-left: 8px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(15, 118, 110, 0.12);
  color: #0f766e;
  font-size: 0.75rem;
  border: 1px solid rgba(15, 118, 110, 0.2);
}

.status-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filters-modal {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.2);
  backdrop-filter: blur(4px);
  display: grid;
  place-items: center;
  z-index: 2000;
}

.filters-modal-card {
  width: min(720px, 92vw);
  background: #fff;
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
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
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #fff;
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

.filters-chips-wrap {
  position: relative;
  max-width: var(--page-max-width);
  margin: 0 auto;
  padding: 0 24px 8px;
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(255, 255, 255, 0.92);
}

.filters-chips {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  scroll-behavior: smooth;
  flex: 1;
}

.filters-chips::-webkit-scrollbar {
  display: none;
}

.filters-chips-wrap::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 36px;
  height: 100%;
  background: none;
  pointer-events: none;
}

.chips-actions {
  flex: 0 0 auto;
}

.no-shadow {
  box-shadow: none !important;
}

.filter-chip {
  flex: 0 0 auto;
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

.list-head {
  margin: 8px 0 16px;
}

.airbnb-layout {
  max-width: var(--page-max-width);
  margin: 0 auto;
  padding:  24px 24px;
  height: calc(100vh - var(--map-offset));
}

.split-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
  grid-template-areas: "list map";
  gap: 32px;
  align-items: stretch;
  height: 100%;
  min-height: 0;
}

.list-pane {
  display: flex;
  flex-direction: column;
  grid-area: list;
  min-height: 0;
  height: 100%;
  overflow-y: auto;
  padding-right: 12px;
  padding-bottom: 32px;
}

.map-pane {
  position: sticky;
  top: var(--map-offset);
  align-self: start;
  grid-area: map;
  height: 100%;
}

.map-section {
  height: 100%;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #fff;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
  position: relative;
  overscroll-behavior: contain;
  touch-action: none;
}

.map-empty {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 5;
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 0.8rem;
}

.activity-map {
  width: 100%;
  height: 100%;
  border: none;
  touch-action: none;
}

.map-pane .leaflet-container {
  touch-action: none;
  overscroll-behavior: contain;
}

.activity-card {
  background: transparent;
  border: none;
  box-shadow: none;
}

.activity-card h3 {
  font-size: 1rem;
  margin-top: 8px;
}

.activity-card .text-secondary {
  font-size: 0.9rem;
}

.activity-image {
  width: 100%;
  height: 160px;
  object-fit: cover;
  border-radius: 12px;
  margin-bottom: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.1);
}

.favorite-badge {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(15, 23, 42, 0.12);
  backdrop-filter: none;
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

@media (max-width: 768px) {
  .airbnb-topbar-inner {
    padding: 12px 16px 8px;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .search-pill {
    width: 100%;
    max-width: 100%;
    padding: 4px;
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
    border-radius: 20px;
    flex: none;
  }

  .pill-segment {
    min-width: 0;
    padding: 6px 10px;
    width: 100%;
  }

  .pill-divider {
    display: none;
  }

  .pill-desktop-only {
    display: none;
  }

  .pill-search {
    height: 40px;
    padding: 0 14px;
    width: 100%;
    justify-content: center;
  }

  .mobile-filters-button {
    display: inline-flex;
  }

  .airbnb-status {
    padding: 0 16px 10px;
  }

  .airbnb-layout {
    padding: 0 16px 32px;
    height: auto;
  }

  .split-layout {
    grid-template-columns: 1fr;
    grid-template-areas:
      "list";
    height: auto;
  }

  .map-pane {
    display: none;
  }

  .list-pane {
    overflow: visible;
    padding-right: 0;
  }

  .activity-list-container {
    height: auto;
    overflow: visible;
    --header-height: 64px;
  }

  :global(body) {
    overflow: auto;
  }
}
</style>
