<template>
  <header class="app-header">
    <div class="header-left">
      <router-link to="/" class="logo">
        <img class="logo-image" src="/humap-logo.png" alt="HUMAP" />
      </router-link>
    </div>

    <!-- Desktop Navigation -->
    <nav class="header-nav desktop-nav">
      <router-link to="/" class="nav-link">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
        <span>Activités</span>
      </router-link>
      <router-link to="/lists" class="nav-link">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
        </svg>
        <span>Mes listes ({{ favoriteCount }} favoris)</span>
      </router-link>
      <button @click="handleLogout" class="nav-link nav-button" title="Déconnexion">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        <span>Déconnexion</span>
      </button>
    </nav>

    <div class="header-right">
      <router-link to="/profile" class="profile-btn desktop-only">
        <div class="profile-avatar">
          <img 
            v-if="authStore.user?.avatar" 
            :src="authStore.user.avatar" 
            :alt="displayName"
            @error="$event.target.style.display = 'none'"
          />
        <span v-else class="avatar-initial">{{ avatarInitial }}</span>
      </div>
      <span class="profile-name">{{ displayName }}</span>
      </router-link>
    </div>
  </header>

  <!-- Mobile Bottom Navigation -->
  <nav class="mobile-bottom-nav">
    <router-link to="/" class="mobile-nav-item">
      <svg class="mobile-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3"></circle>
      </svg>
      <span>Activités</span>
    </router-link>
    <router-link to="/lists" class="mobile-nav-item">
      <svg class="mobile-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
      </svg>
      <span>Listes</span>
    </router-link>
    <router-link to="/profile" class="mobile-nav-item mobile-nav-profile">
      <div class="mobile-profile-avatar">
        <img 
          v-if="authStore.user?.avatar" 
          :src="authStore.user.avatar" 
          :alt="displayName"
          @error="$event.target.style.display = 'none'"
        />
        <span v-else class="mobile-avatar-initial">{{ avatarInitial }}</span>
      </div>
      <span>Profil</span>
    </router-link>
    <button @click="handleLogout" class="mobile-nav-item mobile-nav-button">
      <svg class="mobile-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
        <polyline points="16 17 21 12 16 7"></polyline>
        <line x1="21" y1="12" x2="9" y2="12"></line>
      </svg>
      <span>Quitter</span>
    </button>
  </nav>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth.store'
import { useFavoriteStore } from '../store/favorite.store'

const router = useRouter()
const authStore = useAuthStore()
const favoriteStore = useFavoriteStore()
const { count: favoriteCount } = storeToRefs(favoriteStore)

const displayName = computed(() => {
  return authStore.user?.username || 'Mon profil'
})

const avatarInitial = computed(() => {
  const name = authStore.user?.username || 'U'
  return name.charAt(0).toUpperCase()
})

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

onMounted(async () => {
  try {
    await favoriteStore.loadFavorites()
  } catch (err) {
    console.error(err)
  }
})
</script>

<style scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 12;
  padding: 0 2rem;
  height: 96px;
  background: rgba(255, 255, 255, 0.3);
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(24px) saturate(140%);
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
}

.header-left .logo {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  text-decoration: none;
}

.logo-image {
  height: 91px;
  width: auto;
  display: block;
}

.header-nav {
  display: flex;
  gap: 0.25rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text-secondary);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.875rem;
  padding: 0.5rem 0.875rem;
  border-radius: 0.5rem;
  transition: all 0.15s ease;
}

.nav-button {
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
}

.nav-link:hover {
  color: var(--color-primary);
  background-color: rgba(255, 255, 255, 0.22);
}

.nav-link.router-link-active {
  color: #5b3a25;
  background-color: rgba(211, 201, 188, 0.6);
  border-radius: var(--radius-pill);
}

.nav-icon {
  width: 18px;
  height: 18px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.profile-btn {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.25rem 0.75rem 0.25rem 0.25rem;
  background-color: transparent;
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(16px) saturate(120%);
  color: var(--color-text);
  text-decoration: none;
  border-radius: 9999px;
  transition: all 0.15s ease;
}

.profile-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
  border-color: var(--color-text-tertiary);
}

.profile-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-initial {
  color: white;
  font-weight: 600;
  font-size: 0.8125rem;
}

.profile-name {
  font-weight: 500;
  font-size: 0.8125rem;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Mobile Bottom Navigation */
.mobile-bottom-nav {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.22);
  border-top: 1px solid var(--glass-border);
  backdrop-filter: blur(26px) saturate(140%);
  box-shadow: 0 -10px 30px rgba(15, 23, 42, 0.12);
  padding: 0.375rem 0;
  padding-bottom: calc(0.375rem + env(safe-area-inset-bottom));
  z-index: 1000;
}

.mobile-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.1875rem;
  flex: 1;
  padding: 0.375rem;
  color: var(--color-text-tertiary);
  text-decoration: none;
  font-size: 0.625rem;
  font-weight: 500;
  transition: color 0.15s;
  background: none;
  border: none;
  cursor: pointer;
}

.mobile-nav-item:hover {
  color: var(--color-primary);
}

.mobile-nav-item.router-link-active {
  color: #5b3a25;
}

.mobile-nav-button {
  font-family: inherit;
}

.mobile-nav-icon {
  width: 20px;
  height: 20px;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* Mobile Profile Avatar */
.mobile-profile-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 2px solid transparent;
  transition: border-color 0.15s;
}

.mobile-nav-profile.router-link-active .mobile-profile-avatar {
  border-color: var(--color-primary);
}

.mobile-profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.mobile-avatar-initial {
  color: white;
  font-weight: 600;
  font-size: 0.625rem;
}

/* Responsive */
@media (max-width: 768px) {
  .app-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    padding: 0 1rem;
    height: 64px;
  }

  .logo-image {
    height: 90px;
  }

  /* Hide desktop nav on mobile */
  .desktop-nav {
    display: none;
  }

  .desktop-only {
    display: none;
  }

  .profile-name {
    display: none;
  }

  .profile-btn {
    padding: 0.125rem;
    border: none;
    background: transparent;
  }

  /* Show mobile bottom nav */
  .mobile-bottom-nav {
    display: flex;
  }

  /* Add padding to body for bottom nav */
  :global(body) {
    padding-bottom: 60px;
  }

  :global(main.with-header) {
    padding-top: 64px;
  }
}

@media (min-width: 769px) {
  .mobile-bottom-nav {
    display: none;
  }
}
</style>
