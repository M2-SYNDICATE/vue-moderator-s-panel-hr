<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { getCandidateById, downloadCandidateResume, deleteCandidate } from '@/services/api'
import { apiClient } from '@/services/api' // Добавляем импорт apiClient
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const route = useRoute()
const candidateId = Number(route.params.id)

// Состояния
const candidate = ref<any>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const linkCopied = ref(false)

// Интервал для автообновления
let updateInterval: ReturnType<typeof setInterval> | null = null

// Функция для сравнения объектов
const isEqual = (obj1: any, obj2: any): boolean => {
  return JSON.stringify(obj1) === JSON.stringify(obj2)
}

// Создаем фоновую версию запроса для автообновления
const getCandidateByIdBackground = async (id: number) => {
  return await apiClient.getBackground(`/candidate/${id}`)
}

// Функция для загрузки данных кандидата
const loadCandidateData = async (showLoading = true) => {
  try {
    if (showLoading) loading.value = true

    // Используем разные запросы для основного и фонового обновления
    const response = showLoading
      ? await getCandidateById(candidateId)
      : await getCandidateByIdBackground(candidateId)

    // Сравниваем с текущими данными
    if (!candidate.value || !isEqual(candidate.value, response.data)) {
      candidate.value = response.data
      if (showLoading) {
        console.log('Данные кандидата обновлены')
      } else {
        console.log('Данные кандидата обновлены в фоне')
      }
    }
  } catch (err: any) {
    // Для фоновых запросов не показываем ошибки пользователю
    if (showLoading) {
      error.value = 'Ошибка при загрузке данных кандидата'
      console.error(err)
    } else {
      console.warn('Фоновое обновление кандидата не удалось:', err.message)
    }
  } finally {
    if (showLoading) loading.value = false
  }
}

// Загружаем кандидата по ID при монтировании
onMounted(async () => {
  await loadCandidateData(true)

  // Запускаем автообновление каждые 30 секунд
  updateInterval = setInterval(() => {
    loadCandidateData(false) // Без показа лоадера для фоновых обновлений
  }, 30000) // 30 секунд
})

// Очищаем интервал при размонтировании
onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
    updateInterval = null
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

// Показывать форму отправки приглашения
const showCallManagement = computed(() => {
  return candidate.value?.resumeAnalysis === 'suitable'
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

// Добавить методы
const copyCallLink = async () => {
  try {
    await navigator.clipboard.writeText(candidate.value.callLink)
    linkCopied.value = true

    // Сбросить состояние через 2 секунды
    setTimeout(() => {
      linkCopied.value = false
    }, 2000)
  } catch (err) {
    console.error('Не удалось скопировать ссылку:', err)
    // Fallback для старых браузеров
    const textArea = document.createElement('textarea')
    textArea.value = candidate.value.callLink
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)

    linkCopied.value = true
    setTimeout(() => {
      linkCopied.value = false
    }, 2000)
  }
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

const formattedAIReport = computed(() => {
  if (!candidate.value?.ai_report) return null

  try {
    // Попробуем распарсить как JSON
    let reportData: any
    if (typeof candidate.value.ai_report === 'string') {
      // Если строка — попробуем распарсить
      reportData = JSON.parse(candidate.value.ai_report)
    } else {
      reportData = candidate.value.ai_report
    }

    // Преобразуем в массив для отображения
    const entries = Object.entries(reportData).map(([question, data]: [string, any]) => ({
      question,
      passed: data.passed,
      score: data.score,
    }))

    return entries
  } catch (e) {
    console.error('Ошибка парсинга AI отчета:', e)
    return null
  }
})

// Скачивание резюме
const downloadResume = () => {
  downloadCandidateResume(candidate.value.id)
}

const confirmDelete = async () => {
  if (!candidate.value) return

  if (!confirm(`Вы уверены, что хотите удалить кандидата "${candidateInfo.value.fullName}"?`)) {
    return
  }

  try {
    await deleteCandidate(candidate.value.id)
    alert('Кандидат успешно удален')
    // Перенаправляем на главную страницу после удаления
    window.location.href = '/'
  } catch (error) {
    console.error('Ошибка при удалении кандидата:', error)
    alert('Не удалось удалить кандидата. Попробуйте позже.')
  }
}

// Скачивание PDF отчета
const downloadPDF = () => {
  if (!canPerformActions.value) {
    alert('Действие недоступно: резюме не подходит для данной вакансии')
    return
  }

  if (isReportPending.value) {
    alert('Отчет еще не сформирован')
    return
  }

  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const fontUrl = '/fonts/Roboto-Regular.ttf'

    const xhr = new XMLHttpRequest()
    xhr.open('GET', fontUrl, true)
    xhr.responseType = 'arraybuffer'
    xhr.onload = function () {
      if (xhr.status === 200) {
        const arrayBuffer = xhr.response
        const base64Font = btoa(
          new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ''),
        )

        const fontName = 'Roboto-Regular'
        doc.addFileToVFS(fontName + '.ttf', base64Font) // Теперь как строка!
        doc.addFont(fontName + '.ttf', fontName, 'normal')
        doc.setFont(fontName)

        generatePDFContent(doc)
      } else {
        console.error('Не удалось загрузить шрифт:', fontUrl)
        fallbackToDefaultFont(doc)
      }
    }
    xhr.onerror = () => {
      console.error('Ошибка при загрузке шрифта')
      fallbackToDefaultFont(doc)
    }
    xhr.send()
  } catch (error) {
    console.error('Ошибка при генерации PDF:', error)
    alert('Не удалось сгенерировать отчет. Попробуйте позже.')
  }
}

