<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import CreateVacancyModal from './CreateVacancyModal.vue'
import AddCandidateModal from './AddCandidateModal.vue'
import { useRouter } from 'vue-router'

const router = useRouter()

interface Vacancy {
  id: number
  title: string
  fileName?: string
}

interface Candidate {
  id: number
  fullName: string
  vacancyId: number
  status: 'suitable' | 'not_suitable' | 'analiz'
  comments?: string
  callDate?: string
}

const searchQuery = ref('')
const selectedVacancyId = ref<number | null>(null)
const isVacancyModalOpen = ref(false)
const isCandidateModalOpen = ref(false)
const isVacancyDropdownOpen = ref(false)
const currentPage = ref(1)
const itemsPerPage = ref(5)
const isLoading = ref(false)

// Vacancies data
const vacancies = ref<Vacancy[]>([
  {
    id: 1,
    title: 'Senior Java Developer',
    fileName: 'java_developer_requirements.pdf',
  },
  {
    id: 2,
    title: 'Frontend React Developer',
    fileName: 'react_developer_requirements.pdf',
  },
  {
    id: 3,
    title: 'DevOps Engineer',
    fileName: 'devops_requirements.pdf',
  },
])

// Candidates data
const candidates = ref<Candidate[]>([
  {
    id: 1,
    fullName: 'Иванов Иван Иванович',
    vacancyId: 1,
    status: 'suitable',
    comments: 'Отличный опыт работы с Spring Framework',
    callDate: '2024-01-15T14:00:00Z',
  },
  {
    id: 2,
    fullName: 'Петрова Анна Сергеевна',
    vacancyId: 2,
    status: 'analiz',
    comments: 'Недостаточно опыта с React',
    callDate: '2024-01-16T10:30:00Z',
  },
  {
    id: 3,
    fullName: 'Сидоров Петр Александрович',
    vacancyId: 3,
    status: 'suitable',
    callDate: '2024-01-17T16:00:00Z',
  },
  {
    id: 4,
    fullName: 'Козлова Мария Викторовна',
    vacancyId: 1,
    status: 'not_suitable',
    comments: 'Не хватает опыта с микросервисами',
    callDate: '2024-01-18T11:00:00Z',
  },
  {
    id: 4,
    fullName: 'Козлова Мария Викторовна',
    vacancyId: 1,
    status: 'not_suitable',
    comments: 'Не хватает опыта с микросервисами',
    callDate: '2024-01-18T11:00:00Z',
  },
])

// Computed properties
const filteredCandidates = computed(() => {
  let filtered = candidates.value

  // Filter by search query
  if (searchQuery.value) {
    filtered = filtered.filter((candidate) =>
      candidate.fullName.toLowerCase().includes(searchQuery.value.toLowerCase()),
    )
  }

  // Filter by selected vacancy
  if (selectedVacancyId.value) {
    filtered = filtered.filter((candidate) => candidate.vacancyId === selectedVacancyId.value)
  }

  return filtered
})

const paginatedCandidates = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredCandidates.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredCandidates.value.length / itemsPerPage.value)
})

const selectedVacancyTitle = computed(() => {
  if (!selectedVacancyId.value) return 'Все вакансии'
  const vacancy = vacancies.value.find((v) => v.id === selectedVacancyId.value)
  return vacancy?.title || 'Все вакансии'
})

// Methods
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getVacancyTitle = (vacancyId: number) => {
  const vacancy = vacancies.value.find((v) => v.id === vacancyId)
  return vacancy?.title || 'Неизвестная вакансия'
}

const getStatusText = (status: string) => {
  if (status === 'suitable') {
    return 'Подходит'
  } else if (status === 'not_suitable') {
    return 'Не подходит'
  } else if (status === 'analiz') {
    return 'Анализируется'
  } else {
    return 'Неизвестный статус'
  }
}

