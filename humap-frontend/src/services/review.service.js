import api from './api'

export const reviewService = {
  getByActivityId: (activityId) => api.get(`/reviews/activity/${activityId}`),
  create: (data) => api.post('/reviews', data),
  update: (id, data) => api.put(`/reviews/${id}`, data),
  delete: (id) => api.delete(`/reviews/${id}`),
}