// Функция для генерации контента PDF (вызывается после загрузки шрифта)
const generatePDFContent = (doc: any) => {
  // Заголовок
  doc.setFontSize(20)
  doc.text('Отчет по кандидату', 105, 20, { align: 'center' })

  // Основная информация
  doc.setFontSize(12)
  doc.text(`ФИО: ${candidateInfo.value.fullName}`, 20, 40)
  doc.text(`Вакансия: ${candidate.value.vacancy}`, 20, 50)
  doc.text(`Дата создания: ${formatDate(candidate.value.createdAt)}`, 20, 60)

  let startY = 70

  // Детализированный отчет от ИИ
  if (
    formattedAIReport.value &&
    Array.isArray(formattedAIReport.value) &&
    formattedAIReport.value.length > 0
  ) {
    const tableData = formattedAIReport.value.map((item: any) => [
      item.question,
      item.passed ? 'Пройдено' : 'Не пройдено',
      `${item.score}/10`,
    ])

    // Используем autoTable
    ;(doc as any).autoTable({
      startY: startY,
      head: [['Вопрос', 'Статус', 'Оценка']],
      body: tableData,
      styles: { fontSize: 9, font: 'Roboto-Regular' },
      headStyles: { fillColor: [22, 160, 133], font: 'Roboto-Regular' },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 30 },
        2: { cellWidth: 25 },
      },
    })

    startY = (doc as any).lastAutoTable.finalY + 10
  }

  // Сохраняем PDF
  doc.save(`Отчет по кандидату ${candidateInfo.value.fullName}.pdf`)
}

