<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script setup>
import { useAuthStore } from './store/auth.store'
import { onMounted } from 'vue'

const authStore = useAuthStore()

onMounted(() => {
  authStore.loadToken()
})
</script>

<style scoped>
#app {
  min-height: 100vh;
}
</style>
