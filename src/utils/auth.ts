interface TokenData {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}

interface DecodedToken {
  exp: number
  iat: number
  sub: string
  [key: string]: any
}

class AuthManager {
  private readonly ACCESS_TOKEN_KEY = 'access_token'
  private readonly REFRESH_TOKEN_KEY = 'refresh_token'
  private readonly TOKEN_EXPIRY_KEY = 'token_expiry'

  // Сохранение токенов
  setTokens(tokenData: TokenData): void {
    const expiryTime = Date.now() + tokenData.expires_in * 1000

    localStorage.setItem(this.ACCESS_TOKEN_KEY, tokenData.access_token)
    localStorage.setItem(this.REFRESH_TOKEN_KEY, tokenData.refresh_token)
    localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString())
  }

  // Получение access токена
  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY)
  }

  // Получение refresh токена
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY)
  }

  // Проверка валидности токена
  isTokenValid(): boolean {
    const token = this.getAccessToken()
    const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY)

    if (!token || !expiry) {
      return false
    }

    const expiryTime = parseInt(expiry)
    const currentTime = Date.now()

    // Проверяем, что токен не истек (с запасом в 5 минут)
    return currentTime < expiryTime - 5 * 60 * 1000
  }

  // Декодирование JWT токена
  decodeToken(token: string): DecodedToken | null {
    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      )
      return JSON.parse(jsonPayload)
    } catch (error) {
      console.error('Ошибка декодирования токена:', error)
      return null
    }
  }

  // Проверка истечения токена
  isTokenExpired(token: string): boolean {
    const decoded = this.decodeToken(token)
    if (!decoded) return true

    const currentTime = Date.now() / 1000
    return decoded.exp < currentTime
  }

  // Очистка токенов
  clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY)
    localStorage.removeItem(this.REFRESH_TOKEN_KEY)
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY)
  }

  // Проверка аутентификации
  isAuthenticated(): boolean {
    const token = this.getAccessToken()
    return token !== null && this.isTokenValid()
  }

  // Получение данных пользователя из токена
  getUserData(): any {
    const token = this.getAccessToken()
    if (!token) return null

    return this.decodeToken(token)
  }
}

export const logout = async (): Promise<void> => {
  try {
    const refreshToken = authManager.getRefreshToken()
    if (refreshToken) {
      // Отправляем запрос на сервер для инвалидации токена
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authManager.getAccessToken()}`,
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })
    }
  } catch (error) {
    console.error('Ошибка при выходе:', error)
  } finally {
    // Всегда очищаем токены локально
    authManager.clearTokens()
  }
}

export const authManager = new AuthManager()

// Экспорт для совместимости с существующим кодом
export const isAuthenticated = () => authManager.isAuthenticated()
