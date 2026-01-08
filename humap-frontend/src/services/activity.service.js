import api from './api'

export const activityService = {
  getAll: (page = 1, limit = 50, filters = {}) => api.get('/activities', { params: { page, limit, ...filters } }),
  getNearby: (lat, lng, radius = 15000, limit = 50) =>
    api.get('/activities/near', { params: { lat, lng, radius, limit } }),
  getById: (id) => api.get(`/activities/${id}`),
  create: (data) => api.post('/activities', data),
  update: (id, data) => api.patch(`/activities/${id}`, data),
  delete: (id) => api.delete(`/activities/${id}`),
  toggleLike: (id) => api.post(`/activities/${id}/like`),
}
