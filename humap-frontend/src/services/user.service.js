import api from './api'

export const userService = {
  // Récupérer l'utilisateur connecté
  getCurrentUser: () => api.get('/auth/me'),
  
  // Récupérer un utilisateur par ID
  getById: (id) => api.get(`/users/${id}`),
  
  // Modifier son profil (username, gender, avatar)
  updateProfile: (id, data) => api.patch(`/users/${id}`, data),
  
  // Supprimer son compte
  deleteAccount: (id) => api.delete(`/users/${id}`),
  
  // Récupérer les stats d'un utilisateur
  getStats: (userId) => api.get(`/users/${userId}/stats`),
}
