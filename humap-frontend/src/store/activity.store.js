import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { activityService } from '../services/activity.service'
import { socket } from '../services/socket.service'
import { useToast } from '../composables/useToast'

export const useActivityStore = defineStore('activity', () => {
  const activities = ref([])
  const currentActivity = ref(null)
  const isLoading = ref(false)
  const error = ref(null)
  const pagination = ref({
    page: 1,
    limit: 50,
    total: 0,
  })
  const filters = ref({})

  const fetchActivities = async (page = 1, limit = 50, filterParams = {}) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await activityService.getAll(page, limit, filterParams)
      // Backend returns { items, pagination }
      activities.value = response.data.items || []
      pagination.value = {
        page: response.data.pagination?.page || page,
        limit: response.data.pagination?.limit || limit,
        total: response.data.pagination?.total || response.data.pagination?.total || 0,
        totalPages: response.data.pagination?.totalPages || Math.ceil((response.data.pagination?.total || 0) / limit),
      }
      filters.value = filterParams
      return response.data
    } catch (err) {
      // En cas d'erreur, ne pas écraser le tableau local (conserver état existant)
      error.value = err.response?.data?.message || 'Erreur lors de la récupération des activités'
      throw error.value
    } finally {
      isLoading.value = false
    }
  }

  const applyFilters = async (filterParams = {}) => {
    filters.value = filterParams
    return await fetchActivities(1, pagination.value.limit || 50, filters.value)
  }

  const goToPage = async (page) => {
    const p = Math.max(1, page)
    return await fetchActivities(p, pagination.value.limit || 50, filters.value)
  }

  const setLimit = async (limit) => {
    pagination.value.limit = limit
    return await fetchActivities(1, limit, filters.value)
  }

  const fetchActivityById = async (id) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await activityService.getById(id)
      currentActivity.value = response.data
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de la récupération de l\'activité'
      throw error.value
    } finally {
      isLoading.value = false
    }
  }

  const fetchNearby = async (lat, lng, radius = 15000, limit = 50) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await activityService.getNearby(lat, lng, radius, limit)
      activities.value = response.data.items || []
      pagination.value = {
        page: 1,
        limit,
        total: activities.value.length,
        totalPages: 1,
      }
      filters.value = {}
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de la récupération des activités proches'
      throw error.value
    } finally {
      isLoading.value = false
    }
  }

  const createActivity = async (data) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await activityService.create(data)
      // Add created item optimistically
      activities.value.unshift(response.data)
      // Refresh list from server to keep pagination and ordering consistent
      try {
        await fetchActivities(pagination.value.page || 1, pagination.value.limit || 10, filters.value)
        // If server response does not include the newly created item on current page,
        // ensure the optimistic item remains visible at the top and update pagination total.
        const exists = activities.value.some(a => a._id === response.data._id)
        if (!exists) {
          activities.value.unshift(response.data)
          pagination.value.total = (pagination.value.total || 0) + 1
        }
      } catch (e) {
        // If refresh fails, keep optimistic item and surface warning
        console.warn('fetchActivities after create failed:', e)
      }
      return response.data
    } catch (err) {
      // Prefer detailed validation messages from backend if present
      const details = err.response?.data?.errors
      const msg = err.response?.data?.message
      if (Array.isArray(details) && details.length) {
        error.value = details.join(' ; ')
      } else {
        error.value = msg || 'Erreur lors de la création de l\'activité'
      }
      throw error.value
    } finally {
      isLoading.value = false
    }
  }

  const updateActivity = async (id, data) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await activityService.update(id, data)
      const index = activities.value.findIndex(a => a._id === id)
      if (index !== -1) {
        activities.value[index] = response.data
      }
      if (currentActivity.value?._id === id) {
        currentActivity.value = response.data
      }
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de la mise à jour de l\'activité'
      throw error.value
    } finally {
      isLoading.value = false
    }
  }

  const deleteActivity = async (id) => {
    isLoading.value = true
    error.value = null
    try {
      await activityService.delete(id)
      activities.value = activities.value.filter(a => a._id !== id)
      if (currentActivity.value?._id === id) {
        currentActivity.value = null
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de la suppression de l\'activité'
      throw error.value
    } finally {
      isLoading.value = false
    }
  }

  const toggleLike = async (id) => {
    error.value = null
    try {
      const response = await activityService.toggleLike(id)
      // backend returns { liked }
      const liked = response.data?.liked
      // if currentActivity matches, you may attach liked flag locally
      if (currentActivity.value?._id === id) {
        currentActivity.value.liked = !!liked
      }
      return { liked }
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors du like'
      throw error.value
    }
  }

  // Ajouter une activité reçue en temps réel
  const addActivityRealtime = (activity) => {
    // Éviter les doublons
    const exists = activities.value.some(a => a._id === activity._id)
    if (!exists) {
      activities.value.unshift(activity)
      pagination.value.total += 1
      
      // Afficher une notification toast
      const { info } = useToast()
      info('🆕 Nouvelle activité', activity.title)
      
      console.log('📡 Nouvelle activité reçue:', activity.title)
    }
  }

  // Mettre à jour une activité en temps réel
  const updateActivityRealtime = (activity) => {
    const index = activities.value.findIndex(a => a._id === activity._id)
    if (index !== -1) {
      activities.value[index] = activity
      console.log('📡 Activité mise à jour:', activity.title)
    }
    // Mettre à jour aussi si c'est l'activité courante
    if (currentActivity.value?._id === activity._id) {
      currentActivity.value = activity
    }
  }

  // Supprimer une activité en temps réel
  const deleteActivityRealtime = (data) => {
    const index = activities.value.findIndex(a => a._id === data._id)
    if (index !== -1) {
      const deleted = activities.value.splice(index, 1)[0]
      pagination.value.total -= 1
      
      const { info } = useToast()
      info('Activité supprimée', deleted?.title || 'Une activité a été supprimée')
      
      console.log('Activité supprimée:', data._id)
    }
  }

  // Écouter les événements Socket.io
  socket.on('activity:created', addActivityRealtime)
  socket.on('activity:updated', updateActivityRealtime)
  socket.on('activity:deleted', deleteActivityRealtime)

  return {
    activities,
    currentActivity,
    isLoading,
    error,
    pagination,
    filters,
    fetchActivities,
    fetchNearby,
    applyFilters,
    goToPage,
    setLimit,
    fetchActivityById,
    createActivity,
    updateActivity,
    deleteActivity,
    toggleLike,
    addActivityRealtime,
    updateActivityRealtime,
    deleteActivityRealtime,
  }
})
