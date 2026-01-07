<template>
  <div id="app">
    <AppHeader v-if="authStore.isAuthenticated" />
    <main :class="{ 'with-header': authStore.isAuthenticated }">
      <router-view></router-view>
    </main>
    <ToastNotification />
  </div>
</template>

<script setup>
import { useAuthStore } from './store/auth.store'
import { onMounted, onUnmounted, watch } from 'vue'
import AppHeader from './components/AppHeader.vue'
import ToastNotification from './components/ui/ToastNotification.vue'
import { connectSocket, disconnectSocket } from './services/socket.service'

const authStore = useAuthStore()

onMounted(async () => {
  await authStore.loadToken()
  // Connecter le socket si l'utilisateur est authentifié
  if (authStore.isAuthenticated && authStore.user?._id) {
    connectSocket(authStore.user._id)
  }
})

// Réagir aux changements d'authentification
watch(() => authStore.isAuthenticated, (isAuth) => {
  if (isAuth && authStore.user?._id) {
    connectSocket(authStore.user._id)
  } else {
    disconnectSocket()
  }
})

onUnmounted(() => {
  disconnectSocket()
})
</script>

<style scoped>
#app {
  min-height: 100vh;
}

main.with-header {
  min-height: calc(100vh - 70px);
}
</style>
