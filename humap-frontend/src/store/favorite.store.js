import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { listService } from '../services/list.service'
import { activityService } from '../services/activity.service'

export const useFavoriteStore = defineStore('favorite', () => {
  const likedEntries = ref([]) // raw UserActivityList entries
  const favorites = ref([]) // activity objects
  const isLoading = ref(false)
  const error = ref(null)

  const loadFavorites = async () => {
    isLoading.value = true
    error.value = null
    try {
      const resp = await listService.getAll()
      const lists = resp.data || []
      likedEntries.value = lists.filter(l => l.list_type === 'liked')

      // fetch activities details in parallel
      const promises = likedEntries.value.map(e => activityService.getById(e.activity_id))
      const results = await Promise.allSettled(promises)
      favorites.value = results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value.data)
      return favorites.value
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors du chargement des favoris'
      throw error.value
    } finally {
      isLoading.value = false
    }
  }

  const toggleFavorite = async (activityId) => {
    error.value = null
    try {
      // call activity like endpoint to toggle
      await activityService.toggleLike(activityId)
      // reload favorites
      await loadFavorites()
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors du basculement du favori'
      throw error.value
    }
  }

  const count = computed(() => favorites.value.length)

  return {
    likedEntries,
    favorites,
    isLoading,
    error,
    loadFavorites,
    toggleFavorite,
    count,
  }
})
