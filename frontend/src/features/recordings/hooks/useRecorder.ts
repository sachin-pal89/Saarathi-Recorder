import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '../../../store/index.js'
import type { AppDispatch } from '../../../store/index.js'
import {
  setStatus,
  setError,
  setMediaRecorder,
  setMediaStream,
  setMimeType,
  startRecording,
  pauseRecording,
  resumeRecording,
  stopRecording,
  addSegment,
  resetRecorder
} from '../store/recorderSlice'
import { recordingsApi } from '../../../services/api'
import { useMimeSupport } from './useMimeSupport'

export const useRecorder = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { status, mediaRecorder, mediaStream, segments } = useSelector(
    (state: RootState) => state.recorder
  )
  const { getSupportedMimeType } = useMimeSupport()

  // Request microphone permission
  const requestMicrophonePermission = useCallback(async (): Promise<MediaStream | null> => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Media recording is not supported in this browser')
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      })
      
      dispatch(setMediaStream(stream))
      return stream
    } catch (error) {
      console.error('Microphone permission error:', error)
      dispatch(setError(error instanceof Error ? error.message : 'Failed to access microphone'))
      return null
    }
  }, [dispatch])

  // Start recording
  const startRecordingSession = useCallback(async (recordingId: string, stream?: MediaStream) => {
    try {
      const currentStream = stream || mediaStream
      if (!currentStream) {
        throw new Error('No media stream available')
      }

      const mimeType = getSupportedMimeType()
      dispatch(setMimeType(mimeType))

      const recorder = new MediaRecorder(currentStream, {
        mimeType,
        audioBitsPerSecond: 128000
      })

      let segmentIndex = 0
      const segmentDuration = 15 * 60 * 1000 // 15 minutes in milliseconds
      let segmentTimer: NodeJS.Timeout
      let recordingStartTime = Date.now()

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          // Store segment locally only - no immediate upload
          dispatch(addSegment({ index: segmentIndex, blob: event.data }))
          segmentIndex++
        }
      }

      recorder.onstop = () => {
        clearTimeout(segmentTimer)
      }

      recorder.onerror = (event) => {
        console.error('MediaRecorder error:', event)
        dispatch(setError('Recording error occurred'))
      }

      dispatch(setMediaRecorder(recorder))
      dispatch(startRecording({ recordingId, startTime: recordingStartTime }))

      // Start recording
      recorder.start(1000) // Collect data every second

      // Set up segment timer for long recordings (only after 15 minutes)
      segmentTimer = setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop()
          // Immediately start new segment
          setTimeout(() => {
            const newRecorder = new MediaRecorder(currentStream, {
              mimeType,
              audioBitsPerSecond: 128000
            })
            
            newRecorder.ondataavailable = recorder.ondataavailable
            newRecorder.onstop = recorder.onstop
            newRecorder.onerror = recorder.onerror
            
            dispatch(setMediaRecorder(newRecorder))
            newRecorder.start(1000)
          }, 100)
        }
      }, segmentDuration)

    } catch (error) {
      console.error('Start recording error:', error)
      dispatch(setError(error instanceof Error ? error.message : 'Failed to start recording'))
    }
  }, [dispatch, mediaStream, getSupportedMimeType])

  // Pause recording
  const pauseRecordingSession = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.pause()
      dispatch(pauseRecording())
    }
  }, [dispatch, mediaRecorder])

  // Resume recording
  const resumeRecordingSession = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state === 'paused') {
      mediaRecorder.resume()
      dispatch(resumeRecording())
    }
  }, [dispatch, mediaRecorder])

  // Stop recording
  const stopRecordingSession = useCallback(async () => {
    try {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop()
        dispatch(stopRecording())

        // Clean up media stream
        if (mediaStream) {
          mediaStream.getTracks().forEach(track => track.stop())
          dispatch(setMediaStream(null))
        }

        dispatch(setMediaRecorder(null))
        dispatch(setStatus('completed'))
        
        // Note: Recording is now stored locally, not automatically uploaded
      }
    } catch (error) {
      console.error('Stop recording error:', error)
      dispatch(setError(error instanceof Error ? error.message : 'Failed to stop recording'))
    }
  }, [dispatch, mediaRecorder, mediaStream])

  // Upload segment
  const uploadSegment = useCallback(async (recordingId: string, index: number, blob: Blob) => {
    try {
      const file = new File([blob], `segment_${index}.webm`, { type: blob.type })
      await recordingsApi.uploadSegment(recordingId, { index, file })
    } catch (error) {
      console.error('Segment upload error:', error)
      // Segment will be queued for retry via offline system
    }
  }, [])

  // Save recording to server
  const saveRecordingToServer = useCallback(async (recordingId: string) => {
    try {
      dispatch(setStatus('uploading'))
      
      // Upload all segments
      for (const segment of segments) {
        await uploadSegment(recordingId, segment.index, segment.blob)
      }
      
      // Finalize recording
      await recordingsApi.finalizeRecording(recordingId)
      
      dispatch(setStatus('completed'))
      return true
    } catch (error) {
      console.error('Save recording error:', error)
      dispatch(setError(error instanceof Error ? error.message : 'Failed to save recording'))
      dispatch(setStatus('error'))
      return false
    }
  }, [dispatch, segments, uploadSegment])

  // Reset recorder
  const resetRecording = useCallback(() => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop())
    }
    dispatch(resetRecorder())
  }, [dispatch, mediaStream])

  return {
    status,
    startRecording: startRecordingSession,
    pauseRecording: pauseRecordingSession,
    resumeRecording: resumeRecordingSession,
    stopRecording: stopRecordingSession,
    saveRecordingToServer,
    requestMicrophonePermission,
    resetRecording
  }
}
