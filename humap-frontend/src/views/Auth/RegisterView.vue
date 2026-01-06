<template>
  <div class="register-container">
    <div class="register-card">
      <h1>HUMAP - Inscription</h1>
      <p class="auth-subtitle">Creez votre compte pour partager des activites.</p>
      <ErrorMessage :message="authStore.error" />
      <form @submit.prevent="handleRegister">
        <AppInput
          v-model="form.username"
          type="text"
          label="Nom d'utilisateur"
          placeholder="votre_username"
          required
        />
        <AppInput
          v-model="form.email"
          type="email"
          label="Email"
          placeholder="votre@email.com"
          required
        />
        <AppInput
          v-model="form.password"
          type="password"
          label="Mot de passe"
          placeholder="••••••••"
          required
        />
        <AppButton
          type="submit"
          :disabled="authStore.isLoading"
        >
          {{ authStore.isLoading ? 'Inscription en cours...' : 'S\'inscrire' }}
        </AppButton>
      </form>
      <p class="login-link">
        Déjà inscrit ? <router-link to="/login">Se connecter ici</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../store/auth.store'
import AppInputModern from '../../components/ui/AppInput-modern.vue'
import AppButtonModern from '../../components/ui/AppButton-modern.vue'
import ErrorMessageModern from '../../components/ui/ErrorMessage-modern.vue'

const router = useRouter()
const authStore = useAuthStore()

// alias modern components to existing names used in template
const AppInput = AppInputModern
const AppButton = AppButtonModern
const ErrorMessage = ErrorMessageModern

const form = ref({
  username: '',
  email: '',
  password: '',
})

const handleRegister = async () => {
  try {
    await authStore.register(form.value.username, form.value.email, form.value.password)
    router.push('/')
  } catch (err) {
    console.error(err)
  }
}
</script>
