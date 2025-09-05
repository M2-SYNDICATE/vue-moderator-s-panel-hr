<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getCandidateById, sendScheduleInvite } from '@/services/api'

// Получаем ID кандидата из URL
const route = useRoute()
const candidateId = Number(route.params.id)

// Состояния
const candidate = ref<any>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const isSendingInvitation = ref(false)
const editEmail = ref('')
const isEditingEmail = ref(false)

// Загружаем кандидата по ID
onMounted(async () => {
  try {
    const response = await getCandidateById(candidateId)
    candidate.value = response.data
  } catch (err) {
    error.value = 'Ошибка при загрузке данных кандидата'
    console.error(err)
  } finally {
    loading.value = false
  }
})

// Если нет данных — показываем сообщение
const hasData = computed(() => candidate.value !== null)

// Распарсить информацию из заголовка
const candidateInfo = computed(() => {
  if (!candidate.value?.title) return { fullName: 'Не указано', position: '' }
  const parts = candidate.value.title.split(' / ')
  return {
    fullName: parts[0] || 'Не указано',
    position: parts[1] || candidate.value.vacancy,
  }
})

const canDownloadResume = computed(() => {
  return candidate.value?.resumeAnalysis === 'suitable'
})

const isReportPending = computed(() => {
  return candidate.value?.resumeAnalysis === 'suitable' && !candidate.value?.ai_report
})

// Проверка, можно ли выполнять действия
const canPerformActions = computed(() => {
  return candidate.value?.resumeAnalysis === 'suitable'
})

// Показывать управление созвоном только если приглашение отправлено
const showCallManagement = computed(() => {
  return canPerformActions.value && !!candidate.value?.email
})

// Показывать форму отправки приглашения
const showInvitationForm = computed(() => {
  return canPerformActions.value && !candidate.value?.invitationSent
})

// Форматирование даты и времени
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

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Анализ резюме
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

// Статус созвона
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

// Редактирование ссылки на созвон
const isEditingCallLink = ref(false)
const editCallLink = ref('')

const startEditingCallLink = () => {
  editCallLink.value = candidate.value?.callLink || ''
  isEditingCallLink.value = true
}

const saveCallLink = () => {
  if (editCallLink.value.trim()) {
    candidate.value.callLink = editCallLink.value
  } else {
    candidate.value.callLink = null
  }
  isEditingCallLink.value = false
}

const cancelEditingCallLink = () => {
  editCallLink.value = ''
  isEditingCallLink.value = false
}

// Редактирование даты созвона
const isEditingCallDate = ref(false)
const editCallDate = ref('')

const startEditingCallDate = () => {
  if (candidate.value?.callDate) {
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
    if (candidate.value.callStatus === 'not_planned') {
      candidate.value.callStatus = 'planned'
    }
  } else {
    candidate.value.callDate = null
    candidate.value.callStatus = 'not_planned'
  }
  isEditingCallDate.value = false
}

const cancelEditingCallDate = () => {
  editCallDate.value = ''
  isEditingCallDate.value = false
}

// Открытие ссылки на созвон
const openCallLink = () => {
  if (!canPerformActions.value) return
  if (candidate.value?.callLink) {
    window.open(candidate.value.callLink, '_blank')
  }
}

// Скачивание резюме
const downloadResume = () => {
  if (!canPerformActions.value) {
    alert('Действие недоступно: резюме не подходит для данной вакансии')
    return
  }
  // Здесь можно вызвать функцию из api.js для скачивания файла
  // Например: downloadResumeFile(candidate.value.resume.id)
  console.log('Downloading resume:', candidate.value.resume.name)
}

const sendInvitation = async () => {
  if (!editEmail.value.trim()) {
    alert('Введите email кандидата')
    return
  }

  // Валидация email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(editEmail.value)) {
    alert('Введите корректный email адрес')
    return
  }

  isSendingInvitation.value = true

  try {
    // Отправляем приглашение
    const response = await sendScheduleInvite(candidateId, editEmail.value)

    // Обновляем данные кандидата
    candidate.value.email = editEmail.value
    candidate.value.invitationSent = true

    // Опционально: если есть `callDate`, можно установить статус
    if (candidate.value.callStatus === 'not_planned') {
      candidate.value.callStatus = 'planned'
    }

    // Скрываем форму редактирования
    isEditingEmail.value = false
    editEmail.value = ''

    console.log('Приглашение отправлено:', response)
  } catch (error) {
    console.error('Ошибка при отправке приглашения:', error)
    alert('Не удалось отправить приглашение. Попробуйте еще раз.')
  } finally {
    isSendingInvitation.value = false
  }
}

const startEditingEmail = () => {
  editEmail.value = candidate.value?.email || ''
  isEditingEmail.value = true
}

