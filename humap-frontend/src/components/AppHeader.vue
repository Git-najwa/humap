<template>
  <header class="app-header">
    <div class="header-left">
      <router-link to="/" class="logo">
        🗺️ HUMAP
      </router-link>
    </div>

    <nav class="header-nav">
      <router-link to="/" class="nav-link">
        Activités
      </router-link>
      <router-link to="/lists" class="nav-link">
        Mes listes
      </router-link>
    </nav>

    <div class="header-right">
      <router-link to="/profile" class="profile-btn">
        <span class="profile-icon">👤</span>
        <span class="profile-name">{{ displayName }}</span>
      </router-link>
      <button @click="handleLogout" class="logout-btn" title="Déconnexion">
        🚪
      </button>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth.store'

const router = useRouter()
const authStore = useAuthStore()

const displayName = computed(() => {
  return authStore.user?.username || 'Mon profil'
})

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.header-left .logo {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  text-decoration: none;
}

.header-nav {
  display: flex;
  gap: 1.5rem;
}

.nav-link {
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  transition: all 0.3s ease;
}

.nav-link:hover,
.nav-link.router-link-active {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.profile-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  text-decoration: none;
  border-radius: 2rem;
  transition: all 0.3s ease;
}

.profile-btn:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.profile-icon {
  font-size: 1.2rem;
}

.profile-name {
  font-weight: 500;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.logout-btn {
  padding: 0.5rem;
  background-color: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 0.5rem;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.logout-btn:hover {
  background-color: rgba(220, 53, 69, 0.8);
}

/* Responsive */
@media (max-width: 768px) {
  .app-header {
    flex-wrap: wrap;
    gap: 1rem;
    padding: 1rem;
  }

  .header-nav {
    order: 3;
    width: 100%;
    justify-content: center;
  }

  .profile-name {
    display: none;
  }
}
</style>
