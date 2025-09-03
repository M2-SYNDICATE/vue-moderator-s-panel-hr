<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { logout as authLogout } from '@/utils/auth' // импортируем наш logout

const router = useRouter()

const user = ref({
  name: '',
  email: '',
})

const isUserMenuOpen = ref(false)

// При монтировании читаем из localStorage
onMounted(() => {
  const storedName = localStorage.getItem('userFullName')
  const storedEmail = localStorage.getItem('userEmail')

  if (storedName && storedEmail) {
    user.value.name = storedName
    user.value.email = storedEmail
  } else {
    router.push('/login')
  }
})

const toggleUserMenu = () => {
  isUserMenuOpen.value = !isUserMenuOpen.value
}

const closeUserMenu = () => {
  isUserMenuOpen.value = false
}

// Обработчик выхода
const logout = () => {
  authLogout()
  router.push('/login')
}

// Закрытие меню при клике вне
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.user-menu-container')) {
    closeUserMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('beforeunload', () => {
    document.removeEventListener('click', handleClickOutside)
  })
})
</script>

<template>
  <header class="sticky top-0 z-51 w-full">
    <!-- Backdrop blur background -->
    <div class="absolute inset-0 bg-white/80 backdrop-blur-md border-b border-gray-200/50"></div>

    <!-- Header content -->
    <div class="relative">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo section -->
          <div class="flex items-center space-x-4">
            <div class="flex-shrink-0 group">
              <router-link
                to="/"
                class="flex items-center space-x-3 transition-transform duration-200 group-hover:scale-105"
              >
                <!-- Logo placeholder - replace with actual logo -->
                <div
                  class="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center shadow-sm"
                >
                  <span class="text-white font-bold text-sm">hr</span>
                </div>
                <div class="hidden sm:block">
                  <h1 class="text-xl font-semibold text-gray-900 tracking-tight">
                    Панель модератора HR
                  </h1>
                </div>
              </router-link>
            </div>
          </div>

          <!-- User section -->
          <div class="flex items-center space-x-4">
            <!-- User info and menu -->
            <div class="relative user-menu-container">
              <button
                @click="toggleUserMenu"
                class="flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100/70 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                :class="{ 'bg-gray-100/70': isUserMenuOpen }"
              >
                <!-- User info -->
                <div class="hidden md:block text-left">
                  <div class="text-sm font-medium text-gray-900">{{ user.name }}</div>
                  <div class="text-xs text-gray-500">Модератор</div>
                </div>

                <!-- Dropdown arrow -->
                <svg
                  class="w-4 h-4 text-gray-400 transition-transform duration-200"
                  :class="{ 'rotate-180': isUserMenuOpen }"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              <!-- Dropdown menu -->
              <Transition
                enter-active-class="transition duration-200 ease-out"
                enter-from-class="transform scale-95 opacity-0"
                enter-to-class="transform scale-100 opacity-100"
                leave-active-class="transition duration-150 ease-in"
                leave-from-class="transform scale-100 opacity-100"
                leave-to-class="transform scale-95 opacity-0"
              >
                <div
                  v-if="isUserMenuOpen"
                  class="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl ring-1 ring-black/5 py-2"
                >
                  <!-- User info in dropdown -->
                  <div class="px-4 py-3 border-b border-gray-100">
                    <div class="flex items-center space-x-3">
                      <div class="flex-1 min-w-0">
                        <div class="text-sm font-medium text-gray-900 truncate">
                          {{ user.name }}
                        </div>
                        <div class="text-xs text-gray-500 truncate">{{ user.email }}</div>
                      </div>
                    </div>
                  </div>

                  <!-- Menu items -->
                  <div class="py-2">
                    <a
                      href="#"
                      class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100/70 transition-colors duration-150"
                      @click="closeUserMenu"
                    >
                      <svg
                        class="w-4 h-4 mr-3 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      Профиль
                    </a>

                    <a
                      href="#"
                      class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100/70 transition-colors duration-150"
                      @click="closeUserMenu"
                    >
                      <svg
                        class="w-4 h-4 mr-3 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      Настройки
                    </a>

                    <div class="border-t border-gray-100 my-2"></div>

                    <button
                      @click="logout"
                      class="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                    >
                      <svg
                        class="w-4 h-4 mr-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      Выйти
                    </button>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
/* Additional styles for better backdrop blur support */
@supports (backdrop-filter: blur(12px)) {
  .backdrop-blur-md {
    backdrop-filter: blur(12px);
  }
}

/* Fallback for browsers that don't support backdrop-filter */
@supports not (backdrop-filter: blur(12px)) {
  .backdrop-blur-md {
    background-color: rgba(255, 255, 255, 0.95);
  }
}
</style>
