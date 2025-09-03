<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// Mock data - в реальном приложении будет загружаться по ID
const candidate = ref({
  id: 1,
  title: 'Иванов Иван / Java Developer',
  vacancy: 'Senior Java Developer',
  callDate: '2024-01-15T14:00:00Z',
  callLink: 'https://meet.google.com/abc-defg-hij',
  comments:
    'Кандидат имеет отличный опыт работы с Spring Framework и микросервисами. Показал хорошие знания в области архитектуры приложений. Рекомендуется к собеседованию.',
  resume: {
    name: 'Иванов_Иван_Java_Developer.pdf',
    size: 245760, // bytes
    uploadDate: '2024-01-14',
  },
  resumeAnalysis: 'suitable' as 'suitable' | 'not_suitable' | 'analyzing', // Анализ резюме
  callStatus: 'completed' as 'not_planned' | 'planned' | 'in_progress' | 'completed', // Статус созвона
  createdAt: '2024-01-14T10:30:00Z',
})

// Состояния для редактирования
const isEditingCallLink = ref(false)
const isEditingCallDate = ref(false)
const editCallLink = ref('')
const editCallDate = ref('')

// Extract candidate info from title
const candidateInfo = computed(() => {
  const parts = candidate.value.title.split(' / ')
  return {
    fullName: parts[0] || 'Не указано',
    position: parts[1] || candidate.value.vacancy,
  }
})

// Проверка, можно ли выполнять действия (если резюме подходит)
const canPerformActions = computed(() => {
  return candidate.value.resumeAnalysis === 'suitable'
})

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

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

// Функции для редактирования ссылки на созвон
const startEditingCallLink = () => {
  editCallLink.value = candidate.value.callLink || ''
  isEditingCallLink.value = true
}

const saveCallLink = () => {
  candidate.value.callLink = editCallLink.value
  isEditingCallLink.value = false
}

const cancelEditingCallLink = () => {
  editCallLink.value = ''
  isEditingCallLink.value = false
}

// Функции для редактирования даты созвона
const startEditingCallDate = () => {
  if (candidate.value.callDate) {
    // Конвертируем в формат datetime-local
    const date = new Date(candidate.value.callDate)
    editCallDate.value = date.toISOString().slice(0, 16)
  } else {
    editCallDate.value = ''
  }
  isEditingCallDate.value = true
}

const saveCallDate = () => {
  if (editCallDate.value) {
    candidate.value.callDate = new Date(editCallDate.value).toISOString()
    // Если дата установлена и статус был "не запланирован", меняем на "запланирован"
    if (candidate.value.callStatus === 'not_planned') {
      candidate.value.callStatus = 'planned'
    }
  } else {
    candidate.value.callDate = undefined
    candidate.value.callStatus = 'not_planned'
  }
  isEditingCallDate.value = false
}

const cancelEditingCallDate = () => {
  editCallDate.value = ''
  isEditingCallDate.value = false
}

const downloadResume = () => {
  if (!canPerformActions.value) {
    alert('Действие недоступно: резюме не подходит для данной вакансии')
    return
  }
  console.log('Downloading resume:', candidate.value.resume.name)
}

const downloadPDF = () => {
  if (!canPerformActions.value) {
    alert('Действие недоступно: резюме не подходит для данной вакансии')
    return
  }
  console.log('Downloading PDF report for candidate:', candidate.value.id)
}

const openCallLink = () => {
  if (!canPerformActions.value) {
    alert('Действие недоступно: резюме не п��дходит для данной вакансии')
    return
  }
  if (candidate.value.callLink) {
    window.open(candidate.value.callLink, '_blank')
  }
}

const isVisible = ref(false)

