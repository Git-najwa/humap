import api from './api'

export const listService = {
  getAll: () => api.get('/lists'),
  getById: (id) => api.get(`/lists/${id}`),
  create: (data) => api.post('/lists', data),
  update: (id, data) => api.patch(`/lists/${id}`, data),
  delete: (id) => api.delete(`/lists/${id}`),
  addActivityToList: (listId, activityId) => api.post(`/lists/${listId}/activities`, { activity_id: activityId }),
  removeActivityFromList: (listId, activityId) => api.delete(`/lists/${listId}/activities/${activityId}`),
}
