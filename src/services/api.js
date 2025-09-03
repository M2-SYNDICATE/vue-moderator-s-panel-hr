// src/services/api.js
import axios from 'axios'

// Базовый URL вашего бэкенда
const API_BASE_URL = 'http://26.119.64.68:8000/crud' // замени на реальный адрес

// Создаём экземпляр axios
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false, // если нужно отправлять cookies
})

// Опционально: добавь обработку ошибок и загрузки
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

// src/services/api.js

export const downloadVacancyFile = async (vacancyId) => {
  try {
    const response = await api.get(`/download/vacancy/${vacancyId}`, {
      responseType: 'blob',
    })

    // Определим имя файла из заголовка
    const contentDisposition = response.headers['content-disposition']
    let filename = `vacancy_${vacancyId}.pdf`

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/)
      if (filenameMatch?.[1]) {
        filename = filenameMatch[1]
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
  } catch (error) {
    console.error('Ошибка при скачивании файла:', error)
    alert('Не удалось скачать файл')
  }
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
