<template>
  <div class="lists-container container">
    <header class="header">
      <h1 class="text-2xl font-semibold">Mes listes</h1>
      <AppButtonModern variant="primary" @click="() => showCreateForm = true">+ Nouvelle liste</AppButtonModern>
    </header>

    <ErrorMessage :message="listStore.error" />

    <div v-if="showCreateForm" class="create-form-container card">
      <AppInputModern v-model="newListName" placeholder="Nom de la liste" />
      <div style="display:flex;gap:12px;margin-top:var(--spacing-sm)">
        <AppButtonModern variant="primary" @click="handleCreateList">Créer</AppButtonModern>
        <AppButtonModern variant="secondary" @click="() => showCreateForm = false">Annuler</AppButtonModern>
      </div>
    </div>

    <section class="card" style="margin-top:var(--spacing-lg)">
      <div class="flex-between" style="margin-bottom:var(--spacing-md)">
        <div>
          <h2 class="text-xl font-semibold">Favoris</h2>
          <p class="text-tertiary">{{ favoritesCount }} activité(s)</p>
        </div>
        <AppButtonModern variant="secondary" @click="refreshFavorites">Rafraîchir</AppButtonModern>
      </div>

      <div v-if="favoriteStore.isLoading" class="loading">Chargement des favoris...</div>
      <div v-else-if="favorites.length === 0" class="no-lists">Aucun favori pour le moment.</div>
      <div v-else class="activities-grid">
        <div v-for="activity in favorites" :key="activity._id" class="card activity-card">
          <img
            class="activity-image"
            :src="getActivityImage(activity)"
            :alt="activity.title"
            loading="lazy"
          />
          <h3 class="font-semibold">{{ activity.title }}</h3>
          <p class="text-secondary" style="margin-top:8px">{{ activity.description }}</p>
          <p class="text-tertiary" style="margin-top:8px">📍 {{ activity.location }}</p>
          <div style="margin-top:12px;display:flex;gap:8px">
            <AppButtonModern variant="secondary" @click="() => router.push(`/activities/${activity._id}`)">Voir</AppButtonModern>
            <AppButtonModern variant="danger" @click="removeFavorite(activity._id)">Retirer</AppButtonModern>
          </div>
        </div>
      </div>
    </section>

    <section style="margin-top:var(--spacing-lg)">
      <h2 class="text-xl font-semibold" style="margin-bottom:var(--spacing-md)">Listes personnalisées</h2>

      <div v-if="listStore.isLoading" class="loading">Chargement des listes...</div>
      <div v-else-if="customLists.length === 0" class="no-lists card">Aucune liste personnalisée.</div>
      <div v-else class="lists-grid">
        <div v-for="list in customLists" :key="list.name" class="list-card card">
          <h3 class="font-semibold">{{ list.name }}</h3>
          <p class="count text-tertiary">{{ list.count }} activité(s)</p>
          <div style="margin-top:12px;display:flex;gap:8px">
            <AppButtonModern variant="secondary" @click="viewCustomList(list.name)">
              {{ selectedListName === list.name ? 'Masquer' : 'Voir' }}
            </AppButtonModern>
            <AppButtonModern variant="danger" @click="deleteCustomList(list.name)">Supprimer</AppButtonModern>
          </div>
        </div>
      </div>
    </section>

    <section v-if="selectedListName" class="card" style="margin-top:var(--spacing-lg)">
      <div class="flex-between" style="margin-bottom:var(--spacing-md)">
        <div>
          <h2 class="text-xl font-semibold">{{ selectedListName }}</h2>
          <p class="text-tertiary">{{ selectedListActivities.length }} activité(s)</p>
        </div>
      </div>
      <div v-if="listActivitiesLoading" class="loading">Chargement des activités...</div>
      <div v-else-if="!selectedListActivities.length" class="no-lists">Aucune activité dans cette liste.</div>
      <div v-else class="activities-grid">
        <div v-for="activity in selectedListActivities" :key="activity._id" class="card activity-card">
          <img
            class="activity-image"
            :src="getActivityImage(activity)"
            :alt="activity.title"
            loading="lazy"
          />
          <h3 class="font-semibold">{{ activity.title }}</h3>
          <p class="text-secondary" style="margin-top:8px">{{ activity.description }}</p>
          <p class="text-tertiary" style="margin-top:8px">📍 {{ activity.location }}</p>
          <div style="margin-top:12px;display:flex;gap:8px">
            <AppButtonModern variant="secondary" @click="() => router.push(`/activities/${activity._id}`)">Voir</AppButtonModern>
            <AppButtonModern variant="danger" @click="removeFromCustomList(activity._id)">Retirer</AppButtonModern>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useListStore } from '../../store/list.store'
import { useFavoriteStore } from '../../store/favorite.store'
import ErrorMessage from '../../components/ui/ErrorMessage-modern.vue'
import AppInputModern from '../../components/ui/AppInput-modern.vue'
import AppButtonModern from '../../components/ui/AppButton-modern.vue'
import { useRouter } from 'vue-router'
import { activityService } from '../../services/activity.service'

const listStore = useListStore()
const favoriteStore = useFavoriteStore()
const router = useRouter()
const showCreateForm = ref(false)
const newListName = ref('')
const selectedListName = ref('')
const selectedListActivities = ref([])
const listActivitiesLoading = ref(false)

