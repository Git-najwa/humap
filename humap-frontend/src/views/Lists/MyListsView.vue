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

    <div v-if="listStore.isLoading" class="loading">Chargement des listes...</div>

    <div v-else-if="listStore.lists.length === 0" class="no-lists card">
      Aucune liste créée
    </div>

    <div v-else class="lists-grid">
      <div v-for="list in listStore.lists" :key="list._id" class="list-card card">
        <h3 class="font-semibold">{{ list.name }}</h3>
        <p class="count text-tertiary">{{ list.activities?.length || 0 }} activité(s)</p>
        <div style="margin-top:12px;display:flex;gap:8px">
          <AppButtonModern variant="secondary" @click="() => $router.push(`/lists/${list._id}`)">Ouvrir</AppButtonModern>
          <AppButtonModern variant="danger" @click="deleteList(list._id)">Supprimer</AppButtonModern>
        </div>
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
