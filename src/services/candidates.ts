import { apiClient } from './api'

interface Candidate {
  id: number
  name: string
  email: string
  phone?: string
  resume_url?: string
  status: string
  vacancy_id?: number
  created_at: string
  updated_at: string
}

interface CreateCandidateData {
  name: string
  email: string
  phone?: string
  vacancy_id?: number
}

class CandidateService {
  async getCandidates(): Promise<Candidate[]> {
    const response = await apiClient.get<Candidate[]>('/candidates')
    return response.data
  }

  async getCandidate(id: number): Promise<Candidate> {
    const response = await apiClient.get<Candidate>(`/candidates/${id}`)
    return response.data
  }

  async createCandidate(data: CreateCandidateData): Promise<Candidate> {
    const response = await apiClient.post<Candidate>('/candidates', data)
    return response.data
  }

  async updateCandidate(id: number, data: Partial<CreateCandidateData>): Promise<Candidate> {
    const response = await apiClient.put<Candidate>(`/candidates/${id}`, data)
    return response.data
  }

  async deleteCandidate(id: number): Promise<void> {
    await apiClient.delete(`/candidates/${id}`)
  }
}

export const candidateService = new CandidateService()
