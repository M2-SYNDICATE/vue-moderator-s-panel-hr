<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import CreateVacancyModal from './CreateVacancyModal.vue'
import AddCandidateModal from './AddCandidateModal.vue'
import { useRouter } from 'vue-router'
import {
  getVacancies,
  getCandidates,
  getVacanciesBackground,
  getCandidatesBackground,
  deleteVacancy,
  deleteCandidate,
  downloadVacancyFile,
  type Candidate,
} from '@/services/api'

const router = useRouter()

interface Vacancy {
  id: number
  title: string
  fileName?: string
}

// Интервал для автообновления
let updateInterval: ReturnType<typeof setInterval> | null = null

// Функция для сравнения объектов
const isEqual = (obj1: any, obj2: any): boolean => {
  return JSON.stringify(obj1) === JSON.stringify(obj2)
}

onMounted(async () => {
  await Promise.all([loadVacancies(), loadCandidates()])
})

// Очищаем интервал при размонтировании
onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
    updateInterval = null
  }
})

const copiedLinks = ref<Set<number>>(new Set())
const searchQuery = ref('')
const selectedVacancyId = ref<number | null>(null)
const isVacancyModalOpen = ref(false)
const isCandidateModalOpen = ref(false)
const isVacancyDropdownOpen = ref(false)
const currentPage = ref(1)
const itemsPerPage = ref(5)
const vacancySearchQuery = ref('')

// Vacancies data
const vacancies = ref<Vacancy[]>([])
const candidates = ref<Candidate[]>([])
const isLoading = ref(false)

const loadVacancies = async (showLoading = true) => {
  try {
    if (showLoading) isLoading.value = true

    // Используем фоновый API для автообновления
    const response = showLoading ? await getVacancies() : await getVacanciesBackground()

    if (!isEqual(vacancies.value, response.data)) {
      vacancies.value = response.data
      if (!showLoading) {
        console.log('📊 Данные вакансий обновлены в фоне')
      }
    }
  } catch (err: any) {
    // Для фоновых запросов не показываем ошибки пользователю
    if (showLoading) {
      console.error('Ошибка загрузки вакансий:', err)
      alert('Не удалось загрузить вакансии')
    } else {
      console.warn('Фоновое обновление вакансий не удалось:', err.message)
    }
  } finally {
    if (showLoading) isLoading.value = false
  }
}

const loadCandidates = async (showLoading = true) => {
  try {
    if (showLoading) isLoading.value = true

    // Используем фоновый API для автообновления
    const response = showLoading ? await getCandidates() : await getCandidatesBackground()

    if (!isEqual(candidates.value, response.data)) {
      candidates.value = response.data
      if (!showLoading) {
        console.log('👥 Данные кандидатов обновлены в фоне')
      }
    }
  } catch (err: any) {
    // Для фоновых запросов не показываем ошибки пользователю
    if (showLoading) {
      console.error('Ошибка загрузки кандидатов:', err)
      alert('Не удалось загрузить кандидатов')
    } else {
      console.warn('Фоновое обновление кандидатов не удалось:', err.message)
    }
  } finally {
    if (showLoading) isLoading.value = false
  }
}
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

// Фильтрованные вакансии для поиска
const filteredVacanciesForSearch = computed(() => {
  if (!vacancySearchQuery.value.trim()) {
    return vacancies.value
  }
  return vacancies.value.filter((vacancy) =>
    vacancy.title.toLowerCase().includes(vacancySearchQuery.value.toLowerCase()),
  )
})

//Methods

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

// Функция для подсветки найденного текста
const highlightSearchTerm = (text: string, searchTerm: string) => {
  if (!searchTerm.trim()) return text

  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '<mark class="bg-yellow-200 text-yellow-900 px-1 rounded">$1</mark>')
}

// Функции для анализа резюме
const getResumeAnalysisText = (analysis: string) => {
  switch (analysis) {
    case 'suitable':
      return 'Подходит'
    case 'not_suitable':
      return 'Не подходит'
    case 'analyzing':
      return 'Анализируется'
    default:
      return 'Неизвестно'
  }
}

const getResumeAnalysisColor = (analysis: string) => {
  switch (analysis) {
    case 'suitable':
      return 'bg-green-50 text-green-700 ring-green-600/20'
    case 'not_suitable':
      return 'bg-red-50 text-red-700 ring-red-600/20'
    case 'analyzing':
      return 'bg-yellow-50 text-yellow-700 ring-yellow-600/20'
    default:
      return 'bg-gray-50 text-gray-700 ring-gray-600/20'
  }
}

