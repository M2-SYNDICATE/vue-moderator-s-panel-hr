import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  AxiosError,
} from 'axios'
import { authManager } from '@/utils/auth'
import router from '@/router'

// ===================== Типы =====================

interface ApiResponse<T = any> {
  data: T
  message?: string
  success: boolean
  errors?: Record<string, string[]>
}

interface PaginatedResponse<T = any> {
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
  links: {
    first: string
    last: string
    prev: string | null
    next: string | null
  }
}

interface QueueItem {
  resolve: (value: any) => void
  reject: (error: any) => void
}

// Типы для совместимости с существующим кодом
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

// ===================== API Client =====================

class ApiClient {
  private client: AxiosInstance
  private isRefreshing = false
  private failedQueue: QueueItem[] = []

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      withCredentials: false,
    })

    this.setupInterceptors()
  }

  private setupInterceptors(): void {
    // Request interceptor - добавляем токен к каждому запросу
    this.client.interceptors.request.use(
      (config) => {
        const token = authManager.getAccessToken()
        if (token && authManager.isTokenValid()) {
          // Добавляем Bearer токен в заголовок Authorization (именно так, как ожидает сервер)
          config.headers.Authorization = `Bearer ${token}`
        }

        // Добавляем стандартные заголовки
        config.headers['Accept'] = 'application/json'

        // Content-Type устанавливаем только если это не FormData
        if (!(config.data instanceof FormData)) {
          config.headers['Content-Type'] = 'application/json'
        }

        // Логирование для отладки (можно убрать в продакшене)
        console.log('🚀 Request:', {
          method: config.method?.toUpperCase(),
          url: `${config.baseURL}${config.url}`,
          headers: {
            Authorization: config.headers.Authorization ? 'Bearer ***' : 'Not set',
            'Content-Type': config.headers['Content-Type'],
            Accept: config.headers['Accept'],
          },
        })

        return config
      },
      (error) => {
        console.error('❌ Request interceptor error:', error)
        return Promise.reject(error)
      },
    )

    // Response interceptor - обрабатываем ошибки аутентификации
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Логирование успешных ответов
        console.log('✅ Response:', {
          status: response.status,
          url: response.config.url,
          data: response.data,
        })
        return response
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

        // Логирование ошибок
        console.error('❌ Response error:', {
          status: error.response?.status,
          url: error.config?.url,
          message: error.response?.data || error.message,
        })

        // Обрабатываем 401 ошибки (Unauthorized)
        if (error.response?.status === 401 && !originalRequest._retry) {
          console.log('🔄 Token expired, trying to refresh...')

          if (this.isRefreshing) {
            // Если уже обновляем токен, добавляем запрос в очередь
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject })
            })
              .then((token) => {
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${token}`
                }
                return this.client(originalRequest)
              })
              .catch((err) => {
                return Promise.reject(err)
              })
          }

          originalRequest._retry = true
          this.isRefreshing = true

          try {
            const newToken = await this.refreshToken()
            this.processQueue(null, newToken)

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`
            }

            console.log('✅ Token refreshed successfully')
            return this.client(originalRequest)
          } catch (refreshError) {
            console.error('❌ Token refresh failed:', refreshError)
            this.processQueue(refreshError, null)
            this.handleAuthError()
            return Promise.reject(refreshError)
          } finally {
            this.isRefreshing = false
          }
        }

        return Promise.reject(error)
      },
    )
  }

  private async refreshToken(): Promise<string> {
    const refreshToken = authManager.getRefreshToken()

    if (!refreshToken) {
      throw new Error('Refresh token не найден')
    }

    try {
      // Создаем отдельный axios instance для refresh запроса
      const refreshClient = axios.create({
        baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      })

      console.log('🔄 Refreshing token...')

      const response = await refreshClient.post('/refresh', {
        refresh_token: refreshToken,
      })

      const tokenData = response.data?.data || response.data

      if (!tokenData?.access_token) {
        throw new Error('Invalid refresh response')
      }

      authManager.setTokens({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || refreshToken,
        expires_in: tokenData.expires_in || 3600,
        token_type: tokenData.token_type || 'Bearer',
      })

      return tokenData.access_token
    } catch (error) {
      console.error('❌ Token refresh failed:', error)
      authManager.clearTokens()
      throw error
    }
  }

  private processQueue(error: any, token: string | null): void {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error)
      } else {
        resolve(token)
      }
    })

    this.failedQueue = []
  }

  private handleAuthError(): void {
    authManager.clearTokens()

    // Перенаправляем на страницу входа только если не находимся уже там
    if (router.currentRoute.value.name !== 'login') {
      router.push({ name: 'login' })
    }
  }

  // Базовые HTTP методы
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return await this.client.get<T>(url, config)
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return await this.client.post<T>(url, data, config)
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return await this.client.put<T>(url, data, config)
  }

  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return await this.client.patch<T>(url, data, config)
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return await this.client.delete<T>(url, config)
  }

  // Получение экземпляра axios для прямого использования
  getAxiosInstance(): AxiosInstance {
    return this.client
  }
}

// Создаем единственный экземпляр API клиента
export const apiClient = new ApiClient()

// Получаем экземпляр axios для совместимости
const api = apiClient.getAxiosInstance()

// ===================== API Методы для совместимости =====================

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

// Экспортируем типы для использования в других файлах
export type { ApiResponse, PaginatedResponse }
