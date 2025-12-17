<template>
  <div class="lists-container">
    <header class="header">
      <h1>Mes listes</h1>
      <button @click="showCreateForm = true" class="create-btn">+ Nouvelle liste</button>
    </header>

    <ErrorMessage :message="listStore.error" />

    <div v-if="showCreateForm" class="create-form-container">
      <input v-model="newListName" type="text" placeholder="Nom de la liste" class="input" />
      <button @click="handleCreateList" class="save-btn">Créer</button>
      <button @click="showCreateForm = false" class="cancel-btn">Annuler</button>
    </div>

    <div v-if="listStore.isLoading" class="loading">Chargement des listes...</div>

    <div v-else-if="listStore.lists.length === 0" class="no-lists">
      Aucune liste créée
    </div>

    <div v-else class="lists-grid">
      <div v-for="list in listStore.lists" :key="list._id" class="list-card">
        <h3>{{ list.name }}</h3>
        <p class="count">{{ list.activities?.length || 0 }} activité(s)</p>
        <button @click="deleteList(list._id)" class="delete-btn">Supprimer</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useListStore } from '../../store/list.store'
import ErrorMessage from '../../components/ui/ErrorMessage.vue'

const listStore = useListStore()
const showCreateForm = ref(false)
const newListName = ref('')

onMounted(() => {
  listStore.fetchAllLists()
})

const handleCreateList = async () => {
  if (newListName.value.trim()) {
    try {
      await listStore.createList({ name: newListName.value })
      newListName.value = ''
      showCreateForm.value = false
    } catch (err) {
      console.error(err)
    }
  }
}

const deleteList = async (id) => {
  if (confirm('Êtes-vous sûr de vouloir supprimer cette liste ?')) {
    try {
      await listStore.deleteList(id)
    } catch (err) {
      console.error(err)
    }
  }
}
</script>

<style scoped>
.lists-container {
  padding: 2rem;
  max-width: 1000px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

h1 {
  margin: 0;
}

.create-btn {
  padding: 0.75rem 1.5rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
}

.create-btn:hover {
  background-color: #0056b3;
}

.create-form-container {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  background: white;
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 0.5rem;
}

.save-btn, .cancel-btn, .delete-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
}

.save-btn {
  background-color: #28a745;
  color: white;
}

.save-btn:hover {
  background-color: #218838;
}

.cancel-btn {
  background-color: #6c757d;
  color: white;
}

.cancel-btn:hover {
  background-color: #545b62;
}

.delete-btn {
  background-color: #dc3545;
  color: white;
  width: 100%;
  margin-top: 1rem;
}

.delete-btn:hover {
  background-color: #c82333;
}

.loading, .no-lists {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.lists-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 2rem;
}

.list-card {
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.list-card h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.count {
  color: #666;
  margin: 0.5rem 0;
  font-size: 0.9rem;
}
</style>
