<template>
  <div class="create-activity-container">
    <div class="container">
      <h1 class="text-2xl font-semibold" style="margin-bottom:var(--spacing-md)">Créer une nouvelle activité</h1>

      <ErrorMessage :message="activityStore.error" />

      <form @submit.prevent="handleCreate" class="card">
        <AppInput v-model="form.title" label="Titre" placeholder="Nom de l'activité" />
        <AppInput v-model="form.description" label="Description" placeholder="Décrivez votre activité..." :rows="4" />
        <AppInput v-model="form.location" label="Lieu" placeholder="Lieu de l'activité" />

        <div class="input-wrapper">
          <label class="input-label" for="activity-mood">Ambiance</label>
          <input
            id="activity-mood"
            v-model="form.mood"
            class="modern-input"
            list="mood-options"
            placeholder="Choisir une ambiance"
            name="activity-mood"
          />
          <datalist id="mood-options">
            <option v-for="choice in moodChoices" :key="choice.value" :value="choice.value">
              {{ choice.label }}
            </option>
          </datalist>
        </div>

        <div style="display:flex;gap:12px;align-items:center">
          <AppInput v-model.number="form.price_range" type="number" label="Budget" placeholder="0" />
          <div class="input-wrapper" style="flex:1">
            <label class="input-label" for="activity-people-min">Personnes min</label>
            <select id="activity-people-min" v-model.number="form.nb_people_min" class="modern-input" name="activity-people-min">
              <option v-for="count in peopleOptions" :key="`min-${count}`" :value="count">{{ count }}</option>
            </select>
          </div>
          <div class="input-wrapper" style="flex:1">
            <label class="input-label" for="activity-people-max">Personnes max</label>
            <select id="activity-people-max" v-model.number="form.nb_people_max" class="modern-input" name="activity-people-max">
              <option v-for="count in peopleOptions" :key="`max-${count}`" :value="count">{{ count }}</option>
            </select>
          </div>
        </div>

        <div class="coords-row" style="display:flex;gap:12px;align-items:center;margin-top:var(--spacing-md)">
          <AppInput v-model.number="lng" label="Longitude" placeholder="ex: 2.3522" />
          <AppInput v-model.number="lat" label="Latitude" placeholder="ex: 48.8566" />
          <AppButton variant="secondary" @click="useMyLocation" type="button">Utiliser ma position</AppButton>
        </div>

        <div class="map-picker">
          <div class="map-picker-header">
            <span class="map-picker-title">Position sur la carte</span>
            <span class="map-picker-hint">Cliquez pour choisir le lieu.</span>
          </div>
          <div ref="mapEl" class="map-picker-canvas"></div>
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
              name="activity-photos"
              id="activity-photos"
            />
          </div>
          <div v-if="uploadError" class="text-tertiary" style="margin-top:6px;color:#dc2626">
            {{ uploadError }}
          </div>
          <div v-if="form.photos.length" class="photo-chip-list">
            <span v-for="(url, idx) in form.photos" :key="`${url}-${idx}`" class="photo-chip">
              {{ url }}
              <button type="button" class="photo-chip-remove" @click="removePhoto(idx)">×</button>
            </span>
          </div>
        </div>

        <div class="form-actions" style="display:flex;gap:12px;margin-top:var(--spacing-lg)">
          <AppButton type="submit" variant="primary" :disabled="activityStore.isLoading || isUploading">
            {{ activityStore.isLoading || isUploading ? 'Création...' : 'Créer' }}
          </AppButton>
          <AppButton type="button" variant="secondary" @click="goBack">Annuler</AppButton>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useActivityStore } from '../../store/activity.store'
import AppInputModern from '../../components/ui/AppInput-modern.vue'
import AppButtonModern from '../../components/ui/AppButton-modern.vue'
import ErrorMessageModern from '../../components/ui/ErrorMessage-modern.vue'
import { uploadService } from '../../services/upload.service'

const router = useRouter()
const activityStore = useActivityStore()

const AppInput = AppInputModern
const AppButton = AppButtonModern
const ErrorMessage = ErrorMessageModern

