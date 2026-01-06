import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '../services/auth.service'
import { userService } from '../services/user.service'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(null)
  const user = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  const isAuthenticated = computed(() => !!token.value)
  const userId = computed(() => user.value?._id)

  const login = async (email, password) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await authService.login(email, password)
      token.value = response.data.token
      user.value = response.data.user
      localStorage.setItem('token', token.value)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur de connexion'
      throw error.value
    } finally {
      isLoading.value = false
    }
  }

  const register = async (username, email, password) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await authService.register(username, email, password)
      token.value = response.data.token
      user.value = response.data.user
      localStorage.setItem('token', token.value)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur d\'inscription'
      throw error.value
    } finally {
      isLoading.value = false
    }
  }

  const logout = () => {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
  }

  const loadToken = async () => {
    const savedToken = localStorage.getItem('token')
    if (savedToken) {
      token.value = savedToken
      // Charger automatiquement les infos utilisateur
      await fetchCurrentUser()
    }
  }

  const fetchCurrentUser = async () => {
    if (!token.value) return null
    
    try {
      const response = await userService.getCurrentUser()
      user.value = response.data
      return response.data
    } catch (err) {
      // Si le token est invalide, déconnecter
      if (err.response?.status === 401) {
        logout()
      }
      return null
    }
  }

  const updateProfile = async (data) => {
    if (!user.value?._id) return
    
    isLoading.value = true
    error.value = null
    try {
      const response = await userService.updateProfile(user.value._id, data)
      user.value = response.data
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de la mise à jour du profil'
      throw error.value
    } finally {
      isLoading.value = false
    }
  }

  const deleteAccount = async () => {
    if (!user.value?._id) return
    
    isLoading.value = true
    error.value = null
    try {
      await userService.deleteAccount(user.value._id)
      logout()
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de la suppression du compte'
      throw error.value
    } finally {
      isLoading.value = false
    }
  }

  return {
    token,
    user,
    userId,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    loadToken,
    fetchCurrentUser,
    updateProfile,
    deleteAccount,
  }
})
