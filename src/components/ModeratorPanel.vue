<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import CreateCaseModal from './CreateCaseModal.vue'
import { useRouter } from 'vue-router'
const router = useRouter()

interface Case {
  id: number
  title: string
  vacancy: string
  callDate: string
  status: 'created' | 'analyzing' | 'ready'
}

const searchQuery = ref('')
const isModalOpen = ref(false)
const currentPage = ref(1)
const itemsPerPage = ref(5)
const isLoading = ref(false)

const cases = ref<Case[]>([
  {
    id: 1,
    title: 'Иванов Иван / Java Developer',
    vacancy: 'Senior Java Developer',
    callDate: '2024-01-15',
    status: 'created',
  },
  {
    id: 2,
    title: 'Петрова Анна / Frontend Developer',
    vacancy: 'React Developer',
    callDate: '2024-01-16',
    status: 'analyzing',
  },
  {
    id: 3,
    title: 'Сидоров Петр / DevOps Engineer',
    vacancy: 'DevOps Engineer',
    callDate: '2024-01-17',
    status: 'ready',
  },
  {
    id: 4,
    title: 'Козлова Мария / QA Engineer',
    vacancy: 'QA Engineer',
    callDate: '2024-01-18',
    status: 'created',
  },
  {
    id: 5,
    title: 'Смирнов Алексей / Product Manager',
    vacancy: 'Product Manager',
    callDate: '2024-01-19',
    status: 'analyzing',
  },
  {
    id: 6,
    title: 'Волкова Елена / UI/UX Designer',
    vacancy: 'UI/UX Designer',
    callDate: '2024-01-20',
    status: 'ready',
  },
  {
    id: 7,
    title: 'Морозов Дмитрий / Backend Developer',
    vacancy: 'Backend Developer',
    callDate: '2024-01-21',
    status: 'created',
  },
])

// Filtered and paginated cases
const filteredCases = computed(() => {
  if (!searchQuery.value) return cases.value
  return cases.value.filter(
    (case_) =>
      case_.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      case_.vacancy.toLowerCase().includes(searchQuery.value.toLowerCase()),
  )
})

const totalPages = computed(() => Math.ceil(filteredCases.value.length / itemsPerPage.value))

const paginatedCases = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredCases.value.slice(start, end)
})

const getStatusText = (status: string) => {
  const statusMap = {
    created: 'Создано',
    analyzing: 'Анализируется',
    ready: 'Готово',
  }
  return statusMap[status as keyof typeof statusMap] || status
}

const getStatusColor = (status: string) => {
  const colorMap = {
    created: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    analyzing: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    ready: 'bg-green-50 text-green-700 ring-green-600/20',
  }
  return colorMap[status as keyof typeof colorMap] || 'bg-gray-50 text-gray-700 ring-gray-600/20'
}

const openModal = () => {
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
}

const handleCaseCreated = (newCase: Omit<Case, 'id'>) => {
  const id = Math.max(...cases.value.map((c) => c.id)) + 1
  cases.value.unshift({ ...newCase, id })
  closeModal()
  currentPage.value = 1 // Reset to first page
}

const openCase = (caseId: number) => {
  // Navigate to candidate page
  router.push(`/candidate/${caseId}`)
}

const deleteCase = async (caseId: number) => {
  if (confirm('Вы уверены, что хотите удалить это дело?')) {
    isLoading.value = true
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))
    cases.value = cases.value.filter((case_) => case_.id !== caseId)

    // Adjust current page if necessary
    if (paginatedCases.value.length === 0 && currentPage.value > 1) {
      currentPage.value--
    }
    isLoading.value = false
  }
}

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const testAction = () => {
  alert('Тест кнопка нажата!')
}

