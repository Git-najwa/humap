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
  background: var(--color-bg-alt);
}

.auth-card {
  background: #fff;
  padding: 2rem 1.5rem;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-border);
  width: 100%;
  max-width: 370px;
}

.auth-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  background-color: var(--color-primary);
  border-radius: 24px;
  margin-bottom: 1.25rem;
}

.logo-icon {
  color: white;
  font-size: 3.75rem;
  font-weight: 700;
}

.auth-header h1 {
  margin: 0;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
}

.subtitle {
  margin: 0.5rem 0 0;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-sm);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.submit-btn {
  margin-top: 0.75rem;
  width: 100%;
}

.auth-footer {
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
  text-align: center;
}

.auth-footer p {
  margin: 0;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-xs);
}

.auth-link {
  display: inline-block;
  margin-top: 0.5rem;
  color: var(--color-primary);
  font-weight: 500;
  font-size: var(--font-size-sm);
  text-decoration: none;
  transition: color 0.15s;
}

.auth-link:hover {
  color: var(--color-primary-dark);
  text-decoration: underline;
}

@media (max-width: 480px) {
  .auth-card {
    padding: 1rem;
  }
}
</style>