// Функции для статуса созвона
const getCallStatusText = (status: string) => {
  switch (status) {
    case 'not_planned':
      return 'Не запланирован'
    case 'planned':
      return 'Запланирован'
    case 'in_progress':
      return 'Проходит'
    case 'completed':
      return 'Прошел'
    default:
      return 'Неизвестно'
  }
}

const getCallStatusColor = (status: string) => {
  switch (status) {
    case 'not_planned':
      return 'bg-gray-50 text-gray-700 ring-gray-600/20'
    case 'planned':
      return 'bg-blue-50 text-blue-700 ring-blue-600/20'
    case 'in_progress':
      return 'bg-yellow-50 text-yellow-700 ring-yellow-600/20'
    case 'completed':
      return 'bg-green-50 text-green-700 ring-green-600/20'
    default:
      return 'bg-gray-50 text-gray-700 ring-gray-600/20'
  }
}

// Проверка, нужно ли показывать прочерк
const shouldShowDash = (candidate: Candidate) => {
  return candidate.resumeAnalysis === 'not_suitable'
}

// Vacancy dropdown methods
const toggleVacancyDropdown = () => {
  isVacancyDropdownOpen.value = !isVacancyDropdownOpen.value
  if (!isVacancyDropdownOpen.value) {
    vacancySearchQuery.value = ''
  }
}

