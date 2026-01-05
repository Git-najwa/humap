<template>
  <div class="create-activity-container">
    <h1>Créer une nouvelle activité</h1>

    <ErrorMessage :message="activityStore.error" />

    <form @submit.prevent="handleCreate" class="create-form">
      <AppInput
        v-model="form.title"
        label="Titre"
        placeholder="Nom de l'activité"
        required
      />
      <AppInput
        v-model="form.description"
        label="Description"
        placeholder="Décrivez votre activité..."
        required
      />
      <AppInput
        v-model="form.location"
        label="Lieu"
        placeholder="Lieu de l'activité"
        required
      />
      <AppInput
        v-model="form.mood"
        label="Ambiance"
        placeholder="Ambiance (calm, energetic, ...)"
        required
      />
      <AppInput
        v-model.number="form.price_range"
        type="number"
        label="Budget"
        placeholder="0"
      />
      <AppInput
        v-model.number="form.nb_people"
        type="number"
        label="Nombre de personnes"
        placeholder="2"
      />

      <div class="coords-row">
        <AppInput v-model.number="lng" label="Longitude" placeholder="ex: 2.3522" />
        <AppInput v-model.number="lat" label="Latitude" placeholder="ex: 48.8566" />
        <button type="button" @click="useMyLocation" class="create-btn">Utiliser ma position</button>
      </div>

      <div class="form-actions">
        <AppButton
          type="submit"
          :disabled="activityStore.isLoading"
        >
          {{ activityStore.isLoading ? 'Création...' : 'Créer' }}
        </AppButton>
        <button type="button" @click="goBack" class="cancel-btn">
          Annuler
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useActivityStore } from '../../store/activity.store'
import AppInput from '../../components/ui/AppInput.vue'
import AppButton from '../../components/ui/AppButton.vue'
import ErrorMessage from '../../components/ui/ErrorMessage.vue'

const router = useRouter()
const activityStore = useActivityStore()

const form = ref({
  title: '',
  description: '',
  location: '',
  mood: '',
  price_range: 0,
  nb_people: 2,
  // coordinates will be set before submit
  coordinates: { type: 'Point', coordinates: [null, null] },
})
const lng = ref(null)
const lat = ref(null)

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

    form.value.coordinates = { type: 'Point', coordinates: [lngVal, latVal] }

    await activityStore.createActivity(form.value)
    router.push('/')
  } catch (err) {
    console.error(err)
  }
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
</script>

<style scoped>
.create-activity-container {
  padding: 2rem;
  max-width: 600px;
  margin: 0 auto;
}

h1 {
  text-align: center;
  margin-bottom: 2rem;
}

.create-form {
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.cancel-btn {
  flex: 1;
  padding: 0.75rem 1.5rem;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.3s;
}

.cancel-btn:hover {
  background-color: #545b62;
}
</style>
