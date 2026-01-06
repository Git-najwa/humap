<template>
  <div class="profile-container container">
    <AppButton variant="secondary" @click="goBack">← Retour</AppButton>

    <div v-if="authStore.user" class="card" style="margin-top:var(--spacing-md)">
      <h1 class="text-2xl font-semibold">Profil</h1>
      <div class="profile-info" style="margin-top:var(--spacing-sm)">
        <p><strong>Nom d'utilisateur :</strong> {{ authStore.user.username }}</p>
        <p><strong>Email :</strong> {{ authStore.user.email }}</p>
      </div>

      <AppButton variant="danger" @click="handleLogout" style="margin-top:var(--spacing-md);width:100%">Déconnexion</AppButton>
    </div>

    <div v-else class="loading">
      Chargement du profil...
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../store/auth.store'
import AppButtonModern from '../../components/ui/AppButton-modern.vue'

const AppButton = AppButtonModern

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
