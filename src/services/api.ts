import axios, { type AxiosResponse, AxiosError } from 'axios'

// Базовый URL вашего бэкенда
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// Создаём экземпляр axios
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error)
    throw error
  },
)

// ===================== Типы =====================

export interface LoginCredentials {
  email: string
  password: string
}

export interface Vacancy {
  id: number
  title: string
  // добавьте другие поля, если они есть в ответе бэкенда
}

export interface Candidate {
  id: number
  fullName: string
  vacancyId: number
  resumeAnalysis: 'suitable' | 'not_suitable' | 'analyzing'
  callStatus: 'not_planned' | 'planned' | 'in_progress' | 'completed'
  comments?: string
  callDate?: string
  callLink?: string
}

// ===================== API Методы =====================

// Login
export const login = async (credentials: LoginCredentials): Promise<AxiosResponse<any>> => {
  return await api.post('/login', credentials)
}

// Получить список вакансий
export const getVacancies = async (): Promise<AxiosResponse<Vacancy[]>> => {
  return await api.get('/vacancies')
}

// Получить список кандидатов
export const getCandidates = async (): Promise<AxiosResponse<Candidate[]>> => {
  return await api.get('/candidates')
}

// Получить одного кандидата по ID
export const getCandidateById = async (candidateId: number): Promise<AxiosResponse<Candidate>> => {
  return await api.get(`/candidate/${candidateId}`)
}

// Удалить кандидата по ID
export const deleteCandidate = async (candidateId: number): Promise<void> => {
  await api.delete(`/candidate/${candidateId}`)
}

// Загрузить файл вакансии
export const uploadVacancyFile = async (file: File): Promise<AxiosResponse<any>> => {
  const formData = new FormData()
  formData.append('info_cv', file)

  try {
    const response = await api.post('/vacancy', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      transformResponse: (data) => {
        try {
          return JSON.parse(data)
        } catch {
          return data
        }
      },
    })
    return response
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      try {
        const text = await error.response.data.text?.()
        if (text) error.response.data = text
      } catch {}
    }
    throw error
  }
}

// Добавить кандидата
export const addCandidate = async (
  vacancyId: number,
  resumeFiles: File | File[],
): Promise<AxiosResponse<any>> => {
  const formData = new FormData()

  // Добавляем vacancy_id
  formData.append('vacancy_id', vacancyId.toString())

  // Поддерживаем как один файл, так и массив
  const files = Array.isArray(resumeFiles) ? resumeFiles : [resumeFiles]
  files.forEach((file) => {
    formData.append('resumes', file) // ← имя должно быть 'resumes' (как в бэкенде)
  })

  try {
    const response = await api.post('/candidate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      try {
        const text = await error.response.data.text?.()
        if (text) error.response.data = text
      } catch (e) {
        console.warn('Could not parse error response as text')
      }
    }
    throw error
  }
}

// Удалить вакансию по ID
export const deleteVacancy = async (vacancyId: number): Promise<void> => {
  await api.delete(`/vacancy/${vacancyId}`)
}

// Скачать файл вакансии
export const downloadVacancyFile = async (vacancyId: number): Promise<void> => {
  const response = await api.get(`/download/vacancy/${vacancyId}`, {
    responseType: 'blob',
  })

  let filename = `vacancy_${vacancyId}`

  const contentDisposition = response.headers['content-disposition']
  const extractedFilename = getFilenameFromContentDisposition(contentDisposition)

  if (extractedFilename) {
    filename = extractedFilename
  } else {
    const contentType = response.headers['content-type']

    if (contentType) {
      if (contentType.includes('word') || contentType.includes('msword')) {
        filename += '.doc'
      } else if (contentType.includes('openxmlformats-officedocument.wordprocessingml.document')) {
        filename += '.docx'
      } else if (contentType.includes('pdf')) {
        filename += '.pdf'
      } else if (contentType.includes('font/ttf') || contentType.includes('font-truetype')) {
        filename += '.ttf'
      } else if (contentType.includes('font/woff')) {
        filename += '.woff'
      } else if (contentType.includes('font/woff2')) {
        filename += '.woff2'
      } else if (contentType.includes('font/otf')) {
        filename += '.otf'
      } else if (contentType.includes('font/')) {
        filename += '.font'
      } else {
        filename += '.bin'
      }
    } else {
      filename += '.bin'
    }
  }

  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

// Скачать резюме кандидата
export const downloadCandidateResume = async (candidateId: number): Promise<void> => {
  const response = await api.get(`/download/candidate/${candidateId}`, {
    responseType: 'blob',
  })

  let filename = `resume_${candidateId}`

  const contentDisposition = response.headers['content-disposition']
  const extractedFilename = getFilenameFromContentDisposition(contentDisposition)

  if (extractedFilename) {
    filename = extractedFilename
  } else {
    const contentType = response.headers['content-type']

    if (contentType) {
      if (contentType.includes('word') || contentType.includes('msword')) {
        filename += '.doc'
      } else if (contentType.includes('openxmlformats-officedocument.wordprocessingml.document')) {
        filename += '.docx'
      } else if (contentType.includes('pdf')) {
        filename += '.pdf'
      } else if (contentType.includes('font/ttf') || contentType.includes('font-truetype')) {
        filename += '.ttf'
      } else if (contentType.includes('font/woff')) {
        filename += '.woff'
      } else if (contentType.includes('font/woff2')) {
        filename += '.woff2'
      } else if (contentType.includes('font/otf')) {
        filename += '.otf'
      } else if (contentType.includes('font/')) {
        filename += '.font'
      } else {
        filename += '.bin'
      }
    } else {
      filename += '.bin'
    }
  }

  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

// === Функция для парсинга Content-Disposition ===
function getFilenameFromContentDisposition(contentDisposition: string | undefined): string | null {
  if (!contentDisposition) return null

  // Сначала пробуем filename* (RFC 5987, поддержка Unicode)
  const encodedMatch = contentDisposition.match(/filename\*=UTF-8''(.+)/i)
  if (encodedMatch) {
    try {
      return decodeURIComponent(encodedMatch[1])
    } catch (e) {
      console.error('Failed to decode filename*:', e)
    }
  }

  // Потом обычный filename="..."
  const match = contentDisposition.match(/filename="?([^"]+)"?/i)
  if (match && match[1]) {
    return match[1]
  }

  return null
}

// Отправить приглашение на собеседование
export const sendScheduleInvite = async (candidateId: number, email: string): Promise<any> => {
  try {
    const response = await api.post('/schedule/invite', {
      candidate_id: candidateId,
      email: email,
    })
    return response.data
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      try {
        const text = await error.response.data.text?.()
        if (text) error.response.data = text
      } catch {}
    }
    throw error
  }
}
