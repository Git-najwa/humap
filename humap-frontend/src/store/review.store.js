import { defineStore } from 'pinia'
import { ref } from 'vue'
import { reviewService } from '../services/review.service'
import { socket } from '../services/socket.service'
import { useToast } from '../composables/useToast'

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

  const deleteReview = async (activityId, reviewId) => {
    isLoading.value = true
    error.value = null
    try {
      await reviewService.delete(activityId, reviewId)
      reviews.value = reviews.value.filter(r => r._id !== reviewId)
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de la suppression de l\'avis'
      throw error.value
    } finally {
      isLoading.value = false
    }
  }

  // Ajouter un review en temps réel
  const addReviewRealtime = (review) => {
    // Éviter les doublons
    const exists = reviews.value.some(r => r._id === review._id)
    if (!exists) {
      reviews.value.unshift(review)
      
      const { info } = useToast()
      const username = review.user?.username || 'Quelqu\'un'
      info('Nouvel avis', `${username} a laissé un avis`)
      
      console.log('Nouvel avis reçu:', review._id)
    }
  }

  // Écouter les événements Socket.io
  socket.on('review:created', addReviewRealtime)

  return {
    reviews,
    isLoading,
    error,
    fetchReviewsByActivity,
    createReview,
    updateReview,
    deleteReview,
    addReviewRealtime,
  }
})
