import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '../../../store/index.js'
import type { AppDispatch } from '../../../store/index.js'
import { setWakeLock } from '../store/recorderSlice'

export const useWakeLock = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { wakeLock } = useSelector((state: RootState) => state.recorder)

  const requestWakeLock = useCallback(async (): Promise<boolean> => {
    try {
      if (!('wakeLock' in navigator)) {
        console.warn('Wake Lock API not supported')
        return false
      }

      const wakeLockSentinel = await navigator.wakeLock.request('screen')
      dispatch(setWakeLock(wakeLockSentinel))

      // Handle wake lock release
      wakeLockSentinel.addEventListener('release', () => {
        dispatch(setWakeLock(null))
      })

      // Re-request wake lock on visibility change
      document.addEventListener('visibilitychange', async () => {
        if (document.visibilityState === 'visible' && wakeLockSentinel.released) {
          try {
            const newWakeLock = await navigator.wakeLock.request('screen')
            dispatch(setWakeLock(newWakeLock))
          } catch (error) {
            console.error('Failed to re-request wake lock:', error)
          }
        }
      })

      return true
    } catch (error) {
      console.error('Wake lock request failed:', error)
      return false
    }
  }, [dispatch])

  const releaseWakeLock = useCallback(async (): Promise<void> => {
    try {
      if (wakeLock && !wakeLock.released) {
        await wakeLock.release()
        dispatch(setWakeLock(null))
      }
    } catch (error) {
      console.error('Wake lock release failed:', error)
    }
  }, [dispatch, wakeLock])

  return {
    requestWakeLock,
    releaseWakeLock
  }
}
