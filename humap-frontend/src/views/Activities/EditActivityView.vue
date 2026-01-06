<template>
  <div class="edit-activity-container">
    <div class="container">
      <h1 class="text-2xl font-semibold" style="margin-bottom:var(--spacing-md)">Modifier l'activité</h1>

      <ErrorMessage :message="activityStore.error" />

      <form @submit.prevent="handleUpdate" class="card edit-form">
        <AppInput v-model="form.title" label="Titre" required />
        <AppInput v-model="form.description" label="Description" :rows="4" required />
        <AppInput v-model="form.location" label="Lieu" required />
        <AppInput v-model="form.mood" label="Ambiance" />
        <AppInput v-model.number="form.price_range" type="number" label="Budget" />
        <AppInput v-model.number="form.nb_people" type="number" label="Nb personnes" />

        <div class="coords-row" style="display:flex;gap:12px;align-items:center">
          <AppInput v-model.number="lng" label="Longitude" />
          <AppInput v-model.number="lat" label="Latitude" />
        </div>

        <div class="form-group" style="margin-top:var(--spacing-md)">
          <label class="font-medium">Photos de l'activité</label>
          <div class="photo-input-row">
            <input
              class="input"
              type="file"
              accept="image/*"
              multiple
              @change="handlePhotoUpload"
            />
          </div>
          <div v-if="uploadError" class="text-tertiary" style="margin-top:6px;color:#dc2626">
            {{ uploadError }}
          </div>
          <div v-if="form.photos?.length" class="photo-chip-list">
            <span v-for="(url, idx) in form.photos" :key="`${url}-${idx}`" class="photo-chip">
              {{ url }}
              <button type="button" class="photo-chip-remove" @click="removePhoto(idx)">×</button>
            </span>
          </div>
        </div>

        <div class="form-actions" style="display:flex;gap:12px;margin-top:var(--spacing-lg)">
          <AppButton :disabled="activityStore.isLoading || isUploading" type="submit">
            {{ activityStore.isLoading || isUploading ? 'Enregistrement...' : 'Enregistrer' }}
          </AppButton>
          <AppButton type="button" variant="secondary" @click="goBack">Annuler</AppButton>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useActivityStore } from '../../store/activity.store'
import AppInput from '../../components/ui/AppInput.vue'
import AppButton from '../../components/ui/AppButton.vue'
import ErrorMessage from '../../components/ui/ErrorMessage.vue'
import { uploadService } from '../../services/upload.service'

const router = useRouter()
const route = useRoute()
const activityStore = useActivityStore()

const form = ref({})
const lng = ref(null)
const lat = ref(null)
const isUploading = ref(false)
const uploadError = ref('')

onMounted(async () => {
  try {
    await activityStore.fetchActivityById(route.params.id)
    const a = activityStore.currentActivity
    form.value = {
      title: a.title || '',
      description: a.description || '',
      location: a.location || '',
      mood: a.mood || '',
      price_range: a.price_range || 0,
      nb_people: a.nb_people || 1,
      photos: a.photos || [],
      coordinates: a.coordinates || { type: 'Point', coordinates: [null, null] },
    }
    lng.value = a.coordinates?.coordinates?.[0] || null
    lat.value = a.coordinates?.coordinates?.[1] || null
  } catch (e) {
    console.error('load activity failed', e)
  }
})

const handleUpdate = async () => {
  try {
    activityStore.error = null
    const lngVal = Number(lng.value)
    const latVal = Number(lat.value)
    if (Number.isFinite(lngVal) && Number.isFinite(latVal)) {
      form.value.coordinates = { type: 'Point', coordinates: [lngVal, latVal] }
    }
    await activityStore.updateActivity(route.params.id, form.value)
    router.push(`/activities/${route.params.id}`)
  } catch (e) {
    console.error('update failed', e)
  }
}

const handlePhotoUpload = async (event) => {
  const files = Array.from(event.target.files || [])
  if (!files.length) return
  isUploading.value = true
  uploadError.value = ''
  try {
    for (const file of files) {
      const response = await uploadService.uploadImage(file)
      const url = response.data?.url
      if (url && !form.value.photos.includes(url)) {
        form.value.photos.push(url)
      }
    }
  } catch (err) {
    uploadError.value = err.response?.data?.message || 'Erreur lors de l\'upload des photos'
  } finally {
    isUploading.value = false
    event.target.value = ''
  }
}

const removePhoto = (index) => {
  form.value.photos.splice(index, 1)
}

const goBack = () => router.back()
</script>

<style scoped>
.photo-input-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.photo-chip-list {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.photo-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  font-size: 0.75rem;
}

.photo-chip-remove {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.875rem;
  line-height: 1;
  color: #6b7280;
}
</style>
