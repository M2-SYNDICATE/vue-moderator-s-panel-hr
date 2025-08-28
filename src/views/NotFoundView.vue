<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isVisible = ref(false)

const goHome = () => {
  router.push('/')
}

const goBack = () => {
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    router.push('/')
  }
}

onMounted(() => {
  setTimeout(() => {
    isVisible.value = true
  }, 100)
})
</script>

<template>
  <div
    class="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden"
  >
    <!-- Background decorative elements -->
    <div class="absolute inset-0 pointer-events-none">
      <!-- Floating shapes -->
      <div
        class="absolute top-20 left-10 w-16 h-16 bg-blue-100 rounded-full opacity-40 animate-float"
        style="animation-delay: 0s"
      ></div>
      <div
        class="absolute top-40 right-20 w-12 h-12 bg-red-100 rounded-full opacity-40 animate-float"
        style="animation-delay: 1s"
      ></div>
      <div
        class="absolute bottom-32 left-20 w-8 h-8 bg-yellow-100 rounded-full opacity-40 animate-float"
        style="animation-delay: 2s"
      ></div>
      <div
        class="absolute bottom-20 right-10 w-20 h-20 bg-green-100 rounded-full opacity-40 animate-float"
        style="animation-delay: 3s"
      ></div>

      <!-- Geometric shapes -->
      <div
        class="absolute top-1/4 right-1/4 w-24 h-24 border-2 border-blue-200 rounded-lg opacity-30 animate-pulse"
      ></div>
      <div
        class="absolute bottom-1/4 left-1/4 w-16 h-16 border-2 border-red-200 rounded-full opacity-30 animate-pulse"
        style="animation-delay: 1s"
      ></div>
    </div>

    <!-- Main content -->
    <div class="text-center relative z-10 max-w-2xl mx-auto">
      <!-- 404 Number -->
      <div
        class="transition-all duration-1000 transform"
        :class="
          isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
        "
      >
        <h1 class="text-8xl sm:text-9xl lg:text-[12rem] font-bold text-gray-900 mb-4 leading-none">
          <span
            class="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent animate-gradient"
          >
            404
          </span>
        </h1>
      </div>

      <!-- Error message -->
      <div
        class="transition-all duration-1000 transform"
        :class="isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
        style="animation-delay: 0.2s"
      >
        <h2 class="text-2xl sm:text-3xl font-semibold text-gray-800 mb-4">
          Упс, страница не найдена 😔
        </h2>
      </div>

      <!-- Description -->
      <div
        class="transition-all duration-1000 transform"
        :class="isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
        style="animation-delay: 0.4s"
      >
        <p class="text-lg text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
          К сожалению, запрашиваемая страница не существует или была перемещена. Попробуйте
          вернуться на главную страницу.
        </p>
      </div>

      <!-- Action buttons -->
      <div
        class="flex flex-col sm:flex-row gap-4 justify-center items-center transition-all duration-1000 transform"
        :class="isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
        style="animation-delay: 0.6s"
      >
        <button
          @click="goHome"
          class="group inline-flex items-center px-8 py-4 bg-blue-600 text-white font-medium rounded-2xl shadow-lg hover:bg-blue-700 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-500/50 transition-all duration-300 transform hover:scale-105"
        >
          <svg
            class="w-5 h-5 mr-2 transition-transform duration-300 group-hover:-translate-x-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          На главную
        </button>

        <button
          @click="goBack"
          class="group inline-flex items-center px-8 py-4 bg-white text-gray-700 font-medium rounded-2xl shadow-lg hover:shadow-xl border border-gray-200 hover:border-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-500/20 transition-all duration-300 transform hover:scale-105"
        >
          <svg
            class="w-5 h-5 mr-2 transition-transform duration-300 group-hover:-translate-x-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Назад
        </button>
      </div>

      <!-- Additional help -->
      <div
        class="mt-12 transition-all duration-1000 transform"
        :class="isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
        style="animation-delay: 0.8s"
      >
        <div class="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-200">
          <h3 class="text-lg font-medium text-gray-900 mb-3">Что можно сделать?</h3>
          <ul class="text-sm text-gray-600 space-y-2 text-left max-w-sm mx-auto">
            <li class="flex items-center">
              <svg
                class="w-4 h-4 mr-3 text-green-500 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Проверить правильность URL-адреса
            </li>
            <li class="flex items-center">
              <svg
                class="w-4 h-4 mr-3 text-green-500 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Вернуться на главную страницу
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Animated illustration -->
    <div
      class="absolute bottom-8 right-8 hidden lg:block transition-all duration-1000 transform"
      :class="isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'"
      style="animation-delay: 1s"
    >
      <div class="relative w-32 h-32">
        <!-- Magnifying glass -->
        <div class="absolute inset-0 animate-bounce" style="animation-duration: 3s">
          <svg
            class="w-full h-full text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            stroke-width="1.5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
        </div>
        <!-- Question mark -->
        <div
          class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl text-gray-400 animate-pulse"
        >
          ?
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom animations */
@keyframes float {
  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
    opacity: 0.4;
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
    opacity: 0.8;
  }
}

@keyframes gradient {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}

.animate-gradient {
  background-size: 200% 200%;
  animation: gradient 4s ease-in-out infinite;
}

/* Enhanced pulse animation */
@keyframes pulse {
  0%,
  100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

.animate-pulse {
  animation: pulse 3s infinite;
}

/* Gradient text support */
.bg-clip-text {
  -webkit-background-clip: text;
  background-clip: text;
}
</style>
