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
  // добавьте другие поля, если они есть �� ответе бэкенда
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
  private backgroundClient: AxiosInstance

  // Отдельные контроллеры для разных типов фоновых запросов
  private backgroundControllers: Map<string, AbortController> = new Map()

  // Механизм refresh токенов
  private isRefreshing = false
  private failedQueue: QueueItem[] = []

  constructor() {
    // Основной клиент для пользовательских действий
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
      timeout: 120000, // 2 минуты для загрузки файлов
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      withCredentials: false,
    })

    // Фоновый клиент для автозапросов
    this.backgroundClient = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
      timeout: 8000, // 8 секунд для быстрых фоновых запросов
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      withCredentials: false,
    })

    this.setupInterceptors()
  }

  private setupInterceptors(): void {
    // ========== ОСНОВНОЙ КЛИЕНТ (с refresh токенами) ==========
    this.client.interceptors.request.use(
      (config) => {
        const token = authManager.getAccessToken()
        if (token && authManager.isTokenValid()) {
          config.headers.Authorization = `Bearer ${token}`
        }

        config.headers['Accept'] = 'application/json'

        if (!(config.data instanceof FormData)) {
          config.headers['Content-Type'] = 'application/json'
        }

        console.log('🚀 Main Request:', {
          method: config.method?.toUpperCase(),
          url: `${config.baseURL}${config.url}`,
          timeout: config.timeout,
        })

        return config
      },
      (error) => {
        console.error('❌ Main request interceptor error:', error)
        return Promise.reject(error)
      },
    )

    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log('✅ Main Response:', {
          status: response.status,
          url: response.config.url,
        })
        return response
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

        console.error('❌ Main Response error:', {
          status: error.response?.status,
          url: error.config?.url,
          message: error.response?.data || error.message,
        })

        // ========== ОБРАБОТКА 401 С REFRESH ТОКЕНАМИ ==========
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Если уже обновляем токен, добавляем запрос в очередь
            console.log('⏳ Adding request to refresh queue')
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

          console.log('🔄 Starting token refresh...')

          try {
            const newToken = await this.refreshToken()
            this.processQueue(null, newToken)

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`
            }

            console.log('✅ Token refreshed, retrying original request')
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

    // ========== ФОНОВЫЙ КЛИЕНТ (без refresh токенов) ==========
    this.backgroundClient.interceptors.request.use(
      (config) => {
        const token = authManager.getAccessToken()
        if (token && authManager.isTokenValid()) {
          config.headers.Authorization = `Bearer ${token}`
        }

        config.headers['Accept'] = 'application/json'
        config.headers['Content-Type'] = 'application/json'

        return config
      },
      (error) => {
        return Promise.reject(error)
      },
    )

    this.backgroundClient.interceptors.response.use(
      (response: AxiosResponse) => {
        return response
      },
      async (error: AxiosError) => {
        // Для фоновых запросов просто логируем ошибки, не делаем refresh
        if (error.code === 'ECONNABORTED') {
          console.warn(`⏰ Background timeout: ${error.config?.url}`)
        } else if (error.response?.status === 401) {
          console.warn(`🔒 Background 401: ${error.config?.url} (token expired)`)
        }

        return Promise.reject(error)
      },
    )
  }

  // ========== МЕТОДЫ ДЛЯ REFRESH ТОКЕНОВ ==========
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

      console.log('✅ Token refreshed successfully')
      return tokenData.access_token
    } catch (error) {
      console.error('❌ Token refresh failed:', error)
      authManager.clearTokens()
      throw error
    }
  }

  private processQueue(error: any, token: string | null): void {
    console.log(`🔄 Processing ${this.failedQueue.length} queued requests`)

    this.failedQueue.forEach(({ resolve, reject }, index) => {
      if (error) {
        console.log(`❌ Rejecting queued request ${index + 1}`)
        reject(error)
      } else {
        console.log(`✅ Resolving queued request ${index + 1} with new token`)
        resolve(token)
      }
    })

    this.failedQueue = []
    console.log('🧹 Queue cleared')
  }

  private handleAuthError(): void {
    authManager.clearTokens()

    if (router.currentRoute.value.name !== 'login') {
      router.push({ name: 'login' })
    }
  }

  // Отменяем предыдущие фоновые запросы
  private cancelPreviousBackgroundRequest(url: string): AbortController {
    const existingController = this.backgroundControllers.get(url)
    if (existingController) {
      existingController.abort()
    }

    const newController = new AbortController()
    this.backgroundControllers.set(url, newController)
    return newController
  }

  // Очищаем контроллер после завершения запроса
  private cleanupBackgroundController(url: string): void {
    this.backgroundControllers.delete(url)
  }

  // ========== HTTP МЕТОДЫ ==========

  // Основные методы (с refresh токенами)
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

  // Фоновые методы (без refresh токенов, быстро фейлятся)
  async getBackground<T = any>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    const controller = this.cancelPreviousBackgroundRequest(url)

    try {
      const response = await this.backgroundClient.get<T>(url, {
        ...config,
        signal: controller.signal,
      })

      this.cleanupBackgroundController(url)
      return response
    } catch (error) {
      this.cleanupBackgroundController(url)
      throw error
    }
  }

  // Получение экземпляров axios
  getAxiosInstance(): AxiosInstance {
    return this.client
  }

  getBackgroundAxiosInstance(): AxiosInstance {
    return this.backgroundClient
  }
}

// Создаем единственный экземпляр API клиента
export const apiClient = new ApiClient()

// Получаем экземпляры axios для совместимости
const api = apiClient.getAxiosInstance()

// ===================== API Методы для совместимости =====================

// Login
export const login = async (credentials: LoginCredentials): Promise<AxiosResponse<any>> => {
  return await api.post('/login', credentials)
}

// Получить список вакансий (основной запрос)
export const getVacancies = async (): Promise<AxiosResponse<Vacancy[]>> => {
  return await api.get('/vacancies')
}

// Получить список кандидатов (основной запрос)
export const getCandidates = async (): Promise<AxiosResponse<Candidate[]>> => {
  return await api.get('/candidates')
}

// Фоновые запросы для автообновления
export const getVacanciesBackground = async (): Promise<AxiosResponse<Vacancy[]>> => {
  return await apiClient.getBackground('/vacancies')
}

export const getCandidatesBackground = async (): Promise<AxiosResponse<Candidate[]>> => {
  return await apiClient.getBackground('/candidates')
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
      timeout: 120000,
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

  formData.append('vacancy_id', vacancyId.toString())

  const files = Array.isArray(resumeFiles) ? resumeFiles : [resumeFiles]
  files.forEach((file) => {
    formData.append('resumes', file)
  })

  try {
    const response = await api.post('/candidate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000,
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
    timeout: 60000, // 1 минута для скачивания
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
    timeout: 60000, // 1 минута для скачивания
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

export type { ApiResponse, PaginatedResponse }
