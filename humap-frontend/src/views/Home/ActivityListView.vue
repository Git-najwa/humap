<template>
  <div class="activity-list-container">
    <header class="header">
      <h1>Activités HUMAP</h1>
      <router-link to="/activities/create" class="create-btn">+ Nouvelle activité</router-link>
      <button @click="handleLogout" class="logout-btn">Déconnexion</button>
    </header>

    <ErrorMessage :message="activityStore.error" />

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

onMounted(async () => {
  await activityStore.fetchActivities()
})

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