// Reset page when search changes
const handleSearch = () => {
  currentPage.value = 1
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header and Navigation -->
    <div class="mb-8 animate-fade-in">
      <nav class="flex items-center space-x-2 text-sm text-gray-500 mb-6">
        <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
        <span class="text-gray-900 font-medium">Панель модератора</span>
      </nav>

      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Панель модератора</h1>
          <p class="text-gray-600">Управление кандидатами</p>
        </div>
        <div class="flex items-center space-x-3">
          <button
            @click="testAction"
            class="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white ring-1 ring-gray-300 rounded-xl hover:bg-gray-50 hover:ring-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-all duration-200"
          >
            Тест
          </button>
        </div>
      </div>
    </div>

    <!-- Search and Actions -->
    <div class="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6 mb-8 animate-slide-up">
      <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0"
      >
        <div class="flex-1 max-w-lg">
          <label for="search" class="sr-only">Поиск по кандидатам</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg
                class="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              id="search"
              v-model="searchQuery"
              @input="handleSearch"
              type="text"
              placeholder="Поиск по кандидатам и вакансиям..."
              class="block w-full pl-12 pr-4 py-3 border-0 rounded-xl bg-gray-50 text-gray-900 placeholder:text-gray-500 focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all duration-200 sm:text-sm"
            />
          </div>
        </div>

        <button
          @click="openModal"
          class="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-blue-600 hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all duration-200"
        >
          <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Создать новое дело
        </button>
      </div>
    </div>

    <!-- Cases Table -->
    <div
      class="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 overflow-hidden animate-slide-up"
    >
      <div class="px-6 py-5 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">Дела</h2>
          <div class="text-sm text-gray-500">Всего: {{ filteredCases.length }}</div>
        </div>
      </div>

      <!-- Table for larger screens -->
      <div class="hidden md:block overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Название дела
              </th>
              <th
                class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Вакансия
              </th>
              <th
                class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Дата созвона
              </th>
              <th
                class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Статус
              </th>
              <th
                class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Действия
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="case_ in paginatedCases"
              :key="case_.id"
              class="hover:bg-gray-50 transition-colors duration-150 animate-table-row"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{{ case_.title }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-700">{{ case_.vacancy }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-700">
                  {{ new Date(case_.callDate).toLocaleDateString('ru-RU') }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="getStatusColor(case_.status)"
                  class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset"
                >
                  {{ getStatusText(case_.status) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center space-x-3">
                  <button
                    @click="openCase(case_.id)"
                    class="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors duration-150"
                  >
                    Открыть
                  </button>
                  <button
                    @click="deleteCase(case_.id)"
                    :disabled="isLoading"
                    class="text-red-600 hover:text-red-800 font-medium text-sm transition-colors duration-150 disabled:opacity-50"
                  >
                    Удалить
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Card layout for mobile screens -->
      <div class="md:hidden">
        <div class="divide-y divide-gray-200">
          <div
            v-for="case_ in paginatedCases"
            :key="case_.id"
            class="p-6 hover:bg-gray-50 transition-colors duration-150 animate-card"
          >
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-medium text-gray-900">{{ case_.title }}</h3>
              <span
                :class="getStatusColor(case_.status)"
                class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset"
              >
                {{ getStatusText(case_.status) }}
              </span>
            </div>
            <div class="space-y-2 mb-4">
              <p class="text-sm text-gray-600">
                <span class="font-medium">Вакансия:</span> {{ case_.vacancy }}
              </p>
              <p class="text-sm text-gray-600">
                <span class="font-medium">Дата созвона:</span>
                {{ new Date(case_.callDate).toLocaleDateString('ru-RU') }}
              </p>
            </div>
            <div class="flex items-center space-x-3">
              <button
                @click="openCase(case_.id)"
                class="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors duration-150"
              >
                Открыть
              </button>
              <button
                @click="deleteCase(case_.id)"
                :disabled="isLoading"
                class="text-red-600 hover:text-red-800 font-medium text-sm transition-colors duration-150 disabled:opacity-50"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredCases.length === 0" class="px-6 py-16 text-center">
        <svg
          class="mx-auto h-16 w-16 text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 class="text-lg font-medium text-gray-900 mb-2">
          {{ searchQuery ? 'Ничего не найдено' : 'Нет дел' }}
        </h3>
        <p class="text-gray-500 mb-6">
          {{
            searchQuery ? 'Попробуйте изменить поисковый запрос' : 'Начните с создания нового дела'
          }}
        </p>
        <button
          v-if="!searchQuery"
          @click="openModal"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors duration-200"
        >
          <svg class="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Создать дело
        </button>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-700">
            Показано {{ (currentPage - 1) * itemsPerPage + 1 }}-{{
              Math.min(currentPage * itemsPerPage, filteredCases.length)
            }}
            из {{ filteredCases.length }}
          </div>

          <nav class="flex items-center space-x-2">
            <!-- Previous Button -->
            <button
              @click="goToPage(currentPage - 1)"
              :disabled="currentPage === 1"
              class="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <!-- Page Numbers -->
            <div class="flex items-center space-x-1">
              <template v-for="page in totalPages" :key="page">
                <button
                  v-if="
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  "
                  @click="goToPage(page)"
                  :class="[
                    'relative inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    page === currentPage
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-700 bg-white hover:bg-gray-50',
                  ]"
                >
                  {{ page }}
                </button>
                <span
                  v-else-if="page === currentPage - 2 || page === currentPage + 2"
                  class="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-700"
                >
                  ...
                </span>
              </template>
            </div>

            <!-- Next Button -->
            <button
              @click="goToPage(currentPage + 1)"
              :disabled="currentPage === totalPages"
              class="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <CreateCaseModal :is-open="isModalOpen" @close="closeModal" @case-created="handleCaseCreated" />
  </div>
</template>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes table-row {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes card {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-fade-in {
  animation: fade-in 0.6s ease-out;
}

.animate-slide-up {
  animation: slide-up 0.6s ease-out;
}

.animate-slide-up:nth-child(2) {
  animation-delay: 0.1s;
  animation-fill-mode: both;
}

.animate-slide-up:nth-child(3) {
  animation-delay: 0.2s;
  animation-fill-mode: both;
}

.animate-table-row {
  animation: table-row 0.3s ease-out;
}

.animate-card {
  animation: card 0.3s ease-out;
}

/* Stagger animation for table rows */
.animate-table-row:nth-child(1) {
  animation-delay: 0.05s;
}
.animate-table-row:nth-child(2) {
  animation-delay: 0.1s;
}
.animate-table-row:nth-child(3) {
  animation-delay: 0.15s;
}
.animate-table-row:nth-child(4) {
  animation-delay: 0.2s;
}
.animate-table-row:nth-child(5) {
  animation-delay: 0.25s;
}

/* Stagger animation for cards */
.animate-card:nth-child(1) {
  animation-delay: 0.05s;
}
.animate-card:nth-child(2) {
  animation-delay: 0.1s;
}
.animate-card:nth-child(3) {
  animation-delay: 0.15s;
}
.animate-card:nth-child(4) {
  animation-delay: 0.2s;
}
.animate-card:nth-child(5) {
  animation-delay: 0.25s;
}
</style>
