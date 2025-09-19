import { apiClient } from './api'
import { authManager } from '@/utils/auth'

interface LoginCredentials {
  email: string
  password: string
}

interface LoginResponse {
  access_token: string
  refresh_token?: string
  expires_in?: number
  token_type?: string
  user?: {
    id: number
    username: string
    email: string
    role: string
  }
}

interface User {
  id: number
  username: string
  email: string
  role: string
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      console.log('🔐 Attempting login...')

      const response = await apiClient.post<LoginResponse>('/login', credentials)

      // Проверяем разные форматы ответа от сервера
      const responseData = response.data

      console.log('✅ Login response:', responseData)

      if (responseData && responseData.access_token) {
        // Создаем объект токенов с дефолтными значениями
        const tokenData = {
          access_token: responseData.access_token,
          refresh_token: responseData.refresh_token || responseData.access_token,
          expires_in: responseData.expires_in || 36000,
          token_type: responseData.token_type || 'Bearer',
        }

        console.log('💾 Saving tokens...')

        // Сохраняем токены
        authManager.setTokens(tokenData)

        // Сохраняем данные пользователя в localStorage для совместимости
        if (responseData.user) {
          localStorage.setItem(
            'userFullName',
            responseData.user.username || responseData.user.email,
          )
          localStorage.setItem('userEmail', responseData.user.email)
        }

        return responseData
      }

      throw new Error('Неверный формат ответа сервера')
    } catch (error: any) {
      console.error('❌ Login error:', error)

      if (error.response?.status === 401) {
        throw new Error('Неверные учетные данные')
      }

      if (error.response?.status === 422) {
        throw new Error('Проверьте правильность введенных данных')
      }

      // Проверяем специфичные ошибки от вашего сервера
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail)
      }

      throw new Error(error.message || 'Ошибка сети')
    }
  }

  async logout(): Promise<void> {
    try {
      console.log('🚪 Logging out...')

      const token = authManager.getAccessToken()
      if (token) {
        // Отправляем запрос на logout с Bearer токеном
        await apiClient.post('/logout', {})
      }
    } catch (error) {
      console.error('❌ Ошибка при выходе:', error)
    } finally {
      // Всегда очищаем токены и данные пользователя
      console.log('🧹 Clearing tokens and user data...')
      authManager.clearTokens()
      localStorage.removeItem('userFullName')
      localStorage.removeItem('userEmail')
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      console.log('👤 Getting current user...')
      const response = await apiClient.get<User>('/me')
      return response.data
    } catch (error) {
      console.error('❌ Ошибка получения данных пользователя:', error)
      return null
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = authManager.getRefreshToken()
      if (!refreshToken) {
        console.log('❌ No refresh token available')
        return false
      }

      console.log('🔄 Refreshing token via authService...')

      const response = await apiClient.post<LoginResponse>('/refresh', {
        refresh_token: refreshToken,
      })

      const responseData = response.data

      if (responseData && responseData.access_token) {
        const tokenData = {
          access_token: responseData.access_token,
          refresh_token: responseData.refresh_token || refreshToken,
          expires_in: responseData.expires_in || 3600,
          token_type: responseData.token_type || 'Bearer',
        }

        authManager.setTokens(tokenData)
        console.log('✅ Token refreshed successfully via authService')
        return true
      }

      return false
    } catch (error) {
      console.error('❌ Ошибка обновления токена:', error)
      authManager.clearTokens()
      return false
    }
  }

  isAuthenticated(): boolean {
    const isAuth = authManager.isAuthenticated()
    console.log('🔍 Is authenticated:', isAuth)
    return isAuth
  }

  getUserData(): any {
    return authManager.getUserData()
  }
}

export const authService = new AuthService()
