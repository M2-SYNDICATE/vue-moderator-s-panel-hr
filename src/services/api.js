// src/services/api.js
import axios from 'axios'

// Базовый URL вашего бэкенда
const API_BASE_URL = 'http://26.119.64.68:8000/crud' // замени на реальный адрес

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

// ===================== API Методы =====================

// Login
export const login = async (credentials) => {
  return await api.post('/login', credentials)
}

// Получить список вакансий
export const getVacancies = async () => {
  return await api.get('/vacancies')
}

// Получить список кандидатов
export const getCandidates = async () => {
  return await api.get('/candidates')
}

// Получить одного кандидата по ID
export const getCandidateById = async (candidateId) => {
  return await api.get(`/candidate/${candidateId}`)
}

// Удалить кандидата по ID
export const deleteCandidate = async (candidateId) => {
  return await api.delete(`/candidate/${candidateId}`)
}

export const uploadVacancyFile = async (file) => {
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
    if (error.response) {
      try {
        const text = await error.response.data.text()
        error.response.data = text
      } catch {}
    }
    throw error
  }
}

// Добавить кандидата
export const addCandidate = async (vacancyId, resumeFiles) => {
  const formData = new FormData()

  // Добавляем vacancy_id
  formData.append('vacancy_id', vacancyId)

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
    if (error.response && error.response.data) {
      try {
        const text = await error.response.data.text()
        error.response.data = text
      } catch (e) {
        console.warn('Could not parse error response as text')
      }
    }
    throw error
  }
}

// Удалить вакансию по ID
export const deleteVacancy = async (vacancyId) => {
  return await api.delete(`/vacancy/${vacancyId}`)
}

export const downloadVacancyFile = async (vacancyId) => {
  const response = await api.get(`/download/vacancy/${vacancyId}`, {
    responseType: 'blob',
  })

  let filename = `vacancy_${vacancyId}` // базовое имя без расширения

  // === Извлечение имени файла из Content-Disposition ===
  const contentDisposition = response.headers['content-disposition']
  const extractedFilename = getFilenameFromContentDisposition(contentDisposition)

  if (extractedFilename) {
    filename = extractedFilename
  } else {
    // === Если имя не пришло — определяем расширение по Content-Type ===
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

  // === Создаём ссылку и скачиваем файл ===
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

// === Функция для парсинга Content-Disposition (можно вынести в utils) ===
function getFilenameFromContentDisposition(contentDisposition) {
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

// Экспорт всех методов
export default {
  login,
  getVacancies,
  getCandidates,
  getCandidateById,
  deleteCandidate,
  uploadVacancyFile,
  addCandidate,
  deleteVacancy,
}
