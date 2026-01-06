<template>
  <div class="login-container">
    <div class="login-card">
      <h1>HUMAP - Connexion</h1>
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
        Pas encore inscrit ? <router-link to="/register">S'inscrire ici</router-link>
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

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
}

h1 {
  margin-bottom: 1.5rem;
  text-align: center;
  color: #333;
}

form {
  display: flex;
  flex-direction: column;
}

.register-link {
  margin-top: 1rem;
  text-align: center;
  color: #666;
}

.register-link a {
  color: #007bff;
  text-decoration: none;
  font-weight: 600;
}

.register-link a:hover {
  text-decoration: underline;
}
</style>
