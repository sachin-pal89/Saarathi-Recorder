import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { recordingsApi } from '../../../services/api'

export interface Recording {
  id: string
  user_id: string
  customer_id: string
  purpose: string
  recorded_on: string
  duration_sec: number
  mime: string
  file_path: string | null
  created_at: string
  customer?: {
    name: string
    email: string
  }
  user?: {
    name: string
    email: string
  }
}

export interface RecordingsState {
  recordings: Recording[]
  currentRecording: Recording | null
  loading: boolean
  error: string | null
}

const initialState: RecordingsState = {
  recordings: [],
  currentRecording: null,
  loading: false,
  error: null
}

// Async thunks
export const fetchRecordings = createAsyncThunk(
  'recordings/fetchRecordings',
  async (params?: {
    customer_id?: string
    user_id?: string
    from?: string
    to?: string
  }) => {
    const response = await recordingsApi.getRecordings(params)
    return response
  }
)

export const fetchRecording = createAsyncThunk(
  'recordings/fetchRecording',
  async (id: string) => {
    const response = await recordingsApi.getRecording(id)
    return response
  }
)

const recordingsSlice = createSlice({
  name: 'recordings',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setCurrentRecording: (state, action: PayloadAction<Recording | null>) => {
      state.currentRecording = action.payload
    },
    addRecording: (state, action: PayloadAction<Recording>) => {
      state.recordings.unshift(action.payload)
    },
    updateRecording: (state, action: PayloadAction<Recording>) => {
      const index = state.recordings.findIndex(r => r.id === action.payload.id)
      if (index !== -1) {
        state.recordings[index] = action.payload
      }
      if (state.currentRecording?.id === action.payload.id) {
        state.currentRecording = action.payload
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecordings.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchRecordings.fulfilled, (state, action) => {
        state.loading = false
        state.recordings = action.payload.recordings || []
      })
      .addCase(fetchRecordings.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch recordings'
      })
      .addCase(fetchRecording.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchRecording.fulfilled, (state, action) => {
        state.loading = false
        state.currentRecording = action.payload
      })
      .addCase(fetchRecording.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch recording'
      })
  }
})

export const { clearError, setCurrentRecording, addRecording, updateRecording } = recordingsSlice.actions
export { recordingsSlice }
