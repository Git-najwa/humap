<template>
  <div class="login-container">
    <div class="login-card">
      <h1>HUMAP - Connexion</h1>
      <p class="auth-subtitle">Reprenez vos activites favorites en un instant.</p>
      <ErrorMessage :message="authStore.error" />
      <form @submit.prevent="handleLogin">
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
          {{ authStore.isLoading ? 'Connexion en cours...' : 'Se connecter' }}
        </AppButton>
      </form>
      <p class="register-link">
        Pas encore inscrit ? <router-link to="/register">Creer un compte</router-link>
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
  email: '',
  password: '',
})

const handleLogin = async () => {
  try {
    await authStore.login(form.value.email, form.value.password)
    router.push('/')
  } catch (err) {
    console.error(err)
  }
}
</script>
