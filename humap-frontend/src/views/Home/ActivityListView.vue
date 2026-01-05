<template>
  <div class="activity-list-container">
    <header class="header">
      <h1>Activités HUMAP</h1>
      <div style="display:flex;gap:12px;align-items:center">
        <router-link to="/activities/create" class="create-btn">+ Nouvelle activité</router-link>
        <button @click="handleLogout" class="logout-btn">Déconnexion</button>
      </div>
    </header>

    <ErrorMessage :message="activityStore.error" />

    <section class="filters">
      <input v-model="q" placeholder="Recherche..." @keyup.enter="applyFilters" />
      <select v-model="mood">
        <option value="">Tous les moods</option>
        <option value="calm">calm</option>
        <option value="social">social</option>
        <option value="energetic">energetic</option>
      </select>
      <input v-model.number="price_max" type="number" placeholder="Prix max" />
      <input v-model.number="nb_people" type="number" placeholder="Nb personnes" />
      <button @click="applyFilters" class="create-btn">Filtrer</button>
      <button @click="resetFilters" class="logout-btn">Réinitialiser</button>
    </section>

    <div v-if="activityStore.isLoading" class="loading">Chargement des activités...</div>

    <div v-else-if="activityStore.activities.length === 0" class="no-activities">
      Aucune activité trouvée
    </div>

    <div v-else class="activities-grid">
      <div v-for="activity in activityStore.activities" :key="activity._id" class="activity-card">
        <h3>{{ activity.title }}</h3>
        <p>{{ activity.description }}</p>
        <p class="location">📍 {{ activity.location }}</p>
        <p class="mood">Ambiance : {{ activity.mood }}</p>
        <router-link :to="`/activities/${activity._id}`" class="detail-link">Voir détails</router-link>
      </div>
    </div>

    <div class="pagination" v-if="pagination.total > pagination.limit">
      <button @click="goToPage(pagination.page - 1)" :disabled="pagination.page <= 1">Préc</button>
      <span>Page {{ pagination.page }} / {{ pagination.totalPages || Math.ceil(pagination.total / pagination.limit) }}</span>
      <button @click="goToPage(pagination.page + 1)" :disabled="pagination.page >= (pagination.totalPages || Math.ceil(pagination.total / pagination.limit))">Suiv</button>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useActivityStore } from '../../store/activity.store'
import { useAuthStore } from '../../store/auth.store'
import ErrorMessage from '../../components/ui/ErrorMessage.vue'

const router = useRouter()
const activityStore = useActivityStore()
const authStore = useAuthStore()

const q = ref('')
const mood = ref('')
const price_max = ref(null)
const nb_people = ref(null)

onMounted(async () => {
  try {
    await activityStore.fetchActivities()
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
    await activityStore.fetchActivities(1, activityStore.pagination.limit, filters)
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
    await activityStore.fetchActivities(1, activityStore.pagination.limit, {})
  } catch (e) {
    console.error(e)
  }
}

const goToPage = async (page) => {
  if (page < 1) return
  try {
    await activityStore.fetchActivities(page, activityStore.pagination.limit, activityStore.filters)
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
