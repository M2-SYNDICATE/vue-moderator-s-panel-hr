<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'

interface CandidateForm {
  vacancyId: number | null
  resume: File | null
}

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
    candidate: Omit<CandidateForm, 'resume'> & {
      resumeAnalysis: 'suitable' | 'not_suitable' | 'analyzing'
      callStatus: 'not_planned'
    },
  ): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const form = reactive<CandidateForm>({
  vacancyId: null,
  resume: null,
})

const isDragOver = ref(false)
const fileInputRef = ref<HTMLInputElement>()
const isVisible = ref(false)
const isVacancyDropdownOpen = ref(false)
const vacancySearchQuery = ref('')

// Watch for modal open/close to handle animations
watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      isVisible.value = true
    } else {
      setTimeout(() => {
        isVisible.value = false
        // Сбрасываем состояние dropdown при закрытии модала
        isVacancyDropdownOpen.value = false
        vacancySearchQuery.value = ''
      }, 300)
    }
  },
  { immediate: true },
)

// Фильтрованные вакансии для поиска
const filteredVacancies = computed(() => {
  if (!vacancySearchQuery.value.trim()) {
    return props.vacancies
  }
  return props.vacancies.filter((vacancy) =>
    vacancy.title.toLowerCase().includes(vacancySearchQuery.value.toLowerCase()),
  )
})

// Выбранная вакансия для отображения
const selectedVacancy = computed(() => {
  return props.vacancies.find((v) => v.id === form.vacancyId)
})

const selectedVacancyTitle = computed(() => {
  return selectedVacancy.value?.title || 'Выберите вакансию'
})

// Функция для подсветки найденного текста
const highlightSearchTerm = (text: string, searchTerm: string) => {
  if (!searchTerm.trim()) return text

  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '<mark class="bg-yellow-200 text-yellow-900 px-1 rounded">$1</mark>')
}

const toggleVacancyDropdown = () => {
  isVacancyDropdownOpen.value = !isVacancyDropdownOpen.value
  if (!isVacancyDropdownOpen.value) {
    vacancySearchQuery.value = ''
  }
}

const selectVacancy = (vacancyId: number) => {
  form.vacancyId = vacancyId
  isVacancyDropdownOpen.value = false
  vacancySearchQuery.value = ''
}

const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
  isDragOver.value = true
}

const handleDragLeave = (e: DragEvent) => {
  e.preventDefault()
  isDragOver.value = false
}

const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  isDragOver.value = false

  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    form.resume = files[0]
  }
}

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    form.resume = target.files[0]
  }
}

const removeFile = () => {
  form.resume = null
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const submitForm = () => {
  if (!form.vacancyId || !form.resume) {
    alert('Пожалуйста, выберите вакансию и прикрепите резюме')
    return
  }

  const newCandidate = {
    vacancyId: form.vacancyId,
    resumeAnalysis: 'analyzing' as const,
    callStatus: 'not_planned' as const,
  }

  emit('candidate-created', newCandidate)
  resetForm()
}

const resetForm = () => {
  Object.assign(form, {
    vacancyId: null,
    resume: null,
  })
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
  isVacancyDropdownOpen.value = false
  vacancySearchQuery.value = ''
}

const closeModal = () => {
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
              <!-- Header -->
              <div class="relative px-6 pt-6 pb-4">
                <div class="flex items-center justify-between">
                  <h3 class="text-xl font-semibold text-gray-900">Добавить кандидата</h3>
                  <button
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
                <!-- Vacancy Selection -->
                <div class="space-y-2">
                  <label class="block text-sm font-medium text-gray-700"> Вакансия </label>

                  <div class="relative" style="z-index: 60">
                    <button
                      type="button"
                      @click="toggleVacancyDropdown"
                      class="relative w-full bg-white border border-gray-300 rounded-xl shadow-sm pl-4 pr-10 py-3 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                      :class="{ 'ring-2 ring-blue-600 border-transparent': isVacancyDropdownOpen }"
                    >
                      <span
                        class="block truncate text-gray-900"
                        :class="{ 'text-gray-500': !form.vacancyId }"
                      >
                        {{ selectedVacancyTitle }}
                      </span>
                      <span
                        class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"
                      >
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
                        class="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 max-h-64 overflow-hidden"
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
                                type="button"
                                @click.stop="vacancySearchQuery = ''"
                                class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-150"
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
                            </Transition>
                          </div>
                        </div>

                        <!-- Dropdown Content -->
                        <div class="max-h-48 overflow-auto">
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
                              v-for="vacancy in filteredVacancies"
                              :key="vacancy.id"
                              @click="selectVacancy(vacancy.id)"
                              class="px-4 py-3 hover:bg-gray-50 transition-colors duration-150 border-b border-gray-100 last:border-b-0 cursor-pointer"
                              :class="{ 'bg-blue-50 text-blue-700': form.vacancyId === vacancy.id }"
                            >
                              <div class="text-sm font-medium">
                                <span
                                  v-if="vacancySearchQuery.trim()"
                                  v-html="highlightSearchTerm(vacancy.title, vacancySearchQuery)"
                                ></span>
                                <span v-else>{{ vacancy.title }}</span>
                              </div>
                            </div>
                          </TransitionGroup>

                          <!-- No Results Message -->
                          <div
                            v-if="vacancySearchQuery.trim() && filteredVacancies.length === 0"
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
                            <p class="text-xs text-gray-400 mt-1">
                              Попробуйте изменить поисковый запрос
                            </p>
                          </div>

                          <!-- Empty State -->
                          <div
                            v-if="!vacancySearchQuery.trim() && filteredVacancies.length === 0"
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
                                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                              />
                            </svg>
                            <p class="text-sm">Нет доступных вакансий</p>
                            <p class="text-xs text-gray-400 mt-1">Сначала создайте вакансию</p>
                          </div>
                        </div>
                      </div>
                    </Transition>
                  </div>
                </div>

                <!-- Resume Upload -->
                <div class="space-y-2">
                  <label class="block text-sm font-medium text-gray-700"
                    >Прикрепить резюме (файл)</label
                  >

                  <div
                    @dragover="handleDragOver"
                    @dragleave="handleDragLeave"
                    @drop="handleDrop"
                    :class="[
                      'relative rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200',
                      isDragOver
                        ? 'border-blue-400 bg-blue-50 scale-[1.02]'
                        : 'border-gray-300 hover:border-gray-400',
                    ]"
                  >
                    <div v-if="!form.resume" class="space-y-3">
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
                            class="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-150"
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
                            {{ form.resume.name }}
                          </p>
                          <p class="text-xs text-gray-500">
                            {{ Math.round(form.resume.size / 1024) }} KB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        @click="removeFile"
                        class="flex-shrink-0 rounded-full p-1 text-red-400 hover:text-red-600 hover:bg-red-50 transition-all duration-150"
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
                    class="hidden"
                  />
                </div>

                <!-- Actions -->
                <div class="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    @click="closeModal"
                    class="rounded-xl px-6 py-2.5 text-sm font-medium text-gray-700 bg-white ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-all duration-200"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    :disabled="!form.vacancyId || !form.resume"
                    class="rounded-xl px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Добавить кандидата
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
