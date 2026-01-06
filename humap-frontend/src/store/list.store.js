import { defineStore } from 'pinia'
import { ref } from 'vue'
import { listService } from '../services/list.service'

export const useListStore = defineStore('list', () => {
  const lists = ref([])
  const currentList = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  const fetchAllLists = async () => {
    isLoading.value = true
    error.value = null
    try {
      const response = await listService.getAll()
      lists.value = response.data
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de la récupération des listes'
      throw error.value
    } finally {
      isLoading.value = false
    }
  }

  const fetchListById = async (id) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await listService.getById(id)
      currentList.value = response.data
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de la récupération de la liste'
      throw error.value
    } finally {
      isLoading.value = false
    }
  }

  const createList = async (data) => {
    isLoading.value = true
    error.value = null
    try {
      const payload = { ...data }
      if (!payload.list_type) {
        payload.list_type = 'custom'
      }
      if (!payload.custom_name && payload.name) {
        payload.custom_name = payload.name
        delete payload.name
      }
      const response = await listService.create(payload)
      lists.value.push(response.data)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de la création de la liste'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const updateList = async (id, data) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await listService.update(id, data)
      const index = lists.value.findIndex(l => l._id === id)
      if (index !== -1) {
        lists.value[index] = response.data
      }
      if (currentList.value?._id === id) {
        currentList.value = response.data
      }
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de la mise à jour de la liste'
      throw error.value
    } finally {
      isLoading.value = false
    }
  }

  const deleteList = async (id) => {
    isLoading.value = true
    error.value = null
    try {
      await listService.delete(id)
      lists.value = lists.value.filter(l => l._id !== id)
      if (currentList.value?._id === id) {
        currentList.value = null
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de la suppression de la liste'
      throw error.value
    } finally {
      isLoading.value = false
    }
  }

  const addActivityToList = async (listId, activityId) => {
    try {
      await listService.addActivityToList(listId, activityId)
      await fetchListById(listId)
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de l\'ajout de l\'activité'
      throw error.value
    }
  }

  const removeActivityFromList = async (listId, activityId) => {
    try {
      await listService.removeActivityFromList(listId, activityId)
      await fetchListById(listId)
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors de la suppression de l\'activité'
      throw error.value
    }
  }

  return {
    lists,
    currentList,
    isLoading,
    error,
    fetchAllLists,
    fetchListById,
    createList,
    updateList,
    deleteList,
    addActivityToList,
    removeActivityFromList,
  }
})
