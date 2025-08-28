<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// Mock data - в реальном приложении будет загружаться по ID
const candidate = ref({
  id: 1,
  title: 'Иванов Иван / Java Developer',
  vacancy: 'Senior Java Developer',
  callDate: '2024-01-15',
  callLink: 'https://meet.google.com/abc-defg-hij',
  comments:
    'Кандидат имеет отличный опыт работы с Spring Framework и микросервисами. Показал хорошие знания в области архитектуры приложений. Рекомендуется к собеседованию.',
  resume: {
    name: 'Иванов_Иван_Java_Developer.pdf',
    size: 245760, // bytes
    uploadDate: '2024-01-14',
  },
  status: 'ready',
  createdAt: '2024-01-14T10:30:00Z',
})

// Extract candidate info from title
const candidateInfo = computed(() => {
  const parts = candidate.value.title.split(' / ')
  return {
    fullName: parts[0] || 'Не указано',
    position: parts[1] || candidate.value.vacancy,
  }
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

const downloadResume = () => {
  // В реальном приложении здесь будет логика скачивания файла
  console.log('Downloading resume:', candidate.value.resume.name)
}

const downloadPDF = () => {
  // Функция для скачивания PDF отчета (будет реализована позже)
  console.log('Downloading PDF report for candidate:', candidate.value.id)
}

const openCallLink = () => {
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
        <router-link to="/" class="hover:text-blue-600 transition-colors duration-200">
          Главная
        </router-link>
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
              <span
                :class="getStatusColor(candidate.status)"
                class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ring-1 ring-inset"
              >
                {{ getStatusText(candidate.status) }}
              </span>
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
                    d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 012-2h4a2 2 0 012 2v1m-6 0h8m-8 0H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-2"
                  />
                </svg>
                Созвон {{ formatDate(candidate.callDate) }}
              </div>
            </div>
          </div>

          <!-- Call link card -->
          <div
            v-if="candidate.callLink"
            class="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6 animate-slide-up"
            style="animation-delay: 0.1s"
          >
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Ссылка на созвон</h2>
            <div class="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
              <div class="flex items-center space-x-3">
                <div class="flex-shrink-0">
                  <svg
                    class="h-8 w-8 text-blue-600"
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
                <div>
                  <p class="text-sm font-medium text-gray-900">Google Meet</p>
                  <p class="text-xs text-gray-500 font-mono">{{ candidate.callLink }}</p>
                </div>
              </div>
              <button
                @click="openCallLink"
                class="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-white rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
              >
                <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          </div>

          <!-- Comments card -->
          <div
            v-if="candidate.comments"
            class="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6 animate-slide-up"
            style="animation-delay: 0.2s"
          >
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Комментарии и заметки</h2>
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
              class="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200"
            >
              <div class="flex items-center space-x-4">
                <div class="flex-shrink-0">
                  <svg
                    class="h-10 w-10 text-red-500"
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
                class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 ring-1 ring-gray-300"
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
                  <dt class="text-sm font-medium text-gray-500 mb-1">Статус</dt>
                  <dd>
                    <span
                      :class="getStatusColor(candidate.status)"
                      class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset"
                    >
                      {{ getStatusText(candidate.status) }}
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
                class="w-full inline-flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Скачать PDF отчет
              </button>

              <p class="text-xs text-gray-500 mt-2 text-center">Отчет будет создан автоматически</p>
            </div>

            <!-- Quick actions -->
            <div
              class="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6 animate-slide-up"
              style="animation-delay: 0.6s"
            >
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Быстрые действия</h3>

              <div class="space-y-3">
                <button
                  class="w-full inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                >
                  <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Редактировать
                </button>

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