const selectVacancy = (vacancyId: number | null) => {
  selectedVacancyId.value = vacancyId
  isVacancyDropdownOpen.value = false
  currentPage.value = 1
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

const handleVacancyCreated = async () => {
  try {
    isLoading.value = true
    const response = await getVacancies()
    vacancies.value = response.data
  } catch (err) {
    console.error('Не удалось загрузить список вакансий')
    alert('Не удалось обновить список вакансий')
  } finally {
    isLoading.value = false
    closeVacancyModal()
  }
}

const handleCandidateCreated = async () => {
  try {
    isLoading.value = true
    const response = await getCandidates()
    candidates.value = response.data
  } catch (err) {
    console.error('Не удалось загрузить список кандидатов')
    alert('Не удалось обновить список кандидатов')
  } finally {
    isLoading.value = false
    closeCandidateModal()
  }
}

const removeVacancy = async (id: number) => {
  if (!confirm('Вы уверены, что хотите удалить эту вакансию?')) return

  try {
    isLoading.value = true
    await deleteVacancy(id)
    await loadVacancies()
    await loadCandidates()
    if (selectedVacancyId.value === id) {
      selectedVacancyId.value = null
    }
  } catch (err) {
    console.error('Ошибка при удалении вакансии:', err)
    alert('Не удалось удалить вакансию')
  } finally {
    isLoading.value = false
  }
}
const removeCandidate = async (id: number) => {
  if (!confirm('Вы уверены, что хотите удалить этого кандидата?')) return

  try {
    isLoading.value = true
    await deleteCandidate(id)
    await loadCandidates()
  } catch (err) {
    console.error('Ошибка при удалении кандидата:', err)
    alert('Не удалось удалить кандидата')
  } finally {
    isLoading.value = false
  }
}

const openCandidate = (id: number) => {
  router.push(`/candidate/${id}`)
}

// Pagination
const goToPage = (page: number) => {
  currentPage.value = page
}

const copyCallLink = async (candidate: Candidate) => {
  if (!candidate.callLink) return

  try {
    await navigator.clipboard.writeText(candidate.callLink)
    copiedLinks.value.add(candidate.id)

    setTimeout(() => {
      copiedLinks.value.delete(candidate.id)
    }, 2000)
  } catch (err) {
    console.error('Не удалось скопировать ссылку:', err)
    const textArea = document.createElement('textarea')
    textArea.value = candidate.callLink
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)

    copiedLinks.value.add(candidate.id)
    setTimeout(() => {
      copiedLinks.value.delete(candidate.id)
    }, 2000)
  }
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
              class="relative inline-flex items-center px-6 py-3 text-sm font-semibold rounded-2xl text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5 group overflow-hidden"
            >
              <!-- Animated background overlay -->
              <div
                class="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"
              ></div>

              <svg
                class="-ml-1 mr-2 h-5 w-5 group-hover:rotate-90 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <span class="relative z-10">Создать вакансию</span>
            </button>

            <!-- Add Candidate Button -->
            <button
              @click="openCandidateModal"
              class="relative inline-flex items-center px-6 py-3 text-sm font-semibold rounded-2xl text-white bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5 group overflow-hidden"
            >
              <!-- Animated background overlay -->
              <div
                class="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"
              ></div>

              <svg
                class="-ml-1 mr-2 h-5 w-5 group-hover:rotate-90 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <span class="relative z-10">Добавить кандидатов</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Vacancy Filter with Search -->
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
                class="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 max-h-80 overflow-hidden"
              >
                <!-- Search Input -->
                <div class="p-3 border-b border-gray-100 bg-gray-50/50">
                  <div class="relative">
                    <div
                      class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                    >
                      <svg
                        class="h-4 w-4 text-gray-400"
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
                      v-model="vacancySearchQuery"
                      type="text"
                      placeholder="Поиск вакансий..."
                      class="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                      @click.stop
                    />
                    <Transition
                      enter-active-class="transition duration-150 ease-out"
                      enter-from-class="opacity-0 scale-95"
                      enter-to-class="opacity-100 scale-100"
                      leave-active-class="transition duration-100 ease-in"
                      leave-from-class="opacity-100 scale-100"
                      leave-to-class="opacity-0 scale-95"
                    >
                      <button
                        v-if="vacancySearchQuery"
                        @click.stop="vacancySearchQuery = ''"
                        class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-150"
                      >
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </Transition>
                  </div>
                </div>

                <!-- Dropdown Content -->
                <div class="max-h-64 overflow-auto">
                  <!-- All Vacancies Option (показываем только если нет поиска) -->
                  <div
                    v-if="!vacancySearchQuery.trim()"
                    @click="selectVacancy(null)"
                    class="px-4 py-3 cursor-pointer hover:bg-gray-50 text-sm text-gray-900 transition-colors duration-150 border-b border-gray-100"
                    :class="{ 'bg-blue-50 text-blue-700': selectedVacancyId === null }"
                  >
                    <div class="flex items-center justify-between">
                      <span class="font-medium">Все вакансии</span>
                      <span class="text-xs text-gray-500">{{ candidates.length }} кандидатов</span>
                    </div>
                  </div>

                  <!-- Individual Vacancies -->
                  <TransitionGroup
                    enter-active-class="transition duration-200 ease-out"
                    enter-from-class="opacity-0 transform translate-y-1"
                    enter-to-class="opacity-100 transform translate-y-0"
                    leave-active-class="transition duration-150 ease-in"
                    leave-from-class="opacity-100 transform translate-y-0"
                    leave-to-class="opacity-0 transform translate-y-1"
                  >
                    <div
                      v-for="vacancy in filteredVacanciesForSearch"
                      :key="vacancy.id"
                      class="px-4 py-3 hover:bg-gray-50 transition-colors duration-150 border-b border-gray-100 last:border-b-0"
                      :class="{ 'bg-blue-50': selectedVacancyId === vacancy.id }"
                    >
                      <div class="flex items-center justify-between">
                        <div
                          @click="selectVacancy(vacancy.id)"
                          class="flex-1 cursor-pointer"
                          :class="{ 'text-blue-700': selectedVacancyId === vacancy.id }"
                        >
                          <div class="text-sm font-medium text-gray-900">
                            <span
                              v-if="vacancySearchQuery.trim()"
                              v-html="highlightSearchTerm(vacancy.title, vacancySearchQuery)"
                            ></span>
                            <span v-else>{{ vacancy.title }}</span>
                          </div>
                          <div class="text-xs text-gray-500 mt-1">
                            {{ candidates.filter((c) => c.vacancyId === vacancy.id).length }}
                            кандидатов
                          </div>
                        </div>
                        <div class="flex items-center space-x-2 ml-4">
                          <button
                            v-if="vacancy.fileName"
                            @click.stop="downloadVacancyFile(vacancy.id)"
                            class="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-150"
                            title="Скачать файл"
                          >
                            <svg
                              class="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                          </button>
                          <button
                            @click.stop="removeVacancy(vacancy.id)"
                            class="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-150"
                            title="Удалить вакансию"
                          >
                            <svg
                              class="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
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
                  </TransitionGroup>

                  <!-- No Results Message -->
                  <div
                    v-if="vacancySearchQuery.trim() && filteredVacanciesForSearch.length === 0"
                    class="px-4 py-8 text-center text-gray-500"
                  >
                    <svg
                      class="mx-auto h-8 w-8 text-gray-300 mb-2"
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
                    <p class="text-sm">Вакансии не найдены</p>
                    <p class="text-xs text-gray-400 mt-1">Попробуйте изменить поисковый запрос</p>
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
                  Анализ резюме
                </th>
                <th
                  class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Дата собеседования
                </th>
                <th
                  class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Статус собеседования
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
                  <div class="text-xs text-gray-400 mt-1">
                    {{ getVacancyTitle(candidate.vacancyId) }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="getResumeAnalysisColor(candidate.resumeAnalysis)"
                    class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset"
                  >
                    {{ getResumeAnalysisText(candidate.resumeAnalysis) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div
                    v-if="!shouldShowDash(candidate) && candidate.callDate"
                    class="text-sm text-gray-900"
                  >
                    {{ formatDateTime(candidate.callDate) }}
                  </div>
                  <div v-else-if="!shouldShowDash(candidate)" class="text-sm text-gray-400">
                    Не назначена
                  </div>
                  <div v-else class="text-sm text-gray-400">—</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    v-if="!shouldShowDash(candidate)"
                    :class="getCallStatusColor(candidate.callStatus)"
                    class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset"
                  >
                    {{ getCallStatusText(candidate.callStatus) }}
                  </span>
                  <span v-else class="text-sm text-gray-400">—</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center space-x-3">
                    <!-- Copy Call Link Button -->
                    <button
                      v-if="candidate.callLink && !shouldShowDash(candidate)"
                      @click.stop="copyCallLink(candidate)"
                      :disabled="isLoading"
                      class="group inline-flex items-center text-blue-600 hover:text-blue-800 font-medium text-sm transition-all duration-150 disabled:opacity-50"
                      :title="
                        copiedLinks.has(candidate.id)
                          ? 'Ссылка скопирована!'
                          : 'Скопировать ссылку на собеседование'
                      "
                    >
                      <svg
                        v-if="!copiedLinks.has(candidate.id)"
                        class="h-4 w-4 mr-1 group-hover:scale-110 transition-transform duration-150"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      <svg
                        v-else
                        class="h-4 w-4 mr-1 text-green-600"
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
                      <span :class="{ 'text-green-600': copiedLinks.has(candidate.id) }">
                        {{ copiedLinks.has(candidate.id) ? 'Скопировано' : 'Собеседование' }}
                      </span>
                    </button>

                    <!-- Delete Button -->
                    <button
                      @click.stop="removeCandidate(candidate.id)"
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
              v-for="candidate in paginatedCandidates"
              :key="candidate.id"
              @click="openCandidate(candidate.id)"
              class="p-6 hover:bg-gray-50 transition-colors duration-150 cursor-pointer animate-card"
            >
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-medium text-gray-900">{{ candidate.fullName }}</h3>
                <span
                  :class="getResumeAnalysisColor(candidate.resumeAnalysis)"
                  class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset"
                >
                  {{ getResumeAnalysisText(candidate.resumeAnalysis) }}
                </span>
              </div>
              <div class="space-y-2 mb-4">
                <p class="text-sm text-gray-600">
                  <span class="font-medium">Вакансия:</span>
                  {{ getVacancyTitle(candidate.vacancyId) }}
                </p>
                <p class="text-sm text-gray-600">
                  <span class="font-medium">Собеседование:</span>
                  <span v-if="!shouldShowDash(candidate) && candidate.callDate">
                    {{ formatDateTime(candidate.callDate) }}
                  </span>
                  <span v-else-if="!shouldShowDash(candidate)" class="text-gray-400">
                    Не назначен
                  </span>
                  <span v-else class="text-gray-400">—</span>
                </p>
                <p class="text-sm text-gray-600">
                  <span class="font-medium">Статус Собеседования:</span>
                  <span
                    v-if="!shouldShowDash(candidate)"
                    :class="getCallStatusColor(candidate.callStatus)"
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ring-1 ring-inset ml-2"
                  >
                    {{ getCallStatusText(candidate.callStatus) }}
                  </span>
                  <span v-else class="text-gray-400 ml-2">—</span>
                </p>
              </div>
              <div class="flex items-center space-x-4">
                <!-- Copy Call Link Button -->
                <button
                  v-if="candidate.callLink && !shouldShowDash(candidate)"
                  @click.stop="copyCallLink(candidate)"
                  :disabled="isLoading"
                  class="group inline-flex items-center text-blue-600 hover:text-blue-800 font-medium text-sm transition-all duration-150 disabled:opacity-50"
                >
                  <svg
                    v-if="!copiedLinks.has(candidate.id)"
                    class="h-4 w-4 mr-1 group-hover:scale-110 transition-transform duration-150"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <svg
                    v-else
                    class="h-4 w-4 mr-1 text-green-600"
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
                  <span :class="{ 'text-green-600': copiedLinks.has(candidate.id) }">
                    {{
                      copiedLinks.has(candidate.id)
                        ? 'Скопировано'
                        : 'Скопировать ссылку на собеседования'
                    }}
                  </span>
                </button>

                <!-- Delete Button -->
                <button
                  @click.stop="removeCandidate(candidate.id)"
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
