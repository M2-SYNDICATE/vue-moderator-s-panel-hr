<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { addCandidate } from '@/services/api.js'

// === Типы ===
interface Vacancy {
  id: number
  title: string
}

interface Props {
  isOpen: boolean
  vacancies: Vacancy[]
}

interface Emits {
  (e: 'close'): void
  (
    e: 'candidate-created',
    candidate: {
      vacancyId: number
      resumeAnalysis: 'suitable' | 'not_suitable' | 'analyzing'
      callStatus: 'not_planned'
    },
  ): void
}

// === Props и Emits ===
const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// === Форма ===
const form = reactive({
  vacancyId: null as number | null,
  files: [] as File[], // теперь массив файлов
})

// === UI State ===
const isDragOver = ref(false)
const fileInputRef = ref<HTMLInputElement>()
const isVisible = ref(false)
const isVacancyDropdownOpen = ref(false)
const vacancySearchQuery = ref('')
const isUploading = ref(false)

// === Константы ===
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

// === Computed ===

const filteredVacancies = computed(() => {
  if (!vacancySearchQuery.value.trim()) {
    return props.vacancies
  }
  return props.vacancies.filter((v) =>
    v.title.toLowerCase().includes(vacancySearchQuery.value.toLowerCase()),
  )
})

const selectedVacancy = computed(() => {
  return props.vacancies.find((v) => v.id === form.vacancyId)
})

const selectedVacancyTitle = computed(() => {
  return selectedVacancy.value?.title || 'Выберите вакансию'
})

// Проверка, можно ли отправить
const canSubmit = computed(() => {
  return form.vacancyId && form.files.length > 0 && !isUploading.value
})

// === Валидация файла ===
const validateFile = (file: File): string | null => {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Недопустимый формат. Разрешены: PDF, DOC, DOCX.'
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'Файл слишком большой (макс. 10 МБ).'
  }
  return null
}

// === Добавление файлов ===
const addFiles = (files: FileList | null | undefined) => {
  if (!files || files.length === 0 || isUploading.value) return // Блокируем во время загрузки

  const errors: string[] = []
  const validFiles: File[] = []

  Array.from(files).forEach((file) => {
    const error = validateFile(file)
    if (error) {
      errors.push(`${file.name}: ${error}`)
    } else {
      validFiles.push(file)
    }
  })

  if (errors.length > 0) {
    alert('Ошибки при добавлении файлов:\n' + errors.join('\n'))
  }

  form.files.push(...validFiles)
}

// === Drag & Drop ===
const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
  if (!isUploading.value) {
    isDragOver.value = true
  }
}

const handleDragLeave = (e: DragEvent) => {
  e.preventDefault()
  isDragOver.value = false
}

const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  isDragOver.value = false
  if (!isUploading.value) {
    addFiles(e.dataTransfer?.files)
  }
}

