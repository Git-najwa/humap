import api from './api'

export const reviewService = {
  // Récupérer les avis d'une activité
  getByActivityId: (activityId) => api.get(`/activities/${activityId}/reviews`),
  
  // Créer un avis pour une activité
  create: (activityId, data) => api.post(`/activities/${activityId}/reviews`, data),
  
  // Récupérer un avis par ID
  getById: (activityId, reviewId) => api.get(`/activities/${activityId}/reviews/${reviewId}`),
  
  // Supprimer un avis
  delete: (activityId, reviewId) => api.delete(`/activities/${activityId}/reviews/${reviewId}`),
}
