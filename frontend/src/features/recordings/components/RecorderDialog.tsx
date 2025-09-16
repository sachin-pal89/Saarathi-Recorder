import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Mic, MicOff, Play, Pause, Square, X, Loader2 } from 'lucide-react'
import type { RootState, AppDispatch } from '../../../store'
import type { Customer } from '../../customers/store/customersSlice'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import { useRecorder } from '../hooks/useRecorder'
import { useWakeLock } from '../hooks/useWakeLock'
import { recordingsApi } from '../../../services/api'
import { addRecording } from '../store/recordingsSlice'
import { updateDuration } from '../store/recorderSlice'
import { useToast } from '../../../hooks/use-toast'

interface RecorderDialogProps {
  customer: Customer
  onClose: () => void
}

export const RecorderDialog: React.FC<RecorderDialogProps> = ({ customer, onClose }) => {
  const dispatch = useDispatch<AppDispatch>()
  const { toast } = useToast()
  const { status, duration, error, mediaStream } = useSelector((state: RootState) => state.recorder)
  
  const [purpose, setPurpose] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentRecordingId, setCurrentRecordingId] = useState<string | null>(null)
  
  const { 
    startRecording, 
    pauseRecording, 
    resumeRecording, 
    stopRecording,
    saveRecordingToServer,
    requestMicrophonePermission 
  } = useRecorder()
  
  const { requestWakeLock, releaseWakeLock } = useWakeLock()

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Timer effect to update duration
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (status === 'recording') {
      interval = setInterval(() => {
        dispatch(updateDuration())
      }, 1000) // Update every second
    }
    
    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [status, dispatch])

  const handleStart = async () => {
    if (!purpose.trim()) {
      toast({
        title: "Purpose Required",
        description: "Please enter a purpose for this recording.",
        variant: "destructive"
      })
      return
    }

    try {
      
      // Request microphone permission
      const stream = await requestMicrophonePermission()
      if (!stream) {
        toast({
          title: "Microphone Access Denied",
          description: "Please enable microphone access in your browser settings to record audio.",
          variant: "destructive"
        })
        return
      }

      // Request wake lock
      await requestWakeLock()

      // Create recording session
      const response = await recordingsApi.createRecording({
        customer_id: customer.id,
        purpose: purpose.trim(),
        recorded_on: new Date(date).toISOString(),
        mime: 'audio/webm;codecs=opus' // Will be updated based on browser support
      })

      // Store recording ID and start recording with the media stream
      setCurrentRecordingId(response.recording_id)
      await startRecording(response.recording_id, stream)
      
      toast({
        title: "Recording Started",
        description: "Your recording session has begun. Recording is stored locally."
      })
    } catch (error) {
      console.error('Failed to start recording:', error)
      toast({
        title: "Recording Failed",
        description: error instanceof Error ? error.message : "Failed to start recording",
        variant: "destructive"
      })
    }
  }

  const handlePause = () => {
    if (status === 'recording') {
      pauseRecording()
    } else if (status === 'paused') {
      resumeRecording()
    }
  }

  const handleStop = async () => {
    try {
      await stopRecording()
      await releaseWakeLock()
      
      toast({
        title: "Recording Stopped",
        description: "Recording stopped and stored locally. Click 'Save' to upload to server."
      })
    } catch (error) {
      console.error('Failed to stop recording:', error)
      toast({
        title: "Stop Failed",
        description: error instanceof Error ? error.message : "Failed to stop recording",
        variant: "destructive"
      })
    }
  }

  const handleSave = async () => {
    if (!currentRecordingId) {
      toast({
        title: "No Recording",
        description: "No recording to save.",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmitting(true)
      const success = await saveRecordingToServer(currentRecordingId)
      
      if (success) {
        toast({
          title: "Recording Saved",
          description: "Your recording has been uploaded and saved to the server."
        })
        onClose()
      } else {
        toast({
          title: "Save Failed",
          description: "Failed to save recording to server.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Failed to save recording:', error)
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save recording",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = async () => {
    if (status === 'recording' || status === 'paused') {
      const confirmed = window.confirm(
        'You have an active recording. Are you sure you want to close without saving?'
      )
      if (!confirmed) return
      
      await stopRecording()
      await releaseWakeLock()
    }
    onClose()
  }

  useEffect(() => {
    if (error) {
      toast({
        title: "Recording Error",
        description: error,
        variant: "destructive"
      })
    }
  }, [error, toast])

  const isRecording = status === 'recording'
  const isPaused = status === 'paused'
  const isStopped = status === 'idle' || status === 'completed'
  const canStart = isStopped && purpose.trim()
  const canPause = isRecording || isPaused
  const canStop = isRecording || isPaused

  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent 
        className="w-full max-w-md max-h-[85vh] rounded-lg"
      >

        {/* Save Progress Overlay */}
        {isSubmitting && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-t-xl sm:rounded-lg flex items-center justify-center z-50">
            <div className="text-center p-6 w-full max-w-sm">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Saving Recording...</h3>
              <p className="text-sm text-gray-600 mb-4">Uploading to server and finalizing</p>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div className="bg-blue-600 h-3 rounded-full animate-pulse" style={{ width: '100%' }}></div>
              </div>
              
              <div className="text-xs text-gray-500">
                This may take a few moments depending on recording length
              </div>
            </div>
          </div>
        )}

        {/* Mobile drag handle */}
        <div className="flex justify-center py-2 sm:hidden">
          <div className="w-8 h-1 bg-gray-300 rounded-full"></div>
        </div>

        <DialogHeader className="px-4 pb-2 sm:px-0">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <DialogTitle className="text-center sm:text-left">New Recording</DialogTitle>
              <DialogDescription className="text-center sm:text-left">
                Record audio for {customer.name}
              </DialogDescription>
            </div>
            <button
              onClick={handleClose}
              className="p-2 -mr-2 sm:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </DialogHeader>

        <div className="px-4 space-y-4 sm:px-0">
          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Purpose *
              </label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Enter recording purpose..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-base"
                disabled={!isStopped}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-base"
                disabled={!isStopped}
              />
            </div>
          </div>

          {/* Recording Status */}
          {(isRecording || isPaused) && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-yellow-500'}`} />
                  <span className="text-sm font-medium text-gray-900">
                    {isRecording ? 'Recording' : 'Paused'}
                  </span>
                </div>
                <div className="text-2xl font-mono text-gray-900">
                  {formatDuration(duration)}
                </div>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4 sm:justify-center">
            {canStart && (
              <Button
                onClick={handleStart}
                className="flex items-center justify-center space-x-2 w-full sm:w-auto"
                size="lg"
              >
                <Mic className="h-5 w-5" />
                <span>Start Recording</span>
              </Button>
            )}

            {canPause && (
              <Button
                onClick={handlePause}
                variant="outline"
                className="flex items-center justify-center space-x-2 w-full sm:w-auto"
                size="lg"
              >
                {isRecording ? (
                  <>
                    <Pause className="h-5 w-5" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5" />
                    <span>Resume</span>
                  </>
                )}
              </Button>
            )}

            {canStop && (
              <Button
                onClick={handleStop}
                variant="outline"
                className="flex items-center justify-center space-x-2 w-full sm:w-auto"
                size="lg"
              >
                <Square className="h-5 w-5" />
                <span>Stop</span>
              </Button>
            )}

            {status === 'completed' && (
              <Button
                onClick={handleSave}
                variant="default"
                className="flex items-center justify-center space-x-2 w-full sm:w-auto"
                size="lg"
                disabled={isSubmitting}
              >
                <span>{isSubmitting ? 'Saving...' : 'Save'}</span>
              </Button>
            )}
          </div>

          {/* Progress Bar for Save Process */}
          {isSubmitting && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Saving recording...</span>
                <span className="text-gray-500">Please wait</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
              </div>
              <div className="text-xs text-gray-500 text-center">
                Uploading segments and finalizing recording
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Bottom padding for mobile */}
          <div className="h-4 sm:h-0"></div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
