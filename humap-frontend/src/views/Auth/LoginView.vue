<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <div class="logo">
          <span class="logo-icon">H</span>
        </div>
        <h1>Bienvenue</h1>
        <p class="subtitle">Connectez-vous à votre compte HUMAP</p>
      </div>

      <ErrorMessage :message="authStore.error" />
      
      <form @submit.prevent="handleLogin" class="auth-form">
        <AppInput
          v-model="form.email"
          type="email"
          label="Adresse email"
          placeholder="vous@exemple.com"
          required
        />
        <AppInput
          v-model="form.password"
          type="password"
          label="Mot de passe"
          placeholder="Entrez votre mot de passe"
          required
        />
        <AppButton
          type="submit"
          :disabled="authStore.isLoading"
          class="submit-btn"
        >
          {{ authStore.isLoading ? 'Connexion...' : 'Se connecter' }}
        </AppButton>
      </form>

      <div class="auth-footer">
        <p>Vous n'avez pas de compte ?</p>
        <router-link to="/register" class="auth-link">Créer un compte</router-link>
      </div>
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
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 1rem;
  background: #f9fafb;
}

.auth-card {
  background: #ffffff;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
  width: 100%;
  max-width: 400px;
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 12px;
  margin-bottom: 1.5rem;
}

.logo-icon {
  color: white;
  font-size: 1.5rem;
  font-weight: 700;
}

.auth-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
}

.subtitle {
  margin: 0.5rem 0 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.submit-btn {
  margin-top: 0.5rem;
  width: 100%;
}

.auth-footer {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
  text-align: center;
}

.auth-footer p {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.auth-link {
  display: inline-block;
  margin-top: 0.5rem;
  color: #6366f1;
  font-weight: 500;
  font-size: 0.875rem;
  text-decoration: none;
  transition: color 0.2s;
}

.auth-link:hover {
  color: #4f46e5;
  text-decoration: underline;
}

@media (max-width: 480px) {
  .auth-card {
    padding: 1.5rem;
  }
}
</style>
