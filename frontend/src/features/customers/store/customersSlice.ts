import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { customersApi } from '../../../services/api'

export interface Customer {
  id: string
  name: string
  email: string
  address: string
  lending_status: 'active' | 'inactive' | 'pending'
}

export interface CustomersState {
  customers: Customer[]
  currentCustomer: Customer | null
  loading: boolean
  error: string | null
  pagination: {
    page: number
    pageSize: number
    total: number
  }
}

const initialState: CustomersState = {
  customers: [],
  currentCustomer: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0
  }
}

// Async thunks
export const fetchCustomers = createAsyncThunk(
  'customers/fetchCustomers',
  async (params?: { search?: string; page?: number; pageSize?: number }) => {
    const response = await customersApi.getCustomers(params)
    return response
  }
)

export const fetchCustomer = createAsyncThunk(
  'customers/fetchCustomer',
  async (id: string) => {
    const response = await customersApi.getCustomer(id)
    return response
  }
)

const customersSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setCurrentCustomer: (state, action: PayloadAction<Customer | null>) => {
      state.currentCustomer = action.payload
    },
    updatePagination: (state, action: PayloadAction<{ page?: number; pageSize?: number }>) => {
      if (action.payload.page !== undefined) {
        state.pagination.page = action.payload.page
      }
      if (action.payload.pageSize !== undefined) {
        state.pagination.pageSize = action.payload.pageSize
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false
        state.customers = action.payload.customers || []
        state.pagination.total = action.payload.total || 0
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch customers'
      })
      .addCase(fetchCustomer.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCustomer.fulfilled, (state, action) => {
        state.loading = false
        state.currentCustomer = action.payload
      })
      .addCase(fetchCustomer.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch customer'
      })
  }
})

export const { clearError, setCurrentCustomer, updatePagination } = customersSlice.actions
export { customersSlice }
