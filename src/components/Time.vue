<template>
  <div
    v-if="isMaintenancePeriod && isVisible"
    class="fixed top-0 left-0 right-0 bg-gradient-to-r from-red-500 to-pink-600 text-white text-center py-2 px-3 text-sm font-medium shadow-md z-50"
  >
    <div class="flex items-center justify-center space-x-2">
      <svg
        class="w-4 h-4 flex-shrink-0 animate-pulse"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4.87c-.77-1.333-2.694-1.333-3.464 0L3.34 16.5c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <span class="text-xs leading-tight flex-1">
        При тестировании напишите нам для включения GPU-сервера
      </span>
      <button @click="isVisible = false" class="text-white ml-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const isVisible = ref(true)

const isMaintenancePeriod = computed(() => {
  const moscowTime = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Moscow',
    hour: '2-digit',
    hour12: false,
  }).format(new Date())

  const hour = parseInt(moscowTime.split(':')[0], 10)

  return true
})
</script>