const getStatusColor = (status: string) => {
  if (status === 'suitable') {
    return 'bg-green-50 text-green-700 ring-green-600/20'
  } else if (status === 'not_suitable') {
    return 'bg-red-50 text-red-700 ring-red-600/20'
  } else if (status === 'analiz') {
    return 'bg-yellow-50 text-yellow-700 ring-yellow-600/20'
  } else {
    return 'bg-gray-50 text-gray-700 ring-gray-600/20'
  }
}

// Vacancy dropdown methods
const toggleVacancyDropdown = () => {
  isVacancyDropdownOpen.value = !isVacancyDropdownOpen.value
}

const selectVacancy = (vacancyId: number | null) => {
  selectedVacancyId.value = vacancyId
  isVacancyDropdownOpen.value = false
  currentPage.value = 1 // Reset to first page when filtering
}

// Modal handlers
const openVacancyModal = () => {
  isVacancyModalOpen.value = true
}

const closeVacancyModal = () => {
  isVacancyModalOpen.value = false
}

const openCandidateModal = () => {
  isCandidateModalOpen.value = true
}

const closeCandidateModal = () => {
  isCandidateModalOpen.value = false
}

const handleVacancyCreated = (vacancy: Omit<Vacancy, 'id'>) => {
  const newVacancy = {
    ...vacancy,
    id: Date.now(),
  }
  vacancies.value.push(newVacancy)
  closeVacancyModal()
}

const handleCandidateCreated = (candidate: Omit<Candidate, 'id'>) => {
  const newCandidate = {
    ...candidate,
    id: Date.now(),
  }
  candidates.value.push(newCandidate)
  closeCandidateModal()
}

// Actions
const downloadVacancyFile = (vacancy: Vacancy) => {
  console.log('Downloading file:', vacancy.fileName)
  // В реальном приложении здесь будет логика скачивания файла
}

const deleteVacancy = (id: number) => {
  if (confirm('Вы уверены, что хотите удалить эту вакансию?')) {
    vacancies.value = vacancies.value.filter((v) => v.id !== id)
    if (selectedVacancyId.value === id) {
      selectedVacancyId.value = null
    }
  }
}

const deleteCandidate = (id: number) => {
  if (confirm('Вы уверены, что хотите удалить этого кандидата?')) {
    candidates.value = candidates.value.filter((c) => c.id !== id)
  }
}

const openCandidate = (id: number) => {
  router.push(`/candidate/${id}`)
}

// Pagination
const goToPage = (page: number) => {
  currentPage.value = page
}

// Close dropdown when clicking outside
const closeDropdownOnClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.vacancy-dropdown')) {
    isVacancyDropdownOpen.value = false
  }
}

