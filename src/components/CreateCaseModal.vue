<script setup lang="ts">
import { ref, reactive, watch } from 'vue'

interface CaseForm {
  title: string
  vacancy: string
  callLink: string
  resume: File | null
  comments: string
}

interface Props {
  isOpen: boolean
}

interface Emits {
  (e: 'close'): void
  (
    e: 'case-created',
    case_: Omit<CaseForm, 'resume'> & { callDate: string; status: 'created' },
  ): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const form = reactive<CaseForm>({
  title: '',
  vacancy: '',
  callLink: '',
  resume: null,
  comments: '',
})

const isDragOver = ref(false)
const fileInputRef = ref<HTMLInputElement>()
const isVisible = ref(false)

const vacancyOptions = [
  'Senior Java Developer',
  'Frontend Developer',
  'Backend Developer',
  'DevOps Engineer',
  'QA Engineer',
  'Product Manager',
  'UI/UX Designer',
]

const showVacancyDropdown = ref(false)
const filteredVacancies = ref(vacancyOptions)

// Watch for modal open/close to handle animations
watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      isVisible.value = true
    } else {
      setTimeout(() => {
        isVisible.value = false
      }, 300) // Match transition duration
    }
  },
  { immediate: true },
)

const filterVacancies = () => {
  if (!form.vacancy) {
    filteredVacancies.value = vacancyOptions
  } else {
    filteredVacancies.value = vacancyOptions.filter((option) =>
      option.toLowerCase().includes(form.vacancy.toLowerCase()),
    )
  }
  showVacancyDropdown.value = true
}

const selectVacancy = (vacancy: string) => {
  form.vacancy = vacancy
  showVacancyDropdown.value = false
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
  if (!form.title || !form.vacancy) {
    alert('Пожалуйста, заполните обязательные поля')
    return
  }

  const newCase = {
    title: form.title,
    vacancy: form.vacancy,
    callLink: form.callLink,
    comments: form.comments,
    callDate: new Date().toISOString().split('T')[0],
    status: 'created' as const,
  }

  emit('case-created', newCase)
  resetForm()
}

const resetForm = () => {
  Object.assign(form, {
    title: '',
    vacancy: '',
    callLink: '',
    resume: null,
    comments: '',
  })
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
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
        <!-- Background overlay with blur effect -->
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
                  <h3 class="text-xl font-semibold text-gray-900">Создать новое дело</h3>
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
                <!-- Title -->
                <div class="space-y-2">
                  <label for="title" class="block text-sm font-medium text-gray-700">
                    Название дела <span class="text-red-500">*</span>
                  </label>
                  <input
                    id="title"
                    v-model="form.title"
                    type="text"
                    placeholder="Иванов Иван / Java Developer"
                    required
                    class="block w-full rounded-xl border-0 px-4 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 transition-all duration-200 sm:text-sm sm:leading-6"
                  />
                </div>

                <!-- Vacancy -->
                <div class="relative space-y-2">
                  <label for="vacancy" class="block text-sm font-medium text-gray-700">
                    Вакансия <span class="text-red-500">*</span>
                  </label>
                  <input
                    id="vacancy"
                    v-model="form.vacancy"
                    type="text"
                    placeholder="Выберите или введите вакансию"
                    required
                    @input="filterVacancies"
                    @focus="showVacancyDropdown = true"
                    @blur="setTimeout(() => (showVacancyDropdown = false), 200)"
                    class="block w-full rounded-xl border-0 px-4 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 transition-all duration-200 sm:text-sm sm:leading-6"
                  />

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
                      v-if="showVacancyDropdown && filteredVacancies.length > 0"
                      class="absolute z-20 w-full mt-1 bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 max-h-60 overflow-auto"
                    >
                      <div
                        v-for="vacancy in filteredVacancies"
                        :key="vacancy"
                        @click="selectVacancy(vacancy)"
                        class="px-4 py-3 cursor-pointer hover:bg-gray-50 text-sm text-gray-900 transition-colors duration-150 first:rounded-t-xl last:rounded-b-xl"
                      >
                        {{ vacancy }}
                      </div>
                    </div>
                  </Transition>
                </div>

                <!-- Call Link -->
                <div class="space-y-2">
                  <label for="callLink" class="block text-sm font-medium text-gray-700">
                    Ссылка на созвон
                  </label>
                  <input
                    id="callLink"
                    v-model="form.callLink"
                    type="url"
                    placeholder="https://meet.google.com/..."
                    class="block w-full rounded-xl border-0 px-4 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 transition-all duration-200 sm:text-sm sm:leading-6"
                  />
                </div>

                <!-- Resume Upload -->
                <div class="space-y-2">
                  <label class="block text-sm font-medium text-gray-700"> Прикрепить резюме </label>

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

                <!-- Comments -->
                <div class="space-y-2">
                  <label for="comments" class="block text-sm font-medium text-gray-700">
                    Комментарий / заметки
                  </label>
                  <textarea
                    id="comments"
                    v-model="form.comments"
                    rows="3"
                    placeholder="Дополнительная информация..."
                    class="block w-full rounded-xl border-0 px-4 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 transition-all duration-200 sm:text-sm sm:leading-6 resize-none"
                  ></textarea>
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
                    class="rounded-xl px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    Создать дело
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
