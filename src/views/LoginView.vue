<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/services/auth'

const router = useRouter()

const isLoading = ref(false)
const errorMessage = ref('')

// Исправляем: используем email вместо username
const form = reactive({
  email: '', // ← Было username, должно быть email
  password: '',
})

const handleSubmit = async () => {
  if (isLoading.value) return

  // Проверяем, что поля заполнены
  if (!form.email.trim()) {
    errorMessage.value = 'Введите email'
    return
  }

  if (!form.password.trim()) {
    errorMessage.value = 'Введите пароль'
    return
  }

  errorMessage.value = ''
  isLoading.value = true

  try {
    console.log('🔐 Sending login request with:', {
      email: form.email,
      password: '***',
    })

    // Отправляем email, а не username
    await authService.login({
      email: form.email.trim(), // ← Отправляем email
      password: form.password.trim(),
    })

    router.push({ name: 'moderator-panel' })
  } catch (error: any) {
    console.error('❌ Login failed:', error)
    errorMessage.value = error.message || 'Произошла ошибка при входе'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col">
    <!-- Background decoration -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        class="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"
      ></div>
      <div
        class="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"
      ></div>
      <div
        class="absolute top-40 left-40 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"
      ></div>
    </div>

    <!-- Main content -->
    <div class="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative z-10">
      <div class="max-w-md w-full space-y-8">
        <!-- Header -->
        <div class="text-center">
          <h2 class="mt-6 text-4xl font-bold text-gray-900 tracking-tight">Добро пожаловать</h2>
          <p class="mt-3 text-lg text-gray-600">Войдите в свою учетную запись</p>
        </div>

        <!-- Login form -->
        <div class="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl ring-1 ring-gray-200 p-8">
          <!-- Error message -->
          <div v-if="errorMessage" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <div class="flex">
              <svg
                class="h-5 w-5 text-red-400 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div class="ml-3">
                <p class="text-sm text-red-700">{{ errorMessage }}</p>
              </div>
            </div>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-6">
            <!-- Email field (исправлено с username на email) -->
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                v-model="form.email"
                type="email"
                required
                placeholder="Введите email"
                class="block w-full px-4 py-4 text-base border border-gray-300 rounded-2xl placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/90 backdrop-blur-sm"
              />
            </div>

            <!-- Password field -->
            <div>
              <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
                Пароль
              </label>
              <input
                id="password"
                v-model="form.password"
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
  100% {
    transform: translateY(-25%);
    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
  }
  50% {
    transform: none;
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
}

@keyframes blob {
  0% {
    transform: translate(0px, 0px) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
  100% {
    transform: translate(0px, 0px) scale(1);
  }
}

.animate-blob {
  animation: blob 7s infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}
</style>
