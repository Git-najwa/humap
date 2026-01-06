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
            <AppButtonModern variant="danger" @click="deleteCustomList(list.name)">Supprimer</AppButtonModern>
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

const listStore = useListStore()
const favoriteStore = useFavoriteStore()
const router = useRouter()
const showCreateForm = ref(false)
const newListName = ref('')

const { favorites } = storeToRefs(favoriteStore)
const favoritesCount = computed(() => favorites.value.length)

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
  } catch (err) {
    console.error(err)
  }
}
</script>
