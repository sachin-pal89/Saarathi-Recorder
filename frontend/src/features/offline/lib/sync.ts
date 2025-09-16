import { offlineQueue } from './idb-queue'
import { recordingsApi } from '../../../services/api'
import { useDispatch } from 'react-redux'
import type { AppDispatch } from '../../../store'
import { setSyncing, setLastSyncTime, removeFromQueue, incrementRetryCount } from '../store/networkSlice'

export class SyncManager {
  private dispatch: AppDispatch
  private isSyncing = false

  constructor(dispatch: AppDispatch) {
    this.dispatch = dispatch
  }

  async syncQueue(): Promise<void> {
    if (this.isSyncing) return

    this.isSyncing = true
    this.dispatch(setSyncing(true))

    try {
      const items = await offlineQueue.getItems()
      
      for (const item of items) {
        try {
          await this.processItem(item)
          await offlineQueue.removeItem(item.id)
          this.dispatch(removeFromQueue(item.id))
        } catch (error) {
          console.error(`Failed to process item ${item.id}:`, error)
          
          // Increment retry count
          const newRetryCount = item.retryCount + 1
          this.dispatch(incrementRetryCount(item.id))
          
          if (newRetryCount >= item.maxRetries) {
            // Remove item after max retries
            await offlineQueue.removeItem(item.id)
            this.dispatch(removeFromQueue(item.id))
            console.warn(`Item ${item.id} removed after ${item.maxRetries} failed attempts`)
          } else {
            // Update retry count
            await offlineQueue.updateItem(item.id, { retryCount: newRetryCount })
          }
        }
      }
    } catch (error) {
      console.error('Sync failed:', error)
    } finally {
      this.isSyncing = false
      this.dispatch(setSyncing(false))
      this.dispatch(setLastSyncTime(Date.now()))
    }
  }

  private async processItem(item: any): Promise<void> {
    switch (item.type) {
      case 'recording':
        await this.processRecording(item.data)
        break
      case 'segment':
        await this.processSegment(item.data)
        break
      default:
        throw new Error(`Unknown item type: ${item.type}`)
    }
  }

  private async processRecording(data: any): Promise<void> {
    // Upload complete recording
    const formData = new FormData()
    formData.append('recording', data.blob)
    
    const response = await fetch(`/api/recordings/${data.recordingId}/upload`, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`)
    }
  }

  private async processSegment(data: any): Promise<void> {
    // Upload segment
    await recordingsApi.uploadSegment(data.recordingId, {
      index: data.index,
      file: data.blob
    })
  }

  async addToQueue(item: {
    type: 'recording' | 'segment'
    data: any
  }): Promise<void> {
    const id = `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    await offlineQueue.addItem({
      id,
      ...item
    })
  }
}

export const createSyncManager = (dispatch: AppDispatch) => new SyncManager(dispatch)
