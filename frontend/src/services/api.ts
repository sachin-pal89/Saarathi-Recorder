import { supabase } from './supabase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

// API client with auth headers
const apiClient = async (url: string, options: RequestInit = {}) => {
  const { data: { session } } = await supabase.auth.getSession()
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  return response.json()
}

// Customers API
export const customersApi = {
  getCustomers: async (params?: { search?: string; page?: number; pageSize?: number }) => {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.set('search', params.search)
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString())
    
    const query = searchParams.toString()
    return apiClient(`/customers${query ? `?${query}` : ''}`)
  },

  getCustomer: async (id: string) => {
    return apiClient(`/customers/${id}`)
  }
}

// Recordings API
export const recordingsApi = {
  createRecording: async (data: {
    customer_id: string
    purpose: string
    recorded_on: string
    mime: string
  }) => {
    return apiClient('/recordings', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  uploadSegment: async (recordingId: string, segmentData: {
    index: number
    file: File
  }) => {
    const formData = new FormData()
    formData.append('segment', segmentData.file)
    formData.append('index', segmentData.index.toString())

    const { data: { session } } = await supabase.auth.getSession()
    
    const response = await fetch(`${API_BASE_URL}/recordings/${recordingId}/segments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session?.access_token}`
      },
      body: formData
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }))
      throw new Error(error.message || `HTTP ${response.status}`)
    }

    return response.json()
  },

  finalizeRecording: async (recordingId: string) => {
    return apiClient(`/recordings/${recordingId}/finalize`, {
      method: 'POST'
    })
  },

  getRecordings: async (params?: {
    customer_id?: string
    user_id?: string
    from?: string
    to?: string
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.customer_id) searchParams.set('customer_id', params.customer_id)
    if (params?.user_id) searchParams.set('user_id', params.user_id)
    if (params?.from) searchParams.set('from', params.from)
    if (params?.to) searchParams.set('to', params.to)
    
    const query = searchParams.toString()
    return apiClient(`/recordings${query ? `?${query}` : ''}`)
  },

  getRecording: async (id: string) => {
    return apiClient(`/recordings/${id}`)
  }
}

// Admin API
export const adminApi = {
  getRecordings: async (params?: {
    user?: string
    customer?: string
    from?: string
    to?: string
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.user) searchParams.set('user', params.user)
    if (params?.customer) searchParams.set('customer', params.customer)
    if (params?.from) searchParams.set('from', params.from)
    if (params?.to) searchParams.set('to', params.to)
    
    const query = searchParams.toString()
    return apiClient(`/admin/recordings${query ? `?${query}` : ''}`)
  }
}
