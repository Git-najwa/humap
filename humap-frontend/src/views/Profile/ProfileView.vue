<template>
  <div class="profile-container">
    <div class="profile-card">
      <div class="profile-header">
        <div class="avatar-section">
          <div class="avatar">
            {{ avatarInitial }}
          </div>
          <h1>{{ authStore.user?.username || 'Utilisateur' }}</h1>
        </div>
      </div>

      <ErrorMessage :message="authStore.error" />
      <div v-if="successMessage" class="success-message">
        ✅ {{ successMessage }}
      </div>

      <!-- Mode Affichage -->
      <div v-if="!isEditing" class="profile-info">
        <div class="info-row">
          <span class="label">📧 Email</span>
          <span class="value">{{ authStore.user?.email }}</span>
        </div>
        <div class="info-row">
          <span class="label">👤 Nom d'utilisateur</span>
          <span class="value">{{ authStore.user?.username }}</span>
        </div>
        <div class="info-row">
          <span class="label">⚧ Genre</span>
          <span class="value">{{ authStore.user?.gender || 'Non renseigné' }}</span>
        </div>
        <div class="info-row">
          <span class="label">📝 Avis publiés</span>
          <span class="value">{{ authStore.user?.nb_reviews || 0 }}</span>
        </div>
        <div class="info-row">
          <span class="label">📅 Membre depuis</span>
          <span class="value">{{ formatDate(authStore.user?.created_at) }}</span>
        </div>

        <div class="actions">
          <AppButton @click="startEditing" variant="primary">
            ✏️ Modifier mon profil
          </AppButton>
        </div>
      </div>

      <!-- Mode Édition -->
      <form v-else @submit.prevent="handleSave" class="edit-form">
        <AppInput
          v-model="form.username"
          type="text"
          label="Nom d'utilisateur"
          placeholder="Votre pseudo"
        />
        <div class="form-group">
          <label class="form-label">Genre</label>
          <select v-model="form.gender" class="form-select">
            <option value="">Non renseigné</option>
            <option value="male">Homme</option>
            <option value="female">Femme</option>
            <option value="other">Autre</option>
          </select>
        </div>
        <AppInput
          v-model="form.avatar"
          type="url"
          label="URL de l'avatar"
          placeholder="https://example.com/avatar.jpg"
        />

        <div class="edit-actions">
          <AppButton type="submit" variant="primary" :disabled="authStore.isLoading">
            {{ authStore.isLoading ? 'Enregistrement...' : '💾 Enregistrer' }}
          </AppButton>
          <AppButton type="button" variant="secondary" @click="cancelEditing">
            Annuler
          </AppButton>
        </div>
      </form>

      <!-- Zone danger -->
      <div class="danger-zone">
        <h3>⚠️ Zone dangereuse</h3>
        <p>La suppression de votre compte est irréversible.</p>
        <AppButton 
          variant="danger" 
          @click="confirmDelete"
          :disabled="authStore.isLoading"
        >
          🗑️ Supprimer mon compte
        </AppButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../store/auth.store'
import AppInput from '../../components/ui/AppInput.vue'
import AppButton from '../../components/ui/AppButton.vue'
import ErrorMessage from '../../components/ui/ErrorMessage.vue'

const router = useRouter()
const authStore = useAuthStore()

const isEditing = ref(false)
const successMessage = ref('')
const form = ref({
  username: '',
  gender: '',
  avatar: '',
})

const avatarInitial = computed(() => {
  const name = authStore.user?.username || 'U'
  return name.charAt(0).toUpperCase()
})

const formatDate = (dateString) => {
  if (!dateString) return 'Inconnu'
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const startEditing = () => {
  form.value = {
    username: authStore.user?.username || '',
    gender: authStore.user?.gender || '',
    avatar: authStore.user?.avatar || '',
  }
  isEditing.value = true
  successMessage.value = ''
}

const cancelEditing = () => {
  isEditing.value = false
}

const handleSave = async () => {
  try {
    await authStore.updateProfile(form.value)
    isEditing.value = false
    successMessage.value = 'Profil mis à jour avec succès !'
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (err) {
    console.error(err)
  }
}

const confirmDelete = async () => {
  const confirmed = window.confirm(
    'Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.'
  )
  if (confirmed) {
    try {
      await authStore.deleteAccount()
      router.push('/login')
    } catch (err) {
      console.error(err)
    }
  }
}

onMounted(() => {
  // S'assurer que les données utilisateur sont à jour
  if (!authStore.user) {
    authStore.fetchCurrentUser()
  }
})
</script>

<style scoped>
.profile-container {
  padding: 2rem;
  max-width: 600px;
  margin: 0 auto;
}

.profile-card {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.profile-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
  text-align: center;
  color: white;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 700;
  border: 3px solid white;
}

.profile-header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.profile-info, .edit-form {
  padding: 2rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 1rem 0;
  border-bottom: 1px solid #eee;
}

.info-row:last-child {
  border-bottom: none;
}

.label {
  color: #666;
  font-weight: 500;
}

.value {
  color: #333;
  font-weight: 600;
}

.actions {
  margin-top: 2rem;
  text-align: center;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
}

.form-label {
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.form-select {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 0.5rem;
  font-size: 1rem;
  background: white;
}

.form-select:focus {
  outline: none;
  border-color: #007bff;
}

.edit-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.danger-zone {
  padding: 2rem;
  background: #fff5f5;
  border-top: 1px solid #fed7d7;
}

.danger-zone h3 {
  color: #c53030;
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
}

.danger-zone p {
  color: #742a2a;
  margin: 0 0 1rem 0;
  font-size: 0.9rem;
}

.success-message {
  padding: 1rem;
  margin: 1rem 2rem 0;
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 0.5rem;
  color: #155724;
}
</style>