// Скачивание PDF отчета
const downloadPDF = () => {
  if (!canPerformActions.value) {
    alert('Действие недоступно: резюме не подходит для данной вакансии')
    return
  }
  console.log('Downloading PDF report for candidate:', candidate.value.id)
}
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

      <!-- Loading state -->
      <div v-if="loading" class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <svg
          class="mx-auto h-12 w-12 text-red-400"
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
        <h3 class="mt-2 text-sm font-medium text-red-800">Ошибка загрузки</h3>
        <p class="mt-1 text-sm text-red-700">{{ error }}</p>
      </div>

      <!-- Main content -->
      <div v-else-if="hasData" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Main content -->
        <div class="lg:col-span-2 space-y-8">
          <!-- Header card -->
          <div class="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6 animate-slide-up">
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
                <span v-else-if="canPerformActions" class="text-gray-400">Созвон не назначен</span>
                <span v-else class="text-gray-400">—</span>
              </div>
            </div>
          </div>

          <!-- Invitation form -->
          <div
            v-if="showInvitationForm"
            class="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6 animate-slide-up"
          >
            <h2 class="text-lg font-semibold text-gray-900 mb-4">
              Отправить приглашение кандидату
            </h2>
            <p class="text-sm text-gray-600 mb-4">
              Отправьте кандидату приглашение на собеседование, чтобы узнать удобное время для
              созвона.
            </p>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Email кандидата</label>
                <div v-if="!isEditingEmail" class="flex items-center justify-between">
                  <div class="flex-1">
                    <div v-if="candidate.email" class="p-3 bg-gray-50 rounded-lg">
                      <div class="flex items-center space-x-3">
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
                            d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                          />
                        </svg>
                        <span class="text-sm text-gray-900">{{ candidate.email }}</span>
                      </div>
                    </div>
                    <div v-else class="p-3 bg-gray-50 rounded-lg">
                      <div class="flex items-center space-x-3">
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
                            d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                          />
                        </svg>
                        <span class="text-sm text-gray-500">Email не указан</span>
                      </div>
                    </div>
                  </div>
                  <button
                    @click="startEditingEmail"
                    class="ml-4 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-150"
                  >
                    {{ candidate.email ? 'Изменить' : 'Добавить' }}
                  </button>
                </div>
                <div v-else class="space-y-3">
                  <input
                    v-model="editEmail"
                    type="email"
                    placeholder="candidate@example.com"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div class="flex space-x-2">
                    <button
                      @click="sendInvitation"
                      :disabled="isSendingInvitation || !editEmail.trim()"
                      class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {{ isSendingInvitation ? 'Отправка...' : 'Отправить приглашение' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Call management -->
          <div
            v-if="showCallManagement"
            class="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6 animate-slide-up"
          >
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-gray-900">Управление созвоном</h2>
              <div
                v-if="candidate.invitationSent && !candidate.callDate"
                class="flex items-center space-x-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Приглашение отправлено</span>
              </div>
            </div>

            <!-- Call Date -->
            <div class="mb-6">
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-medium text-gray-700">Дата и время созвона</h3>
                <button
                  v-if="!isEditingCallDate"
                  @click="startEditingCallDate"
                  class="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-150"
                ></button>
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

            <!-- Call Link -->
            <div>
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-medium text-gray-700">Ссылка на созвон</h3>
                <button
                  v-if="!isEditingCallLink"
                  @click="startEditingCallLink"
                  class="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-150"
                ></button>
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

          <!-- Comments -->
          <div
            v-if="candidate.comments"
            class="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6 animate-slide-up"
          >
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Комментарии и заметки AI</h2>
            <div class="prose prose-gray max-w-none">
              <p class="text-gray-700 leading-relaxed">{{ candidate.comments }}</p>
            </div>
          </div>

          <!-- Resume -->
          <div
            v-if="candidate.resume"
            class="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6 animate-slide-up"
          >
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Прикрепленное резюме</h2>
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div class="flex items-center space-x-4">
                <div class="flex-shrink-0">
                  <svg
                    :class="canPerformActions ? 'text-blue-500' : 'text-orange-500'"
                    class="h-10 w-10"
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
                :disabled="!canDownloadResume"
                class="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ring-1"
                :class="
                  canPerformActions
                    ? 'text-gray-700 bg-white hover:bg-gray-50 ring-gray-300'
                    : 'text-orange-700 bg-orange-50 hover:bg-orange-100 ring-orange-200 border border-orange-300'
                "
              >
                <svg
                  :class="canPerformActions ? 'text-gray-500' : 'text-orange-500'"
                  class="h-4 w-4 mr-2"
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
                Скачать
              </button>
            </div>

            <!-- Предупреждение, если резюме не подходит -->
            <div
              v-if="candidate.resumeAnalysis === 'not_suitable'"
              class="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg"
            >
              <div class="flex items-center space-x-2 text-xs text-orange-800">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <span>Резюме не подходит для данной вакансии, но доступно для ознакомления</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="lg:col-span-1">
          <div class="sticky top-24 space-y-6">
            <div class="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6 animate-slide-up">
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

            <div class="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6 animate-slide-up">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Отчет</h3>
              <p class="text-sm text-gray-600 mb-4">
                Скачайте полный отчет по кандидату в формате PDF
              </p>

              <!-- Кнопка скачивания -->
              <button
                @click="downloadPDF"
                :disabled="!canPerformActions || isReportPending"
                class="w-full inline-flex items-center justify-center px-4 py-3 text-sm font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 shadow-sm"
                :class="
                  canPerformActions && !isReportPending
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
                {{
                  canPerformActions && !isReportPending ? 'Скачать PDF отчет' : 'Отчет недоступен'
                }}
              </button>

              <!-- Сообщение: отчёт ещё не сформирован -->
              <p
                v-if="isReportPending"
                class="text-xs text-yellow-700 mt-2 text-center bg-yellow-50 py-2 px-4 rounded-lg"
              >
                ⏳ Отчёт ещё не сформирован
              </p>

              <!-- Стандартное пояснение -->
              <p class="text-xs text-gray-500 mt-2 text-center">
                {{
                  !canPerformActions
                    ? 'Доступно только для подходящих резюме'
                    : 'Отчет будет создан автоматически при помощи AI'
                }}
              </p>
            </div>

            <div class="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6 animate-slide-up">
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
