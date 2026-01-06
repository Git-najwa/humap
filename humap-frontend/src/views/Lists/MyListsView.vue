<template>
  <div class="lists-container">
    <header class="header">
      <h1>Mes listes</h1>
      <button @click="showCreateForm = true" class="create-btn">+ Nouvelle liste</button>
    </header>
<template>
  <div class="lists-container container">
    <header class="header">
      <h1 class="text-2xl font-semibold">Mes listes</h1>
      <AppButton-modern variant="primary" @click="() => showCreateForm = true">+ Nouvelle liste</AppButton-modern>
    </header>

    <ErrorMessage :message="listStore.error" />

    <div v-if="showCreateForm" class="create-form-container card">
      <AppInput-modern v-model="newListName" placeholder="Nom de la liste" />
      <div style="display:flex;gap:12px;margin-top:var(--spacing-sm)">
        <AppButton-modern variant="primary" @click="handleCreateList">Créer</AppButton-modern>
        <AppButton-modern variant="secondary" @click="() => showCreateForm = false">Annuler</AppButton-modern>
      </div>
    </div>

    <div v-if="listStore.isLoading" class="loading">Chargement des listes...</div>

    <div v-else-if="listStore.lists.length === 0" class="no-lists card">
      Aucune liste créée
    </div>

    <div v-else class="lists-grid">
      <div v-for="list in listStore.lists" :key="list._id" class="list-card card">
        <h3 class="font-semibold">{{ list.name }}</h3>
        <p class="count text-tertiary">{{ list.activities?.length || 0 }} activité(s)</p>
        <div style="margin-top:12px;display:flex;gap:8px">
          <AppButton-modern variant="secondary" @click="() => $router.push(`/lists/${list._id}`)">Ouvrir</AppButton-modern>
          <AppButton-modern variant="danger" @click="deleteList(list._id)">Supprimer</AppButton-modern>
        </div>
      </div>
    </div>
  </div>
</template>
        <p class="count">{{ list.activities?.length || 0 }} activité(s)</p>
        <button @click="deleteList(list._id)" class="delete-btn">Supprimer</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useListStore } from '../../store/list.store'
import { useActivityStore } from '../../store/activity.store'
import ErrorMessage from '../../components/ui/ErrorMessage-modern.vue'
import AppInputModern from '../../components/ui/AppInput-modern.vue'
import AppButtonModern from '../../components/ui/AppButton-modern.vue'
import { useRouter } from 'vue-router'

const listStore = useListStore()
const activityStore = useActivityStore()
const router = useRouter()
const showCreateForm = ref(false)
const newListName = ref('')

onMounted(async () => {
  try {
    await listStore.fetchAllLists()
  } catch (err) {
    console.error(err)
  }
})

const handleCreateList = async () => {
  if (newListName.value.trim()) {
    try {
      await listStore.createList({ name: newListName.value })
      newListName.value = ''
      showCreateForm.value = false
    } catch (err) {
      console.error(err)
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

const toggleFavorite = async (activityId) => {
  try {
    await activityStore.toggleLike(activityId)
    // refresh lists and favorites
    await listStore.fetchAllLists()
    // reload liked activities
    const likedEntries = listStore.lists.filter(l => l.list_type === 'liked')
    const promises = likedEntries.map(e => activityStore.fetchActivityById(e.activity_id))
    const results = await Promise.allSettled(promises)
    likedActivities.value = results.filter(r => r.status === 'fulfilled').map(r => r.value)
  } catch (err) {
    console.error('toggleFavorite failed', err)
  }
}
</script>

<style scoped>
.lists-container {
  padding: 2rem;
  max-width: 1000px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

h1 {
  margin: 0;
}

.create-btn {
  padding: 0.75rem 1.5rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
}

.create-btn:hover {
  background-color: #0056b3;
}

.create-form-container {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  background: white;
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 0.5rem;
}

.save-btn, .cancel-btn, .delete-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
}

.save-btn {
  background-color: #28a745;
  color: white;
}

.save-btn:hover {
  background-color: #218838;
}

.cancel-btn {
  background-color: #6c757d;
  color: white;
}

.cancel-btn:hover {
  background-color: #545b62;
}

.delete-btn {
  background-color: #dc3545;
  color: white;
  width: 100%;
  margin-top: 1rem;
}

.delete-btn:hover {
  background-color: #c82333;
}

.loading, .no-lists {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.lists-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 2rem;
}

.list-card {
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.list-card h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.count {
  color: #666;
  margin: 0.5rem 0;
  font-size: 0.9rem;
}
</style>
