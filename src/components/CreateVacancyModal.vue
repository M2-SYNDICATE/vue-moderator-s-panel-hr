<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { uploadVacancyFile } from '@/services/api.js'

interface Props {
  isOpen: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'vacancy-created'): void //
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const form = reactive({
  descriptionFile: null as File | null,
})
const isDragOver = ref(false)
const fileInputRef = ref<HTMLInputElement>()
const isVisible = ref(false)
const isLoading = ref(false) // Добавляем состояние загрузки

// Watch for modal open/close to handle animations
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

const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
  if (!isLoading.value) {
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

  if (isLoading.value) return // Блокируем во время загрузки

  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    form.descriptionFile = files[0]
  }
}

const handleFileSelect = (e: Event) => {
  if (isLoading.value) return // Блокируем во время загрузки

  const target = e.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    form.descriptionFile = target.files[0]
  }
}

const removeFile = () => {
  if (isLoading.value) return // Блокируем во время загрузки

  form.descriptionFile = null
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const submitForm = async () => {
  if (!form.descriptionFile || isLoading.value) {
    if (!form.descriptionFile) {
      alert('Пожалуйста, прикрепите файл')
    }
    return
  }

  isLoading.value = true // Начинаем загрузку

  try {
    // Используем axios через наш сервис
    await uploadVacancyFile(form.descriptionFile)

    // Успешно загружено → уведомляем родителя
    emit('vacancy-created')
    closeModal()
  } catch (err: any) {
    console.error('Ошибка при загрузке вакансии:', err)

    // Пытаемся получить текст ошибки из ответа
    const errorMessage = err.response?.data
      ? await err.response.data.text().catch(() => 'Ошибка сервера')
      : err.message || 'Не удалось загрузить вакансию'

    alert(errorMessage)
  } finally {
    isLoading.value = false // Завершаем загрузку
  }
}

const resetForm = () => {
  Object.assign(form, {
    descriptionFile: null,
  })
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const closeModal = () => {
  if (isLoading.value) return // Блокируем закрытие во время загрузки

  resetForm()
  emit('close')
}
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
        <!-- Background overlay -->
        <div
          class="fixed inset-0 bg-black/40 backdrop-blur-sm transition-all duration-300"
          @click="closeModal"
        ></div>

        <!-- Modal container -->
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
                v-if="isLoading"
                class="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl"
              >
                <div class="flex flex-col items-center space-y-3">
                  <div class="relative">
                    <div class="animate-spin rounded-full h-8 w-8 border-2 border-gray-200"></div>
                    <div
                      class="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent absolute top-0 left-0"
                    ></div>
                  </div>
                  <p class="text-sm font-medium text-gray-700">Создание вакансии...</p>
                </div>
              </div>

              <!-- Header -->
              <div class="relative px-6 pt-6 pb-4">
                <div class="flex items-center justify-between">
                  <h3 class="text-xl font-semibold text-gray-900">Создать вакансию</h3>
                  <button
                    v-if="!isLoading"
                    @click="closeModal"
                    class="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
                <!-- File Upload -->
                <div class="space-y-2">
                  <label class="block text-sm font-medium text-gray-700">
                    Описание вакансии (файл)
                  </label>

                  <div
                    @dragover="handleDragOver"
                    @dragleave="handleDragLeave"
                    @drop="handleDrop"
                    :class="[
                      'relative rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200',
                      isLoading
                        ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                        : isDragOver
                          ? 'border-blue-400 bg-blue-50 scale-[1.02]'
                          : 'border-gray-300 hover:border-gray-400',
                    ]"
                  >
                    <div v-if="!form.descriptionFile" class="space-y-3">
                      <div class="mx-auto h-12 w-12 text-gray-400">
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
                      <div class="space-y-1">
                        <p class="text-sm text-gray-600">
                          Перетащите файл сюда или
                          <button
                            type="button"
                            @click="fileInputRef?.click()"
                            :disabled="isLoading"
                            class="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-150 disabled:text-gray-400 disabled:cursor-not-allowed"
                          >
                            выберите файл
                          </button>
                        </p>
                        <p class="text-xs text-gray-500">PDF, DOC, DOCX до 10MB</p>
                      </div>
                    </div>

                    <div v-else class="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div class="flex items-center space-x-3">
                        <div class="flex-shrink-0">
                          <svg
                            class="h-8 w-8 text-gray-400"
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
                        </div>
                        <div class="min-w-0 flex-1">
                          <p class="text-sm font-medium text-gray-900 truncate">
                            {{ form.descriptionFile.name }}
                          </p>
                          <p class="text-xs text-gray-500">
                            {{ Math.round(form.descriptionFile.size / 1024) }} KB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        @click="removeFile"
                        :disabled="isLoading"
                        class="flex-shrink-0 rounded-full p-1 text-red-400 hover:text-red-600 hover:bg-red-50 transition-all duration-150 disabled:text-gray-300 disabled:cursor-not-allowed disabled:hover:bg-transparent"
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
                    @change="handleFileSelect"
                    :disabled="isLoading"
                    class="hidden"
                  />
                </div>

                <!-- Actions -->
                <div class="flex justify-end space-x-3 pt-4">
                  <button
                    v-if="!isLoading"
                    type="button"
                    @click="closeModal"
                    class="rounded-xl px-6 py-2.5 text-sm font-medium text-gray-700 bg-white ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-all duration-200"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    :disabled="isLoading || !form.descriptionFile"
                    class="rounded-xl px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 disabled:hover:shadow-sm flex items-center space-x-2"
                  >
                    <div v-if="isLoading" class="flex items-center space-x-2">
                      <div
                        class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"
                      ></div>
                      <span>Создание...</span>
                    </div>
                    <span v-else>Создать вакансию</span>
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
