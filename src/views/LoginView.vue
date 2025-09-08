<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/services/auth'

const router = useRouter()

const isVisible = ref(false)
const selectedProfile = ref('moderator')
const email = ref('')
const password = ref('')
const isLoading = ref(false)
const error = ref<string | null>(null)

const loginHandler = async () => {
  if (!email.value || !password.value) {
    error.value = 'Пожалуйста, заполните все поля'
    return
  }

  error.value = null
  isLoading.value = true

  try {
    const response = await authService.login({
      email: email.value,
      password: password.value,
    })

    // Данные пользователя уже сохраняются в authService
    // Но для совместимости сохраняем и в localStorage
    if (response.user) {
      localStorage.setItem('userEmail', response.user.email)
      localStorage.setItem('userFullName', response.user.username || response.user.email)
    }

    router.push('/')
  } catch (err: any) {
    console.error('Ошибка входа:', err)
    error.value = err.message || 'Неверные данные или ошибка сервера'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  setTimeout(() => {
    isVisible.value = true
  }, 100)
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col relative overflow-hidden">
    <!-- Full-screen background image -->
    <div class="absolute inset-0 pointer-events-none">
      <div
        class="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-gray-100 opacity-60"
      ></div>
      <div
        class="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
        style="background-image: url('/767.webp')"
      ></div>
      <div class="absolute inset-0 bg-white/20 backdrop-blur-[0.5px]"></div>
    </div>

    <!-- Main content -->
    <div class="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative z-10">
      <div class="w-full max-w-md relative">
        <div
          class="transition-all duration-1000 transform"
          :class="isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'"
        >
          <!-- Logo -->
          <div class="text-center mb-8">
            <div
              class="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full mb-6 shadow-lg"
            >
              <span class="text-white font-bold text-xl">AI hr</span>
            </div>
            <h1 class="text-2xl font-semibold text-gray-900">Вход</h1>
          </div>

          <!-- Profile selection -->
          <div class="space-y-4 mb-8">
            <div
              class="relative cursor-pointer transition-all duration-200 hover:scale-[1.02]"
              @click="selectedProfile = 'moderator'"
            >
              <div
                :class="[
                  'flex items-center p-4 rounded-2xl border-2 transition-all duration-200 backdrop-blur-sm',
                  selectedProfile === 'moderator'
                    ? 'border-blue-500 bg-blue-50/80'
                    : 'border-gray-200 bg-white/80 hover:border-gray-300',
                ]"
              >
                <div class="flex-shrink-0 mr-4">
                  <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg
                      class="w-6 h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                </div>
                <div class="flex-1">
                  <div class="text-base font-medium text-gray-900">Я модератор AI HR</div>
                  <div class="text-sm text-gray-500">Панель модератора</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Error message -->
          <div
            v-if="error"
            class="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm text-center"
          >
            {{ error }}
          </div>

          <!-- Login form -->
          <form @submit.prevent="loginHandler" class="space-y-6">
            <!-- Email field -->
            <div>
              <label for="email" class="sr-only">Email</label>
              <input
                id="email"
                v-model="email"
                type="email"
                required
                placeholder="Email или телефон"
                class="block w-full px-4 py-4 text-base border border-gray-300 rounded-2xl placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/90 backdrop-blur-sm"
              />
            </div>

            <!-- Password field -->
            <div>
              <label for="password" class="sr-only">Пароль</label>
              <input
                id="password"
                v-model="password"
                type="password"
                required
                placeholder="Пароль"
                class="block w-full px-4 py-4 text-base border border-gray-300 rounded-2xl placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/90 backdrop-blur-sm"
              />
            </div>

            <!-- Login button -->
            <button
              type="submit"
              :disabled="isLoading"
              class="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 backdrop-blur-sm"
            >
              <span v-if="!isLoading">Войти</span>
              <div v-else class="flex items-center">
                <svg
                  class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Вход...
              </div>
            </button>
          </form>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="py-6 text-center relative z-10">
      <p class="text-sm text-gray-500">2025 HDD[M2]</p>
    </footer>
  </div>
</template>

<style scoped>
@keyframes bounce {
  0%,
  20%,
  53%,
  80%,
  100% {
    transform: translate3d(0, 0, 0);
  }
  40%,
  43% {
    transform: translate3d(0, -8px, 0);
  }
  70% {
    transform: translate3d(0, -4px, 0);
  }
  90% {
    transform: translate3d(0, -2px, 0);
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
    opacity: 0.4;
  }
  50% {
    transform: translateY(-10px) rotate(180deg);
    opacity: 0.8;
  }
}

.animate-bounce {
  animation: bounce 3s infinite;
}

.animate-float {
  animation: float 4s ease-in-out infinite;
}

@supports (backdrop-filter: blur(8px)) {
  .backdrop-blur-sm {
    backdrop-filter: blur(8px);
  }
}

@supports not (backdrop-filter: blur(8px)) {
  .backdrop-blur-sm {
    background-color: rgba(255, 255, 255, 0.9);
  }
}
</style>
