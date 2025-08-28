<script setup lang="ts">
import { ref, onMounted } from 'vue'

const isVisible = ref(false)

onMounted(() => {
  // Trigger animation after component mounts
  setTimeout(() => {
    isVisible.value = true
  }, 100)
})
</script>

<template>
  <footer class="relative mt-auto">
    <!-- Subtle top border -->
    <div
      class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"
    ></div>

    <!-- Footer content with backdrop blur -->
    <div class="bg-white/90 backdrop-blur-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="py-6 flex items-center justify-center">
          <div
            class="text-center transition-all duration-700 transform"
            :class="isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'"
          >
            <!-- Main signature -->
            <div class="group cursor-default">
              <div class="relative inline-block">
                <!-- Subtle background glow effect -->
                <div
                  class="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-purple-400/10 to-blue-400/10 rounded-lg blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                ></div>

                <!-- Main text -->
                <div
                  class="relative px-4 py-2 rounded-lg transition-all duration-200 group-hover:bg-white/30"
                >
                  <span class="text-sm font-light text-gray-500 tracking-wide">crafted by</span>
                  <span
                    class="ml-2 text-base font-semibold bg-gradient-to-r from-gray-700 via-gray-800 to-gray-700 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:via-purple-600 group-hover:to-blue-600 transition-all duration-500"
                  >
                    HDD[M2]
                  </span>
                </div>
              </div>

              <!-- Animated underline -->
              <div class="mt-1 flex justify-center">
                <div
                  class="h-0.5 bg-gradient-to-r from-transparent via-gray-300 to-transparent transition-all duration-400 group-hover:via-blue-400"
                  :class="isVisible ? 'w-16' : 'w-0'"
                ></div>
              </div>
            </div>

            <!-- Compact year display -->
            <div class="mt-2 text-xs text-gray-400 font-light tracking-wider">
              {{ new Date().getFullYear() }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
/* Enhanced gradient text */
.bg-clip-text {
  -webkit-background-clip: text;
  background-clip: text;
}

/* Subtle pulse animation for dots */
@keyframes pulse {
  0%,
  100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.1);
  }
}

.animate-pulse {
  animation: pulse 3s infinite;
}
</style>
