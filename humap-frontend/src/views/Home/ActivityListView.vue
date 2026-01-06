<template>
  <div class="activity-list-container">
    <header class="header container">
      <h1 class="text-2xl font-semibold">Activités HUMAP</h1>
      <div class="flex gap-sm">
        <router-link to="/activities/create">
          <AppButton-modern variant="primary">+ Nouvelle activité</AppButton-modern>
        </router-link>
        <router-link to="/lists">
          <AppButton-modern variant="secondary">Favoris ({{ likedCount }})</AppButton-modern>
        </router-link>
        <AppButton-modern variant="secondary" @click="handleLogout">Déconnexion</AppButton-modern>
      </div>
    </header>

    <ErrorMessage :message="activityStore.error" />

    <section class="filters container card" style="display:flex;gap:12px;align-items:center;margin-bottom:var(--spacing-lg)">
      <AppInput-modern v-model="q" placeholder="Recherche..." />
      <select v-model="mood" class="input" style="width:180px">
        <option value="">Tous les moods</option>
        <option value="calm">calm</option>
        <option value="social">social</option>
        <option value="energetic">energetic</option>
      </select>
      <AppInput-modern v-model.number="price_max" type="number" placeholder="Prix max" style="width:120px" />
      <AppInput-modern v-model.number="nb_people" type="number" placeholder="Nb personnes" style="width:120px" />
      <AppButton-modern variant="primary" @click="applyFilters">Filtrer</AppButton-modern>
      <AppButton-modern variant="secondary" @click="resetFilters">Réinitialiser</AppButton-modern>
    </section>

    <div v-if="activityStore.isLoading" class="loading">Chargement des activités...</div>

    <div v-else-if="activityStore.activities.length === 0" class="no-activities">
      Aucune activité trouvée
    </div>

    <div v-else class="activities-grid container grid grid-cols-3">
      <div v-for="activity in activityStore.activities" :key="activity._id" class="card">
        <h3 class="text-lg font-semibold">{{ activity.title }}</h3>
        <p class="text-secondary" style="margin-top:8px">{{ activity.description }}</p>
        <div style="margin-top:12px;display:flex;justify-content:space-between;align-items:center">
          <div>
            <p class="location text-tertiary">📍 {{ activity.location }}</p>
            <p class="mood text-tertiary">Ambiance : {{ activity.mood }}</p>
          </div>
          <router-link :to="`/activities/${activity._id}`">
            <AppButton-modern variant="secondary">Voir</AppButton-modern>
          </router-link>
        </div>
      </div>
    </div>

    <div class="pagination container" v-if="pagination.total > pagination.limit" style="display:flex;gap:12px;align-items:center;justify-content:center;margin-top:var(--spacing-lg)">
      <AppButton-modern variant="secondary" @click="goToPage(pagination.page - 1)" :disabled="pagination.page <= 1">Préc</AppButton-modern>
      <span class="text-sm text-tertiary">Page {{ pagination.page }} / {{ pagination.totalPages || Math.ceil(pagination.total / pagination.limit) }}</span>
      <AppButton-modern variant="secondary" @click="goToPage(pagination.page + 1)" :disabled="pagination.page >= (pagination.totalPages || Math.ceil(pagination.total / pagination.limit))">Suiv</AppButton-modern>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useActivityStore } from '../../store/activity.store'
import { useAuthStore } from '../../store/auth.store'
import { useListStore } from '../../store/list.store'
import ErrorMessage from '../../components/ui/ErrorMessage-modern.vue'
import AppInputModern from '../../components/ui/AppInput-modern.vue'
import AppButtonModern from '../../components/ui/AppButton-modern.vue'

const router = useRouter()
const activityStore = useActivityStore()
const authStore = useAuthStore()
const listStore = useListStore()

const likedCount = computed(() => listStore.lists.filter(l => l.list_type === 'liked').length)

const q = ref('')
const mood = ref('')
const price_max = ref(null)
const nb_people = ref(null)
const pagination = activityStore.pagination
const filters = activityStore.filters

// initialize local filter inputs from store
q.value = filters.value?.q || ''
mood.value = filters.value?.mood || ''
price_max.value = filters.value?.price_range || null
nb_people.value = filters.value?.nb_people || null

onMounted(async () => {
  try {
    await activityStore.fetchActivities()
    // also fetch user's lists to show favorites badge
    if (authStore.user) {
      try {
        await listStore.fetchAllLists()
      } catch (e) {
        console.warn('Could not load user lists for badge', e)
      }
    }
  } catch (e) {
    console.error('fetchActivities failed:', e)
  }
})

const applyFilters = async () => {
  const filters = {}
  if (mood.value) filters.mood = mood.value
  if (price_max.value !== null && price_max.value !== undefined && price_max.value !== '') filters.price_range = price_max.value
  if (nb_people.value) filters.nb_people = nb_people.value
  if (q.value) filters.q = q.value
  try {
    const f = {}
    if (mood.value) f.mood = mood.value
    if (price_max.value !== null && price_max.value !== undefined && price_max.value !== '') f.price_range = price_max.value
    if (nb_people.value) f.nb_people = nb_people.value
    if (q.value) f.q = q.value
    await activityStore.applyFilters(f)
  } catch (e) {
    console.error('applyFilters failed', e)
  }
}

const resetFilters = async () => {
  q.value = ''
  mood.value = ''
  price_max.value = null
  nb_people.value = null
  try {
    await activityStore.applyFilters({})
    q.value = ''
    mood.value = ''
    price_max.value = null
    nb_people.value = null
  } catch (e) {
    console.error(e)
  }
}

const goToPage = async (page) => {
  if (page < 1) return
  try {
    await activityStore.goToPage(page)
  } catch (e) {
    console.error('goToPage failed', e)
  }
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.activity-list-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
}

h1 {
  margin: 0;
  flex: 1;
}

.create-btn, .logout-btn {
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

.create-btn:hover {
  background-color: #0056b3;
}

.logout-btn {
  background-color: #6c757d;
}

.logout-btn:hover {
  background-color: #545b62;
}

.loading, .no-activities {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.activities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}

.activity-card {
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
}

.activity-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
}

.activity-card h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.activity-card p {
  margin: 0.5rem 0;
  color: #666;
  line-height: 1.5;
}

.location, .mood {
  font-size: 0.9rem;
}

.detail-link {
  display: inline-block;
  margin-top: 1rem;
  color: #007bff;
  text-decoration: none;
  font-weight: 600;
}

.detail-link:hover {
  text-decoration: underline;
}
</style>