// Резервный вариант: если шрифт не загрузился
const fallbackToDefaultFont = (doc: any) => {
  console.warn('Используется стандартный шрифт (без кириллицы)')
  alert('Не удалось загрузить шрифт. Русские буквы могут отображаться некорректно.')
  generatePDFContent(doc)
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

              <!-- Resume download button in header -->
              <div v-if="candidate.resume" class="flex-shrink-0 ml-4">
                <button
                  @click="downloadResume"
                  class="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ring-1"
                  :class="
                    canPerformActions
                      ? 'text-blue-700 bg-white hover:bg-gray-50 ring-gray-300'
                      : 'text-orange-700 bg-orange-50 hover:bg-orange-100 ring-orange-200 border border-orange-300'
                  "
                >
                  <svg
                    :class="canPerformActions ? 'text-blue-500' : 'text-orange-500'"
                    class="h-4 w-4 mr-1"
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
                  <span class="hidden sm:inline">Скачать резюме</span>
                  <span class="sm:hidden">Скачать</span>
                </button>
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

            <!-- Предупреждение о резюме под хедером -->
            <div
              v-if="candidate.resume && candidate.resumeAnalysis === 'not_suitable'"
              class="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg"
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

          <!-- Контактная информация -->
          <div class="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6 animate-slide-up">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Контактная информация</h2>
            <div class="space-y-4">
              <div>
                <dt class="block text-sm font-medium text-gray-700 mb-1">Телефон</dt>
                <dd class="p-3 bg-gray-50 rounded-lg text-sm text-gray-900 font-mono">
                  {{ candidate.phone || 'Не указан' }}
                </dd>
              </div>
              <div v-if="candidate.resumeAnalysis !== 'not_suitable'">
                <dt class="block text-sm font-medium text-gray-700 mb-1">Ответ кандидата</dt>
                <dd class="p-3 bg-gray-50 rounded-lg text-sm text-gray-900 leading-relaxed">
                  Кандидат ответил, что готов к собеседованию в любое время.
                </dd>
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
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
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

            <!-- Call Connection -->
            <div>
              <h3 class="text-sm font-medium text-gray-700 mb-3">Подключение к созвону</h3>
              <div class="p-4 bg-gray-50 rounded-xl">
                <div v-if="candidate.callLink" class="space-y-4">
                  <!-- Call Link Display -->
                  <div class="flex items-start space-x-3">
                    <div
                      class="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center"
                    >
                      <svg
                        class="h-5 w-5 text-blue-600"
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
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="text-sm font-medium text-gray-900 mb-2">
                        Ссылка на видеоконференцию
                      </p>
                      <button
                        @click="copyCallLink"
                        class="group w-full text-left p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        <div class="flex items-center justify-between">
                          <span
                            class="text-sm text-blue-600 font-mono break-all group-hover:text-blue-700"
                          >
                            {{ candidate.callLink }}
                          </span>
                          <div class="flex items-center ml-3 flex-shrink-0">
                            <svg
                              v-if="!linkCopied"
                              class="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors duration-200"
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
                              class="h-4 w-4 text-green-600"
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
                          </div>
                        </div>
                        <p
                          class="text-xs text-gray-500 mt-1 group-hover:text-blue-600 transition-colors duration-200"
                        >
                          {{
                            linkCopied ? 'Ссылка скопирована!' : 'Нажмите, чтобы скопировать ссылку'
                          }}
                        </p>
                      </button>
                    </div>
                  </div>

                  <!-- Connect Button -->
                  <div class="flex justify-end">
                    <button
                      @click="openCallLink"
                      :disabled="!canPerformActions"
                      class="relative inline-flex items-center px-4 py-2.5 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 shadow-lg shadow-green-600/25 hover:shadow-xl hover:shadow-green-600/40 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:ring-offset-2 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none group overflow-hidden"
                    >
                      <!-- Animated background overlay -->
                      <div
                        class="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"
                      ></div>

                      <svg
                        class="h-4 w-4 mr-2 relative z-10"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                      <span class="relative z-10">Подключиться</span>
                    </button>
                  </div>
                </div>

                <div v-else class="flex items-center justify-center py-8">
                  <div class="text-center">
                    <div
                      class="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3"
                    >
                      <svg
                        class="h-6 w-6 text-gray-400"
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
                    </div>
                    <p class="text-sm text-gray-500 font-medium">Ссылка на созвон недоступна</p>
                    <p class="text-xs text-gray-400 mt-1">Ссылка будет создана автоматически</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Comments -->
          <div
            v-if="candidate.comments"
            class="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6 animate-slide-up"
          >
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Комментарии и заметки от AI</h2>
            <div class="prose prose-gray max-w-none">
              <p class="text-gray-700 leading-relaxed">{{ candidate.comments }}</p>
            </div>
          </div>

          <!-- AI Report - показывается только если резюме подходит -->
          <div
            v-if="candidate.resumeAnalysis === 'suitable'"
            class="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6 animate-slide-up"
          >
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Отчет от AI</h2>
            <div v-if="formattedAIReport && formattedAIReport.length > 0" class="space-y-6">
              <div
                v-for="(item, index) in formattedAIReport"
                :key="index"
                class="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors duration-200"
              >
                <div class="flex items-start justify-between mb-3">
                  <h3 class="text-sm font-medium text-gray-900 flex-1 pr-4">
                    {{ item.question }}
                  </h3>
                  <div class="flex items-center space-x-2 flex-shrink-0">
                    <span
                      :class="[
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        item.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800',
                      ]"
                    >
                      {{ item.passed ? 'Пройдено' : 'Не пройдено' }}
                    </span>
                    <span
                      :class="[
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        item.score >= 7
                          ? 'bg-green-100 text-green-800'
                          : item.score >= 4
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800',
                      ]"
                    >
                      Оценка: {{ item.score }}/10
                    </span>
                  </div>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div
                    :class="[
                      'h-2 rounded-full',
                      item.score >= 7
                        ? 'bg-green-500'
                        : item.score >= 4
                          ? 'bg-yellow-500'
                          : 'bg-red-500',
                    ]"
                    :style="{ width: `${(item.score / 10) * 100}%` }"
                  ></div>
                </div>
              </div>
            </div>
            <div v-else-if="candidate.ai_report" class="prose prose-gray max-w-none">
              <p class="text-gray-700 leading-relaxed">
                {{ candidate.ai_report }}
              </p>
            </div>
            <div v-else class="text-center py-8">
              <div
                class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100 mb-3"
              >
                <svg
                  class="h-6 w-6 text-yellow-600"
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
              </div>
              <p class="text-sm text-gray-500 font-medium">⏳ Отчёт ещё не сформирован</p>
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
                  @click="confirmDelete"
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
