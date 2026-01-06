<template>
  <div class="activity-list-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-header-content">
        <h1 class="page-title">Activités</h1>
        <p class="page-subtitle">Découvrez les activités disponibles</p>
      </div>
      <router-link to="/activities/create" class="create-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        <span>Nouvelle activité</span>
      </router-link>
    </div>

    <!-- Error Message -->
    <ErrorMessage :message="activityStore.error" />

    <!-- Loading State -->
    <div v-if="activityStore.isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Chargement des activités...</p>
    </div>

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

    <!-- Activities Grid -->
    <div v-else class="activities-grid">
      <article v-for="activity in activityStore.activities" :key="activity._id" class="activity-card">
        <div class="card-header">
          <span class="card-mood" :class="getMoodClass(activity.mood)">{{ activity.mood }}</span>
        </div>
        <div class="card-body">
          <h3 class="card-title">{{ activity.title }}</h3>
          <p class="card-description">{{ truncateText(activity.description, 100) }}</p>
          <div class="card-location">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span>{{ activity.location }}</span>
          </div>
        </div>
        <div class="card-footer">
          <router-link :to="`/activities/${activity._id}`" class="detail-link">
            Voir détails
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </router-link>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useActivityStore } from '../../store/activity.store'
import ErrorMessage from '../../components/ui/ErrorMessage.vue'

const activityStore = useActivityStore()

onMounted(() => {
  activityStore.fetchActivities()
})

const truncateText = (text, maxLength) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

const getMoodClass = (mood) => {
  const moodMap = {
    'calme': 'mood-calm',
    'énergique': 'mood-energetic',
    'festif': 'mood-festive',
    'romantique': 'mood-romantic',
    'aventurier': 'mood-adventure'
  }
  return moodMap[mood?.toLowerCase()] || 'mood-default'
}
</script>

<style scoped>
.activity-list-page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  min-height: calc(100vh - 80px);
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.page-title {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: #111827;
}

.page-subtitle {
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.create-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background-color: #111827;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: background-color 0.2s;
}

.create-btn:hover {
  background-color: #374151;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #6b7280;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #111827;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  color: #6b7280;
}

.empty-state svg {
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
  color: #374151;
}

.empty-state p {
  margin: 0 0 1.5rem 0;
  font-size: 0.875rem;
}

.empty-state-btn {
  padding: 0.75rem 1.5rem;
  background-color: #111827;
  color: white;
  border-radius: 8px;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.empty-state-btn:hover {
  background-color: #374151;
}

/* Activities Grid */
.activities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

/* Activity Card */
.activity-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  transition: box-shadow 0.2s, transform 0.2s;
}

.activity-card:hover {
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card-header {
  padding: 1rem 1.25rem 0;
}

.card-mood {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 9999px;
  text-transform: capitalize;
}

.mood-calm {
  background-color: #dbeafe;
  color: #1e40af;
}

.mood-energetic {
  background-color: #fef3c7;
  color: #92400e;
}

.mood-festive {
  background-color: #fce7f3;
  color: #9d174d;
}

.mood-romantic {
  background-color: #ffe4e6;
  color: #be123c;
}

.mood-adventure {
  background-color: #d1fae5;
  color: #065f46;
}

.mood-default {
  background-color: #f3f4f6;
  color: #374151;
}

.card-body {
  padding: 1rem 1.25rem;
}

.card-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
}

.card-description {
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.5;
}

.card-location {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.card-location svg {
  flex-shrink: 0;
  color: #9ca3af;
}

.card-footer {
  padding: 1rem 1.25rem;
  border-top: 1px solid #f3f4f6;
  background-color: #fafafa;
}

.detail-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #111827;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: color 0.2s;
}

.detail-link:hover {
  color: #4b5563;
}

.detail-link svg {
  transition: transform 0.2s;
}

.detail-link:hover svg {
  transform: translateX(4px);
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .activity-list-page {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .create-btn {
    width: 100%;
    justify-content: center;
  }

  .activities-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 1.5rem;
  }

  .card-title {
    font-size: 1rem;
  }
}
</style>
