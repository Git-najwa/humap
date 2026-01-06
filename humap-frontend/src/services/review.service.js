import api from './api'

export const reviewService = {
  getByActivityId: (activityId) => api.get(`/activities/${activityId}/reviews`),
  // create expects data with activity_id field
  create: (data) => {
    const activityId = data.activity_id || data.activityId
    if (!activityId) return Promise.reject(new Error('activity_id is required'))
    return api.post(`/activities/${activityId}/reviews`, data)
  },
  update: (id, data) => api.put(`/reviews/${id}`, data),
  delete: (id) => api.delete(`/reviews/${id}`),
}
