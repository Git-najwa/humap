<template>
  <div class="register-container">
    <div class="register-card">
      <h1>HUMAP - Inscription</h1>
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
import AppInput from '../../components/ui/AppInput.vue'
import AppButton from '../../components/ui/AppButton.vue'
import ErrorMessage from '../../components/ui/ErrorMessage.vue'

const router = useRouter()
const authStore = useAuthStore()

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

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.register-card {
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

.login-link {
  margin-top: 1rem;
  text-align: center;
  color: #666;
}

.login-link a {
  color: #007bff;
  text-decoration: none;
  font-weight: 600;
}

.login-link a:hover {
  text-decoration: underline;
}
</style>