const form = ref({
  title: '',
  description: '',
  location: '',
  mood: '',
  price_range: 0,
  nb_people: null,
  nb_people_min: 1,
  nb_people_max: 8,
  photos: [],
  // coordinates will be set before submit
  coordinates: { type: 'Point', coordinates: [null, null] },
})
const lng = ref(null)
const lat = ref(null)
const isUploading = ref(false)
const uploadError = ref('')
const mapEl = ref(null)
const mapInstance = ref(null)
const mapMarker = ref(null)
const peopleOptions = Array.from({ length: 8 }, (_, index) => index + 1)
const moodChoices = [
  { value: 'calm', label: 'Calm' },
  { value: 'social', label: 'Social' },
  { value: 'energetic', label: 'Energetic' },
  { value: 'outdoor', label: 'Outdoor' },
  { value: 'indoor', label: 'Indoor' },
  { value: 'culture', label: 'Culture' },
  { value: 'family', label: 'Famille' },
  { value: 'romantic', label: 'Romantique' },
  { value: 'adventure', label: 'Aventure' },
  { value: 'wellness', label: 'Bien-être' },
  { value: 'food', label: 'Food' },
  { value: 'sport', label: 'Sport' },
]

const handleCreate = async () => {
  try {
    // Client-side validation
    activityStore.error = null

    if (!form.value.title || !form.value.title.trim()) {
      activityStore.error = 'Le titre est requis.'
      return
    }
    if (!form.value.description || !form.value.description.trim()) {
      activityStore.error = 'La description est requise.'
      return
    }

    // coordinates must be provided
    const lngVal = Number(lng.value)
    const latVal = Number(lat.value)
    if (!Number.isFinite(lngVal) || !Number.isFinite(latVal)) {
      activityStore.error = 'Veuillez renseigner les coordonnées (longitude et latitude).'
      return
    }

    if (form.value.nb_people_min > form.value.nb_people_max) {
      activityStore.error = 'La fourchette de personnes est invalide.'
      return
    }

    form.value.coordinates = { type: 'Point', coordinates: [lngVal, latVal] }

    await activityStore.createActivity(form.value)
    router.push('/')
  } catch (err) {
    console.error(err)
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

const useMyLocation = () => {
  activityStore.error = null
  if (!navigator.geolocation) {
    activityStore.error = 'Géolocalisation non supportée par ce navigateur.'
    return
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      lat.value = pos.coords.latitude
      lng.value = pos.coords.longitude
      setMapMarker(lat.value, lng.value, true)
    },
    (err) => {
      activityStore.error = 'Impossible de récupérer la position : ' + err.message
    },
    { enableHighAccuracy: true, timeout: 10000 }
  )
}

const goBack = () => {
  router.back()
}

const initMap = () => {
  if (!mapEl.value || mapInstance.value) return
  const { L } = window
  if (!L) return
  const initialLat = Number.isFinite(lat.value) ? lat.value : 46.5197
  const initialLng = Number.isFinite(lng.value) ? lng.value : 6.6323
  mapInstance.value = L.map(mapEl.value, {
    zoomControl: true,
    scrollWheelZoom: true,
  }).setView([initialLat, initialLng], 12)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(mapInstance.value)

  mapMarker.value = L.marker([initialLat, initialLng], { draggable: true }).addTo(mapInstance.value)
  mapMarker.value.on('moveend', (event) => {
    const pos = event.target.getLatLng()
    lat.value = pos.lat
    lng.value = pos.lng
  })

  mapInstance.value.on('click', (event) => {
    const pos = event.latlng
    lat.value = pos.lat
    lng.value = pos.lng
    setMapMarker(lat.value, lng.value, false)
  })
}

const setMapMarker = (latValue, lngValue, center) => {
  if (!mapInstance.value || !mapMarker.value) return
  mapMarker.value.setLatLng([latValue, lngValue])
  if (center) {
    mapInstance.value.setView([latValue, lngValue], 13, { animate: false })
  }
}

onMounted(() => {
  initMap()
})

onBeforeUnmount(() => {
  if (mapInstance.value) {
    mapInstance.value.remove()
    mapInstance.value = null
  }
})

watch([lat, lng], ([nextLat, nextLng]) => {
  if (!Number.isFinite(nextLat) || !Number.isFinite(nextLng)) return
  setMapMarker(nextLat, nextLng, false)
})

</script>

<style scoped>
.photo-input-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin-bottom: var(--spacing-md);
}

.input-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
}

.modern-input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-sm);
  font-family: inherit;
  background-color: var(--glass-bg-strong);
  color: var(--color-text);
  transition: all var(--transition-fast);
  line-height: 1.5;
  backdrop-filter: blur(20px) saturate(140%);
}

.modern-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.18);
}

.map-picker {
  margin-top: var(--spacing-md);
  border-radius: var(--radius-xl);
  border: 1px solid var(--glass-border);
  background: var(--glass-bg-strong);
  box-shadow: var(--glass-shadow);
  padding: var(--spacing-md);
}

.map-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.map-picker-title {
  font-weight: var(--font-weight-semibold);
}

.map-picker-hint {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
}

.map-picker-canvas {
  width: 100%;
  height: 260px;
  border-radius: 16px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  overflow: hidden;
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
