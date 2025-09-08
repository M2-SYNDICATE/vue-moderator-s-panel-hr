import { apiClient } from './api'

interface Vacancy {
  id: number
  title: string
  description: string
  requirements: string[]
  salary_min?: number
  salary_max?: number
  location: string
  employment_type: string
  experience_level: string
  created_at: string
  updated_at: string
}

interface CreateVacancyData {
  title: string
  description: string
  requirements: string[]
  salary_min?: number
  salary_max?: number
  location: string
  employment_type: string
  experience_level: string
}

class VacancyService {
  async getVacancies(): Promise<Vacancy[]> {
    const response = await apiClient.get<Vacancy[]>('/vacancies')
    return response.data
  }

  async getVacancy(id: number): Promise<Vacancy> {
    const response = await apiClient.get<Vacancy>(`/vacancies/${id}`)
    return response.data
  }

  async createVacancy(data: CreateVacancyData): Promise<Vacancy> {
    const response = await apiClient.post<Vacancy>('/vacancies', data)
    return response.data
  }

  async updateVacancy(id: number, data: Partial<CreateVacancyData>): Promise<Vacancy> {
    const response = await apiClient.put<Vacancy>(`/vacancies/${id}`, data)
    return response.data
  }

  async deleteVacancy(id: number): Promise<void> {
    await apiClient.delete(`/vacancies/${id}`)
  }
}

export const vacancyService = new VacancyService()