// === Input file ===
const handleFileSelect = (e: Event) => {
  if (isUploading.value) return // Блокируем во время загрузки

  const target = e.target as HTMLInputElement
  addFiles(target.files)
  // Сбрасываем значение, чтобы можно было выбрать те же файлы снова
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

// === Удаление файла ===
const removeFile = (index: number) => {
  if (isUploading.value) return // Блокируем во время загрузки
  form.files.splice(index, 1)
}

// === Выбор вакансии ===
const toggleVacancyDropdown = () => {
  if (isUploading.value) return // Блокируем во время загрузки

  isVacancyDropdownOpen.value = !isVacancyDropdownOpen.value
  if (!isVacancyDropdownOpen.value) {
    vacancySearchQuery.value = ''
  }
}

const selectVacancy = (id: number) => {
  if (isUploading.value) return // Блокируем во время загрузки

  form.vacancyId = id
  isVacancyDropdownOpen.value = false
  vacancySearchQuery.value = ''
}

// === Отправка формы ===
const submitForm = async () => {
  if (!canSubmit.value) return
  if (!form.vacancyId) return

  isUploading.value = true

  try {
    await addCandidate(form.vacancyId, form.files)

    emit('candidate-created', {
      vacancyId: form.vacancyId!,
      resumeAnalysis: 'analyzing',
      callStatus: 'not_planned',
    })

    closeModal()
  } catch (err: any) {
    console.error('Ошибка при добавлении кандидатов:', err)

    const errorMessage =
      err.response?.data instanceof Blob
        ? await err.response.data.text().catch(() => 'Ошибка сервера')
        : err.message || 'Не удалось добавить кандидатов'

    alert(`Ошибка: ${errorMessage}`)
  } finally {
    isUploading.value = false
  }
}

// === Сброс формы ===
const resetForm = () => {
  form.vacancyId = null
  form.files = []
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
  isVacancyDropdownOpen.value = false
  vacancySearchQuery.value = ''
}

// === Закрытие модалки ===
const closeModal = () => {
  if (isUploading.value) return // Блокируем закрытие во время загрузки

  resetForm()
  emit('close')
}

// === Анимация открытия/закрытия ===
watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      isVisible.value = true
    } else {
      setTimeout(() => {
        isVisible.value = false
      }, 300)
    }
  },
  { immediate: true },
)
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto">
        <!-- Overlay -->
        <div
          class="fixed inset-0 bg-black/40 backdrop-blur-sm transition-all duration-300"
          @click="closeModal"
        ></div>

        <!-- Modal -->
        <div class="flex min-h-full items-center justify-center p-4">
          <Transition
            enter-active-class="duration-300 ease-out"
            enter-from-class="opacity-0 scale-95 translate-y-4"
            enter-to-class="opacity-100 scale-100 translate-y-0"
            leave-active-class="duration-200 ease-in"
            leave-from-class="opacity-100 scale-100 translate-y-0"
            leave-to-class="opacity-0 scale-95 translate-y-4"
          >
            <div
              v-if="isOpen"
              class="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all"
              @click.stop
            >
              <!-- Loading Overlay -->
              <div
                v-if="isUploading"
                class="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl"
              >
                <div class="flex flex-col items-center space-y-3">
                  <div class="relative">
                    <div class="animate-spin rounded-full h-8 w-8 border-2 border-gray-200"></div>
                    <div
                      class="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent absolute top-0 left-0"
                    ></div>
                  </div>
                  <p class="text-sm font-medium text-gray-700">Добавление кандидатов...</p>
                </div>
              </div>

              <!-- Header -->
              <div class="px-6 pt-6 pb-4">
                <div class="flex items-center justify-between">
                  <h3 class="text-xl font-semibold text-gray-900">Добавить кандидатов</h3>
                  <button
                    v-if="!isUploading"
                    @click="closeModal"
                    class="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Form -->
              <form @submit.prevent="submitForm" class="px-6 pb-6 space-y-5">
                <!-- Vacancy Selection -->
                <div class="space-y-2">
                  <label class="block text-sm font-medium text-gray-700">Вакансия</label>

                  <div class="relative" style="z-index: 60">
                    <button
                      type="button"
                      @click="toggleVacancyDropdown"
                      :disabled="isUploading"
                      :class="[
                        'relative w-full bg-white border border-gray-300 rounded-xl shadow-sm pl-4 pr-10 py-3 text-left focus:outline-none focus:ring-2 focus:ring-blue-600 hover:border-gray-400 transition-all',
                        { 'ring-2 ring-blue-600 border-transparent': isVacancyDropdownOpen },
                        isUploading ? 'opacity-50 cursor-not-allowed' : '',
                      ]"
                    >
                      <span class="block truncate" :class="{ 'text-gray-500': !form.vacancyId }">
                        {{ selectedVacancyTitle }}
                      </span>
                      <span
                        class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"
                      >
                        <svg
                          class="h-5 w-5 text-gray-400 transition-transform"
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

                    <!-- Dropdown -->
                    <Transition
                      enter-active-class="transition duration-200 ease-out"
                      enter-from-class="transform scale-95 opacity-0"
                      enter-to-class="transform scale-100 opacity-100"
                      leave-active-class="transition duration-150 ease-in"
                      leave-from-class="transform scale-100 opacity-100"
                      leave-to-class="transform scale-95 opacity-0"
                    >
                      <div
                        v-if="isVacancyDropdownOpen && !isUploading"
                        class="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 max-h-64 overflow-hidden"
                      >
                        <!-- Search -->
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
                              class="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                              @click.stop
                            />
                            <button
                              v-if="vacancySearchQuery"
                              type="button"
                              @click.stop="vacancySearchQuery = ''"
                              class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
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
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>

                        <!-- List -->
                        <div class="max-h-48 overflow-auto">
                          <div
                            v-for="vacancy in filteredVacancies"
                            :key="vacancy.id"
                            @click="selectVacancy(vacancy.id)"
                            class="px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 cursor-pointer"
                            :class="{ 'bg-blue-50': form.vacancyId === vacancy.id }"
                          >
                            <div class="text-sm font-medium text-gray-900">
                              {{ vacancy.title }}
                            </div>
                          </div>

                          <!-- No results -->
                          <div
                            v-if="vacancySearchQuery.trim() && filteredVacancies.length === 0"
                            class="px-4 py-8 text-center text-gray-500 text-sm"
                          >
                            Вакансии не найдены
                          </div>
                          <div
                            v-else-if="!vacancySearchQuery.trim() && filteredVacancies.length === 0"
                            class="px-4 py-8 text-center text-gray-500 text-sm"
                          >
                            Нет вакансий
                          </div>
                        </div>
                      </div>
                    </Transition>
                  </div>
                </div>

                <!-- Resume Upload -->
                <div class="space-y-3">
                  <label class="block text-sm font-medium text-gray-700">
                    Прикрепить резюме (можно несколько)
                  </label>

                  <!-- Drag & Drop Zone -->
                  <div
                    @dragover="handleDragOver"
                    @dragleave="handleDragLeave"
                    @drop="handleDrop"
                    :class="[
                      'relative rounded-xl border-2 border-dashed transition-all duration-200',
                      form.files.length > 0 ? 'p-4' : 'p-6',
                      isUploading
                        ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                        : isDragOver
                          ? 'border-blue-400 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400',
                    ]"
                  >
                    <div class="text-center">
                      <div
                        :class="form.files.length > 0 ? 'h-8 w-8' : 'h-12 w-12'"
                        class="mx-auto text-gray-400"
                      >
                        <svg
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          class="h-full w-full"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="1.5"
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                      </div>
                      <div :class="form.files.length > 0 ? 'space-y-1' : 'space-y-1 mt-3'">
                        <p
                          :class="form.files.length > 0 ? 'text-xs' : 'text-sm'"
                          class="text-gray-600"
                        >
                          {{
                            form.files.length > 0
                              ? 'Добавить еще файлы'
                              : 'Перетащите файлы сюда или'
                          }}
                          <button
                            type="button"
                            @click="fileInputRef?.click()"
                            :disabled="isUploading"
                            class="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-150 disabled:text-gray-400 disabled:cursor-not-allowed"
                          >
                            {{ form.files.length > 0 ? '' : 'выберите' }}
                          </button>
                        </p>
                        <p class="text-xs text-gray-500">PDF, DOC, DOCX до 10 МБ каждый</p>
                      </div>
                    </div>
                  </div>

                  <!-- Список файлов -->
                  <div v-if="form.files.length > 0" class="space-y-2 max-h-40 overflow-y-auto">
                    <div class="text-xs font-medium text-gray-500 px-1">
                      Выбрано файлов: {{ form.files.length }}
                    </div>
                    <div
                      v-for="(file, index) in form.files"
                      :key="index"
                      class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div class="flex items-center space-x-3 min-w-0 flex-1">
                        <svg
                          class="h-5 w-5 text-gray-400 flex-shrink-0"
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
                        <div class="min-w-0 flex-1">
                          <p class="text-sm font-medium text-gray-900 truncate">
                            {{ file.name }}
                          </p>
                          <p class="text-xs text-gray-500">{{ Math.round(file.size / 1024) }} КБ</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        @click="removeFile(index)"
                        :disabled="isUploading"
                        class="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-full transition flex-shrink-0 ml-2 disabled:text-gray-300 disabled:cursor-not-allowed disabled:hover:bg-transparent"
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
                    </div>
                  </div>

                  <input
                    ref="fileInputRef"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    multiple
                    @change="handleFileSelect"
                    :disabled="isUploading"
                    class="hidden"
                  />
                </div>

                <!-- Actions -->
                <div class="flex justify-end space-x-3 pt-4">
                  <button
                    v-if="!isUploading"
                    type="button"
                    @click="closeModal"
                    class="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    :disabled="!canSubmit"
                    class="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm hover:shadow transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <div v-if="isUploading" class="flex items-center space-x-2">
                      <div
                        class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"
                      ></div>
                      <span>Загрузка...</span>
                    </div>
                    <span v-else>
                      Добавить {{ form.files.length }} кандидат{{
                        form.files.length === 1 ? 'а' : form.files.length < 5 ? 'ов' : 'ов'
                      }}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
