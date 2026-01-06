<template>
  <div class="profile-container">
    <div class="profile-card">
      <!-- Header avec avatar -->
      <div class="profile-header">
        <div class="avatar-wrapper">
          <div class="avatar">
            <img 
              v-if="authStore.user?.avatar" 
              :src="authStore.user.avatar" 
              :alt="authStore.user?.username"
              @error="handleImageError"
            />
            <span v-else class="avatar-initial">{{ avatarInitial }}</span>
          </div>
          <button v-if="isEditing" class="avatar-edit-btn" type="button" @click="$refs.avatarInput.focus()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
          </button>
        </div>
        <h1 class="profile-name">{{ authStore.user?.username || 'Utilisateur' }}</h1>
        <p class="profile-email">{{ authStore.user?.email }}</p>
      </div>

      <!-- Messages -->
      <ErrorMessage :message="authStore.error" />
      <div v-if="successMessage" class="success-message">
        <svg class="success-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        {{ successMessage }}
      </div>

      <!-- Mode Affichage -->
      <div v-if="!isEditing" class="profile-content">
        <div class="info-section">
          <h2 class="section-title">Informations personnelles</h2>
          
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Nom d'utilisateur</span>
              <span class="info-value">{{ authStore.user?.username }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Email</span>
              <span class="info-value">{{ authStore.user?.email }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Genre</span>
              <span class="info-value">{{ formatGender(authStore.user?.gender) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Membre depuis</span>
              <span class="info-value">{{ formatDate(authStore.user?.created_at) }}</span>
            </div>
          </div>
        </div>

        <div class="stats-section">
          <h2 class="section-title">Statistiques</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <span class="stat-value">{{ authStore.user?.nb_reviews || 0 }}</span>
              <span class="stat-label">Avis publiés</span>
            </div>
          </div>
        </div>

        <div class="actions-section">
          <AppButton @click="startEditing" variant="primary">
            Modifier le profil
          </AppButton>
        </div>
      </div>

      <!-- Mode Édition -->
      <form v-else @submit.prevent="handleSave" class="edit-form">
        <h2 class="section-title">Modifier le profil</h2>
        
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
          ref="avatarInput"
          v-model="form.avatar"
          type="url"
          label="URL de la photo de profil (optionnel)"
          placeholder="https://exemple.com/photo.jpg"
        />
        <div class="form-group">
          <label class="form-label">Photo de profil (depuis l'appareil)</label>
          <div class="photo-input-row">
            <input
              class="form-select"
              type="file"
              accept="image/*"
              @change="handleAvatarUpload"
            />
          </div>
          <div v-if="isUploadingAvatar" class="text-tertiary" style="margin-top:6px">
            Upload en cours...
          </div>
          <div v-if="avatarUploadError" class="text-tertiary" style="margin-top:6px;color:#dc2626">
            {{ avatarUploadError }}
          </div>
        </div>

        <div class="form-actions">
          <AppButton type="button" variant="secondary" @click="cancelEditing">
            Annuler
          </AppButton>
          <AppButton type="submit" variant="primary" :disabled="authStore.isLoading">
            {{ authStore.isLoading ? 'Enregistrement...' : 'Enregistrer' }}
          </AppButton>
        </div>
      </form>

      <!-- Zone danger -->
      <div class="danger-section">
        <h2 class="section-title danger-title">Zone dangereuse</h2>
        <p class="danger-text">
          La suppression de votre compte est définitive. Toutes vos données seront effacées.
        </p>
        <AppButton 
          variant="danger" 
          @click="confirmDelete"
          :disabled="authStore.isLoading"
        >
          Supprimer mon compte
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
import { uploadService } from '../../services/upload.service'

const router = useRouter()
const authStore = useAuthStore()

const isEditing = ref(false)
const successMessage = ref('')
const isUploadingAvatar = ref(false)
const avatarUploadError = ref('')
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

const formatGender = (gender) => {
  const genders = {
    male: 'Homme',
    female: 'Femme',
    other: 'Autre'
  }
  return genders[gender] || 'Non renseigné'
}

const handleImageError = (event) => {
  event.target.style.display = 'none'
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

const handleAvatarUpload = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  isUploadingAvatar.value = true
  avatarUploadError.value = ''
  try {
    const response = await uploadService.uploadImage(file)
    const url = response.data?.url
    if (url) {
      form.value.avatar = url
    }
  } catch (err) {
    avatarUploadError.value = err.response?.data?.message || 'Erreur lors de l\'upload'
  } finally {
    isUploadingAvatar.value = false
    event.target.value = ''
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
  padding: 2rem 1rem;
  max-width: 640px;
  margin: 0 auto;
}

.profile-card {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.photo-input-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* Header */
.profile-header {
  padding: 2rem;
  text-align: center;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
}

.avatar-wrapper {
  position: relative;
  display: inline-block;
  margin-bottom: 1rem;
}

.avatar {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4px solid rgba(255, 255, 255, 0.3);
  overflow: hidden;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-initial {
  font-size: 2.5rem;
  font-weight: 600;
  color: white;
}

.avatar-edit-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.avatar-edit-btn svg {
  width: 16px;
  height: 16px;
  color: #6366f1;
}

.profile-name {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.profile-email {
  margin: 0.25rem 0 0;
  opacity: 0.9;
  font-size: 0.875rem;
}

/* Content sections */
.profile-content {
  padding: 1.5rem;
}

.section-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.info-section {
  margin-bottom: 2rem;
}

.info-grid {
  display: grid;
  gap: 1rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  color: #6b7280;
  font-size: 0.875rem;
}

.info-value {
  color: #111827;
  font-weight: 500;
  font-size: 0.875rem;
}

/* Stats */
.stats-section {
  margin-bottom: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: #6366f1;
}

.stat-label {
  display: block;
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

/* Actions */
.actions-section {
  text-align: center;
}

/* Edit form */
.edit-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  color: #374151;
}

.form-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  background: white;
  color: #111827;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-select:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
  justify-content: flex-end;
}

/* Danger zone */
.danger-section {
  padding: 1.5rem;
  background: #fef2f2;
  border-top: 1px solid #fecaca;
}

.danger-title {
  color: #dc2626;
}

.danger-text {
  color: #991b1b;
  font-size: 0.875rem;
  margin: 0 0 1rem;
}

/* Success message */
.success-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  margin: 1rem 1.5rem 0;
  background-color: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 8px;
  color: #065f46;
  font-size: 0.875rem;
}

.success-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

/* Responsive */
@media (max-width: 640px) {
  .profile-container {
    padding: 1rem 0.5rem;
  }

  .profile-header {
    padding: 1.5rem 1rem;
  }

  .avatar {
    width: 80px;
    height: 80px;
  }

  .avatar-initial {
    font-size: 2rem;
  }

  .profile-content,
  .edit-form,
  .danger-section {
    padding: 1rem;
  }

  .form-actions {
    flex-direction: column;
  }

  .form-actions button {
    width: 100%;
  }
}
</style>
