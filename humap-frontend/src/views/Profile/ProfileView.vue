<template>
  <div class="profile-container">
    <button @click="goBack" class="back-btn">← Retour</button>

    <div v-if="authStore.user" class="profile-card">
      <h1>Profil</h1>
      <div class="profile-info">
        <p><strong>Nom d'utilisateur :</strong> {{ authStore.user.username }}</p>
        <p><strong>Email :</strong> {{ authStore.user.email }}</p>
      </div>

      <button @click="handleLogout" class="logout-btn">Déconnexion</button>
    </div>

    <div v-else class="loading">
      Chargement du profil...
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../store/auth.store'

const router = useRouter()
const authStore = useAuthStore()

const goBack = () => {
  router.back()
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.profile-container {
  padding: 2rem;
  max-width: 600px;
  margin: 0 auto;
}

.back-btn {
  padding: 0.5rem 1rem;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  margin-bottom: 1rem;
}

.back-btn:hover {
  background-color: #545b62;
}

.profile-card {
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h1 {
  margin-top: 0;
  color: #333;
}

.profile-info {
  background-color: #f8f9fa;
  padding: 1.5rem;
  border-radius: 0.5rem;
  margin-bottom: 2rem;
}

.profile-info p {
  margin: 0.5rem 0;
}

.logout-btn {
  width: 100%;
  padding: 0.75rem 1.5rem;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.3s;
}

.logout-btn:hover {
  background-color: #c82333;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
}
</style>
