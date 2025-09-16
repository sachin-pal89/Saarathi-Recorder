import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export interface OfflineQueueItem {
  id: string
  type: 'recording' | 'segment'
  data: any
  timestamp: number
  retryCount: number
  maxRetries: number
}

export interface NetworkState {
  isOnline: boolean
  queue: OfflineQueueItem[]
  isSyncing: boolean
  lastSyncTime: number | null
}

const initialState: NetworkState = {
  isOnline: navigator.onLine,
  queue: [],
  isSyncing: false,
  lastSyncTime: null
}

const networkSlice = createSlice({
  name: 'network',
  initialState,
  reducers: {
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload
    },
    
    addToQueue: (state, action: PayloadAction<Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retryCount'>>) => {
      const item: OfflineQueueItem = {
        ...action.payload,
        id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        retryCount: 0
      }
      state.queue.push(item)
    },
    
    removeFromQueue: (state, action: PayloadAction<string>) => {
      state.queue = state.queue.filter(item => item.id !== action.payload)
    },
    
    updateQueueItem: (state, action: PayloadAction<{ id: string; updates: Partial<OfflineQueueItem> }>) => {
      const item = state.queue.find(item => item.id === action.payload.id)
      if (item) {
        Object.assign(item, action.payload.updates)
      }
    },
    
    incrementRetryCount: (state, action: PayloadAction<string>) => {
      const item = state.queue.find(item => item.id === action.payload)
      if (item) {
        item.retryCount += 1
      }
    },
    
    setSyncing: (state, action: PayloadAction<boolean>) => {
      state.isSyncing = action.payload
    },
    
    setLastSyncTime: (state, action: PayloadAction<number>) => {
      state.lastSyncTime = action.payload
    },
    
    clearQueue: (state) => {
      state.queue = []
    }
  }
})

export const {
  setOnlineStatus,
  addToQueue,
  removeFromQueue,
  updateQueueItem,
  incrementRetryCount,
  setSyncing,
  setLastSyncTime,
  clearQueue
} = networkSlice.actions

export { networkSlice }
