import { io } from 'socket.io-client'
import { useToast } from '../composables/useToast'

const URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Créer la connexion socket
const socket = io(URL, {
  autoConnect: false, // On connecte manuellement
})

// Logs pour debug
socket.on('connect', () => {
  console.log('🔌 Socket connecté:', socket.id)
})

socket.on('disconnect', (reason) => {
  console.log('🔌 Socket déconnecté:', reason)
})

socket.on('connect_error', (error) => {
  console.error('Erreur de connexion socket:', error.message)
})

// Écouter les notifications de like
socket.on('notification:like', (data) => {
  console.log('Notification like reçue:', data)
  const toast = useToast()
  toast.info(`${data.likerUsername} a aimé votre activité "${data.activityTitle}"`)
})

// Écouter les notifications de commentaire
socket.on('notification:comment', (data) => {
  console.log('Notification commentaire reçue:', data)
  const toast = useToast()
  toast.info(`${data.reviewerUsername} a commenté votre activité "${data.activityTitle}"`)
})

// Fonctions exportées
export function connectSocket(userId) {
  if (!socket.connected) {
    socket.connect()
    // Rejoindre la room de l'utilisateur après connexion
    socket.once('connect', () => {
      if (userId) {
        socket.emit('join:user', userId)
        console.log('🔌 Rejoint la room user:', userId)
      }
    })
  } else if (userId) {
    // Déjà connecté, juste rejoindre la room
    socket.emit('join:user', userId)
    console.log('🔌 Rejoint la room user:', userId)
  }
}

export function disconnectSocket() {
  if (socket.connected) {
    socket.disconnect()
  }
}

export function isConnected() {
  return socket.connected
}

export { socket }
export default socket
