import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { activityService } from '../services/activity.service'

export const useActivityStore = defineStore('activity', () => {
  const activities = ref([])
  const currentActivity = ref(null)
  const isLoading = ref(false)
  const error = ref(null)
  const pagination = ref({
    page: 1,
    limit: 10,
    total: 0,
  })
  const filters = ref({})

  const fetchActivities = async (page = 1, limit = 10, filterParams = {}) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await activityService.getAll(page, limit, filterParams)
      // Protection : vérifier que activities existe dans la réponse
      activities.value = response.data.activities || []
      pagination.value = {
        page,
        limit,
        total: response.data.total || 0,
      }
      filters.value = filterParams
      return response.data
    } catch (err) {
      // En cas d'erreur, garder un tableau vide
      activities.value = []
      error.value = err.response?.data?.message || 'Erreur lors de la récupération des activités'
      throw error.value
    } finally {
      isLoading.value = false
    }
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

  const createActivity = async (data) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await activityService.create(data)
      activities.value.push(response.data)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de la création de l\'activité'
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

  return {
    activities,
    currentActivity,
    isLoading,
    error,
    pagination,
    filters,
    fetchActivities,
    fetchActivityById,
    createActivity,
    updateActivity,
    deleteActivity,
  }
})
