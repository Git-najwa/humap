<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="['toast', `toast-${toast.type}`]"
        >
          <span class="toast-icon">
            <CheckIcon v-if="toast.type === 'success'" :size="18" color="#10b981" />
            <InfoIcon v-else :size="18" color="#6366f1" />
          </span>
          <div class="toast-content">
            <p class="toast-title">{{ toast.title }}</p>
            <p v-if="toast.message" class="toast-message">{{ toast.message }}</p>
          </div>
          <button class="toast-close" @click="removeToast(toast.id)">
            <CloseIcon :size="16" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useToast } from '../../composables/useToast'
import { CheckIcon, InfoIcon, CloseIcon } from '../icons'

const { toasts, removeToast } = useToast()
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toast {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  border-radius: 10px;
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  min-width: 300px;
  max-width: 400px;
}

.toast-info {
  border-left: 4px solid #6366f1;
}

.toast-success {
  border-left: 4px solid #10b981;
}

.toast-icon {
  font-size: 1.2rem;
}

.toast-info .toast-icon {
  color: #6366f1;
}

.toast-success .toast-icon {
  color: #10b981;
}

.toast-content {
  flex: 1;
}

.toast-title {
  margin: 0;
  font-weight: 600;
  font-size: 0.95rem;
  color: #111827;
}

.toast-message {
  margin: 4px 0 0;
  font-size: 0.85rem;
  color: #6b7280;
}

.toast-close {
  background: none;
  border: none;
  font-size: 1.3rem;
  color: #9ca3af;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.toast-close:hover {
  color: #374151;
}

/* Animations */
.toast-enter-active {
  animation: slideIn 0.3s ease;
}

.toast-leave-active {
  animation: slideOut 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideOut {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(100%);
  }
}
</style>
