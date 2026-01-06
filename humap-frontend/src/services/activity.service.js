import api from './api'

export const activityService = {
  getAll: (page = 1, limit = 10, filters = {}) => api.get('/activities', { params: { page, limit, ...filters } }),
  getById: (id) => api.get(`/activities/${id}`),
  create: (data) => api.post('/activities', data),
  update: (id, data) => api.patch(`/activities/${id}`, data),
  delete: (id) => api.delete(`/activities/${id}`),
  toggleLike: (id) => api.post(`/activities/${id}/like`),
}