onMounted(() => {
  setTimeout(() => {
    isVisible.value = true
  }, 100)
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Navigation breadcrumbs -->
      <nav class="flex items-center space-x-2 text-sm text-gray-500 mb-6 animate-fade-in">
        <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
        <router-link to="/" class="hover:text-blue-600 transition-colors duration-200">
          Панель модератора
        </router-link>
        <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
        <span class="text-gray-900 font-medium">{{ candidateInfo.fullName }}</span>
      </nav>

      <!-- Main content grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Main content -->
        <div class="lg:col-span-2 space-y-8">
          <!-- Header card -->
          <div
            class="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6 animate-slide-up"
            :class="{
              'opacity-100 translate-y-0': isVisible,
              'opacity-0 translate-y-4': !isVisible,
            }"
          >
            <div class="flex items-start justify-between mb-4">
              <div>
                <h1 class="text-2xl font-bold text-gray-900 mb-2">{{ candidate.title }}</h1>
                <p class="text-gray-600">{{ candidate.vacancy }}</p>
              </div>
            </div>

            <div class="flex items-center space-x-6 text-sm text-gray-500">
              <div class="flex items-center">
                <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 012-2h4a2 2 0 012 2v1m-6 0h8m-8 0H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-2"
                  />
                </svg>
                Создано {{ formatDate(candidate.createdAt) }}
              </div>
              <div class="flex items-center">
                <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <span v-if="candidate.callDate && canPerformActions">
                  Созвон {{ formatDateTime(candidate.callDate) }}
                </span>
                <span v-else-if="canPerformActions" class="text-gray-400">
                  Созвон не назначен
                </span>
                <span v-else class="text-gray-400">—</span>
              </div>
            </div>
          </div>

          <!-- Call date management card -->
          <div
            v-if="canPerformActions"
            class="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6 animate-slide-up"
            style="animation-delay: 0.1s"
          >
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Управление созвоном</h2>

            <!-- Call Date Section -->
            <div class="mb-6">
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-medium text-gray-700">Дата и время созвона</h3>
                <button
                  v-if="!isEditingCallDate"
                  @click="startEditingCallDate"
                  class="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-150"
                >
                  {{ candidate.callDate ? 'Изменить' : 'Добавить' }}
                </button>
              </div>

              <div v-if="!isEditingCallDate" class="p-4 bg-gray-50 rounded-xl">
                <div v-if="candidate.callDate" class="flex items-center space-x-3">
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
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <span class="text-sm text-gray-900">{{
                    formatDateTime(candidate.callDate)
                  }}</span>
                </div>
                <div v-else class="flex items-center space-x-3">
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
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span class="text-sm text-gray-500">Дата созвона не назначена</span>
                </div>
              </div>

              <div v-else class="space-y-3">
                <input
                  v-model="editCallDate"
                  type="datetime-local"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div class="flex space-x-2">
                  <button
                    @click="saveCallDate"
                    class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                  >
                    Сохранить
                  </button>
                  <button
                    @click="cancelEditingCallDate"
                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>

            <!-- Call Link Section -->
            <div>
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-medium text-gray-700">Ссылка на созвон</h3>
                <button
                  v-if="!isEditingCallLink"
                  @click="startEditingCallLink"
                  class="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-150"
                >
                  {{ candidate.callLink ? 'Изменить' : 'Добавить' }}
                </button>
              </div>

              <div v-if="!isEditingCallLink" class="p-4 bg-gray-50 rounded-xl">
                <div v-if="candidate.callLink" class="flex items-center justify-between">
                  <div class="flex items-center space-x-3 min-w-0 flex-1">
                    <svg
                      class="h-5 w-5 text-blue-600 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    <div class="min-w-0 flex-1">
                      <p class="text-sm font-medium text-gray-900">Google Meet</p>
                      <p class="text-xs text-gray-500 font-mono truncate">
                        {{ candidate.callLink }}
                      </p>
                    </div>
                  </div>
                  <button
                    @click="openCallLink"
                    class="ml-4 inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-white rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 ring-1 ring-blue-200"
                  >
                    <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    Открыть
                  </button>
                </div>
                <div v-else class="flex items-center space-x-3">
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
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                  <span class="text-sm text-gray-500">Ссылка на созвон не добавлена</span>
                </div>
              </div>

              <div v-else class="space-y-3">
                <input
                  v-model="editCallLink"
                  type="url"
                  placeholder="https://meet.google.com/..."
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div class="flex space-x-2">
                  <button
                    @click="saveCallLink"
                    class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                  >
                    Сохранить
                  </button>
                  <button
                    @click="cancelEditingCallLink"
                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Blocked actions message -->
          <div
            v-if="!canPerformActions"
            class="bg-red-50 border border-red-200 rounded-2xl p-6 animate-slide-up"
            style="animation-delay: 0.1s"
          >
            <div class="flex items-center space-x-3">
              <svg
                class="h-6 w-6 text-red-500 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <div>
                <h3 class="text-sm font-medium text-red-800">Резюме не подходит</h3>
                <p class="text-sm text-red-700 mt-1">
                  Управление созвоном и получение отчетов недоступно для кандидатов с неподходящими
                  резюме.
                </p>
              </div>
            </div>
          </div>

          <!-- Comments card -->
          <div
            v-if="candidate.comments"
            class="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6 animate-slide-up"
            style="animation-delay: 0.2s"
          >
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Комментарии и заметки AI</h2>
            <div class="prose prose-gray max-w-none">
              <p class="text-gray-700 leading-relaxed">{{ candidate.comments }}</p>
            </div>
          </div>

          <!-- Resume card -->
          <div
            v-if="candidate.resume"
            class="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6 animate-slide-up"
            style="animation-delay: 0.3s"
          >
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Прикрепленное резюме</h2>
            <div
              class="flex items-center justify-between p-4 bg-gray-50 rounded-xl transition-colors duration-200"
              :class="{ 'hover:bg-gray-100': canPerformActions, 'opacity-60': !canPerformActions }"
            >
              <div class="flex items-center space-x-4">
                <div class="flex-shrink-0">
                  <svg
                    class="h-10 w-10 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ candidate.resume.name }}</p>
                  <p class="text-xs text-gray-500">
                    {{ formatFileSize(candidate.resume.size) }} • Загружено
                    {{ formatDate(candidate.resume.uploadDate) }}
                  </p>
                </div>
              </div>
              <button
                @click="downloadResume"
                :disabled="!canPerformActions"
                class="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 ring-1"
                :class="
                  canPerformActions
                    ? 'text-gray-700 bg-white hover:bg-gray-50 ring-gray-300'
                    : 'text-gray-400 bg-gray-100 cursor-not-allowed ring-gray-200'
                "
              >
                <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Скачать
              </button>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="lg:col-span-1">
          <div class="sticky top-24 space-y-6">
            <!-- Candidate info card -->
            <div
              class="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6 animate-slide-up"
              style="animation-delay: 0.4s"
            >
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Информация о кандидате</h3>

              <div class="space-y-4">
                <div>
                  <dt class="text-sm font-medium text-gray-500 mb-1">ФИО</dt>
                  <dd class="text-sm text-gray-900 font-medium">{{ candidateInfo.fullName }}</dd>
                </div>

                <div>
                  <dt class="text-sm font-medium text-gray-500 mb-1">Позиция</dt>
                  <dd class="text-sm text-gray-900">{{ candidateInfo.position }}</dd>
                </div>

                <div>
                  <dt class="text-sm font-medium text-gray-500 mb-1">Вакансия</dt>
                  <dd class="text-sm text-gray-900">{{ candidate.vacancy }}</dd>
                </div>

                <div>
                  <dt class="text-sm font-medium text-gray-500 mb-1">Анализ резюме</dt>
                  <dd>
                    <span
                      :class="getResumeAnalysisColor(candidate.resumeAnalysis)"
                      class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset"
                    >
                      {{ getResumeAnalysisText(candidate.resumeAnalysis) }}
                    </span>
                  </dd>
                </div>

                <div>
                  <dt class="text-sm font-medium text-gray-500 mb-1">Статус созвона</dt>
                  <dd>
                    <span
                      :class="getCallStatusColor(candidate.callStatus)"
                      class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset"
                    >
                      {{ getCallStatusText(candidate.callStatus) }}
                    </span>
                  </dd>
                </div>
              </div>
            </div>

            <!-- PDF download card -->
            <div
              class="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6 animate-slide-up"
              style="animation-delay: 0.5s"
            >
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Отчет</h3>
              <p class="text-sm text-gray-600 mb-4">
                Скачайте полный отчет по кандидату в формате PDF
              </p>

              <button
                @click="downloadPDF"
                :disabled="!canPerformActions"
                class="w-full inline-flex items-center justify-center px-4 py-3 text-sm font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 shadow-sm"
                :class="
                  canPerformActions
                    ? 'text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 hover:shadow-md'
                    : 'text-gray-400 bg-gray-200 cursor-not-allowed focus:ring-gray-300'
                "
              >
                <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                {{ canPerformActions ? 'Скачать PDF отчет' : 'Отчет недоступен' }}
              </button>

              <p class="text-xs text-gray-500 mt-2 text-center">
                {{
                  canPerformActions
                    ? 'Отчет будет создан автоматически при помощи ИИ'
                    : 'Доступно только для подходящих резюме'
                }}
              </p>
            </div>

            <!-- Quick actions -->
            <div
              class="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6 animate-slide-up"
              style="animation-delay: 0.6s"
            >
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Быстрые действия</h3>

              <div class="space-y-3">
                <button
                  class="w-full inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200"
                >
                  <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Удалить
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
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

.animate-fade-in {
  animation: fade-in 0.6s ease-out;
}

.animate-slide-up {
  animation: slide-up 0.6s ease-out;
  animation-fill-mode: both;
}
</style>
