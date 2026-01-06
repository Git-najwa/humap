<template>
  <div class="activity-list-container">
    <header class="header container">
      <h1 class="text-2xl font-semibold">Activités HUMAP</h1>
      <div class="flex gap-sm">
        <router-link to="/activities/create">
          <AppButtonModern variant="primary">+ Nouvelle activité</AppButtonModern>
        </router-link>
        <router-link to="/lists">
          <AppButtonModern variant="secondary">Favoris ({{ likedCount }})</AppButtonModern>
        </router-link>
        <AppButtonModern variant="secondary" @click="handleLogout">Déconnexion</AppButtonModern>
      </div>
    </header>

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
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useActivityStore } from '../../store/activity.store'
import { useAuthStore } from '../../store/auth.store'
import { useFavoriteStore } from '../../store/favorite.store'
import ErrorMessageModern from '../../components/ui/ErrorMessage-modern.vue'
import AppInputModern from '../../components/ui/AppInput-modern.vue'
import AppButtonModern from '../../components/ui/AppButton-modern.vue'

const activityStore = useActivityStore()
const authStore = useAuthStore()
const favoriteStore = useFavoriteStore()

const { pagination } = storeToRefs(activityStore)
const { favorites, count: likedCount } = storeToRefs(favoriteStore)

const ErrorMessage = ErrorMessageModern

const q = ref('')
const mood = ref('')
const price_max = ref(null)
const nb_people = ref(null)

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
    if (authStore.user) {
      await favoriteStore.loadFavorites()
    }
  } catch (err) {
    console.error(err)
  }
})

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

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
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
</style>
