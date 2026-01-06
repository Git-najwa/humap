import { defineStore } from 'pinia'
import { ref } from 'vue'
import { reviewService } from '../services/review.service'

export const useReviewStore = defineStore('review', () => {
  const reviews = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  const fetchReviewsByActivity = async (activityId) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await reviewService.getByActivityId(activityId)
      const payload = response.data?.items || response.data
      reviews.value = Array.isArray(payload) ? payload : []
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de la récupération des avis'
      throw error.value
    } finally {
      isLoading.value = false
    }
  }

  const createReview = async (activityId, data) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await reviewService.create(activityId, data)
      reviews.value.unshift(response.data)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de la création de l\'avis'
      throw error.value
    } finally {
      isLoading.value = false
    }
  }

  const updateReview = async (id, data) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await reviewService.update(id, data)
      const index = reviews.value.findIndex(r => r._id === id)
      if (index !== -1) {
        reviews.value[index] = response.data
      }
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de la mise à jour de l\'avis'
      throw error.value
    } finally {
      isLoading.value = false
    }
  }

  const deleteReview = async (id) => {
    isLoading.value = true
    error.value = null
    try {
      await reviewService.delete(id)
      reviews.value = reviews.value.filter(r => r._id !== id)
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de la suppression de l\'avis'
      throw error.value
    } finally {
      isLoading.value = false
    }
  }

  return {
    reviews,
    isLoading,
    error,
    fetchReviewsByActivity,
    createReview,
    updateReview,
    deleteReview,
  }
})