// Add event listener for clicking outside
if (typeof window !== 'undefined') {
  document.addEventListener('click', closeDropdownOnClickOutside)
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8 animate-fade-in">
        <nav class="flex items-center space-x-2 text-sm text-gray-500 mb-6">
          <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span class="text-gray-900 font-medium">Панель модератора</span>
        </nav>
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Панель модератора</h1>
            <p class="mt-2 text-gray-600">Управление вакансиями и кандидатами</p>
          </div>

          <div class="flex items-center space-x-4">
            <!-- Search -->
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
                v-model="searchQuery"
                type="text"
                placeholder="Поиск кандидатов..."
                class="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 sm:text-sm"
              />
            </div>

            <!-- Create Vacancy Button -->
            <button
              @click="openVacancyModal"
              class="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-blue-600 hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all duration-200"
            >
              <svg class="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Создать вакансию
            </button>

            <!-- Add Candidate Button -->
            <button
              @click="openCandidateModal"
              class="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-green-600 hover:bg-green-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 transition-all duration-200"
            >
              <svg class="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Добавить кандидата
            </button>
          </div>
        </div>
      </div>

      <!-- Vacancy Filter Dropdown -->
      <div class="mb-6 animate-slide-up relative" style="z-index: 50">
        <div class="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">Фильтр по вакансиям</h2>
            <div class="text-sm text-gray-500">
              Найдено кандидатов: {{ filteredCandidates.length }}
            </div>
          </div>

          <div class="relative vacancy-dropdown" style="z-index: 60">
            <button
              @click="toggleVacancyDropdown"
              class="relative w-full bg-white border border-gray-300 rounded-xl shadow-sm pl-4 pr-10 py-3 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 hover:border-gray-400"
            >
              <span class="block truncate text-gray-900">{{ selectedVacancyTitle }}</span>
              <span class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  class="h-5 w-5 text-gray-400 transition-transform duration-200"
                  :class="{ 'rotate-180': isVacancyDropdownOpen }"
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
              </span>
            </button>
            <Transition
              enter-active-class="transition duration-200 ease-out"
              enter-from-class="transform scale-95 opacity-0"
              enter-to-class="transform scale-100 opacity-100"
              leave-active-class="transition duration-150 ease-in"
              leave-from-class="transform scale-100 opacity-100"
              leave-to-class="transform scale-95 opacity-0"
            >
              <div
                v-if="isVacancyDropdownOpen"
                class="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 max-h-80 overflow-auto"
              >
                <!-- All Vacancies Option -->
                <div
                  @click="selectVacancy(null)"
                  class="px-4 py-3 cursor-pointer hover:bg-gray-50 text-sm text-gray-900 transition-colors duration-150 first:rounded-t-xl border-b border-gray-100"
                  :class="{ 'bg-blue-50 text-blue-700': selectedVacancyId === null }"
                >
                  <div class="flex items-center justify-between">
                    <span class="font-medium">Все вакансии</span>
                    <span class="text-xs text-gray-500">{{ candidates.length }} кандидатов</span>
                  </div>
                </div>

                <!-- Individual Vacancies -->
                <div
                  v-for="vacancy in vacancies"
                  :key="vacancy.id"
                  class="px-4 py-3 hover:bg-gray-50 transition-colors duration-150 border-b border-gray-100 last:border-b-0 last:rounded-b-xl"
                  :class="{ 'bg-blue-50': selectedVacancyId === vacancy.id }"
                >
                  <div class="flex items-center justify-between">
                    <div
                      @click="selectVacancy(vacancy.id)"
                      class="flex-1 cursor-pointer"
                      :class="{ 'text-blue-700': selectedVacancyId === vacancy.id }"
                    >
                      <div class="text-sm font-medium text-gray-900">{{ vacancy.title }}</div>
                      <div class="text-xs text-gray-500 mt-1">
                        {{ candidates.filter((c) => c.vacancyId === vacancy.id).length }}
                        кандидатов
                      </div>
                    </div>
                    <div class="flex items-center space-x-2 ml-4">
                      <button
                        v-if="vacancy.fileName"
                        @click.stop="downloadVacancyFile(vacancy)"
                        class="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-150"
                        title="Скачать файл"
                      >
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </button>
                      <button
                        @click.stop="deleteVacancy(vacancy.id)"
                        class="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-150"
                        title="Удалить вакансию"
                      >
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>

      <!-- Candidates Table -->
      <div
        class="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 overflow-hidden animate-slide-up"
      >
        <div class="px-6 py-5 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900">
              Кандидаты
              <span v-if="selectedVacancyId" class="text-sm font-normal text-gray-500 ml-2">
                для "{{ selectedVacancyTitle }}"
              </span>
            </h2>
            <div class="text-sm text-gray-500">Всего: {{ filteredCandidates.length }}</div>
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
                  ФИО кандидата
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
                v-for="candidate in paginatedCandidates"
                :key="candidate.id"
                @click="openCandidate(candidate.id)"
                class="hover:bg-gray-50 transition-colors duration-150 cursor-pointer animate-table-row"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ candidate.fullName }}</div>
                  <div v-if="candidate.comments" class="text-xs text-gray-500 mt-1">
                    {{ candidate.comments }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">
                    {{ getVacancyTitle(candidate.vacancyId) }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div v-if="candidate.callDate" class="text-sm text-gray-900">
                    {{ formatDateTime(candidate.callDate) }}
                  </div>
                  <div v-else class="text-sm text-gray-400">Не назначена</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="getStatusColor(candidate.status)"
                    class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset"
                  >
                    {{ getStatusText(candidate.status) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <button
                    @click.stop="deleteCandidate(candidate.id)"
                    :disabled="isLoading"
                    class="text-red-600 hover:text-red-800 font-medium text-sm transition-colors duration-150 disabled:opacity-50"
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Card layout for mobile screens -->
        <div class="md:hidden">
          <div class="divide-y divide-gray-200">
            <div
              v-for="candidate in paginatedCandidates"
              :key="candidate.id"
              @click="openCandidate(candidate.id)"
              class="p-6 hover:bg-gray-50 transition-colors duration-150 cursor-pointer animate-card"
            >
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-medium text-gray-900">{{ candidate.fullName }}</h3>
                <span
                  :class="getStatusColor(candidate.status)"
                  class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset"
                >
                  {{ getStatusText(candidate.status) }}
                </span>
              </div>
              <div class="space-y-2 mb-4">
                <p class="text-sm text-gray-600">
                  <span class="font-medium">Вакансия:</span>
                  {{ getVacancyTitle(candidate.vacancyId) }}
                </p>
                <p v-if="candidate.callDate" class="text-sm text-gray-600">
                  <span class="font-medium">Созвон:</span>
                  {{ formatDateTime(candidate.callDate) }}
                </p>
                <p v-if="candidate.comments" class="text-sm text-gray-600">
                  <span class="font-medium">Комментарий:</span>
                  {{ candidate.comments }}
                </p>
              </div>
              <div class="flex items-center space-x-3">
                <button
                  @click.stop="deleteCandidate(candidate.id)"
                  :disabled="isLoading"
                  class="text-red-600 hover:text-red-800 font-medium text-sm transition-colors duration-150 disabled:opacity-50"
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State for Candidates -->
        <div v-if="filteredCandidates.length === 0" class="px-6 py-16 text-center">
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
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h3 class="text-lg font-medium text-gray-900 mb-2">
            {{ searchQuery || selectedVacancyId ? 'Ничего не найдено' : 'Нет кандидатов' }}
          </h3>
          <p class="text-gray-500 mb-6">
            {{
              searchQuery || selectedVacancyId
                ? 'Попробуйте изменить фильтры или поисковый запрос'
                : 'Добавьте первого кандидата для начала работы'
            }}
          </p>
          <button
            v-if="!searchQuery && !selectedVacancyId"
            @click="openCandidateModal"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-green-600 bg-green-50 hover:bg-green-100 transition-colors duration-200"
          >
            <svg class="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Добавить кандидата
          </button>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div class="flex items-center justify-between">
            <div class="text-sm text-gray-700">
              Показано {{ (currentPage - 1) * itemsPerPage + 1 }}-{{
                Math.min(currentPage * itemsPerPage, filteredCandidates.length)
              }}
              из {{ filteredCandidates.length }}
            </div>

            <nav class="flex items-center space-x-2">
              <!-- Previous Button -->
              <button
                @click="goToPage(currentPage - 1)"
                :disabled="currentPage === 1"
                class="```vue:src/components/ModeratorPanel.vue relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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

      <!-- Modals -->
      <CreateVacancyModal
        :is-open="isVacancyModalOpen"
        @close="closeVacancyModal"
        @vacancy-created="handleVacancyCreated"
      />
      <AddCandidateModal
        :is-open="isCandidateModalOpen"
        :vacancies="vacancies"
        @close="closeCandidateModal"
        @candidate-created="handleCandidateCreated"
      />
    </div>
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
