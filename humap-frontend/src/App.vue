<template>
  <div id="app">
    <AppHeader v-if="authStore.isAuthenticated" />
    <main :class="{ 'with-header': authStore.isAuthenticated }">
      <router-view></router-view>
    </main>
  </div>
</template>

<script setup>
import { useAuthStore } from './store/auth.store'
import { onMounted } from 'vue'
import AppHeader from './components/AppHeader.vue'

const authStore = useAuthStore()

onMounted(() => {
  authStore.loadToken()
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