const { favorites } = storeToRefs(favoriteStore)
const favoritesCount = computed(() => favorites.value.length)

const DEFAULT_ACTIVITY_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="520" viewBox="0 0 800 520">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#f5e7d7"/>
        <stop offset="100%" stop-color="#f0d9c7"/>
      </linearGradient>
    </defs>
    <rect width="800" height="520" fill="url(#bg)"/>
    <circle cx="640" cy="140" r="90" fill="#f7c58f" opacity="0.7"/>
    <path d="M0 420 L180 280 L340 400 L480 300 L680 420 L800 360 L800 520 L0 520 Z" fill="#e9bfa1"/>
    <path d="M0 360 L130 260 L260 340 L380 260 L560 360 L800 300 L800 520 L0 520 Z" fill="#d9a887"/>
    <text x="60" y="120" font-family="Georgia, serif" font-size="36" fill="#7a4f3a">HUMAP</text>
    <text x="60" y="165" font-family="Georgia, serif" font-size="20" fill="#7a4f3a">Activité locale</text>
  </svg>`
)}`;

const getActivityImage = (activity) => {
  return activity?.photos?.[0] || activity?.image || activity?.photo || activity?.pictures?.[0] || DEFAULT_ACTIVITY_IMAGE
}

const customLists = computed(() => {
  const map = new Map()
  listStore.lists
    .filter(entry => entry.list_type === 'custom')
    .forEach(entry => {
      const name = entry.custom_name?.trim() || 'Sans nom'
      if (!map.has(name)) {
        map.set(name, { name, count: 0, entries: [] })
      }
      const current = map.get(name)
      if (entry.activity_id) {
        current.count += 1
      }
      current.entries.push(entry)
    })
  return Array.from(map.values())
})

onMounted(async () => {
  try {
    await listStore.fetchAllLists()
    await favoriteStore.loadFavorites()
  } catch (err) {
    console.error(err)
  }
})

const handleCreateList = async () => {
  if (newListName.value.trim()) {
    try {
      await listStore.createList({ list_type: 'custom', custom_name: newListName.value })
      newListName.value = ''
      showCreateForm.value = false
    } catch (err) {
      console.error(err?.response?.data || err)
    }
  }
}

const deleteList = async (id) => {
  if (confirm('Êtes-vous sûr de vouloir supprimer cette liste ?')) {
    try {
      await listStore.deleteList(id)
    } catch (err) {
      console.error(err)
    }
  }
}

const removeFavorite = async (activityId) => {
  try {
    await favoriteStore.toggleFavorite(activityId)
  } catch (err) {
    console.error('toggleFavorite failed', err)
  }
}

const refreshFavorites = async () => {
  try {
    await favoriteStore.loadFavorites()
  } catch (err) {
    console.error(err)
  }
}

const deleteCustomList = async (name) => {
  const entries = customLists.value.find(l => l.name === name)?.entries || []
  if (!entries.length) return
  if (!confirm('Supprimer cette liste personnalisée ?')) return
  try {
    await Promise.all(entries.map(entry => listStore.deleteList(entry._id)))
    if (selectedListName.value === name) {
      selectedListName.value = ''
      selectedListActivities.value = []
    }
  } catch (err) {
    console.error(err)
  }
}

const viewCustomList = async (name) => {
  if (selectedListName.value === name) {
    selectedListName.value = ''
    selectedListActivities.value = []
    return
  }
  const entries = customLists.value.find(l => l.name === name)?.entries || []
  selectedListName.value = name
  listActivitiesLoading.value = true
  try {
    const activityIds = entries.map(entry => entry.activity_id).filter(Boolean)
    const results = await Promise.allSettled(activityIds.map(id => activityService.getById(id)))
    const activityMap = new Map()
    results
      .filter(result => result.status === 'fulfilled')
      .forEach(result => {
        activityMap.set(result.value.data._id, result.value.data)
      })
    const entryMap = new Map()
    entries.forEach(entry => {
      if (!entry.activity_id || entryMap.has(entry.activity_id)) return
      entryMap.set(entry.activity_id, entry._id)
    })
    selectedListActivities.value = Array.from(entryMap.entries())
      .map(([activityId, entryId]) => {
        const activity = activityMap.get(activityId)
        if (!activity) return null
        return { ...activity, _entryId: entryId }
      })
      .filter(Boolean)
  } catch (err) {
    console.error(err)
    selectedListActivities.value = []
  } finally {
    listActivitiesLoading.value = false
  }
}

const removeFromCustomList = async (activityId) => {
  const name = selectedListName.value
  if (!name) return
  const entries = listStore.lists.filter(entry =>
    entry.list_type === 'custom' &&
    (entry.custom_name?.trim() || 'Sans nom') === name &&
    entry.activity_id === activityId
  )
  if (!entries.length) return
  try {
    await Promise.all(entries.map(entry => listStore.deleteList(entry._id)))
    selectedListActivities.value = selectedListActivities.value.filter(a => a._id !== activityId)
  } catch (err) {
    console.error(err)
  }
}
</script>

<style scoped>
.activity-image {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  margin-bottom: 10px;
}
</style>
