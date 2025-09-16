import { openDB } from 'idb'
import type { DBSchema, IDBPDatabase } from 'idb'

interface OfflineQueueDB extends DBSchema {
  recordings: {
    key: string
    value: {
      id: string
      type: 'recording' | 'segment'
      data: any
      timestamp: number
      retryCount: number
      maxRetries: number
    }
  }
}

class OfflineQueue {
  private db: IDBPDatabase<OfflineQueueDB> | null = null

  async init(): Promise<void> {
    this.db = await openDB<OfflineQueueDB>('offline-queue', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('recordings')) {
          db.createObjectStore('recordings', { keyPath: 'id' })
        }
      },
    })
  }

  async addItem(item: {
    id: string
    type: 'recording' | 'segment'
    data: any
    timestamp?: number
    retryCount?: number
    maxRetries?: number
  }): Promise<void> {
    if (!this.db) await this.init()

    const queueItem = {
      ...item,
      timestamp: item.timestamp || Date.now(),
      retryCount: item.retryCount || 0,
      maxRetries: item.maxRetries || 3
    }

    await this.db!.put('recordings', queueItem)
  }

  async getItems(): Promise<any[]> {
    if (!this.db) await this.init()
    return await this.db!.getAll('recordings')
  }

  async removeItem(id: string): Promise<void> {
    if (!this.db) await this.init()
    await this.db!.delete('recordings', id)
  }

  async updateItem(id: string, updates: Partial<any>): Promise<void> {
    if (!this.db) await this.init()
    
    const item = await this.db!.get('recordings', id)
    if (item) {
      await this.db!.put('recordings', { ...item, ...updates })
    }
  }

  async clear(): Promise<void> {
    if (!this.db) await this.init()
    await this.db!.clear('recordings')
  }

  async getItemCount(): Promise<number> {
    if (!this.db) await this.init()
    return await this.db!.count('recordings')
  }
}

export const offlineQueue = new OfflineQueue()
