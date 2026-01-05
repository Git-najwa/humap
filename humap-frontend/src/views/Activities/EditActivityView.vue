<template>
  <div class="edit-activity-container">
    <h1>Modifier l'activité</h1>

    <ErrorMessage :message="activityStore.error" />

    <form @submit.prevent="handleUpdate" class="edit-form">
      <AppInput v-model="form.title" label="Titre" required />
      <AppInput v-model="form.description" label="Description" required />
      <AppInput v-model="form.location" label="Lieu" required />
      <AppInput v-model="form.mood" label="Ambiance" />
      <AppInput v-model.number="form.price_range" type="number" label="Budget" />
      <AppInput v-model.number="form.nb_people" type="number" label="Nb personnes" />

      <div class="coords-row">
        <AppInput v-model.number="lng" label="Longitude" />
        <AppInput v-model.number="lat" label="Latitude" />
      </div>

      <div class="form-actions">
        <AppButton :disabled="activityStore.isLoading" type="submit">{{ activityStore.isLoading ? 'Enregistrement...' : 'Enregistrer' }}</AppButton>
        <button type="button" @click="goBack" class="cancel-btn">Annuler</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useActivityStore } from '../../store/activity.store'
import AppInput from '../../components/ui/AppInput.vue'
import AppButton from '../../components/ui/AppButton.vue'
import ErrorMessage from '../../components/ui/ErrorMessage.vue'

const router = useRouter()
const route = useRoute()
const activityStore = useActivityStore()

const form = ref({})
const lng = ref(null)
const lat = ref(null)

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

const goBack = () => router.back()
</script>

<style scoped>
.edit-activity-container { padding: 2rem; max-width: 700px; margin: 0 auto }
.form-actions { display:flex; gap:1rem; margin-top:1.5rem }
.cancel-btn { background:#6c757d; color:white; border:none; padding:0.75rem 1rem; border-radius:0.5rem }
</style>
