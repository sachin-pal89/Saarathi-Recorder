import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export type RecordingStatus = 'idle' | 'requesting' | 'recording' | 'paused' | 'stopping' | 'uploading' | 'completed' | 'error'

export interface RecorderState {
  status: RecordingStatus
  isRecording: boolean
  isPaused: boolean
  duration: number
  startTime: number | null
  pauseTime: number | null
  totalPauseDuration: number
  mediaRecorder: MediaRecorder | null
  mediaStream: MediaStream | null
  wakeLock: WakeLockSentinel | null
  currentRecordingId: string | null
  segments: Array<{
    index: number
    blob: Blob
    uploaded: boolean
  }>
  mimeType: string
  error: string | null
}

const initialState: RecorderState = {
  status: 'idle',
  isRecording: false,
  isPaused: false,
  duration: 0,
  startTime: null,
  pauseTime: null,
  totalPauseDuration: 0,
  mediaRecorder: null,
  mediaStream: null,
  wakeLock: null,
  currentRecordingId: null,
  segments: [],
  mimeType: '',
  error: null
}

const recorderSlice = createSlice({
  name: 'recorder',
  initialState,
  reducers: {
    setStatus: (state, action: PayloadAction<RecordingStatus>) => {
      state.status = action.payload
      state.isRecording = action.payload === 'recording'
      state.isPaused = action.payload === 'paused'
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    
    setMediaRecorder: (state, action: PayloadAction<MediaRecorder | null>) => {
      state.mediaRecorder = action.payload
    },
    
    setMediaStream: (state, action: PayloadAction<MediaStream | null>) => {
      state.mediaStream = action.payload
    },
    
    setWakeLock: (state, action: PayloadAction<WakeLockSentinel | null>) => {
      state.wakeLock = action.payload
    },
    
    setMimeType: (state, action: PayloadAction<string>) => {
      state.mimeType = action.payload
    },
    
    startRecording: (state, action: PayloadAction<{ recordingId: string; startTime: number }>) => {
      state.status = 'recording'
      state.isRecording = true
      state.isPaused = false
      state.duration = 0
      state.startTime = action.payload.startTime
      state.pauseTime = null
      state.totalPauseDuration = 0
      state.currentRecordingId = action.payload.recordingId
      state.segments = []
      state.error = null
    },
    
    pauseRecording: (state) => {
      if (state.status === 'recording') {
        state.status = 'paused'
        state.isPaused = true
        state.pauseTime = Date.now()
      }
    },
    
    resumeRecording: (state) => {
      if (state.status === 'paused') {
        state.status = 'recording'
        state.isPaused = false
        if (state.pauseTime) {
          state.totalPauseDuration += Date.now() - state.pauseTime
          state.pauseTime = null
        }
      }
    },
    
    stopRecording: (state) => {
      state.status = 'stopping'
      state.isRecording = false
      state.isPaused = false
      if (state.pauseTime) {
        state.totalPauseDuration += Date.now() - state.pauseTime
        state.pauseTime = null
      }
    },
    
    addSegment: (state, action: PayloadAction<{ index: number; blob: Blob }>) => {
      state.segments.push({
        index: action.payload.index,
        blob: action.payload.blob,
        uploaded: false
      })
    },
    
    markSegmentUploaded: (state, action: PayloadAction<number>) => {
      const segment = state.segments.find(s => s.index === action.payload)
      if (segment) {
        segment.uploaded = true
      }
    },
    
    updateDuration: (state) => {
      if (state.startTime && state.status === 'recording') {
        const now = Date.now()
        state.duration = Math.floor((now - state.startTime - state.totalPauseDuration) / 1000)
      }
    },
    
    resetRecorder: (state) => {
      return { ...initialState }
    },
    
    setUploading: (state) => {
      state.status = 'uploading'
    },
    
    setCompleted: (state) => {
      state.status = 'completed'
    }
  }
})

export const {
  setStatus,
  setError,
  setMediaRecorder,
  setMediaStream,
  setWakeLock,
  setMimeType,
  startRecording,
  pauseRecording,
  resumeRecording,
  stopRecording,
  addSegment,
  markSegmentUploaded,
  updateDuration,
  resetRecorder,
  setUploading,
  setCompleted
} = recorderSlice.actions

export { recorderSlice }
